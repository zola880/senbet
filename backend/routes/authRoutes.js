const express = require('express');
const router = express.Router();
const {
  register,
  registerStudent,
  generateStudentPin,
  login,
  studentLogin,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// Admin-only routes
router.post('/register', protect, authorize('admin'), register);
router.post('/register/student', protect, authorize('admin'), registerStudent);
router.post('/generate-pin/:id', protect, authorize('admin'), generateStudentPin);

// Public login routes
router.post('/login', login);
router.post('/student/login', studentLogin);

// Protected route
router.get('/me', protect, getMe);

module.exports = router;