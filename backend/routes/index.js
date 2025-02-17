// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);
router.post('/auth/refresh-token', authController.refreshToken);

// Client routes
router.use('/client', protect, authorize('client'));
router.get('/client/dashboard/stats', clientController.getDashboardStats);
router.get('/client/bookings', clientController.getBookings);
router.get('/client/reviews', clientController.getReviews);
router.get('/client/payments', clientController.getPayments);
router.get('/client/profile', clientController.getProfile);
router.put('/client/profile', clientController.updateProfile);

// Coach routes
router.use('/coach', protect, authorize('coach'));
router.get('/coach/dashboard/stats', coachController.getDashboardStats);
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