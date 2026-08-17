const mongoose = require('mongoose');
const User = require('../models/User');
const Counter = require('../models/Counter'); // Added to reset the ID counter
require('dotenv').config();

const seedAdmin = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ ERROR: MONGO_URI not set in .env file');
    console.log('Create a .env file with: MONGO_URI=your_mongodb_connection_string');
    process.exit(1);
  }

  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected successfully\n');

    // 1. Delete existing admin with ID AS-0001 to ensure a clean slate
    console.log('🗑️  Checking for existing admin (AS-0001)...');
    const deleteResult = await User.deleteOne({ adminId: 'AS-0001' });
    
    if (deleteResult.deletedCount > 0) {
      console.log('✅ Existing admin deleted successfully.\n');
    } else {
      console.log('ℹ️  No existing admin with ID AS-0001 found. Proceeding to create...\n');
    }

    // 2. Reset the admin ID counter so the next admin created via UI gets AS-0002
    await Counter.findByIdAndUpdate(
      'adminId',
      { seq: 1 },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log('🔢 Admin ID counter reset to 1 (Next UI admin will be AS-0002).\n');

    // 3. Create the new admin user
    console.log('👤 Creating admin user...');
    
    const admin = await User.create({
      fullName: 'System Administrator',
      adminId: 'AS-0001',
      password: '122112', // Will be automatically hashed by the pre-save hook
      role: 'admin',
      accountStatus: 'active',
      phone: '+251 911 123 456',
      qualifications: 'System Admin'
    });

    console.log('\n═══════════════════════════════════════════');
    console.log('✅ ADMIN CREATED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════');
    console.log(`👤 Name:     ${admin.fullName}`);
    console.log(`🆔 Admin ID: ${admin.adminId}`);
    console.log(`🔑 Password: 122112`);
    console.log('═══════════════════════════════════════════');
    console.log('\n⚠️  Login with:');
    console.log('   User ID: AS-0001');
    console.log('   Password: 122112\n');

  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
    if (error.code === 11000) {
      console.log('   Duplicate key error - admin ID or email already exists');
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

seedAdmin();