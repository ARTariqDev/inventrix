const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({
  email: String,
  fullName: String,
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

async function listAllUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const users = await User.find({});
    console.log(`\n📋 Total users: ${users.length}\n`);
    
    users.forEach((user, i) => {
      console.log(`${i + 1}. Email: "${user.email}"`);
      console.log(`   Name: ${user.fullName}`);
      console.log(`   ID: ${user._id}\n`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

listAllUsers();
