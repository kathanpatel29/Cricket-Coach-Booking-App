const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const coachController = require('../controllers/coachController');
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Import route files
const authRoutes = require('./auth');
const userRoutes = require('./users');
const coachRoutes = require('./coaches');
const scheduleRoutes = require('./schedules');
const bookingRoutes = require('./bookings');

// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);
router.post('/auth/check-email', authController.checkEmail);
router.get('/auth/me', protect, authController.getMe);

// User routes
router.use('/users', protect, authorize('user'));
router.get('/users/dashboard/stats', userController.getDashboardStats);
router.get('/users/bookings', userController.getBookings);
router.get('/users/reviews', userController.getReviews);
router.get('/users/payments', userController.getPayments);
router.get('/users/profile', userController.getProfile);
router.put('/users/profile', userController.updateProfile);

// Coach routes
router.use('/coach', protect, authorize('coach'));
router.get('/coach/dashboard/stats', coachController.getDashboardStats);
router.get('/coach/bookings', coachController.getCoachBookings);
router.get('/coach/availability', coachController.getAvailability);
router.post('/coach/availability', coachController.addAvailability);
router.delete('/coach/availability/:id', coachController.deleteAvailability);
router.get('/coach/sessions', coachController.getSessions);
router.get('/coach/earnings', coachController.getEarnings);
router.get('/coach/profile', coachController.getProfile);
router.put('/coach/profile', coachController.updateProfile);

// Admin routes
router.use('/admin', protect, authorize('admin'));
router.get('/admin/dashboard/stats', adminController.getDashboardStats);
router.get('/admin/users', adminController.getUsers);
router.get('/admin/reviews', adminController.getReviews);
router.get('/admin/payments', adminController.getPayments);

// Public routes
router.get('/coaches', coachController.getAllCoaches);
router.get('/coaches/:id', coachController.getCoachById);
router.get('/coaches/:id/availability', coachController.getCoachAvailability);

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/coaches', coachRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/bookings', bookingRoutes);

module.exports = router; 