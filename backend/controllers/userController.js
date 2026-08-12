const User = require('../models/User');

// @desc    Get all users (with filtering by role or class)
// @route   GET /api/v1/users
// @access  Private/Admin or Teacher (limited)
const getUsers = async (req, res, next) => {
  try {
    let query = {};

    if (req.query.role) {
      query.role = req.query.role;
    }

    if (req.query.class) {
      query.class = req.query.class;
    }

    // Fetch all users including pinHash to check if PIN exists
    const users = await User.find(query)
      .select('fullName email role studentId qualifications class phone pinHash')
      .populate('class', 'name')
      .sort({ fullName: 1 })
      .lean();

    // Add hasPin field and remove pinHash from response
    const usersWithPinStatus = users.map(user => ({
      ...user,
      hasPin: !!user.pinHash,
      pinHash: undefined, // Remove from response
    }));

    res.status(200).json({
      success: true,
      count: usersWithPinStatus.length,
      data: usersWithPinStatus,
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
    const user = await User.findById(req.params.id)
      .select('+pinHash')
      .populate('class', 'name')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Add hasPin field and remove pinHash from response
    const userWithPinStatus = {
      ...user,
      hasPin: !!user.pinHash,
      pinHash: undefined,
    };

    res.status(200).json({
      success: true,
      data: userWithPinStatus,
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
    // First get the current user to check their role
    const currentUser = await User.findById(req.params.id);
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent adding email to students or removing email from admin/teacher
    if (currentUser.role === 'student') {
      // Students shouldn't have email - remove it from update data
      delete req.body.email;
      delete req.body.password; // Students don't use password
    } else if (req.body.email) {
      // For admin/teacher, email must be provided if it wasn't already set
      if (!currentUser.email && !req.body.email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required for admin/teacher accounts',
        });
      }
    }

    const { password, ...updateData } = req.body;

    if (password && currentUser.role !== 'student') {
      // Only allow password updates for non-student users
      const user = await User.findById(req.params.id).select('+password');
      user.password = password;
      await user.save();
      delete updateData.password;
    } else if (password && currentUser.role === 'student') {
      // Students don't use passwords, remove it
      delete updateData.password;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('class', 'name')
      .lean();

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