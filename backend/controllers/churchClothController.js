const ChurchClothRecord = require('../models/ChurchClothRecord');

const getClothRecords = async (req, res, next) => {
  try {
    const records = await ChurchClothRecord.find()
      .populate('recordedBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

const createClothRecord = async (req, res, next) => {
  try {
    const record = await ChurchClothRecord.create({
      ...req.body,
      recordedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

const updateClothRecord = async (req, res, next) => {
  try {
    const record = await ChurchClothRecord.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

const deleteClothRecord = async (req, res, next) => {
  try {
    const record = await ChurchClothRecord.findByIdAndDelete(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found' });
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
