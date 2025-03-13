import axios from 'axios';
import { getCachedData, setCachedData, generateCacheKey } from '../utils/cacheUtils';

// Get the API URL from environment variables or use a default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout to prevent hanging requests
  timeout: 15000,
  // Important for CORS with credentials
  withCredentials: true
});

// Flag to prevent multiple refresh token requests
let isRefreshing = false;
// Queue of failed requests to retry after token refresh
let failedRequestsQueue = [];

// Process the queue of failed requests with a new token
const processQueue = (token) => {
  failedRequestsQueue.forEach(prom => {
    prom.resolve(token);
  });
  
  failedRequestsQueue = [];
};

// Add cache configuration for specific endpoints
const API_CACHE_CONFIG = {
  // Time slots endpoint caching (10 minutes)
  '/coach/time-slots': {
    enabled: true,
    duration: 10 * 60 * 1000, // 10 minutes
    methods: ['GET']
  }
};

// Add function to check if an endpoint should be cached
const shouldCacheEndpoint = (url, method = 'GET') => {
  // Extract the base endpoint without query params
  const baseEndpoint = url.split('?')[0];
  
  // Check if this endpoint has cache config
  const cacheConfig = API_CACHE_CONFIG[baseEndpoint];
  if (!cacheConfig || !cacheConfig.enabled) {
    return false;
  }
  
  // Check if the method should be cached
  return cacheConfig.methods.includes(method.toUpperCase());
};

// Get cache duration for an endpoint
const getCacheDuration = (url) => {
  const baseEndpoint = url.split('?')[0];
  const cacheConfig = API_CACHE_CONFIG[baseEndpoint];
  return cacheConfig ? cacheConfig.duration : 0;
};

// Add a global error recovery mechanism
let isBackendDown = false;
let backendRecoveryAttemptTime = 0;
const BACKEND_RECOVERY_INTERVAL = 30000; // 30 seconds between recovery attempts

// Function to check if backend is available again
const checkBackendRecovery = async () => {
  try {
    // Make a lightweight health check request
    const response = await axios.get(`${API_URL}/health`, { 
      timeout: 3000,
      headers: { 
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });
    
    if (response.status === 200) {
      console.log('Backend recovered, resuming normal operations');
      isBackendDown = false;
      return true;
    }
  } catch (error) {
    console.log('Backend still unavailable:', error.message);
  }
  return false;
};

// Enhanced request interceptor with caching
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Check if this request should be cached
    if (config.method.toLowerCase() === 'get' && shouldCacheEndpoint(config.url, 'GET')) {
      // Generate a cache key based on the URL and params
      const cacheKey = generateCacheKey(config.url, config.params);
      
      // Add the cache key to the config for the response interceptor
      config.cacheKey = cacheKey;
      
      // Check if we have a cached response
      const cachedResponse = getCachedData(cacheKey);
      if (cachedResponse) {
        // Return the cached response and cancel the request
        config.adapter = () => {
          return Promise.resolve({
            data: cachedResponse,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            request: {}
          });
        };
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Update the response interceptor to handle backend failures gracefully
api.interceptors.response.use(
  (response) => {
    // If we get a successful response and backend was marked as down, it's recovered
    if (isBackendDown) {
      isBackendDown = false;
      console.log('Backend connection restored');
    }
    
    // Check if this response should be cached
    if (response.config.method.toLowerCase() === 'get' && 
        shouldCacheEndpoint(response.config.url, 'GET') && 
        response.config.cacheKey) {
      // Cache the response data
      setCachedData(
        response.config.cacheKey, 
        response.data, 
        getCacheDuration(response.config.url)
      );
    }
    
    return response;
  },
  async (error) => {
    // Don't retry if request was cancelled intentionally
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }
    
    const originalRequest = error.config;
    
    // Check for backend connection issues (5xx errors, network errors, or timeouts)
    const isServerError = error.response && error.response.status >= 500;
    const isNetworkError = !error.response && error.message.includes('Network Error');
    const isTimeoutError = error.code === 'ECONNABORTED';
    
    if ((isServerError || isNetworkError || isTimeoutError) && !originalRequest._isRetry) {
      // Mark backend as potentially down
      if (!isBackendDown) {
        console.log('Backend connection issue detected, switching to offline mode');
        isBackendDown = true;
        backendRecoveryAttemptTime = Date.now();
      }
      
      // For GET requests, try to return cached data if available
      if (originalRequest.method.toLowerCase() === 'get' && originalRequest.cacheKey) {
        const cachedData = getCachedData(originalRequest.cacheKey);
        if (cachedData) {
          console.log('Using cached data during backend unavailability');
          return Promise.resolve({
            data: cachedData,
            status: 200,
            statusText: 'OK (from cache)',
            headers: {},
            config: originalRequest,
            request: {},
            _fromCache: true
          });
        }
      }
      
      // Check if we should attempt recovery
      const now = Date.now();
      if (now - backendRecoveryAttemptTime > BACKEND_RECOVERY_INTERVAL) {
        backendRecoveryAttemptTime = now;
        
        // Try to recover connection to backend
        const recovered = await checkBackendRecovery();
        if (recovered) {
          // Retry the original request once
          originalRequest._isRetry = true;
          return api(originalRequest);
        }
      }
      
      // Create a user-friendly error
      const friendlyError = new Error('The server is currently unavailable. Using cached data where possible.');
      friendlyError.isServerDown = true;
      friendlyError.originalError = error;
      return Promise.reject(friendlyError);
    }
    
    // Handle token refresh for 401 errors
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalConfig._retry = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        // No refresh token, redirect to login
        localStorage.removeItem('token');
        
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
      
      // Handle token refresh
      if (!isRefreshing) {
        isRefreshing = true;
        
        try {
          // Call refresh token endpoint
          const response = await axios.post(
            `${api.defaults.baseURL}/public/auth/refresh`,
            { refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
          );
          
          const { token, refreshToken: newRefreshToken } = response.data.data;
          
          // Update localStorage
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          // Update auth header for future requests
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Process queued requests
          processQueue(token);
          
          // Retry the original request
          return api(originalRequest);
        } catch (refreshError) {
          // Process queued requests with error
          failedRequestsQueue.forEach(prom => {
            prom.reject(refreshError);
          });
          
          // Clear tokens and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          
          // Only redirect if not on login page
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // Add request to queue
        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject: (err) => {
              reject(err);
            }
          });
        });
      }
    } else if (error.response) {
      // Log other error responses for debugging
      console.log('API Error Status:', error.response.status);
      console.log('API Error Data:', error.response.data);
    } else if (error.request) {
      // Handle network errors with retry logic
      console.log('Network Error - no response received');
      
      // Implement retry logic for network issues
      if (!originalRequest._networkRetry && navigator.onLine) {
        originalRequest._networkRetry = true;
        
        // Wait a bit and retry the request
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(api(originalRequest));
          }, 1000);
        });
      }
    }
    
    return Promise.reject(error);
  }
);

// ======== AUTH API ENDPOINTS ========
export const authApi = {
  register: (userData) => api.post('/public/auth/register', userData),
  login: (credentials) => api.post('/public/auth/login', credentials),
  refreshToken: (refreshToken) => api.post('/public/auth/refresh', { refreshToken }),
  getProfile: () => api.get('/user/profile'),
  updateProfile: (profileData) => api.put('/user/profile', profileData),
};

// ======== PUBLIC API ENDPOINTS ========
export const publicApi = {
  // Coaches
  getAllCoaches: (params) => api.get('/public/coaches', { params }),
  getCoachById: (id) => api.get(`/public/coaches/${id}`),
  getCoachAvailability: ({ coachId, date }) => api.get(`/public/coaches/${coachId}/availability`, { params: { date } }),
  
  // New direct time slot access methods
  getAvailableDates: (coachId) => api.get(`/public/available-dates/${coachId}`),
  getTimeSlotsByDate: (coachId, date) => api.get(`/public/time-slots/${coachId}/${date}`),
  
  // Reviews
  getCoachReviews: (coachId) => api.get(`/public/coaches/${coachId}/reviews`)
};

// ======== USER API ENDPOINTS ========
export const userApi = {
  // Profile
  getUserProfile: () => api.get('/user/profile'),
  updateUserProfile: (profileData) => api.put('/user/profile', profileData),
  getUserDashboard: () => api.get('/user/dashboard'),
  
  // Favorites
  getFavoriteCoaches: () => api.get('/user/favorites'),
  addToFavorites: (coachId) => api.post(`/user/favorites/${coachId}`),
  removeFromFavorites: (coachId) => api.delete(`/user/favorites/${coachId}`),
  
  // Bookings
  createBooking: (bookingData) => api.post('/user/bookings', bookingData),
  getUserBookings: (params) => api.get('/user/bookings', { params }),
  cancelBooking: (id) => api.put(`/user/bookings/${id}/cancel`),
  getBookingById: (id) => api.get(`/user/bookings/${id}`),
  
  // New endpoint for processing payment after approval
  processBookingPayment: (bookingId, paymentData) => api.post(`/user/bookings/${bookingId}/payment`, paymentData),
  
  // Payments
  createPaymentIntent: (bookingId) => api.post(`/user/payments/intent/${bookingId}`),
  getPaymentHistory: (params) => api.get('/user/payments/history', { params }),
  processPayment: (paymentData) => api.post('/user/payments/process', paymentData),
  completePayment: (bookingId, paymentData) => api.post(`/user/payments/confirm/${bookingId}`, paymentData),
  
  // Notifications
  getUserNotifications: () => api.get('/user/notifications'),
  markUserNotificationsAsRead: () => api.patch('/user/notifications/read'),
  deleteUserNotification: (id) => api.delete(`/user/notifications/${id}`),
  
  // Reviews
  createReview: (reviewData) => api.post('/user/reviews', reviewData),
  getUserReviews: () => api.get('/user/reviews')
};

// ======== COACH API ENDPOINTS ========
export const coachApi = {
  // Profile
  getCoachProfile: () => {
    console.log('Fetching coach profile from URL:', '/coach/profile');
    return api.get('/coach/profile');
  },
  updateCoachProfile: (profileData) => api.put('/coach/profile', profileData),
  syncApprovalStatus: () => api.post('/coach/sync-approval'),
  getCoachDashboard: () => api.get('/coach/dashboard'),
  
  // Availability
  getCoachAvailability: () => api.get('/coach/availability'),
  updateCoachAvailability: (availabilityData) => api.put('/coach/availability', availabilityData),
  
  // Time Slots
  createTimeSlot: (timeSlotData) => {
    return api.post('/coach/time-slots', timeSlotData).catch(error => {
      if (isBackendDown || error.isServerDown) {
        console.error('Cannot create time slot while backend is down');
        // Return a structured error that won't crash the app
        return Promise.reject({
          isHandled: true,
          message: 'Cannot create time slots while server is unavailable. Please try again later.'
        });
      }
      return Promise.reject(error);
    });
  },
  getTimeSlots: (params) => {
    // Try to use cached data first by utilizing the interceptors
    return api.get('/coach/time-slots', { 
      params,
      headers: {
        'Cache-Control': 'max-age=600' // Also send cache headers to the server
      }
    }).catch(error => {
      // Log the error details
      console.error('Time slots fetch error:', error.message);
      
      // If backend is down, return empty data rather than crashing
      if (isBackendDown || (error.isServerDown)) {
        console.log('Returning empty time slots due to backend unavailability');
        return Promise.resolve({
          data: {
            status: 'success',
            data: {
              data: [] // Return empty array instead of error
            }
          },
          _fromEmergencyFallback: true
        });
      }
      
      // For rate limit errors, return cached data or empty array
      if (error.isRateLimit) {
        const cachedData = getCachedData(generateCacheKey('/coach/time-slots', params));
        if (cachedData) {
          return Promise.resolve({
            data: cachedData,
            _fromCache: true
          });
        }
        
        // Return empty data rather than error
        return Promise.resolve({
          data: {
            status: 'success',
            data: {
              data: [] // Return empty array instead of error
            }
          },
          _fromEmergencyFallback: true
        });
      }
      
      return Promise.reject(error);
    });
  },
  updateTimeSlot: (id, timeSlotData) => api.patch(`/coach/time-slots/${id}`, timeSlotData),
  deleteTimeSlot: (id) => api.delete(`/coach/time-slots/${id}`),
  
  // Bookings
  getCoachBookings: (params) => api.get('/coach/bookings', { params }),
  // New endpoints for booking approval/rejection
  approveBooking: (bookingId) => api.put(`/coach/bookings/${bookingId}/approve`),
  rejectBooking: (bookingId, data) => api.put(`/coach/bookings/${bookingId}/reject`, data),
  completeBooking: (bookingId) => api.put(`/coach/bookings/${bookingId}/complete`),
  
  // Payments
  getCoachPayments: () => api.get('/coach/payments'),
  
  // Reviews
  getCoachReviews: () => api.get('/coach/reviews'),
  
  // Notifications
  getCoachNotifications: () => api.get('/coach/notifications'),
  markCoachNotificationsAsRead: () => api.patch('/coach/notifications/read'),
  deleteCoachNotification: (id) => api.delete(`/coach/notifications/${id}`),
};

// ======== ADMIN API ENDPOINTS ========
export const adminApi = {
  // Profile & Dashboard
  getAdminProfile: () => api.get('/admin/profile'),
  getAdminDashboard: () => api.get('/admin/dashboard'),
  
  // User Management
  getAllUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  deleteUser: (id, options = {}) => {
    if (options.forceDelete) {
      return api.delete(`/admin/users/${id}?forceDelete=true`);
    }
    return api.delete(`/admin/users/${id}`);
  },
  searchUsers: (params) => api.get('/admin/users/search', { params }),
  
  // Coach Approval
  getPendingCoaches: (params) => {
    try {
      return api.get('/admin/coaches/pending', { params });
    } catch (error) {
      console.error('Error fetching pending coaches:', error);
      throw error;
    }
  },
  approveCoach: (id) => {
    try {
      if (!id) {
        throw new Error('Coach ID is required for approval');
      }
      return api.put(`/admin/coaches/${id}/approve`);
    } catch (error) {
      console.error(`Error approving coach ${id}:`, error);
      throw error;
    }
  },
  rejectCoach: (id, data) => {
    try {
      if (!id) {
        console.error('Coach ID is required for rejection');
        return Promise.reject(new Error('Coach ID is required for rejection'));
      }
      if (!data || !data.reason) {
        console.error('Rejection reason is required');
        return Promise.reject(new Error('Rejection reason is required'));
      }
      
      console.log(`Attempting to reject coach ${id} with reason:`, data.reason);
      return api.put(`/admin/coaches/${id}/reject`, data)
        .catch(error => {
          console.error(`Error in reject coach API call for coach ${id}:`, error);
          console.error('Error details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
          });
          throw error;
        });
    } catch (error) {
      console.error(`Error in reject coach API wrapper for coach ${id}:`, error);
      return Promise.reject(error);
    }
  },
  getCoachApprovalHistory: (params) => {
    try {
      return api.get('/admin/coaches/approval-history', { params });
    } catch (error) {
      console.error('Error fetching coach approval history:', error);
      throw error;
    }
  },
  
  // Reviews Management
  getAllReviews: (params) => api.get('/admin/reviews', { params }),
  getReviewById: (id) => api.get(`/admin/reviews/${id}`),
  moderateReview: (id, moderationData) => api.put(`/admin/reviews/${id}/moderate`, moderationData),
  
  // Booking Management
  getAllBookings: (params) => {
    return api.get('/admin/bookings', { params })
      .then(response => {
        // Log the raw response for debugging
        console.log('Admin getAllBookings raw response:', response.data);
        
        if (response.data.status === 'success' && response.data.data && response.data.data.bookings) {
          // Map the bookings to include necessary fields for frontend display
          const mappedBookings = response.data.data.bookings.map(booking => {
            // Extract coach and user information
            const coachName = booking.coach?.user?.name || 'Unknown Coach';
            const userName = booking.user?.name || 'Unknown User';
            
            // Extract TimeSlot information if available
            let timeSlotData = null;
            if (booking.timeSlot) {
              timeSlotData = {
                date: booking.timeSlot.date,
                startTime: booking.timeSlot.startTime,
                endTime: booking.timeSlot.endTime,
                duration: booking.timeSlot.duration
              };
            }
            
            // Create a normalized booking object with all necessary fields
            return {
              ...booking,
              coachName,
              userName,
              timeSlotData,
              // Add explicit fields for easier access in frontend
              date: booking.timeSlot?.date || booking.date || null,
              startTime: booking.timeSlot?.startTime || null,
              endTime: booking.timeSlot?.endTime || null,
              duration: booking.timeSlot?.duration || null
            };
          });
          
          // Replace the original bookings array with our enhanced version
          response.data.data.bookings = mappedBookings;
        }
        
        return response;
      })
      .catch(error => {
        console.error('Error fetching admin bookings:', error);
        throw error;
      });
  },
  getBookingById: (id) => api.get(`/admin/bookings/${id}`),
  updateBookingStatus: (id, statusData) => api.put(`/admin/bookings/${id}/status`, statusData),
  
  // Payment Management
  getAllPayments: (params) => api.get('/admin/payments', { params }),
  getPaymentById: (id) => api.get(`/admin/payments/${id}`),
  updatePaymentStatus: (id, statusData) => api.put(`/admin/payments/${id}/status`, statusData),
  
  // Reports
  generateReports: (params) => api.get('/admin/reports/generate', { params }),
  getReportById: (id) => api.get(`/admin/reports/${id}`),
  
  // Notifications
  getAdminNotifications: () => api.get('/admin/notifications'),
  markNotificationsAsRead: (notificationIds) => api.patch('/admin/notifications/read', { notificationIds }),
  deleteNotification: (id) => api.delete(`/admin/notifications/${id}`),
};

// Helper function to determine which API to use based on user role
export const getApiByRole = (role) => {
  switch (role) {
    case 'admin':
      return adminApi;
    case 'coach':
      return coachApi;
    case 'user':
      return userApi;
    default:
      return publicApi;
  }
};

export default api;
