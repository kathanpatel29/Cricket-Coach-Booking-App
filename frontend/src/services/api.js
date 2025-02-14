import axios from 'axios';
import { toast } from 'react-toastify';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && token !== "undefined") {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const message = error.response.data?.message || 'An error occurred';
      
      switch (error.response.status) {
        case 401:
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          toast.error('Session expired. Please login again.');
          break;
        case 403:
          toast.error('You do not have permission to perform this action');
          break;
        case 404:
          toast.error('Resource not found');
          break;
        case 422:
          toast.error('Validation failed. Please check your input.');
          break;
        case 429:
          toast.error('Too many requests. Please try again later.');
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          toast.error(message);
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('An unexpected error occurred.');
    }
    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
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
  getProfile: () => api.get('/coaches/profile'),
  updateProfile: (formData) => api.put('/coaches/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAvailability: () => api.get('/coaches/availability'),
  updateAvailability: (availability) => api.put('/coaches/availability', { availability }),
  deleteTimeSlot: (dateId, slotId) => api.delete(`/coaches/availability/${dateId}/slots/${slotId}`),
  getEmergencyOff: () => api.get('/coaches/emergency-off'),
  setEmergencyOff: (data) => api.post('/coaches/emergency-off', data),
  getBookings: (params) => api.get('/coaches/bookings', { params }),
  updateBookingStatus: (bookingId, status) => api.patch(`/coaches/bookings/${bookingId}`, { status }),
  getStats: (params) => api.get('/coaches/stats', { params }),
  getEarnings: (params) => api.get('/coaches/earnings', { params }),
  getReviews: (params) => api.get('/coaches/reviews', { params }),
  getAll: () => api.get('/coaches'),
  getById: (id) => api.get(`/coaches/${id}`),
  getPublicProfile: (id) => api.get(`/coaches/${id}/public`),
  getDashboardStats: () => api.get('/coaches/dashboard/stats'),
  submitSessionFeedback: (sessionId, data) => api.post(`/coaches/sessions/${sessionId}/feedback`, data),
  getSessions: (params) => api.get('/coaches/sessions', { params }),
};

// Client Service
export const clientService = {
  getProfile: () => api.get('/clients/profile'),
  updateProfile: (data) => api.put('/clients/profile', data),
  getBookings: () => api.get('/clients/bookings'),
  cancelBooking: (bookingId, reason) => api.post(`/clients/bookings/${bookingId}/cancel`, { reason }),
  submitReview: (bookingId, data) => api.post(`/clients/bookings/${bookingId}/review`, data),
};

// Booking Service
export const bookingService = {
  create: (data) => api.post('/bookings', data),
  getById: (id) => api.get(`/bookings/${id}`),
  getUserBookings: () => api.get('/bookings/client'),
  getCoachBookings: (params) => api.get('/bookings/coach', { params }),
  updateStatus: (id, status) => api.patch(`/bookings/${id}/status`, { status }),
  cancelBooking: (id) => api.post(`/bookings/${id}/cancel`),
  reschedule: (id, data) => api.post(`/bookings/${id}/reschedule`, data),
  confirmPayment: (id) => api.post(`/bookings/${id}/confirm-payment`),
  getAll: () => api.get('/bookings'),
  getAvailableSlots: (coachId, date) => api.get(`/bookings/slots/${coachId}`, { params: { date } }),
};

// Admin Service
export const adminService = {
  getDashboardStats: () => api.get('/admin/dashboard'),
  getDetailedStats: (params) => api.get('/admin/stats', { params }),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getPendingCoaches: () => api.get('/admin/coaches/pending', {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  }),
  approveCoach: (id, data) => api.post(`/admin/coaches/${id}/approve`, data),
  rejectCoach: (id, data) => api.post(`/admin/coaches/${id}/reject`, data),
  getAllBookings: (params) => api.get('/admin/bookings', { params }),
  updateBooking: (id, data) => api.put(`/admin/bookings/${id}`, data),
  getUserStats: (params) => api.get('/admin/reports/users', { params }),
  getBookingStats: (params) => api.get('/admin/reports/bookings', { params }),
  getRevenueStats: (params) => api.get('/admin/reports/revenue', { params }),
  getCoachPerformance: (params) => api.get('/admin/reports/coach-performance', { params }),
  getPendingReviews: () => api.get('/admin/reviews/pending'),
  moderateReview: (id, data) => api.put(`/admin/reviews/${id}/moderate`, data),
  exportUsers: (params) => api.get('/admin/export/users', { 
    params,
    responseType: 'blob'
  }),
  exportBookings: (params) => api.get('/admin/export/bookings', { 
    params,
    responseType: 'blob'
  }),
  exportRevenue: () => api.get('/admin/export/revenue', { responseType: 'blob' }),
};

// Payment Service
export const paymentService = {
  createIntent: (bookingId) => api.post(`/payments/create-intent/${bookingId}`),
  confirm: (bookingId, paymentIntentId) => api.post(`/payments/confirm/${bookingId}`, { paymentIntentId }),
  getPaymentHistory: (params) => api.get('/payments/history', { params }),
  requestRefund: (paymentId, reason) => api.post(`/payments/${paymentId}/refund`, { reason }),
  getCoachEarnings: () => api.get('/payments/earnings'),
};

// Report Service
export const reportService = {
  exportUsers: (params) => api.get('/reports/export/users', { 
    params,
    responseType: 'blob'
  }),
  exportBookings: (params) => api.get('/reports/export/bookings', { 
    params,
    responseType: 'blob'
  }),
  exportEarnings: (params) => api.get('/reports/export/earnings', { 
    params,
    responseType: 'blob'
  }),
  generateCustomReport: (params) => api.post('/reports/custom', params, {
    responseType: 'blob'
  }),
};

export default api;