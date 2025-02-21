import axios from 'axios';
import { toast } from 'react-toastify';

// Create axios instance with base URL and default headers
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    // Handle token expiration
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.localStorage.setItem('logout', Date.now().toString());
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  checkEmail: (email) => api.post('/auth/check-email', { email }),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  registerCoach: (data) => api.post('/auth/coach/register', data),
  getCoachStatus: () => api.get('/auth/coach/status'),
  updatePhone: (phone) => api.put('/auth/update-phone', { phone }),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const userService = {
  getDashboardStats: () => api.get('/users/dashboard/stats'),
  getBookings: () => api.get('/user/bookings'),
  getReviews: () => api.get('/user/reviews'),
  getPayments: () => api.get('/user/payments'),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  updatePhone: (phone) => api.put('/users/phone', { phone }),
  updateProfileImage: (data) => api.put('/users/profile-image', data),
  updateCurrentUserProfile: (data) => api.put('/users/current/profile', data),
  deleteCurrentUserAccount: () => api.delete('/users/profile'),
  changePassword: (data) => api.put('/users/password', data),
  getAllCoaches: () => api.get('/users/coaches'),
  getCoachById: (id) => api.get(`/users/coaches/${id}`),
  getCoachAvailability: (id) => api.get(`/users/coaches/${id}/availability`),
  getAvailabilitySettings: () => api.get('/users/availability-settings'),
  updateAvailabilitySettings: (settings) => api.put('/users/availability-settings', settings),
  getAvailableCoaches: () => api.get('/users/available-coaches'),
};

// Coach Service
export const coachService = {
  // Dashboard
  getDashboardStats: () => api.get('/coaches/dashboard/stats'),
  
  // Bookings
  getBookings: () => api.get('/coach/bookings'),
  
  // Profile
  getProfile: () => api.get('/coaches/profile'),
  updateProfile: (data) => api.put('/coaches/profile', data),
  
  // Schedule
  getSchedule: () => api.get('/coaches/schedule'),
  updateSchedule: (schedule) => api.put('/coaches/schedule', schedule),
  
  // Analytics
  getAnalytics: () => api.get('/coach/analytics'),
  
  // Availability
  getAvailability: (params) => api.get('/coaches/availability', { params }),
  addAvailability: (availability) => api.post('/coaches/availability', availability),
  deleteAvailability: (id) => api.delete(`/coaches/availability/${id}`),
  
  // Public
  getAll: async () => {
    try {
      const response = await api.get('/coaches');
      return {
        data: {
          status: 'success',
          data: response.data?.data || [] // Ensure we return an empty array if no data
        }
      };
    } catch (error) {
      console.error('Error in getAllCoaches:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch coaches');
    }
  },
  getById: (id) => api.get(`/coaches/${id}`),
  
  // Stats
  getStats: () => api.get('/coaches/stats'),
  getEarnings: () => api.get('/coach/earnings'),
  getReviews: () => api.get('/coaches/reviews'),

  // Sessions
  getSessions: (status) => api.get('/coaches/sessions', { params: { status } }),
  updateSession: (sessionId, data) => api.put(`/coaches/sessions/${sessionId}`, data),

  // User View
  getAllAvailability: () => api.get('/availability'),
  getCoachAvailability: (coachId) => api.get(`/coaches/${coachId}/availability`),

  // User Availability View
  getAvailableCoaches: () => api.get('/coaches/available'),
  getCoachAvailability: (coachId) => api.get(`/coaches/${coachId}/availability`),

  getAvailabilitySettings: () => api.get('/coaches/settings/availability'),
  
  updateAvailabilitySettings: (settings) => api.put('/coaches/settings/availability', settings),
  
  getAllCoaches: (params) => {
    try {
      return api.get('/coaches', { params });
    } catch (error) {
      console.error('Error in getAllCoaches:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch coaches');
    }
  },

  // Emergency off
  setEmergencyOff: (data) => api.post('/coaches/emergency-off', data),
  getEmergencyOff: () => api.get('/coaches/emergency-off'),
};

// Booking Service
export const bookingService = {
  createBooking: (data) => api.post('/bookings', data),
  getBookings: (params) => api.get('/bookings', { params }),
  getBookingById: (id) => api.get(`/bookings/${id}`),
  updateBooking: (id, data) => api.put(`/bookings/${id}`, data),
  cancelBooking: (id, reason) => api.put(`/bookings/${id}/cancel`, { reason }),
  getCoachBookings: (params) => api.get('/bookings/coach', { params }),
  getUserBookings: (params) => api.get('/bookings/user', { params }),
  confirmBooking: (id) => api.put(`/bookings/${id}/confirm`),
  rescheduleBooking: (id, data) => api.put(`/bookings/${id}/reschedule`, data),
  createPaymentIntent: (bookingId) => api.post(`/payments/create-payment-intent/${bookingId}`),
  updateSessionStatus: (sessionId, status) => api.put(`/coach/sessions/${sessionId}`, { status }),
  getSessions: () => api.get('/coach/sessions'),
};

// Payment Service
export const paymentService = {
  createPaymentIntent: (bookingId) => api.post('/payments/create-intent/' + bookingId),
  confirmPayment: (bookingId) => api.post('/payments/confirm/' + bookingId),
  getPaymentHistory: () => api.get('/payments/history'),
  requestRefund: (paymentId, data) => api.post('/payments/' + paymentId + '/refund', data),
  getCoachEarnings: () => api.get('/payments/earnings'),
  getAllPayments: () => api.get('/payments/all'),
  processRefund: (paymentId, data) => api.post('/payments/refund/' + paymentId, data),
};

// Admin Service
export const adminService = {
  // User Management
  getUsers: () => api.get('/admin/users'),
  updateUser: (userId, data) => api.put(`/admin/users/${userId}`, data),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  searchUsers: (query) => api.get('/admin/users', { params: { search: query } }),
  
  // Coach Management
  getPendingCoaches: () => api.get('/admin/coaches/pending'),
  approveCoach: (coachId, notes) => api.put(`/admin/coaches/${coachId}/approve`, { notes }),
  rejectCoach: (coachId, reason) => api.put(`/admin/coaches/${coachId}/reject`, { reason }),
  getCoachApprovalHistory: () => api.get('/admin/coaches/approval-history'),
  
  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  
  // Booking management
  getAllBookings: (filters) => api.get('/admin/bookings', { params: filters }),
  updateBooking: (id, data) => api.put(`/admin/bookings/${id}`, data),
  processRefund: (bookingId) => api.post(`/admin/bookings/${bookingId}/refund`),
  
  // Reports
  getUserStats: () => api.get('/admin/reports/users'),
  getBookingStats: () => api.get('/admin/reports/bookings'),
  getRevenueStats: () => api.get('/admin/reports/revenue'),
  getCoachPerformance: () => api.get('/admin/reports/coach-performance'),
  
  // Review Moderation
  getPendingReviews: () => api.get('/admin/reviews/pending'),
  moderateReview: (reviewId, data) => api.put(`/admin/reviews/${reviewId}/moderate`, data),
  getReviews: () => api.get('/admin/reviews'),
  getPayments: () => api.get('/payments'),

  //PaymentManagement
  processPayout: (paymentId) => api.post(`/admin/payments/${paymentId}/payout`),
  processRefund: (paymentId) => api.post(`/admin/payments/${paymentId}/refund`),
};

// Public Service
export const publicService = {
  getAllCoaches: async (params) => {
    try {
      const response = await api.get('/coaches', { params });
      return {
        status: 'success',
        data: {
          coaches: response.data?.data?.coaches || [],
          totalPages: response.data?.data?.totalPages || 1
        }
      };
    } catch (error) {
      console.error('Error in getAllCoaches:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch coaches');
    }
  },
  getCoachById: (id) => api.get(`/coaches/${id}`),
  getCoachAvailability: (id) => api.get(`/coaches/${id}/availability`)
};

// Review Service
export const reviewService = {
  // Get reviews for a coach
  getCoachReviews: (coachId, page) => api.get(`/reviews/coach/${coachId}`, { params: { page } }),
  
  // Get reviews by a user
  getUserReviews: (page) => api.get('/reviews/user', { params: { page } }),
  
  // Create a new review
  createReview: (data) => api.post('/reviews', data),
  
  // Update a review
  updateReview: (reviewId, data) => api.put(`/reviews/${reviewId}`, data),
  
  // Delete a review
  deleteReview: (reviewId) => api.delete(`/reviews/${reviewId}`),
  
  // Reply to a review (for coaches)
  replyToReview: (reviewId, data) => api.post(`/reviews/${reviewId}/reply`, data),
  
  // Get review statistics
  getReviewStats: (coachId) => api.get(`/reviews/coach/${coachId}`),
};

// Export the api instance
export default api;