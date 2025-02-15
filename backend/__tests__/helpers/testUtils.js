const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const setupTestDB = () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections before each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany();
    }
  });
};

const createTestUser = async (User, data = {}) => {
  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'client',
    ...data
  };
  return await User.create(defaultUser);
};

const createTestCoach = async (User, Coach, data = {}) => {
  const coachUser = await createTestUser(User, {
    role: 'coach',
    email: 'coach@example.com',
    ...data.user
  });

  const defaultCoach = {
    user: coachUser._id,
    bio: 'Experienced cricket coach with focus on technique development',
    specializations: ['batting', 'bowling'],
    experience: 5,
    hourlyRate: 50,
    availability: [{
      date: new Date(),
      slots: ['10:00', '11:00', '12:00']
    }],
    location: 'Test Cricket Ground',
    certificates: ['Level 1 Coaching Certificate'],
    languages: ['English'],
    ...data.coach
  };

  return {
    user: coachUser,
    coach: await Coach.create(defaultCoach)
  };
};

module.exports = {
  setupTestDB,
  createTestUser,
  createTestCoach
}; 