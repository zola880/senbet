const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const { jwtSecret, jwtExpire } = require('../config/env');
const crypto = require('crypto');

const generateToken = (id) => {
  return jwt.sign({ id }, jwtSecret, {
    expiresIn: jwtExpire,
  });
};

// BULLETPROOF student ID generator:
// - Queries all existing student IDs
// - Finds the numeric maximum (not alphabetical)
// - Has a safe fallback using timestamp
const generateStudentId = async () => {
  try {
    const allStudents = await User.find(
      { studentId: { $ne: null } },
      { studentId: 1 }
    ).lean();

    if (allStudents.length === 0) {
      return 'SS-0001';
    }

    const numbers = allStudents
      .map(student => {
        const match = student.studentId.match(/^SS-(\d{4})$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => num > 0);

    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const newNumber = maxNumber + 1;

    return `SS-${String(newNumber).padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating student ID:', error);
    // Fallback: timestamp-based unique ID
    const timestamp = Date.now() % 10000;
    return `SS-${String(timestamp).padStart(4, '0')}`;
  }
};

const generatePin = () => {
  const buffer = crypto.randomBytes(3);
  const num = buffer.readUIntBE(0, 3) % 1000000;
  return String(num).padStart(6, '0');
};

// @desc    Register a new user (Admin only)
// @route   POST /api/v1/auth/register
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
    console.error('Register error:', error);
    next(error);
  }
};

// @desc    Register a new student (Admin only) with auto-generated Student ID + PIN
// @route   POST /api/v1/auth/register/student
// FIX: Retry up to 3 times on duplicate ID collision
const registerStudent = async (req, res, next) => {
  try {
    const {
      fullName,
      class: classId,
      phone,
    } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required',
      });
    }

    if (!classId) {
      return res.status(400).json({
        success: false,
        message: 'Class is required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class selected',
      });
    }

    // Retry up to 3 times in case of rare ID collision
    let user = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts && !user) {
      attempts++;
      const studentId = await generateStudentId();
      const newPin = generatePin();

      console.log(`Attempt ${attempts}: Creating student with ID ${studentId}`);

      try {
        user = await User.create({
          fullName: fullName.trim(),
          studentId,
          pinHash: newPin,
          role: 'student',
          class: classId,
          phone: phone || null,
          accountStatus: 'active',
        });

        user.password = undefined;
        user.pinHash = undefined;

        console.log('SUCCESS: Student created:', user.studentId);

        return res.status(201).json({
          success: true,
          data: {
            studentId: user.studentId,
            fullName: user.fullName,
            class: user.class,
            phone: user.phone,
            role: user.role,
            createdPin: newPin,
          },
          token: generateToken(user._id),
        });
      } catch (createError) {
        // If duplicate key, retry with new ID
        if (createError.code === 11000) {
          console.log(`Duplicate ID on attempt ${attempts}, retrying...`);
          continue;
        }
        // Other errors, throw immediately
        throw createError;
      }
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to generate unique Student ID. Please try again.',
    });
  } catch (error) {
    console.error('=== REGISTER STUDENT ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    if (error.errors) {
      console.error('Error details:', JSON.stringify(error.errors, null, 2));
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }
    
    next(error);
  }
};

// @desc    Generate PIN for existing student (Admin only)
// @route   POST /api/v1/auth/generate-pin/:id
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
    console.error('GenerateStudentPin error:', error);
    next(error);
  }
};

// @desc    Login user with email + password (Admin/Teacher)
// @route   POST /api/v1/auth/login
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

    if (user.role === 'student') {
      return res.status(403).json({
        success: false,
        message: 'Students must use Student ID and PIN to login',
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
    console.error('Login error:', error);
    next(error);
  }
};

// @desc    Login student with Student ID + PIN
// @route   POST /api/v1/auth/student/login
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
    console.error('StudentLogin error:', error);
    next(error);
  }
};

// @desc    Get current logged-in user
// @route   GET /api/v1/auth/me
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
    console.error('GetMe error:', error);
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