const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../utils/imageUpload');
const userController = require('../controllers/userController');

// User profile routes
router.get('/profile', userController.getCurrentUserProfile);
router.put('/profile', upload.single('profileImage'), userController.updateCurrentUserProfile);
router.delete('/profile', userController.deleteCurrentUserAccount);
router.put('/password', userController.changePassword);

module.exports = router; 