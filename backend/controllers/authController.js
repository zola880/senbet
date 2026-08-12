const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret, jwtExpire } = require('../config/env');
const crypto = require('crypto');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, jwtSecret, {
    expiresIn: jwtExpire,
  });
};

// Generate unique student ID (SS-XXXX format)
const generateStudentId = async () => {
  // Try to get the highest existing student ID
  const latestUser = await User.findOne({ studentId: { $ne: null } })
    .sort({ studentId: -1 })
    .select('studentId')
    .lean();
  
  if (latestUser && latestUser.studentId) {
    // Extract number from SS-XXXX
    const lastNumber = parseInt(latestUser.studentId.split('-')[1], 10);
    const newNumber = lastNumber + 1;
    return `SS-${String(newNumber).padStart(4, '0')}`;
  } else {
    // Start from SS-0001
    return 'SS-0001';
  }
};

// Generate secure 6-digit PIN
const generatePin = () => {
  // Use crypto for cryptographically secure random number
  const buffer = crypto.randomBytes(3); // 3 bytes = 24 bits, enough for 6 digits
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
      rollNumber,
      qualifications,
      phone,
    } = req.body;

    // OPTIMIZATION: Added .select('_id') and .lean() for existence check
    // We only need to know if user exists, don't need full document
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

// @desc    Register a new student (Admin only) with auto-generated Student ID and PIN
// @route   POST /api/v1/auth/register/student
// @access  Private/Admin
const registerStudent = async (req, res, next) => {
  try {
    const {
      fullName,
      class: classId,
      rollNumber,
      phone,
    } = req.body;

    // Generate unique student ID
    const studentId = await generateStudentId();
    
    // Generate secure 6-digit PIN
    const pin = generatePin();

    // Create user with student ID and PIN hash
    const user = await User.create({
      fullName,
      studentId,
      pinHash: pin, // Will be hashed by pre-save middleware
      role: 'student',
      class: classId || null,
      rollNumber: rollNumber || null,
      phone: phone || null,
      accountStatus: 'active',
    });

    // Remove sensitive data from output
    user.password = undefined;
    user.pinHash = undefined;

    res.status(201).json({
      success: true,
      data: {
        studentId: user.studentId,
        fullName: user.fullName,
        class: user.class,
        rollNumber: user.rollNumber,
        phone: user.phone,
        role: user.role,
        createdPin: pin, // Show PIN to admin only
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

    // Generate new secure 6-digit PIN
    const newPin = generatePin();
    
    // Update the user's PIN hash
    user.pinHash = newPin;
    await user.save();

    // Remove sensitive data from output
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

    // NO .lean() here - we MUST keep full Mongoose document to call user.matchPassword()
    // This is a Mongoose instance method that doesn't exist on plain objects
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check account status
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

    // Find user by studentId and include pinHash
    const user = await User.findOne({ studentId }).select('+pinHash');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Student ID or PIN',
      });
    }

    // Check role - must be a student
    if (user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'This login is for students only',
      });
    }

    // Check account status
    if (user.accountStatus !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active',
      });
    }

    // Verify PIN
    const isMatch = await user.matchPin(pin);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Student ID or PIN',
      });
    }

    // Remove sensitive data
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
    // OPTIMIZATION: Added .lean() for plain object (faster serialization)
    // OPTIMIZATION: Limited populate to only 'name' field (frontend only shows class name)
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