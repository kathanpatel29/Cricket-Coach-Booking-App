const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../utils/imageUpload');
const userController = require('../controllers/userController');

// User profile routes (protected)
router.get('/current/profile', protect, userController.getCurrentUserProfile);
router.put('/current/profile', protect, upload.single('profileImage'), userController.updateCurrentUserProfile);
router.delete('/profile', protect, userController.deleteCurrentUserAccount);
router.put('/password', protect, userController.changePassword);
router.get('/bookings', protect, userController.getBookings);
router.get('/reviews', protect, userController.getReviews);
router.get('/payments', protect, userController.getPayments);
router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.put('/phone', protect, userController.updatePhone);
router.put('/profile-image', protect, userController.updateProfileImage);
router.put('/profile-image', protect, upload.single('profileImage'), userController.updateProfileImage);
router.get('/dashboard/stats', protect, userController.getDashboardStats);

module.exports = router;