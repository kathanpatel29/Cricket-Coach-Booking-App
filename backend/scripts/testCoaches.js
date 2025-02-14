const mongoose = require('mongoose');
const Coach = require('../models/Coach');
const User = require('../models/User');
require('dotenv').config();

const testCoaches = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // First check Users with coach role
    const coachUsers = await User.find({ role: 'coach' });
    console.log('\nCoach Users found:', coachUsers.length);
    
    // Find all coaches with populated user data
    const coaches = await Coach.find().populate({
      path: 'user',
      select: 'name email role isActive isApproved'
    });
    
    console.log('\nTotal coaches found:', coaches.length);
    
    if (coaches.length > 0) {
      coaches.forEach(coach => {
        console.log('\nCoach Details:');
        console.log('Name:', coach.user?.name);
        console.log('Email:', coach.user?.email);
        console.log('Status:', coach.status);
        console.log('Approval Status:', coach.approvalStatus);
        console.log('Specializations:', coach.specializations);
        console.log('Is Available:', coach.isAvailable);
        console.log('Has Set Availability:', coach.hasSetAvailability);
        console.log('Availability Slots:', coach.availability?.length || 0);
      });
    } else {
      console.log('No coaches found in the database');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testCoaches(); 