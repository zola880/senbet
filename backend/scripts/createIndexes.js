const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/yetemari_serta';

async function createIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected successfully.');

    const db = mongoose.connection.db;

    // ---------- Users ----------
    console.log('Creating indexes for users...');
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1 });
    await db.collection('users').createIndex({ class: 1 });

    // ---------- Classes ----------
    console.log('Creating indexes for classes...');
    await db.collection('classes').createIndex({ name: 1 }, { unique: true });

    // ---------- Courses ----------
    console.log('Creating indexes for courses...');
    await db.collection('courses').createIndex({ code: 1 }, { sparse: true });

    // ---------- Teacher Assignments ----------
    console.log('Creating indexes for teacherassignments...');
    await db.collection('teacherassignments').createIndex({ teacher: 1 });
    await db.collection('teacherassignments').createIndex({ class: 1 });
    await db.collection('teacherassignments').createIndex({ course: 1 });
    // Compound index for checking if a teacher is assigned to a specific course+class
    await db.collection('teacherassignments').createIndex(
      { teacher: 1, course: 1, class: 1 },
      { unique: true, partialFilterExpression: { class: { $exists: true } } }
    );

    // ---------- Student Scores ----------
    console.log('Creating indexes for studentscores...');
    await db.collection('studentscores').createIndex({ student: 1, course: 1, componentName: 1 });
    await db.collection('studentscores').createIndex({ class: 1, course: 1, componentName: 1 });
    await db.collection('studentscores').createIndex({ student: 1 });

    // ---------- Attendance ----------
    console.log('Creating indexes for attendances...');
    await db.collection('attendances').createIndex({ class: 1, date: 1 }, { unique: true });
    await db.collection('attendances').createIndex({ 'records.student': 1, date: -1 });

    // ---------- Practice Sessions ----------
    console.log('Creating indexes for practicesessions...');
    await db.collection('practicesessions').createIndex({ class: 1 });
    await db.collection('practicesessions').createIndex({ supervisor: 1 });

    // ---------- Notifications ----------
    console.log('Creating indexes for notifications...');
    await db.collection('notifications').createIndex({ recipient: 1, createdAt: -1 });
    await db.collection('notifications').createIndex({ recipient: 1, read: 1 });

    // ---------- Assessment Configs ----------
    console.log('Creating indexes for assessmentconfigs...');
    await db.collection('assessmentconfigs').createIndex({ class: 1, academicYear: 1 }, { unique: true });

    console.log('\n✅ All indexes created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating indexes:', error.message);
    process.exit(1);
  }
}

createIndexes();