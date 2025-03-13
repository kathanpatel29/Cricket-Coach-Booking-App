# Cricket Coach Booking Application

A full-stack web application for booking cricket coaching sessions, managing coaches, and handling appointments with robust error handling and performance optimizations.

Live Demo: [https://cric-coach-app.vercel.app](https://cric-coach-app.vercel.app)

## Features

- **User Management**
  - User registration and authentication with JWT
  - Role-based access control (User, Coach, Admin)
  - Profile management with specialized coach profiles
  - Secure password handling and account recovery

- **Booking System**
  - Interactive calendar for session scheduling
  - Availability management for coaches
  - Time slot selection with conflict prevention
  - Session history and upcoming appointments

- **Coach Management**
  - Detailed coach profiles with specializations
  - Experience and certification verification
  - Rating and review system
  - Customizable hourly rates and availability

- **Notifications**
  - Real-time notification system
  - Email confirmations for bookings and payments
  - Reminder notifications for upcoming sessions
  - Rate-limited API calls to prevent excessive refreshing

- **Payment Processing**
  - Secure payment integration with Stripe
  - Payment history and receipts
  - Refund processing for cancellations

- **Admin Dashboard**
  - User management and oversight
  - System metrics and analytics
  - Content moderation tools
  - Global settings configuration

- **Performance & Reliability**
  - Optimized API with caching layer
  - Rate limiting to prevent abuse
  - Health check endpoint for system monitoring
  - Graceful error handling and recovery

- **Security**
  - CORS protection with configurable origins
  - Environment-based configuration system
  - Protection against common web vulnerabilities
  - Secure storage of sensitive information

- **Internationalization**
  - Multi-language support with i18next
  - English and Hindi languages available
  - Language detection and persistence
  - Easily extensible for additional languages
  - Language switcher available in the Navbar for seamless language toggling

## Tech Stack

### Frontend
- **Framework**: React.js with Hooks and Context API
- **Build Tool**: Vite for fast development and optimized builds
- **UI Libraries**: Material UI, Tailwind CSS
- **State Management**: React Context with custom hooks
- **Form Handling**: Formik with Yup validation
- **HTTP Client**: Axios with interceptors for auth and error handling
- **Caching**: Custom caching layer with session storage
- **Internationalization**: i18next for multi-language support

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with refresh token rotation
- **Email Service**: Nodemailer with templating
- **File Uploads**: Multer with cloud storage
- **Validation**: Joi for request validation
- **Logging**: Winston for structured logging

### DevOps & Tools
- **Version Control**: Git with GitHub
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel for frontend and backend
- **Testing**: Jest, React Testing Library
- **Documentation**: JSDoc, Swagger for API docs
- **Code Quality**: ESLint, Prettier

## Architecture

The application follows a modern client-server architecture:

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│             │      │             │      │             │
│  Frontend   │◄────►│   Backend   │◄────►│  Database   │
│  (React)    │      │  (Express)  │      │ (MongoDB)   │
│             │      │             │      │             │
└─────────────┘      └─────────────┘      └─────────────┘
       ▲                    ▲                    ▲
       │                    │                    │
       ▼                    ▼                    ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│             │      │             │      │             │
│    Cache    │      │ Third-party │      │   Backup    │
│   Layer     │      │   Services  │      │   System    │
│             │      │             │      │             │
└─────────────┘      └─────────────┘      └─────────────┘
```

## Recent Enhancements

### Performance Optimizations
- Implemented caching layer for frequently accessed data
- Added rate limiting to prevent API abuse
- Optimized database queries with proper indexing
- Reduced unnecessary API calls with debouncing and throttling

### Error Handling Improvements
- Added health check endpoint for system monitoring
- Implemented graceful error recovery mechanisms
- Enhanced error logging and monitoring
- Improved user feedback for system errors

### Security Enhancements
- Centralized configuration system with environment-specific settings
- Enhanced CORS protection with configurable origins
- Improved JWT handling and validation
- Added protection against common web vulnerabilities

### User Experience Improvements
- Enhanced notification system with rate limiting
- Improved form validation and error messages
- Added loading indicators and skeleton screens
- Implemented responsive design for all device sizes
- Added multi-language support with language switcher in the Navbar (currently supporting English and Hindi)

## Quick Start

1. Visit [https://cric-coach-app.vercel.app](https://cric-coach-app.vercel.app)
2. Register as a user or coach
3. Browse available coaches or set up your coaching profile
4. Book sessions or manage your coaching schedule
5. Process payments securely through Stripe
6. Receive email confirmations for bookings and payments

## For Development

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Gmail account (for email notifications)
- Stripe account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/cricket-coach-booking-app.git
cd cricket-coach-booking-app
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Configure environment variables:

See the `ENVIRONMENT_SETUP.md` file for detailed instructions on setting up environment variables for both development and production.

4. Run the application:

Development:
```bash
# Run backend
cd backend
npm run dev

# Run frontend
cd frontend
npm run dev
```

Production:
```bash
# Build frontend
cd frontend
npm run build

# Start backend
cd backend
npm start
```

## Environment Configuration

The application uses a centralized configuration system that supports different environments:

- Development: Uses `.env` file
- Production: Uses `.env.production` file
- Testing: Uses `.env.test` file

See `ENVIRONMENT_SETUP.md` for detailed instructions on configuring environment variables.

## API Documentation

### System
- `GET /api/health` - Health check endpoint for monitoring system status

### Authentication
- `POST /api/auth/register` - Register a new user
  - Body: `{ name, email, password, role, phone }`
  - Returns: User object with JWT token
- `POST /api/auth/login` - User login
  - Body: `{ email, password }`
  - Returns: User object with JWT token
- `POST /api/auth/refresh-token` - Refresh authentication token
  - Body: `{ refreshToken }`
  - Returns: New JWT token and refresh token
- `POST /api/auth/forgot-password` - Request password reset
  - Body: `{ email }`
  - Returns: Success message
- `POST /api/auth/reset-password` - Reset password with token
  - Body: `{ token, password }`
  - Returns: Success message
- `GET /api/auth/verify-email/:token` - Verify user email
  - Returns: Success message
- `POST /api/auth/logout` - Logout user and invalidate refresh token
  - Body: `{ refreshToken }`
  - Returns: Success message

### User Management
- `GET /api/user/profile` - Get current user profile
  - Returns: User profile data
- `PUT /api/user/profile` - Update user profile
  - Body: `{ name, phone, ... }`
  - Returns: Updated user profile
- `GET /api/user/notifications` - Get user notifications
  - Query: `{ page, limit, unreadOnly }`
  - Returns: List of notifications
- `PUT /api/user/notifications/:id/read` - Mark notification as read
  - Returns: Updated notification
- `PUT /api/user/notifications/read-all` - Mark all notifications as read
  - Returns: Success message
- `PUT /api/user/change-password` - Change user password
  - Body: `{ currentPassword, newPassword }`
  - Returns: Success message
- `POST /api/user/profile-image` - Upload profile image
  - Body: Form data with image file
  - Returns: Updated user with image URL

### Coach Management
- `GET /api/coaches` - Get all coaches
  - Query: `{ page, limit, specialization, minRating, maxPrice, search }`
  - Returns: List of coaches with pagination
- `GET /api/coaches/:id` - Get coach details
  - Returns: Detailed coach profile
- `GET /api/coach/profile` - Get current coach profile (for coaches)
  - Returns: Coach profile data
- `PUT /api/coach/profile` - Update coach profile
  - Body: `{ bio, experience, hourlyRate, specializations, certifications }`
  - Returns: Updated coach profile
- `GET /api/coach/schedule` - Get coach schedule and availability
  - Query: `{ startDate, endDate }`
  - Returns: Schedule with available time slots
- `PUT /api/coach/schedule` - Update coach schedule
  - Body: `{ availableDays, availableHours, exceptions }`
  - Returns: Updated schedule
- `GET /api/coach/reviews` - Get reviews for a coach
  - Query: `{ page, limit }`
  - Returns: List of reviews with pagination
- `GET /api/coach/earnings` - Get coach earnings
  - Query: `{ startDate, endDate }`
  - Returns: Earnings summary and details

### Booking System
- `POST /api/bookings` - Create a new booking
  - Body: `{ coachId, date, startTime, endTime, notes }`
  - Returns: Created booking
- `GET /api/bookings` - Get user bookings
  - Query: `{ status, page, limit, startDate, endDate }`
  - Returns: List of bookings with pagination
- `GET /api/bookings/:id` - Get booking details
  - Returns: Detailed booking information
- `PATCH /api/bookings/:id` - Update booking status
  - Body: `{ status, reason }`
  - Returns: Updated booking
- `DELETE /api/bookings/:id` - Cancel booking
  - Returns: Cancelled booking
- `GET /api/coach/bookings` - Get coach bookings
  - Query: `{ status, page, limit, startDate, endDate }`
  - Returns: List of bookings for the coach
- `GET /api/coach/booking-requests` - Get pending booking requests
  - Query: `{ page, limit }`
  - Returns: List of pending booking requests
- `POST /api/coach/bookings/:id/respond` - Respond to booking request
  - Body: `{ action, reason }`
  - Returns: Updated booking

### Payment Processing
- `POST /api/payments/create-intent` - Create payment intent
  - Body: `{ bookingId, amount }`
  - Returns: Stripe payment intent
- `POST /api/payments/confirm` - Confirm payment
  - Body: `{ paymentIntentId, bookingId }`
  - Returns: Payment confirmation
- `GET /api/payments/history` - Get payment history
  - Query: `{ page, limit, startDate, endDate }`
  - Returns: List of payments with pagination
- `POST /api/payments/refund` - Process refund
  - Body: `{ paymentId, amount, reason }`
  - Returns: Refund details
- `GET /api/payments/:id` - Get payment details
  - Returns: Detailed payment information

### Reviews and Ratings
- `POST /api/reviews` - Create a review
  - Body: `{ coachId, bookingId, rating, comment }`
  - Returns: Created review
- `GET /api/reviews/coach/:coachId` - Get reviews for a coach
  - Query: `{ page, limit, sortBy }`
  - Returns: List of reviews with pagination
- `PUT /api/reviews/:id` - Update a review
  - Body: `{ rating, comment }`
  - Returns: Updated review
- `DELETE /api/reviews/:id` - Delete a review
  - Returns: Success message

### Admin Operations
- `GET /api/admin/users` - Get all users
  - Query: `{ page, limit, role, search }`
  - Returns: List of users with pagination
- `GET /api/admin/users/:id` - Get user details
  - Returns: Detailed user information
- `PUT /api/admin/users/:id` - Update user
  - Body: User data to update
  - Returns: Updated user
- `DELETE /api/admin/users/:id` - Delete user
  - Returns: Success message
- `GET /api/admin/coaches` - Get all coaches for admin
  - Query: `{ page, limit, status, search }`
  - Returns: List of coaches with pagination
- `PUT /api/admin/coaches/:id/approve` - Approve coach
  - Returns: Approved coach
- `PUT /api/admin/coaches/:id/reject` - Reject coach
  - Body: `{ reason }`
  - Returns: Rejected coach
- `GET /api/admin/bookings` - Get all bookings
  - Query: `{ page, limit, status, search }`
  - Returns: List of bookings with pagination
- `GET /api/admin/payments` - Get all payments
  - Query: `{ page, limit, status, search }`
  - Returns: List of payments with pagination
- `GET /api/admin/dashboard` - Get admin dashboard statistics
  - Returns: System statistics and metrics

### Internationalization
- `GET /api/public/languages` - Get available languages
  - Returns: List of supported languages
- `GET /api/public/translations/:lang` - Get translations for a language
  - Returns: Translation key-value pairs

## Error Handling

The application implements a comprehensive error handling strategy:

1. **Frontend Error Handling**:
   - Global error boundary for React components
   - Axios interceptors for API error handling
   - Retry mechanism for transient errors
   - Offline detection and recovery

2. **Backend Error Handling**:
   - Centralized error middleware
   - Structured error responses
   - Detailed error logging
   - Graceful shutdown for critical errors

3. **Health Monitoring**:
   - Health check endpoint for system status
   - Automatic recovery mechanisms
   - Error rate monitoring and alerting

## Deployment

The application is deployed on Vercel:
- Frontend: [https://cric-coach-app.vercel.app](https://cric-coach-app.vercel.app)
- Backend: [https://cricket-coach-backend.vercel.app](https://cricket-coach-backend.vercel.app)

## Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Contact

Kathan Patel (N0166913)
- Email: kathan.patel@humber.ca
- GitHub: [https://github.com/kathanpatel29](https://github.com/kathanpatel29)

Project Link: [https://github.com/kathanpatel29/Cricket-Coach-Booking-App](https://github.com/kathanpatel29/Cricket-Coach-Booking-App)

## Acknowledgments

- Humber College - HTTP-5310-0NA
- All contributors and testers

## License

This project is licensed under the MIT License. 