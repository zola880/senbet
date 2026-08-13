const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Counter = require('../models/Counter');
const { jwtSecret, jwtExpire } = require('../config/env');
const crypto = require('crypto');

const generateToken = (id) => {
  return jwt.sign({ id }, jwtSecret, { expiresIn: jwtExpire });
};

// FIXED: More robust ID generation with retry and verification
const generateStudentId = async () => {
  const maxAttempts = 3;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Increment the counter
      const counter = await Counter.findByIdAndUpdate(
        'studentId',
        { $inc: { seq: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      
      const studentId = `SS-${String(counter.seq).padStart(4, '0')}`;
      
      // Verify this ID doesn't already exist
      const existing = await User.findOne({ studentId }).select('_id').lean();
      
      if (existing) {
        console.warn(`Attempt ${attempt + 1}: Generated ID ${studentId} already exists, retrying...`);
        continue; // Try again
      }
      
      return studentId;
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      if (attempt === maxAttempts - 1) throw error; // Throw on last attempt
    }
  }
  
  throw new Error('Failed to generate unique Student ID after 3 attempts');
};

// FIXED: Rollback counter if user creation fails
const rollbackStudentIdCounter = async () => {
  try {
    await Counter.findByIdAndUpdate(
      'studentId',
      { $inc: { seq: -1 } },
      { new: true }
    );
    console.log('Rolled back student ID counter');
  } catch (error) {
    console.error('Failed to rollback counter:', error);
  }
};

const generatePin = () => {
  const buffer = crypto.randomBytes(3);
  const num = buffer.readUIntBE(0, 3) % 1000000;
  return String(num).padStart(6, '0');
};

const register = async (req, res, next) => {
  try {
    const { fullName, email, password, role, class: classId, qualifications, phone } = req.body;

    const existingUser = await User.findOne({ email }).select('_id').lean();
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const user = await User.create({
      fullName, email, password, role,
      class: classId || null, qualifications, phone,
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
      academicLevel,
      address,
      age,
      sex,
      fatherName,
    } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required' });
    }

    if (!classId) {
      return res.status(400).json({ success: false, message: 'Class is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ success: false, message: 'Invalid class selected' });
    }

    // Generate student ID with retry logic
    const studentId = await generateStudentId();
    const newPin = generatePin();

    console.log('Creating student:', { fullName, studentId, class: classId });

    try {
      const user = await User.create({
        fullName: fullName.trim(),
        studentId,
        pinHash: newPin,
        role: 'student',
        class: classId,
        phone: phone || null,
        accountStatus: 'active',
        academicLevel: academicLevel || null,
        address: address || null,
        age: age ? Number(age) : null,
        sex: sex || null,
        fatherName: fatherName || null,
        // PIN is generated automatically during registration
        hasPin: true,
      });

      user.password = undefined;
      user.pinHash = undefined;

      console.log('SUCCESS: Student created:', user.studentId);

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
    } catch (createError) {
      // If user creation failed, rollback the counter
      await rollbackStudentIdCounter();
      throw createError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('=== REGISTER STUDENT ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate Student ID. Please try again.' });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    
    next(error);
  }
};

const generateStudentPin = async (req, res, next) => {
  try {
    // IMPORTANT: Select pinHash so we can modify it
    const user = await User.findById(req.params.id).select('+pinHash');
    if (!user) return res.status(404).json({ success: false, message: 'Student not found' });
    if (user.role !== 'student') return res.status(400).json({ success: false, message: 'User is not a student' });

    const newPin = generatePin();
    user.pinHash = newPin;
    user.hasPin = true; // Ensure hasPin is true after PIN generation
    await user.save();

    user.password = undefined;
    user.pinHash = undefined;

    res.status(200).json({
      success: true,
      data: { studentId: user.studentId, fullName: user.fullName, createdPin: newPin },
    });
  } catch (error) {
    console.error('GenerateStudentPin error:', error);
    next(error);
  }
};

// NEW: Reset counter to match highest existing student ID
const resetStudentIdCounter = async (req, res, next) => {
  try {
    // Find the highest existing student ID
    const allStudents = await User.find(
      { studentId: { $ne: null } },
      { studentId: 1 }
    ).lean();

    let maxNumber = 0;
    allStudents.forEach(student => {
      const match = student.studentId.match(/^SS-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) maxNumber = num;
      }
    });

    // Reset counter to the highest number
    await Counter.findByIdAndUpdate(
      'studentId',
      { seq: maxNumber },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const nextId = `SS-${String(maxNumber + 1).padStart(4, '0')}`;

    res.status(200).json({
      success: true,
      message: `Counter reset. Next student will get ID: ${nextId}`,
      data: {
        highestExistingId: allStudents.length > 0 ? `SS-${String(maxNumber).padStart(4, '0')}` : null,
        nextId: nextId,
        totalStudents: allStudents.length
      }
    });
  } catch (error) {
    console.error('Reset counter error:', error);
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Please provide email and password' });

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });
    if (user.role === 'student') return res.status(403).json({ success: false, message: 'Students must use Student ID and PIN to login' });
    if (user.accountStatus !== 'active') return res.status(403).json({ success: false, message: 'Account is not active' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    user.password = undefined;

    res.status(200).json({ success: true, data: user, token: generateToken(user._id) });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

const studentLogin = async (req, res, next) => {
  try {
    const { studentId, pin } = req.body;
    if (!studentId || !pin) return res.status(400).json({ success: false, message: 'Please provide Student ID and PIN' });

    const user = await User.findOne({ studentId }).select('+pinHash');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid Student ID or PIN' });
    if (user.role !== 'student') return res.status(403).json({ success: false, message: 'This login is for students only' });
    if (user.accountStatus !== 'active') return res.status(403).json({ success: false, message: 'Account is not active' });
    if (!user.pinHash) return res.status(401).json({ success: false, message: 'PIN not set. Please contact administrator.' });

    const isMatch = await user.matchPin(pin);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid Student ID or PIN' });

    user.password = undefined;
    user.pinHash = undefined;

    res.status(200).json({ success: true, data: user, token: generateToken(user._id) });
  } catch (error) {
    console.error('StudentLogin error:', error);
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('class', 'name').lean();
    res.status(200).json({ success: true, data: user });
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
  resetStudentIdCounter
};