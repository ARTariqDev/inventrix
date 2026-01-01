const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({
  email: String,
  fullName: String,
  password: String,
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

async function setPassword() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const user = await User.findOne({ email: 'artariqdev@gmail.com' });
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    // Set a simple hashed password (in production, use proper bcrypt)
    // This is the bcrypt hash of "test123"
    const hashedPassword = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
    user.password = hashedPassword;
    await user.save();

    console.log('✅ Password set successfully!');
    console.log('\n📧 Login credentials:');
    console.log('   Email: artariqdev@gmail.com');
    console.log('   Password: test123');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

setPassword();
