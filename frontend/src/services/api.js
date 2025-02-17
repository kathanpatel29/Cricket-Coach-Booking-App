import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
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
  login: (loginData) => api.post('/auth/login', loginData),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
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
  getDashboardStats: () => api.get('/coaches/dashboard/stats'),
  
  // Profile
  getProfile: () => api.get('/coaches/profile'),
  updateProfile: (data) => api.put('/coaches/profile', data),
  
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
  getEarnings: () => api.get('/coaches/earnings'),
  getReviews: () => api.get('/coaches/reviews'),
};

// Client Service
export const clientService = {
  getProfile: () => api.get('/clients/profile'),
  updateProfile: (data) => api.put('/clients/profile', data),
  getBookings: () => api.get('/clients/bookings'),
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
  // Coach approval methods
  getPendingCoaches: () => api.get('/admin/coaches/pending'),
  approveCoach: (coachId) => api.post(`/admin/coaches/${coachId}/approve`),
  rejectCoach: (coachId, data) => api.post(`/admin/coaches/${coachId}/reject`, data),
  
  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard'),
  
  // User management
  getAllUsers: () => api.get('/admin/users'),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  
  // Booking management
  getAllBookings: () => api.get('/admin/bookings'),
  updateBooking: (id, data) => api.put(`/admin/bookings/${id}`, data),
  
  // Reports
  getUserStats: () => api.get('/admin/reports/users'),
  getBookingStats: () => api.get('/admin/reports/bookings'),
  getRevenueStats: () => api.get('/admin/reports/revenue'),
  getCoachPerformance: () => api.get('/admin/reports/coach-performance'),
};

export default api;