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
  try {
    const latestUser = await User.findOne({ studentId: { $ne: null } })
      .sort({ studentId: -1 })
      .select('studentId')
      .lean();

    if (latestUser && latestUser.studentId) {
      const lastNumber = parseInt(latestUser.studentId.split('-')[1], 10);
      return `SS-${String(lastNumber + 1).padStart(4, '0')}`;
    }
    return 'SS-0001';
  } catch (error) {
    console.error('Error generating student ID:', error);
    throw new Error('Failed to generate Student ID');
  }
};

const generatePin = () => {
  const buffer = crypto.randomBytes(3);
  const num = buffer.readUIntBE(0, 3) % 1000000;
  return String(num).padStart(6, '0');
};

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

    // Check if user already exists
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

const registerStudent = async (req, res, next) => {
  try {
    const {
      fullName,
      class: classId,
      phone,
    } = req.body;

    // Validate required fields
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

    // Generate unique student ID
    const studentId = await generateStudentId();
    
    // Generate secure 6-digit PIN
    const newPin = generatePin();

    console.log('Creating student:', { fullName, studentId, class: classId });

    const user = await User.create({
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

    console.log('Student created successfully:', user.studentId);

    res.status(201).json({
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
  } catch (error) {
    console.error('RegisterStudent error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate Student ID. Please try again.',
      });
    }
    
    // Handle validation errors
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