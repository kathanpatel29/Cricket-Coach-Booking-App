const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../utils/imageUpload');
const {
    getCurrentUserProfile,
    updateCurrentUserProfile,
    deleteCurrentUserAccount,
    changePassword
} = require('../controllers/userController');

// Protect all user routes
router.use(protect);

// User profile routes
router.get('/profile', getCurrentUserProfile);
router.put('/profile', upload.single('profileImage'), updateCurrentUserProfile);
router.delete('/profile', deleteCurrentUserAccount);
router.put('/password', changePassword);

module.exports = router; 