const express = require('express');
const router = express.Router();
const {
  getAttendance,
  markAttendance,
  getStudentAttendance,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.get('/', protect, authorize('admin', 'teacher'), getAttendance);
router.post('/', protect, authorize('admin', 'teacher'), markAttendance);
router.get('/student/:studentId', protect, getStudentAttendance);

module.exports = router;