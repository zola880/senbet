const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret, jwtExpire } = require('../config/env');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, jwtSecret, {
    expiresIn: jwtExpire,
  });
};

// @desc    Register a new user (Admin only)
// @route   POST /api/v1/auth/register
// @access  Private/Admin
const register = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      password,
      role,
      class: classId,
      rollNumber,
      qualifications,
      phone,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    const user = await User.create({
      fullName,
      email,
      password,
      role,
      class: classId || null,
      rollNumber,
      qualifications,
      phone,
    });

    // Remove password from output
    user.password = undefined;

    res.status(201).json({
      success: true,
      data: user,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Remove password
    user.password = undefined;

    res.status(200).json({
      success: true,
      data: user,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged-in user
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('class');
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
};