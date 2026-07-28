const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getTeacherDashboard,
  getStudentDashboard,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.get('/admin', protect, authorize('admin'), getAdminDashboard);
router.get('/teacher', protect, authorize('teacher'), getTeacherDashboard);
router.get('/student', protect, authorize('student'), getStudentDashboard);

module.exports = router;