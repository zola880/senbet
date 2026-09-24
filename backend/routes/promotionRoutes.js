const express = require('express');
const router = express.Router();
const {
  previewPromotion,
  runPromotion,
  rollbackPromotion,
  getPromotionHistory,
} = require('../controllers/promotionController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.get('/preview', protect, authorize('admin', 'development'), previewPromotion);
router.post('/run', protect, authorize('admin', 'development'), runPromotion);
router.post('/rollback/:batchId', protect, authorize('admin', 'development'), rollbackPromotion);
router.get('/history', protect, authorize('admin', 'development'), getPromotionHistory);

module.exports = router;