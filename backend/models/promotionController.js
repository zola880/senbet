const User = require('../models/User');
const Class = require('../models/Class');
const AssessmentConfig = require('../models/AssessmentConfig');
const StudentScore = require('../models/StudentScore');
const TeacherAssignment = require('../models/TeacherAssignment');
const PromotionBatch = require('../models/PromotionBatch');
const PromotionRecord = require('../models/PromotionRecord');
const computeRanking = require('../utils/rankingHelper');

// Define the class ladder (gradeLevel ordering)
const GRADE_ORDER = ['Kg1', 'Kg2', 'Kg3', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Get the next class in the grade ladder
 */
const getNextClass = async (currentClass) => {
  if (!currentClass || !currentClass.gradeLevel) return null;
  
  const currentIndex = GRADE_ORDER.indexOf(currentClass.gradeLevel);
  if (currentIndex === -1 || currentIndex === GRADE_ORDER.length - 1) {
    return null; // Top class or unknown grade
  }
  
  const nextGradeLevel = GRADE_ORDER[currentIndex + 1];
  return await Class.findOne({ gradeLevel: nextGradeLevel }).lean();
};

/**
 * Helper function to get class data with students, courses, and scores
 */
const getClassPromotionData = async (cls) => {
  const config = await AssessmentConfig.findOne({ class: cls._id }).lean();
  if (!config) return null;

  const students = await User.find({ class: cls._id, role: 'student' })
    .select('fullName studentId class')
    .lean();

  if (students.length === 0) return null;

  // Get courses for this class
  const assignments = await TeacherAssignment.find({ class: cls._id })
    .populate('course', 'name')
    .lean();
  
  const validAssignments = assignments.filter(a => a.course != null);
  const courseIds = [...new Set(validAssignments.map(a => a.course._id.toString()))];
  const courses = validAssignments
    .map(a => a.course)
    .filter((v, i, a) => a.findIndex(t => t._id.toString() === v._id.toString()) === i);

  if (courses.length === 0) return null;

  // Get scores
  const scores = await StudentScore.find({
    class: cls._id,
    course: { $in: courseIds },
    student: { $in: students.map(s => s._id) },
  }).lean();

  // Compute ranking
  const ranking = computeRanking(students, courses, config, scores);
  const nextClass = await getNextClass(cls);

  return {
    config,
    students,
    ranking,
    nextClass,
  };
};

// @desc    Preview promotion (dry run)
// @route   GET /api/v1/promotion/preview
// @access  Private (Admin)
const previewPromotion = async (req, res, next) => {
  try {
    const academicYear = req.query.academicYear;
    if (!academicYear) {
      return res.status(400).json({
        success: false,
        message: 'academicYear query parameter is required',
      });
    }

    const allClasses = await Class.find().lean();
    const previewData = [];

    for (const cls of allClasses) {
      const classData = await getClassPromotionData(cls);
      if (!classData) continue;

      const { config, students, ranking, nextClass } = classData;

      // Build preview records
      ranking.forEach(rank => {
        const passMark = config.passMark || 50;
        const passed = rank.overallTotal >= passMark;
        
        let status;
        if (!passed) {
          status = 'retained';
        } else if (!nextClass) {
          status = 'graduated';
        } else {
          status = 'promoted';
        }

        previewData.push({
          studentId: rank.studentId,
          fullName: rank.fullName,
          studentCode: students.find(s => s._id.toString() === rank.studentId.toString())?.studentId,
          currentClass: cls.name,
          currentGradeLevel: cls.gradeLevel,
          averageScore: rank.overallTotal.toFixed(2),
          passMark,
          status,
          nextClass: nextClass ? nextClass.name : null,
          nextGradeLevel: nextClass ? nextClass.gradeLevel : null,
        });
      });
    }

    // Summary
    const summary = {
      totalStudents: previewData.length,
      promoted: previewData.filter(p => p.status === 'promoted').length,
      retained: previewData.filter(p => p.status === 'retained').length,
      graduated: previewData.filter(p => p.status === 'graduated').length,
    };

    res.status(200).json({
      success: true,
      data: previewData,
      summary,
      academicYear,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Run promotion (apply changes)
// @route   POST /api/v1/promotion/run
// @access  Private (Admin)
const runPromotion = async (req, res, next) => {
  try {
    const { academicYear } = req.body;
    if (!academicYear) {
      return res.status(400).json({
        success: false,
        message: 'academicYear is required',
      });
    }

    // Check if a batch already exists for this year
    const existingBatch = await PromotionBatch.findOne({ academicYear, status: 'applied' });
    if (existingBatch) {
      return res.status(400).json({
        success: false,
        message: 'Promotion already applied for this academic year. Use rollback first if you need to redo it.',
      });
    }

    // Compute promotion records
    const allClasses = await Class.find().lean();
    const records = [];

    for (const cls of allClasses) {
      const classData = await getClassPromotionData(cls);
      if (!classData) continue;

      const { config, ranking, nextClass } = classData;

      ranking.forEach(rank => {
        const passMark = config.passMark || 50;
        const passed = rank.overallTotal >= passMark;
        
        let status;
        let toClassId = null;
        if (!passed) {
          status = 'retained';
          toClassId = cls._id;
        } else if (!nextClass) {
          status = 'graduated';
          toClassId = null;
        } else {
          status = 'promoted';
          toClassId = nextClass._id;
        }

        records.push({
          student: rank.studentId,
          fromClass: cls._id,
          toClass: toClassId,
          averageScore: rank.overallTotal,
          passMark,
          status,
        });
      });
    }

    // Create batch
    const batch = await PromotionBatch.create({
      academicYear,
      runBy: req.user.id,
      status: 'applied',
      summary: {
        totalStudents: records.length,
        promoted: records.filter(r => r.status === 'promoted').length,
        retained: records.filter(r => r.status === 'retained').length,
        graduated: records.filter(r => r.status === 'graduated').length,
      },
    });

    // Create records
    const recordsWithBatch = records.map(r => ({ ...r, batch: batch._id }));
    await PromotionRecord.insertMany(recordsWithBatch);

    // Update student classes
    for (const record of records) {
      if (record.status === 'promoted' && record.toClass) {
        await User.findByIdAndUpdate(record.student, { class: record.toClass });
      } else if (record.status === 'graduated') {
        await User.findByIdAndUpdate(record.student, { 
          accountStatus: 'inactive',
          class: null,
        });
      }
      // retained: no change needed
    }

    res.status(201).json({
      success: true,
      message: 'Promotion applied successfully',
      data: {
        batchId: batch._id,
        summary: batch.summary,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Rollback promotion
// @route   POST /api/v1/promotion/rollback/:batchId
// @access  Private (Admin)
const rollbackPromotion = async (req, res, next) => {
  try {
    const { batchId } = req.params;
    const batch = await PromotionBatch.findById(batchId);
    
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Promotion batch not found',
      });
    }

    if (batch.status === 'rolled_back') {
      return res.status(400).json({
        success: false,
        message: 'This batch has already been rolled back',
      });
    }

    // Get all records for this batch
    const records = await PromotionRecord.find({ batch: batchId }).lean();

    // Revert student classes
    for (const record of records) {
      if (record.status === 'promoted' || record.status === 'graduated') {
        await User.findByIdAndUpdate(record.student, { 
          class: record.fromClass,
          accountStatus: 'active',
        });
      }
    }

    // Mark batch as rolled back
    batch.status = 'rolled_back';
    await batch.save();

    res.status(200).json({
      success: true,
      message: 'Promotion rolled back successfully',
      data: {
        batchId: batch._id,
        revertedStudents: records.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get promotion history
// @route   GET /api/v1/promotion/history
// @access  Private (Admin)
const getPromotionHistory = async (req, res, next) => {
  try {
    const batches = await PromotionBatch.find()
      .populate('runBy', 'fullName adminId')
      .sort({ runAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: batches.length,
      data: batches,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  previewPromotion,
  runPromotion,
  rollbackPromotion,
  getPromotionHistory,
};