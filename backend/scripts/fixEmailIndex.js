const mongoose = require('mongoose');
require('dotenv').config();

const run = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('ERROR: MONGO_URI not set in .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected successfully');

  console.log('\nDropping old email index...');
  try {
    await mongoose.connection.collection('users').dropIndex('email_1');
    console.log('✓ Old email index dropped');
  } catch (error) {
    if (error.codeName === 'IndexNotFound') {
      console.log('✓ Email index does not exist (already clean)');
    } else {
      throw error;
    }
  }

  console.log('\nCreating new sparse email index...');
  await mongoose.connection.collection('users').createIndex(
    { email: 1 },
    { unique: true, sparse: true }
  );
  console.log('✓ New sparse email index created');

  console.log('\n✅ Complete! Email index now properly allows multiple null values.');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('ERROR:', err);
  process.exit(1);
});