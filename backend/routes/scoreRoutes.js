const express = require('express');
const router = express.Router();
const { enterScores, getScores } = require('../controllers/scoreController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.post('/', protect, authorize('admin', 'teacher'), enterScores);
router.get('/', protect, getScores);

module.exports = router;