/**
 * Migration Script: Convert existing students to use Student ID + PIN authentication
 * 
 * This script:
 * 1. Finds all students in the database
 * 2. Generates unique Student IDs (SS-XXXX format) for each
 * 3. Generates secure 6-digit PINs for each student
 * 4. Updates the database with studentId and pinHash fields
 * 
 * Run with: node backend/scripts/migrateStudents.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { mongoURI } = require('../config/env');

// Generate unique student ID (SS-XXXX format)
const generateStudentId = async (startingPoint = 1) => {
  const latestUser = await User.findOne({ studentId: { $ne: null } })
    .sort({ studentId: -1 })
    .select('studentId')
    .lean();
  
  let lastNumber = startingPoint - 1;
  
  if (latestUser && latestUser.studentId) {
    lastNumber = parseInt(latestUser.studentId.split('-')[1], 10);
  }
  
  const newNumber = lastNumber + 1;
  return `SS-${String(newNumber).padStart(4, '0')}`;
};

// Generate secure 6-digit PIN
const generatePin = () => {
  const buffer = crypto.randomBytes(3);
  const num = buffer.readUIntBE(0, 3) % 1000000;
  return String(num).padStart(6, '0');
};

const hashPin = async (pin) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(pin, salt);
};

const migrateStudents = async () => {
  console.log('Starting student migration...');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Find all students
    const students = await User.find({ role: 'student' });
    console.log(`Found ${students.length} students to migrate`);

    if (students.length === 0) {
      console.log('No students found. Migration complete.');
      process.exit(0);
    }

    // Track progress
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process each student
    for (const student of students) {
      try {
        // Check if student already has studentId
        if (student.studentId) {
          console.log(`✓ Skipping ${student.fullName}: already has studentId (${student.studentId})`);
          skippedCount++;
          continue;
        }

        // Generate new student ID
        const studentId = await generateStudentId(migratedCount + 1);
        
        // Generate new PIN
        const pin = generatePin();
        
        // Hash the PIN
        const pinHash = await hashPin(pin);

        // Update the student
        student.studentId = studentId;
        student.pinHash = pinHash;
        student.accountStatus = 'active';
        // Clear password for students since they use PIN, not password
        // Keep email for communication but they won't be able to login with it
        student.password = undefined;
        
        await student.save();

        console.log(`✓ Migrated ${student.fullName}`);
        console.log(`  Student ID: ${studentId}`);
        console.log(`  PIN: ${pin} (write this down!)`);
        console.log('');

        migratedCount++;

      } catch (err) {
        console.error(`✗ Failed to migrate ${student.fullName}:`, err.message);
        errors.push({ name: student.fullName, error: err.message });
        errorCount++;
      }
    }

    // Summary
    console.log('');
    console.log('========================================');
    console.log('Migration Summary:');
    console.log('========================================');
    console.log(`Total students found: ${students.length}`);
    console.log(`Successfully migrated: ${migratedCount}`);
    console.log(`Already had studentId: ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);

    if (errors.length > 0) {
      console.log('');
      console.log('Errors:');
      errors.forEach(err => {
        console.log(`  - ${err.name}: ${err.error}`);
      });
    }

    console.log('');
    console.log('IMPORTANT: The new PINs for each student are shown above.');
    console.log('Please provide these to your students/parents securely.');
    console.log('========================================');

    // Disconnect
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

// Run the migration
migrateStudents();