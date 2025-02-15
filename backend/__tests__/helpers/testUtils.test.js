const mongoose = require('mongoose');
const { setupTestDB, createTestUser, createTestCoach } = require('./testUtils');
const User = require('../../models/User');
const Coach = require('../../models/Coach');

describe('Test Utilities', () => {
  setupTestDB();

  describe('createTestUser', () => {
    it('should create a user with default values', async () => {
      const user = await createTestUser(User);
      expect(user).toBeDefined();
      expect(user.name).toBe('Test User');
      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe('client');
    });

    it('should create a user with custom values', async () => {
      const customData = {
        name: 'Custom User',
        email: 'custom@example.com',
        role: 'admin'
      };
      const user = await createTestUser(User, customData);
      expect(user.name).toBe(customData.name);
      expect(user.email).toBe(customData.email);
      expect(user.role).toBe(customData.role);
    });
  });

  describe('createTestCoach', () => {
    it('should create a coach with default values', async () => {
      const { user, coach } = await createTestCoach(User, Coach);
      expect(user).toBeDefined();
      expect(coach).toBeDefined();
      expect(user.role).toBe('coach');
      expect(coach.specializations).toContain('batting');
      expect(coach.experience).toBe(5);
      expect(coach.hourlyRate).toBe(50);
    });

    it('should create a coach with custom values', async () => {
      const customData = {
        user: {
          name: 'Custom Coach',
          email: 'custom.coach@example.com'
        },
        coach: {
          specializations: ['bowling'],
          experience: 10,
          hourlyRate: 75
        }
      };
      const { user, coach } = await createTestCoach(User, Coach, customData);
      expect(user.name).toBe('Custom Coach');
      expect(user.email).toBe('custom.coach@example.com');
      expect(coach.specializations).toContain('bowling');
      expect(coach.experience).toBe(10);
      expect(coach.hourlyRate).toBe(75);
    });
  });
}); 