require('dotenv').config();

// Increase timeout for tests
jest.setTimeout(30000);

// Mock console methods to keep test output clean
console.error = jest.fn();
console.warn = jest.fn();
console.log = jest.fn();

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';
process.env.PORT = '5000';

// Global beforeAll and afterAll hooks
beforeAll(async () => {
  // Add any global setup here
  // This runs once before all tests
});

afterAll(async () => {
  // Add any global cleanup here
  // This runs once after all tests
  
  // Clear all mocks
  jest.clearAllMocks();
});

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
}); 