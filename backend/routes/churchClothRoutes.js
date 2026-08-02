const express = require('express');
const router = express.Router();
const {
  getClothRecords,
  createClothRecord,
  updateClothRecord,
  deleteClothRecord,
} = require('../controllers/churchClothController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.get('/', protect, authorize('admin'), getClothRecords);
router.post('/', protect, authorize('admin'), createClothRecord);
router.put('/:id', protect, authorize('admin'), updateClothRecord);
router.delete('/:id', protect, authorize('admin'), deleteClothRecord);

module.exports = router;
