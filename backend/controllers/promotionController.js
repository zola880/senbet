const User = require('../models/User');
const Class = require('../models/class');
const AssessmentConfig = require('../models/AssessmentConfig');
const StudentScore = require('../models/StudentScore');
const TeacherAssignment = require('../models/TeacherAssignment');
const PromotionBatch = require('../models/PromotionBatch');
const PromotionRecord = require('../models/PromotionRecord');
const computeRanking = require('../utils/rankingHelper');
// Class ladder (gradeLevel ordering)
const GRADE_ORDER = ['Kg1', 'Kg2', 'Kg3', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

const getNextClass = async (currentClass) => {
  if (!currentClass || !currentClass.gradeLevel) return null;
  const currentIndex = GRADE_ORDER.indexOf(currentClass.gradeLevel);
  if (currentIndex === -1 || currentIndex === GRADE_ORDER.length - 1) return null;
  return await Class.findOne({ gradeLevel: GRADE_ORDER[currentIndex + 1] }).lean();
};

/**
 * Gather everything needed to evaluate one class:
 * config, students, courses, raw scores, ranking, next class
 */
const getClassPromotionData = async (cls) => {
  const config = await AssessmentConfig.findOne({ class: cls._id }).lean();
  if (!config) return null;

  const students = await User.find({ class: cls._id, role: 'student' })
    .select('fullName studentId class')
    .lean();
  if (students.length === 0) return null;

  const assignments = await TeacherAssignment.find({ class: cls._id })
    .populate('course', 'name')
    .lean();
  const validAssignments = assignments.filter(a => a.course != null);
  const courseIds = [...new Set(validAssignments.map(a => a.course._id.toString()))];
  const courses = validAssignments
    .map(a => a.course)
    .filter((v, i, a) => a.findIndex(t => t._id.toString() === v._id.toString()) === i);
  if (courses.length === 0) return null;

  const scores = await StudentScore.find({
    class: cls._id,
    course: { $in: courseIds },
    student: { $in: students.map(s => s._id) },
  }).lean();

  const ranking = computeRanking(students, courses, config, scores);
  const nextClass = await getNextClass(cls);

  return { config, students, courses, scores, ranking, nextClass };
};

/**
 * RULE 1: find courses with NO submitted scores for this student
 */
const getMissingCourses = (courses, scores, studentId) => {
  const sid = studentId.toString();
  const covered = new Set();
  scores.forEach((s) => {
    if (s.student.toString() === sid) covered.add(s.course.toString());
  });
  return courses.filter((c) => !covered.has(c._id.toString()));
};

/**
 * RULE 2: promotion score is decided by the admin (0-100, default 50)
 */
const parsePromotionScore = (value) => {
  if (value === undefined || value === null || value === '') return 50;
  const n = Number(value);
  if (Number.isNaN(n) || n < 0 || n > 100) return null;
  return n;
};

/**
 * Core evaluation used by both preview and run
 */
const evaluateStudent = (rank, missing, promotionScore, nextClass) => {
  if (missing.length > 0) return 'incomplete';
  if (rank.overallTotal >= promotionScore) return nextClass ? 'promoted' : 'graduated';
  return 'retained';
};

// @desc    Preview promotion (dry run — changes nothing)
// @route   GET /api/v1/promotion/preview?academicYear=&promotionScore=
// @access  Private (Admin)
const previewPromotion = async (req, res, next) => {
  try {
    const academicYear = req.query.academicYear;
    if (!academicYear) {
      return res.status(400).json({ success: false, message: 'academicYear query parameter is required' });
    }

    const promotionScore = parsePromotionScore(req.query.promotionScore);
    if (promotionScore === null) {
      return res.status(400).json({ success: false, message: 'promotionScore must be a number between 0 and 100' });
    }

    const allClasses = await Class.find().lean();
    const previewData = [];

    for (const cls of allClasses) {
      const data = await getClassPromotionData(cls);
      if (!data) continue;
      const { students, courses, scores, ranking, nextClass } = data;

      ranking.forEach((rank) => {
        const missing = getMissingCourses(courses, scores, rank.studentId);
        const status = evaluateStudent(rank, missing, promotionScore, nextClass);

        previewData.push({
          studentId: rank.studentId,
          fullName: rank.fullName,
          studentCode: students.find(s => s._id.toString() === rank.studentId.toString())?.studentId,
          currentClass: cls.name,
          currentGradeLevel: cls.gradeLevel,
          averageScore: rank.overallTotal.toFixed(2),
          promotionScore,
          status,
          missingCourses: missing.map(m => m.name),
          nextClass: nextClass ? nextClass.name : null,
          nextGradeLevel: nextClass ? nextClass.gradeLevel : null,
        });
      });
    }

    const summary = {
      totalStudents: previewData.length,
      promoted: previewData.filter(p => p.status === 'promoted').length,
      retained: previewData.filter(p => p.status === 'retained').length,
      graduated: previewData.filter(p => p.status === 'graduated').length,
      incomplete: previewData.filter(p => p.status === 'incomplete').length,
    };

    res.status(200).json({ success: true, data: previewData, summary, academicYear, promotionScore });
  } catch (error) {
    next(error);
  }
};

// @desc    Run promotion (apply changes)
// @route   POST /api/v1/promotion/run  { academicYear, promotionScore }
// @access  Private (Admin)
const runPromotion = async (req, res, next) => {
  try {
    const { academicYear } = req.body;
    if (!academicYear) {
      return res.status(400).json({ success: false, message: 'academicYear is required' });
    }

    const promotionScore = parsePromotionScore(req.body.promotionScore);
    if (promotionScore === null) {
      return res.status(400).json({ success: false, message: 'promotionScore must be a number between 0 and 100' });
    }

    const existingBatch = await PromotionBatch.findOne({ academicYear, status: 'applied' });
    if (existingBatch) {
      return res.status(400).json({
        success: false,
        message: 'Promotion already applied for this academic year. Use rollback first if you need to redo it.',
      });
    }

    const allClasses = await Class.find().lean();
    const records = [];

    for (const cls of allClasses) {
      const data = await getClassPromotionData(cls);
      if (!data) continue;
      const { courses, scores, ranking, nextClass } = data;

      ranking.forEach((rank) => {
        const missing = getMissingCourses(courses, scores, rank.studentId);
        const status = evaluateStudent(rank, missing, promotionScore, nextClass);

        let toClassId = null;
        if (status === 'promoted') toClassId = nextClass._id;
        else if (status === 'retained' || status === 'incomplete') toClassId = cls._id;
        else toClassId = null; // graduated

        records.push({
          student: rank.studentId,
          fromClass: cls._id,
          toClass: toClassId,
          averageScore: rank.overallTotal,
          promotionScore,
          missingCourses: missing.map(m => m.name),
          status,
        });
      });
    }

    const batch = await PromotionBatch.create({
      academicYear,
      promotionScore,
      runBy: req.user.id,
      status: 'applied',
      summary: {
        totalStudents: records.length,
        promoted: records.filter(r => r.status === 'promoted').length,
        retained: records.filter(r => r.status === 'retained').length,
        graduated: records.filter(r => r.status === 'graduated').length,
        incomplete: records.filter(r => r.status === 'incomplete').length,
      },
    });

    const recordsWithBatch = records.map(r => ({ ...r, batch: batch._id }));
    await PromotionRecord.insertMany(recordsWithBatch);

    // Move students (incomplete & retained stay in place)
    for (const record of records) {
      if (record.status === 'promoted' && record.toClass) {
        await User.findByIdAndUpdate(record.student, { class: record.toClass });
      } else if (record.status === 'graduated') {
        await User.findByIdAndUpdate(record.student, { accountStatus: 'inactive', class: null });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Promotion applied successfully',
      data: { batchId: batch._id, summary: batch.summary },
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
      return res.status(404).json({ success: false, message: 'Promotion batch not found' });
    }
    if (batch.status === 'rolled_back') {
      return res.status(400).json({ success: false, message: 'This batch has already been rolled back' });
    }

    const records = await PromotionRecord.find({ batch: batchId }).lean();

    for (const record of records) {
      if (record.status === 'promoted' || record.status === 'graduated') {
        await User.findByIdAndUpdate(record.student, { class: record.fromClass, accountStatus: 'active' });
      }
    }

    batch.status = 'rolled_back';
    await batch.save();

    res.status(200).json({
      success: true,
      message: 'Promotion rolled back successfully',
      data: { batchId: batch._id, revertedStudents: records.length },
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

    res.status(200).json({ success: true, count: batches.length, data: batches });
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