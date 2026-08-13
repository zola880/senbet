const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Counter = require('../models/Counter');
const { jwtSecret, jwtExpire } = require('../config/env');
const crypto = require('crypto');

const generateToken = (id) => {
  return jwt.sign({ id }, jwtSecret, { expiresIn: jwtExpire });
};

// Generate a 6-digit PIN
const generatePin = () => {
  const buffer = crypto.randomBytes(3);
  const num = buffer.readUIntBE(0, 3) % 1000000;
  return String(num).padStart(6, '0');
};

// Sync the counter with the highest existing student ID
const syncStudentIdCounter = async () => {
  // Find the highest student ID number
  const allStudents = await User.find(
    { studentId: { $ne: null } },
    { studentId: 1 }
  ).lean();

  let maxNumber = 0;
  allStudents.forEach((student) => {
    const match = student.studentId.match(/^SS-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNumber) maxNumber = num;
    }
  });

  // Get current counter value
  const counter = await Counter.findById('studentId');
  const currentSeq = counter ? counter.seq : 0;

  // If the highest existing ID is greater than or equal to current counter, update counter
  if (maxNumber >= currentSeq) {
    await Counter.findByIdAndUpdate(
      'studentId',
      { seq: maxNumber },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`Counter synced: max existing = ${maxNumber}, counter set to ${maxNumber}`);
  } else {
    console.log(`Counter already higher: counter = ${currentSeq}, max existing = ${maxNumber}`);
  }
};

// Generate a unique Student ID
const generateStudentId = async () => {
  // First, sync the counter to avoid duplicates from stale counter
  await syncStudentIdCounter();

  // Increment the counter atomically
  const counter = await Counter.findByIdAndUpdate(
    'studentId',
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const studentId = `SS-${String(counter.seq).padStart(4, '0')}`;
  console.log(`Generated student ID: ${studentId}`);
  return studentId;
};

// Register a non-student user (admin/teacher)
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

// Register a student with automatic ID and PIN generation
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

    // Basic validations
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required' });
    }

    if (!classId) {
      return res.status(400).json({ success: false, message: 'Class is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ success: false, message: 'Invalid class selected' });
    }

    const maxAttempts = 3;
    let lastError = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Generate a fresh ID for each attempt
        const studentId = await generateStudentId();
        const newPin = generatePin();

        console.log(`Attempt ${attempt + 1}: Creating student ${fullName} with ID ${studentId}`);

        // Attempt to create the user
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
          hasPin: true, // PIN is auto-generated
        });

        // Success
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
      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error);

        // If duplicate key error, it's definitely the studentId (since no other unique fields are set)
        if (error.code === 11000) {
          console.warn(`Duplicate key error on attempt ${attempt + 1}. Retrying...`);
          lastError = error;
          continue;
        }

        // Validation error
        if (error.name === 'ValidationError') {
          const messages = Object.values(error.errors).map((err) => err.message);
          return res.status(400).json({ success: false, message: messages.join(', ') });
        }

        // Other errors
        throw error;
      }
    }

    // If all attempts failed due to duplicate
    console.error('Failed to create student after multiple attempts:', lastError);
    return res.status(500).json({
      success: false,
      message: 'Could not generate a unique Student ID. Please try again.',
    });
  } catch (error) {
    console.error('=== REGISTER STUDENT ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    next(error);
  }
};

// Generate or reset a student's PIN
const generateStudentPin = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('+pinHash');
    if (!user) return res.status(404).json({ success: false, message: 'Student not found' });
    if (user.role !== 'student') return res.status(400).json({ success: false, message: 'User is not a student' });

    const newPin = generatePin();
    user.pinHash = newPin;
    user.hasPin = true;
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

// Reset counter to match highest existing student ID (admin utility)
const resetStudentIdCounter = async (req, res, next) => {
  try {
    await syncStudentIdCounter();
    const counter = await Counter.findById('studentId');
    const nextId = `SS-${String(counter.seq + 1).padStart(4, '0')}`;

    res.status(200).json({
      success: true,
      message: `Counter reset. Next student will get ID: ${nextId}`,
      data: {
        highestExistingId: counter ? `SS-${String(counter.seq).padStart(4, '0')}` : null,
        nextId,
        totalStudents: await User.countDocuments({ role: 'student' }),
      },
    });
  } catch (error) {
    console.error('Reset counter error:', error);
    next(error);
  }
};

// Login for non-students
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

// Student login with ID and PIN
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

// Get current user
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
  resetStudentIdCounter,
};