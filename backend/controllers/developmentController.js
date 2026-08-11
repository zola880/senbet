const DevelopmentRecord = require('../models/DevelopmentRecord');

// Only admin and the development manager may use these endpoints
const canAccess = (role) => ['admin', 'development'].includes(role);

// @desc    Add a new income or expense record
// @route   POST /api/v1/development
// @access  Private (admin, development)
const createRecord = async (req, res, next) => {
  try {
    if (!canAccess(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { type, description, amount, quantity, date, notes } = req.body;

    const record = await DevelopmentRecord.create({
      type,
      description,
      amount,
      quantity,
      date: date || Date.now(),
      notes,
      recordedBy: req.user._id,
    });

    res.status(201).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

// @desc    Get records with optional filters (type, date range)
// @route   GET /api/v1/development?type=&startDate=&endDate=
// @access  Private (admin, development)
const getRecords = async (req, res, next) => {
  try {
    if (!canAccess(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const filter = {};
    if (req.query.type) filter.type = req.query.type;

    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const records = await DevelopmentRecord.find(filter)
      .select('type description amount quantity date notes recordedBy')
      .populate('recordedBy', 'fullName')
      .sort({ date: -1, createdAt: -1 })
      .limit(500)
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

// @desc    Get totals (income, expense, balance) for a date range
// @route   GET /api/v1/development/summary?startDate=&endDate=
// @access  Private (admin, development)
const getSummary = async (req, res, next) => {
  try {
    if (!canAccess(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const dateMatch = {};
    if (req.query.startDate || req.query.endDate) {
      dateMatch.date = {};
      if (req.query.startDate) dateMatch.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        dateMatch.date.$lte = end;
      }
    }

    const [incomeAgg, expenseAgg] = await Promise.all([
      DevelopmentRecord.aggregate([
        { $match: { type: 'income', ...dateMatch } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      DevelopmentRecord.aggregate([
        { $match: { type: 'expense', ...dateMatch } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
    ]);

    const totalIncome = incomeAgg[0]?.total || 0;
    const totalExpense = expenseAgg[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        incomeCount: incomeAgg[0]?.count || 0,
        expenseCount: expenseAgg[0]?.count || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a record (owner or admin)
// @route   PUT /api/v1/development/:id
// @access  Private (admin, development)
const updateRecord = async (req, res, next) => {
  try {
    const record = await DevelopmentRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    const isOwner = record.recordedBy.toString() === req.user._id.toString();
    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { type, description, amount, quantity, date, notes } = req.body;
    if (type) record.type = type;
    if (description) record.description = description;
    if (amount !== undefined) record.amount = amount;
    if (quantity !== undefined) record.quantity = quantity;
    if (date) record.date = date;
    if (notes !== undefined) record.notes = notes;

    await record.save();

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a record (owner or admin)
// @route   DELETE /api/v1/development/:id
// @access  Private (admin, development)
const deleteRecord = async (req, res, next) => {
  try {
    const record = await DevelopmentRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    const isOwner = record.recordedBy.toString() === req.user._id.toString();
    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await record.deleteOne();

    res.status(200).json({ success: true, message: 'Record deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRecord,
  getRecords,
  getSummary,
  updateRecord,
  deleteRecord,
};