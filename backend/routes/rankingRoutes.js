const express = require('express');
const router = express.Router();
const {
  getClassRanking,
  getStudentRanking,
} = require('../controllers/rankingController');
const { protect } = require('../middleware/auth');

router.get('/class/:classId', protect, getClassRanking);
router.get('/student/:studentId', protect, getStudentRanking);

module.exports = router;