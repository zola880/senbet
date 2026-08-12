const express = require('express');
const router = express.Router();
const {
  createAssignment,
  getAssignments,
  getAssignment,
  getTeacherAssignments,
  updateAssignment,
  deleteAssignment,
} = require('../controllers/assignmentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.post('/', protect, authorize('admin'), createAssignment);
router.get('/', protect, getAssignments);
router.get('/teacher/:teacherId', protect, getTeacherAssignments);
router.get('/:id', protect, getAssignment);
router.delete('/:id', protect, authorize('admin'), deleteAssignment);
router.put('/:id', protect, authorize('admin'), updateAssignment);

module.exports = router;