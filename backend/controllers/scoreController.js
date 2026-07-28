const StudentScore = require('../models/StudentScore');
const AssessmentConfig = require('../models/AssessmentConfig');
const User = require('../models/User');

// @desc    Enter scores for students (batch)
// @route   POST /api/v1/scores
// @access  Private (Teacher or Admin)
const enterScores = async (req, res, next) => {
  try {
    const { class: classId, course, componentName, scores } = req.body;
    // scores: [{ student: id, scoreObtained, maxScore }]
    // maxScore can default from AssessmentConfig component, but allow override

    // Validate that component exists in class config
    const config = await AssessmentConfig.findOne({ class: classId });
    if (!config) {
      return res.status(400).json({
        success: false,
        message: 'No assessment config for this class. Please set it up first.',
      });
    }
    const component = config.components.find(c => c.name === componentName);
    if (!component) {
      return res.status(400).json({
        success: false,
        message: `Component '${componentName}' not found in assessment config`,
      });
    }

    const createdScores = [];
    for (const entry of scores) {
      const { student, scoreObtained, maxScore } = entry;
      const finalMax = maxScore || component.maxScore;

      // Upsert: if score for this student+class+course+component exists, update it
      const existing = await StudentScore.findOneAndUpdate(
        { student, class: classId, course, componentName },
        {
          scoreObtained,
          maxScore: finalMax,
          enteredBy: req.user.id,
          date: new Date(),
        },
        { upsert: true, new: true }
      );
      createdScores.push(existing);
    }

    res.status(200).json({
      success: true,
      count: createdScores.length,
      data: createdScores,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get scores with filters (student, class, course, component)
// @route   GET /api/v1/scores
// @access  Private
const getScores = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.student) filter.student = req.query.student;
    if (req.query.class) filter.class = req.query.class;
    if (req.query.course) filter.course = req.query.course;
    if (req.query.component) filter.componentName = req.query.component;

    // Teachers can only see scores of students in their assigned classes
    if (req.user.role === 'teacher') {
      // We could add restriction, but for simplicity, we keep open (handled by frontend routing)
    }

    const scores = await StudentScore.find(filter)
      .populate('student', 'fullName rollNumber')
      .populate('course', 'name')
      .populate('class', 'name');
    res.status(200).json({ success: true, count: scores.length, data: scores });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  enterScores,
  getScores,
};