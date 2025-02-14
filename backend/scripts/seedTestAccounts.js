const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Coach = require('../models/Coach');
require('dotenv').config();

const testAccounts = {
  admin: {
    name: 'Admin User',
    email: 'admin@criccoach.com',
    password: 'Admin@123',
    role: 'admin'
  },
  coaches: [
    {
      name: 'John Smith',
      email: 'john@criccoach.com',
      password: 'Coach@123',
      specializations: ['batting', 'fielding'],
      experience: 10,
      hourlyRate: 50,
      bio: 'Former national player with 10 years of coaching experience'
    },
    {
      name: 'Sarah Wilson',
      email: 'sarah@criccoach.com',
      password: 'Coach@123',
      specializations: ['bowling', 'strategy'],
      experience: 8,
      hourlyRate: 45,
      bio: 'Specialized in fast bowling techniques and match strategy'
    },
    {
      name: 'Mike Johnson',
      email: 'mike@criccoach.com',
      password: 'Coach@123',
      specializations: ['batting', 'wicket-keeping'],
      experience: 12,
      hourlyRate: 55,
      bio: 'Expert in batting techniques and wicket keeping'
    },
    {
      name: 'David Brown',
      email: 'david@criccoach.com',
      password: 'Coach@123',
      specializations: ['spin-bowling', 'mental-coaching'],
      experience: 15,
      hourlyRate: 60,
      bio: 'Specialist in spin bowling and mental preparation'
    }
  ],
  clients: [
    {
      name: 'Client One',
      email: 'client1@example.com',
      password: 'Client@123'
    },
    {
      name: 'Client Two',
      email: 'client2@example.com',
      password: 'Client@123'
    },
    {
      name: 'Client Three',
      email: 'client3@example.com',
      password: 'Client@123'
    }
  ]
};

const seedTestAccounts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing test accounts
    await User.deleteMany({
      email: {
        $in: [
          testAccounts.admin.email,
          ...testAccounts.coaches.map(coach => coach.email),
          ...testAccounts.clients.map(client => client.email)
        ]
      }
    });
    await Coach.deleteMany({});

    // Create admin account
    const adminUser = new User({
      ...testAccounts.admin,
      isActive: true,
      isApproved: true
    });
    await adminUser.save();
    console.log('Admin account created:', adminUser.email);

    // Create coach accounts
    for (const coachData of testAccounts.coaches) {
      const coachUser = new User({
        name: coachData.name,
        email: coachData.email,
        password: coachData.password,
        role: 'coach',
        isActive: true,
        isApproved: true
      });
      await coachUser.save();

      // Create availability for next 7 days
      const availability = [];
      for (let i = 1; i <= 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        availability.push({
          date: date,
          slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']
        });
      }

      const coach = await Coach.create({
        user: coachUser._id,
        specializations: coachData.specializations,
        experience: coachData.experience,
        hourlyRate: coachData.hourlyRate,
        bio: coachData.bio,
        availability: availability,
        rating: 4.5,
        isAvailable: true,
        status: 'approved',
        approvalStatus: 'approved',
        hasSetAvailability: true,
        isProfileComplete: true
      });

      console.log('Coach account created:', coachUser.email);
    }

    // Create client accounts
    for (const clientData of testAccounts.clients) {
      const clientUser = new User({
        ...clientData,
        role: 'client',
        isActive: true,
        isApproved: true
      });
      await clientUser.save();
      console.log('Client account created:', clientUser.email);
    }

    console.log('\nTest accounts created successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin:', testAccounts.admin.email, '/', testAccounts.admin.password);
    console.log('Coaches:', testAccounts.coaches.map(c => `${c.email} / ${c.password}`).join('\n'));
    console.log('Clients:', testAccounts.clients.map(c => `${c.email} / ${c.password}`).join('\n'));

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding test accounts:', error);
    process.exit(1);
  }
};

seedTestAccounts(); 