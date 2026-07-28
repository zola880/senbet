const express = require('express');
const router = express.Router();
const {
  upsertConfig,
  getConfig,
  getAllConfigs,
} = require('../controllers/assessmentConfigController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.post('/', protect, authorize('admin'), upsertConfig);
router.get('/', protect, authorize('admin'), getAllConfigs);
router.get('/:classId', protect, getConfig); // teachers/students can fetch config

module.exports = router;