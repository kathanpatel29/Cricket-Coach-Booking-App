import axios from 'axios';
import { toast } from 'react-toastify';

// Create axios instance with base URL and default headers
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
  refreshToken: () => api.post('/auth/refresh-token'),
  
  // Get dashboard route based on user role
  getDashboardRoute: (role) => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'coach':
        return '/coach/dashboard';
      case 'client':
        return '/client/dashboard';
      default:
        return '/';
    }
  },
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  checkEmail: (email) => api.post('/auth/check-email', { email }),
};

// User Service
export const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => {
    const config = data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : {};
    return api.put('/users/profile', data, config);
  },
  deleteAccount: () => api.delete('/users/profile'),
  changePassword: (data) => api.put('/users/password', data),
};

// Coach Service
export const coachService = {
  // Dashboard
  getDashboardStats: () => api.get('/coach/dashboard/stats'),
  
  // Profile
  getProfile: () => api.get('/coach/profile'),
  updateProfile: (data) => api.put('/coach/profile', data),
  
  // Schedule
  getSchedule: () => api.get('/coaches/schedule'),
  updateSchedule: (data) => api.put('/coaches/schedule', data),
  
  // Bookings
  getBookings: () => api.get('/coaches/bookings'),
  updateBookingStatus: (bookingId, status) => 
    api.put(`/coaches/bookings/${bookingId}/status`, { status }),
  
  // Emergency off
  getEmergencyOff: () => api.get('/coaches/emergency-off'),
  setEmergencyOff: (data) => api.post('/coaches/emergency-off', data),
  removeEmergencyOff: (date) => api.delete(`/coaches/emergency-off/${date}`),
  
  // Public
  getAll: () => api.get('/coaches'),
  getById: (id) => api.get(`/coaches/${id}`),
  
  // Stats
  getStats: () => api.get('/coaches/stats'),
  getEarnings: () => api.get('/coach/earnings'),
  getReviews: () => api.get('/coaches/reviews'),

  // Sessions
  getSessions: () => api.get('/coach/sessions'),
  updateSession: (sessionId, data) => api.put(`/coaches/sessions/${sessionId}`, data),

  // Availability
  getAvailability: () => api.get('/coach/availability'),
  addAvailability: (data) => api.post('/coach/availability', data),
  deleteAvailability: (id) => api.delete(`/coach/availability/${id}`),
  
  // Client View
  getAllAvailability: () => api.get('/availability'),
  getCoachAvailability: (coachId) => api.get(`/coaches/${coachId}/availability`),

  // Client Availability View
  getAvailableCoaches: () => api.get('/coaches/available'),
  getCoachAvailability: (coachId) => api.get(`/coaches/${coachId}/availability`),
};

// Client Service
export const clientService = {
  getDashboardStats: () => api.get('/client/dashboard/stats'),
  getBookings: () => api.get('/client/bookings'),
  getReviews: () => api.get('/client/reviews'),
  getPayments: () => api.get('/client/payments'),
  getProfile: () => api.get('/client/profile'),
  updateProfile: (data) => api.put('/client/profile', data),
  cancelBooking: (bookingId, reason) => 
    api.post(`/clients/bookings/${bookingId}/cancel`, { reason }),
  submitReview: (bookingId, data) => 
    api.post(`/clients/bookings/${bookingId}/review`, data),
};

// Booking Service
export const bookingService = {
  create: (data) => api.post('/bookings', data),
  getById: (id) => api.get('/bookings/' + id),
  getUserBookings: () => api.get('/bookings/client'),
  getCoachBookings: (params) => api.get('/bookings/coach', { params }),
  updateStatus: (id, status) => api.patch('/bookings/' + id + '/status', { status }),
  cancelBooking: (id) => api.post('/bookings/' + id + '/cancel'),
  reschedule: (id, data) => api.post('/bookings/' + id + '/reschedule', data),
  confirmPayment: (bookingId) => api.post(`/payments/confirm-payment/${bookingId}`),
  getAll: () => api.get('/bookings'),
  getAvailableSlots: (coachId, date) => api.get(`/bookings/slots/${coachId}?date=${date}`),
  createPaymentIntent: (bookingId) => api.post(`/payments/create-payment-intent/${bookingId}`),
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
  approveCoach: (coachId) => api.post(`/admin/coaches/${coachId}/approve`),
  rejectCoach: (coachId, data) => api.post(`/admin/coaches/${coachId}/reject`, data),
  
  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  
  // Booking management
  getAllBookings: () => api.get('/admin/bookings'),
  updateBooking: (id, data) => api.put(`/admin/bookings/${id}`, data),
  
  // Reports
  getUserStats: () => api.get('/admin/reports/users'),
  getBookingStats: () => api.get('/admin/reports/bookings'),
  getRevenueStats: () => api.get('/admin/reports/revenue'),
  getCoachPerformance: () => api.get('/admin/reports/coach-performance'),
  
  // Review Moderation
  getPendingReviews: () => api.get('/admin/reviews/pending'),
  moderateReview: (reviewId, data) => api.put(`/admin/reviews/${reviewId}/moderate`, data),
  getReviews: () => api.get('/admin/reviews'),
  getPayments: () => api.get('/admin/payments'),
};

// Public Service
export const publicService = {
  getAllCoaches: () => api.get('/coaches'),
  getCoachById: (id) => api.get(`/coaches/${id}`)
};

// Export the api instance
export default api;