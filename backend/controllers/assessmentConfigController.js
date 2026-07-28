const AssessmentConfig = require('../models/AssessmentConfig');

// @desc    Create or update assessment config for a class
// @route   POST /api/v1/assessment-configs
// @access  Private/Admin
const upsertConfig = async (req, res, next) => {
  try {
    const { class: classId, academicYear, components, passMark, rankingPeriod } = req.body;

    // Find if config exists for this class and year
    let config = await AssessmentConfig.findOne({ class: classId, academicYear });
    if (config) {
      // Update
      config.components = components;
      config.passMark = passMark || config.passMark;
      config.rankingPeriod = rankingPeriod || config.rankingPeriod;
      await config.save();
    } else {
      config = await AssessmentConfig.create(req.body);
    }

    res.status(200).json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
};

// @desc    Get assessment config for a class
// @route   GET /api/v1/assessment-configs/:classId
// @access  Private
const getConfig = async (req, res, next) => {
  try {
    const config = await AssessmentConfig.findOne({
      class: req.params.classId,
    }).populate('class', 'name');
    if (!config) {
      return res.status(404).json({ success: false, message: 'No assessment config found for this class' });
    }
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all configs
// @route   GET /api/v1/assessment-configs
// @access  Private/Admin
const getAllConfigs = async (req, res, next) => {
  try {
    const configs = await AssessmentConfig.find().populate('class', 'name');
    res.status(200).json({ success: true, count: configs.length, data: configs });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upsertConfig,
  getConfig,
  getAllConfigs,
};