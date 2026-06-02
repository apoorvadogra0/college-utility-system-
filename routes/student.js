const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken } = require('../middleware/auth');
const studentController = require('../controllers/studentController');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Get student profile
router.get('/profile', verifyToken, studentController.getProfile);

// Update student profile
router.put('/profile', verifyToken, upload.single('profilePhoto'), studentController.updateProfile);

// Get dashboard data
router.get('/dashboard', verifyToken, studentController.getDashboard);

// Get notifications
router.get('/notifications', verifyToken, studentController.getNotifications);

// Mark notification as read
router.put('/notifications/:notificationId/read', verifyToken, studentController.markNotificationAsRead);

module.exports = router;
