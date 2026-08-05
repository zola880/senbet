const express = require('express');
const router = express.Router();
const { downloadFile } = require('../controllers/fileController');
const { protect } = require('../middleware/auth');

router.get('/:filename', protect, downloadFile);

module.exports = router;