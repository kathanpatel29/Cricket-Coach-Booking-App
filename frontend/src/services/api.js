import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  }
});

// Add auth token to requests if available
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
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
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
  getAll: () => api.get('/coaches'),
  getById: (id) => api.get('/coaches/' + id),
  getProfile: () => api.get('/coaches/profile'),
  updateProfile: (data) => api.put('/coaches/profile', data),
  getAvailability: () => api.get('/coaches/availability'),
  updateAvailability: (data) => api.put('/coaches/availability', data),
  getSessions: (params) => api.get('/coaches/sessions', { params }),
  getStats: () => api.get('/coaches/stats'),
  getEarnings: () => api.get('/coaches/earnings'),
  getReviews: () => api.get('/coaches/reviews'),
  setEmergencyOff: (data) => api.post('/coaches/emergency-off', data),
  removeEmergencyOff: (date) => api.delete('/coaches/emergency-off/' + date),
  getDashboardStats: async () => {
    try {
      const response = await api.get('/coaches/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching coach dashboard stats:', error);
      throw error;
    }
  },
};

// Client Service
export const clientService = {
  getProfile: () => api.get('/clients/profile'),
  updateProfile: (data) => api.put('/clients/profile', data),
  getBookings: () => api.get('/clients/bookings'),
  cancelBooking: (bookingId, reason) => api.post('/clients/bookings/' + bookingId + '/cancel', { reason }),
  submitReview: (bookingId, data) => api.post('/clients/bookings/' + bookingId + '/review', data),
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
  confirmPayment: (id) => api.post('/bookings/' + id + '/confirm-payment'),
  getAll: () => api.get('/bookings'),
  getAvailableSlots: (coachId, date) => api.get('/bookings/slots/' + coachId, { params: { date } }),
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
  getDashboardStats: () => api.get('/admin/dashboard'),
  getDetailedStats: (params) => api.get('/admin/stats', { params }),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get('/admin/users/' + id),
  updateUser: (id, data) => api.put('/admin/users/' + id, data),
  deleteUser: (id) => api.delete('/admin/users/' + id),
  getPendingCoaches: async () => {
    try {
      const response = await api.get('/admin/coaches/pending');
      return response;
    } catch (error) {
      console.error('Error fetching pending coaches:', error);
      throw error;
    }
  },
  approveCoach: (id, data) => api.post('/admin/coaches/' + id + '/approve', data),
  rejectCoach: (id, data) => api.post('/admin/coaches/' + id + '/reject', data),
  getAllBookings: (params) => api.get('/admin/bookings', { params }),
  updateBooking: (id, data) => api.put('/admin/bookings/' + id, data),
  getUserStats: () => api.get('/admin/reports/users'),
  getBookingStats: () => api.get('/admin/reports/bookings'),
  getRevenueStats: () => api.get('/admin/reports/revenue'),
  getCoachPerformance: () => api.get('/admin/reports/coach-performance'),
  getPendingReviews: () => api.get('/admin/reviews/pending'),
  moderateReview: (id, data) => api.put('/admin/reviews/' + id + '/moderate', data),
  exportUsers: () => api.get('/admin/export/users', { responseType: 'blob' }),
  exportBookings: () => api.get('/admin/export/bookings', { responseType: 'blob' }),
  exportRevenue: () => api.get('/admin/export/revenue', { responseType: 'blob' })
};

// Export the api instance
export { api };