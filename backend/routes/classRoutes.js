const express = require('express');
const router = express.Router();
const {
  createClass,
  getClasses,
  getClass,
  updateClass,
  deleteClass,
} = require('../controllers/classController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.post('/', protect, authorize('admin'), createClass);
router.get('/', protect, getClasses);
router.get('/:id', protect, getClass);
router.put('/:id', protect, authorize('admin'), updateClass);
router.delete('/:id', protect, authorize('admin'), deleteClass);

module.exports = router;