const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const testLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the test user
    const user = await User.findOne({ email: 'client1@example.com' }).select('+password');
    
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('User found:', {
      id: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isApproved: user.isApproved
    });

    // Test password comparison
    const isMatch = await user.comparePassword('Client@123');
    console.log('Password match:', isMatch);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
};

testLogin(); 