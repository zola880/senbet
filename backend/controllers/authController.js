const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret, jwtExpire } = require('../config/env');
const crypto = require('crypto');

const generateToken = (id) => {
  return jwt.sign({ id }, jwtSecret, {
    expiresIn: jwtExpire,
  });
};

const generateStudentId = async () => {
  const latestUser = await User.findOne({ studentId: { $ne: null } })
    .sort({ studentId: -1 })
    .select('studentId')
    .lean();
  
  if (latestUser && latestUser.studentId) {
    const lastNumber = parseInt(latestUser.studentId.split('-')[1], 10);
    const newNumber = lastNumber + 1;
    return `SS-${String(newNumber).padStart(4, '0')}`;
  } else {
    return 'SS-0001';
  }
};

const generatePin = () => {
  const buffer = crypto.randomBytes(3);
  const num = buffer.readUIntBE(0, 3) % 1000000;
  return String(num).padStart(6, '0');
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
      qualifications,
      phone,
    } = req.body;

    const existingUser = await User.findOne({ email })
      .select('_id')
      .lean();

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
      qualifications,
      phone,
    });

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

// @desc    Register a new student (Admin only) with auto-generated Student ID
// @route   POST /api/v1/auth/register/student
// @access  Private/Admin
const registerStudent = async (req, res, next) => {
  try {
    const {
      fullName,
      class: classId,
      phone,
    } = req.body;

    const studentId = await generateStudentId();

    const user = await User.create({
      fullName,
      studentId,
      role: 'student',
      class: classId || null,
      phone: phone || null,
      accountStatus: 'active',
    });

    user.password = undefined;
    user.pinHash = undefined;

    res.status(201).json({
      success: true,
      data: {
        studentId: user.studentId,
        fullName: user.fullName,
        class: user.class,
        phone: user.phone,
        role: user.role,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate PIN for existing student (Admin only)
// @route   POST /api/v1/auth/generate-pin/:id
// @access  Private/Admin
const generateStudentPin = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    if (user.role !== 'student') {
      return res.status(400).json({
        success: false,
        message: 'User is not a student',
      });
    }

    const newPin = generatePin();
    
    user.pinHash = newPin;
    await user.save();

    user.password = undefined;
    user.pinHash = undefined;

    res.status(200).json({
      success: true,
      data: {
        studentId: user.studentId,
        fullName: user.fullName,
        createdPin: newPin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user with email + password (Admin/Teacher)
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

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (user.accountStatus !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

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

// @desc    Login student with Student ID + PIN
// @route   POST /api/v1/auth/student/login
// @access  Public
const studentLogin = async (req, res, next) => {
  try {
    const { studentId, pin } = req.body;

    if (!studentId || !pin) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Student ID and PIN',
      });
    }

    const user = await User.findOne({ studentId }).select('+pinHash');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Student ID or PIN',
      });
    }

    if (user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'This login is for students only',
      });
    }

    if (user.accountStatus !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active',
      });
    }

    if (!user.pinHash) {
      return res.status(401).json({
        success: false,
        message: 'PIN not set. Please contact administrator.',
      });
    }

    const isMatch = await user.matchPin(pin);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Student ID or PIN',
      });
    }

    user.password = undefined;
    user.pinHash = undefined;

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
    const user = await User.findById(req.user.id)
      .populate('class', 'name')
      .lean();

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
  registerStudent,
  generateStudentPin,
  login,
  studentLogin,
  getMe,
};