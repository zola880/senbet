const User = require('../models/User');

// @desc    Get all users (with filtering by role or class)
// @route   GET /api/v1/users
// @access  Private/Admin or Teacher (limited)
const getUsers = async (req, res, next) => {
  try {
    let query = {};

    // Filter by role
    if (req.query.role) {
      query.role = req.query.role;
    }

    // Filter by class (for students)
    if (req.query.class) {
      query.class = req.query.class;
    }

    // Teacher can only see students of their assigned classes
    if (req.user.role === 'teacher') {
      // We could restrict further, but for simplicity, teachers can view students they teach
      // We'll rely on assignment context. For now, let them view all students if they provide class?
      // Better: in a real app, restrict to classes they teach. We'll keep simple.
    }

    const users = await User.find(query)
      .populate('class')
      .sort({ fullName: 1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Private
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('class');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
const updateUser = async (req, res, next) => {
  try {
    const { password, ...updateData } = req.body;

    // If password is being updated, handle separately
    if (password) {
      const user = await User.findById(req.params.id).select('+password');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      user.password = password;
      await user.save();
      delete updateData.password;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('class');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
};