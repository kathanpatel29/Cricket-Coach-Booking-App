const request = require('supertest');
const express = require('express');
const { setupTestDB, createTestUser, createTestCoach } = require('../helpers/testUtils');
const User = require('../../models/User');
const Coach = require('../../models/Coach');
const Booking = require('../../models/Booking');
const emailService = require('../../services/emailService');
const emailController = require('../../controllers/emailController');

// Mock nodemailer
jest.mock('nodemailer');
const nodemailer = require('nodemailer');
const mockSendMail = jest.fn();
nodemailer.createTransport.mockReturnValue({ sendMail: mockSendMail });

const app = express();
app.use(express.json());

// Mock auth middleware
app.use((req, res, next) => {
  req.user = { id: '123456789', role: 'client', email: 'client@example.com' };
  next();
});

describe('Email Notification Tests', () => {
  setupTestDB();
  let testClient, testCoach, testBooking;

  beforeAll(async () => {
    const clientData = await createTestUser(User);
    testClient = clientData.user;

    const coachData = await createTestCoach(User, Coach);
    testCoach = coachData.coach;

    testBooking = await Booking.create({
      client: testClient._id,
      coach: testCoach._id,
      date: new Date(),
      timeSlot: '10:00',
      duration: 1,
      totalAmount: 5000,
      status: 'pending'
    });
  });

  beforeEach(() => {
    mockSendMail.mockClear();
  });

  describe('Booking Notifications', () => {
    it.concurrent('sends booking confirmation email to client and coach', async () => {
      await emailService.sendBookingConfirmation(testBooking._id);

      expect(mockSendMail).toHaveBeenCalledTimes(2); // One for client, one for coach
      
      // Check client email
      expect(mockSendMail.mock.calls[0][0]).toMatchObject({
        to: testClient.email,
        subject: expect.stringContaining('Booking Confirmation'),
        html: expect.stringContaining(testCoach.name)
      });

      // Check coach email
      expect(mockSendMail.mock.calls[1][0]).toMatchObject({
        to: testCoach.email,
        subject: expect.stringContaining('New Booking'),
        html: expect.stringContaining(testClient.name)
      });
    });

    it.concurrent('sends booking cancellation emails', async () => {
      await emailService.sendBookingCancellation(testBooking._id);

      expect(mockSendMail).toHaveBeenCalledTimes(2);
      
      // Check client email
      expect(mockSendMail.mock.calls[0][0]).toMatchObject({
        to: testClient.email,
        subject: expect.stringContaining('Booking Cancelled'),
        html: expect.stringContaining('cancellation')
      });

      // Check coach email
      expect(mockSendMail.mock.calls[1][0]).toMatchObject({
        to: testCoach.email,
        subject: expect.stringContaining('Booking Cancelled'),
        html: expect.stringContaining('cancellation')
      });
    });

    it.concurrent('sends booking reminder emails', async () => {
      await emailService.sendBookingReminder(testBooking._id);

      expect(mockSendMail).toHaveBeenCalledTimes(2);
      
      // Check client reminder
      expect(mockSendMail.mock.calls[0][0]).toMatchObject({
        to: testClient.email,
        subject: expect.stringContaining('Reminder'),
        html: expect.stringContaining('upcoming session')
      });

      // Check coach reminder
      expect(mockSendMail.mock.calls[1][0]).toMatchObject({
        to: testCoach.email,
        subject: expect.stringContaining('Reminder'),
        html: expect.stringContaining('upcoming session')
      });
    });
  });

  describe('Account Notifications', () => {
    it.concurrent('sends welcome email on registration', async () => {
      const newUser = await createTestUser(User);
      await emailService.sendWelcomeEmail(newUser.user._id);

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockSendMail.mock.calls[0][0]).toMatchObject({
        to: newUser.user.email,
        subject: expect.stringContaining('Welcome'),
        html: expect.stringContaining('welcome')
      });
    });

    it.concurrent('sends coach approval notification', async () => {
      await emailService.sendCoachApprovalNotification(testCoach._id);

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockSendMail.mock.calls[0][0]).toMatchObject({
        to: testCoach.email,
        subject: expect.stringContaining('Approved'),
        html: expect.stringContaining('approved')
      });
    });

    it.concurrent('sends password reset email', async () => {
      const resetToken = 'test-reset-token';
      await emailService.sendPasswordResetEmail(testClient.email, resetToken);

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockSendMail.mock.calls[0][0]).toMatchObject({
        to: testClient.email,
        subject: expect.stringContaining('Password Reset'),
        html: expect.stringContaining(resetToken)
      });
    });
  });

  describe('Error Handling', () => {
    it.concurrent('handles email sending failures gracefully', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP error'));

      await expect(emailService.sendWelcomeEmail(testClient._id))
        .rejects
        .toThrow('Failed to send welcome email');
    });

    it.concurrent('handles invalid email addresses', async () => {
      const invalidUser = await User.create({
        name: 'Invalid',
        email: 'invalid-email',
        password: 'password123'
      });

      await expect(emailService.sendWelcomeEmail(invalidUser._id))
        .rejects
        .toThrow('Invalid email address');
    });
  });

  describe('Email Templates', () => {
    it.concurrent('generates correct booking confirmation template', async () => {
      const template = await emailService.generateBookingTemplate(testBooking._id, 'confirmation');
      
      expect(template).toContain(testCoach.name);
      expect(template).toContain(testBooking.timeSlot);
      expect(template).toContain(testBooking.date.toLocaleDateString());
    });

    it.concurrent('generates correct reminder template', async () => {
      const template = await emailService.generateBookingTemplate(testBooking._id, 'reminder');
      
      expect(template).toContain('upcoming');
      expect(template).toContain(testBooking.timeSlot);
      expect(template).toContain('zoom link');
    });
  });
}); 