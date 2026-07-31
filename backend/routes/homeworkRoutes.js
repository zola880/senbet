const express = require('express');
const router = express.Router();
const { createHomework, getHomework, deleteHomework } = require('../controllers/homeworkController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.post('/', protect, authorize('teacher'), createHomework);
router.get('/', protect, getHomework);
router.delete('/:id', protect, authorize('admin', 'teacher'), deleteHomework);

module.exports = router;