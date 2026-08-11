const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const {
  createRecord,
  getRecords,
  getSummary,
  updateRecord,
  deleteRecord,
} = require('../controllers/developmentController');

router.route('/')
  .get(protect, getRecords)
  .post(protect, createRecord);

router.get('/summary', protect, getSummary);

router.route('/:id')
  .put(protect, updateRecord)
  .delete(protect, deleteRecord);

module.exports = router;