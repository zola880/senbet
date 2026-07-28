const express = require('express');
const router = express.Router();
const {
  createPractice,
  getPractices,
  getMyPractices,
  updatePractice,
  deletePractice,
} = require('../controllers/practiceController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.post('/', protect, authorize('admin'), createPractice);
router.get('/my', protect, getMyPractices); // must be above /:id to avoid matching "my" as id
router.get('/', protect, getPractices);
router.put('/:id', protect, authorize('admin'), updatePractice);
router.delete('/:id', protect, authorize('admin'), deletePractice);

module.exports = router;