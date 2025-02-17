const multer = require('multer');
const path = require('path');

// Define storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

// File type validation
const fileFilter = (req, file, cb) => {
    cb(null, file.mimetype.startsWith('image/'));
};

// Multer upload middleware
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter
});

module.exports = { upload };
