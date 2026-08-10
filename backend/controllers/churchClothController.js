const ChurchClothRecord = require('../models/ChurchClothRecord');

// @desc    Get all church cloth records
// @route   GET /api/v1/church-cloth
// @access  Private
const getClothRecords = async (req, res, next) => {
  try {
    // OPTIMIZATION: Added .select() to fetch only the fields displayed in the frontend table
    // OPTIMIZATION: Added .lean() for plain objects (faster serialization, less memory)
    // Note: .populate('recordedBy', 'fullName email') already has field selection - good!
    const records = await ChurchClothRecord.find()
      .select('borrowerName phoneNumber borrowedDate expectedReturnDate returnedAt status notes recordedBy createdAt')
      .populate('recordedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new church cloth record
// @route   POST /api/v1/church-cloth
// @access  Private
const createClothRecord = async (req, res, next) => {
  try {
    const record = await ChurchClothRecord.create({
      ...req.body,
      recordedBy: req.user._id,
    });

    // No optimization needed - document is already in memory from create()
    res.status(201).json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a church cloth record
// @route   PUT /api/v1/church-cloth/:id
// @access  Private
const updateClothRecord = async (req, res, next) => {
  try {
    // OPTIMIZATION: Added .populate() so the response matches the GET endpoint shape
    // OPTIMIZATION: Added .lean() to the returned document (faster serialization)
    // Note: We don't modify the document after update, just return it as JSON
    const record = await ChurchClothRecord.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    )
      .populate('recordedBy', 'fullName email')
      .lean();

    if (!record) {
      return res.status(404).json({ 
        success: false, 
        message: 'Record not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a church cloth record
// @route   DELETE /api/v1/church-cloth/:id
// @access  Private
const deleteClothRecord = async (req, res, next) => {
  try {
    // No optimization needed - we don't return the document, just a success message
    const record = await ChurchClothRecord.findByIdAndDelete(req.params.id);
    
    if (!record) {
      return res.status(404).json({ 
        success: false, 
        message: 'Record not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Record deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getClothRecords,
  createClothRecord,
  updateClothRecord,
  deleteClothRecord,
};