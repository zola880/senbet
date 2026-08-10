const Notification = require('../models/Notification');

// @desc    Get notifications for current user
// @route   GET /api/v1/notifications
// @access  Private
const getMyNotifications = async (req, res, next) => {
  try {
    // OPTIMIZATION: Added .select() for only needed fields
    // OPTIMIZATION: Added .lean() for plain objects (2-3x faster serialization)
    // Note: .populate('course', 'name') already has field selection - good!
    const notifications = await Notification.find({ recipient: req.user._id })
      .select('title message type course read createdAt')
      .populate('course', 'name')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/v1/notifications/:id/read
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    // OPTIMIZATION: Added .lean() to returned document (faster serialization)
    // Note: We don't modify the document after update, just return it
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true }
    ).lean();

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/v1/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res, next) => {
  try {
    // No optimization needed - updateMany() is already efficient
    // We don't return documents, just a success message
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
};