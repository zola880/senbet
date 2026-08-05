const path = require('path');
const fs = require('fs');

// @desc    Download a file from uploads
// @route   GET /api/v1/files/:filename
// @access  Private
const downloadFile = async (req, res, next) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '..', 'uploads', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    res.download(filePath);
  } catch (error) {
    next(error);
  }
};

module.exports = { downloadFile };