const express = require('express');
const router = express.Router();
const { createAnnouncement, getAnnouncements, deleteAnnouncement } = require('../controllers/announcementController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.post('/', protect, authorize('teacher'), createAnnouncement);
router.get('/', protect, getAnnouncements);
router.delete('/:id', protect, authorize('admin', 'teacher'), deleteAnnouncement);

module.exports = router;