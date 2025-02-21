# Cricket Coach Booking Application

A full-stack web application for booking cricket coaching sessions, managing coaches, and handling appointments.

Live Demo: [https://cric-coach-app.vercel.app](https://cric-coach-app.vercel.app)

## Features

- User registration and authentication
- Coach profile management
- Session booking and scheduling
- Secure payment processing
- Admin dashboard
- Email notifications
- Multi-language support (English & Hindi)

## Tech Stack

- Frontend: React.js, Vite, Material UI, Tailwind CSS
- Backend: Node.js, Express.js
- Database: MongoDB
- Authentication: JWT
- Payment: Stripe
- Email: Nodemailer
- Testing: Jest
- Deployment: Vercel

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

Backend (.env):
```
PORT=5000
MONGODB_URI=your_mongodb_uri
STRIPE_SECRET_KEY=your_stripe_secret_key
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_gmail
EMAIL_PASSWORD=your_gmail_app_password
```

Frontend (.env):
```
VITE_API_URL=http://localhost:5000
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

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

## Deployment

The application is deployed on Vercel:
- Frontend: [https://cric-coach-app.vercel.app](https://cric-coach-app.vercel.app)
- Backend: [https://cricket-coach-backend.vercel.app](https://cricket-coach-backend.vercel.app)

## Contact

Kathan Patel (N0166913)
- Email: kathan.patel@humber.ca
- GitHub: [https://github.com/kathanpatel29](https://github.com/kathanpatel29)

Project Link: [https://github.com/kathanpatel29/Cricket-Coach-Booking-App](https://github.com/kathanpatel29/Cricket-Coach-Booking-App)

## Acknowledgments

- Professor Bernie Monette
- Humber College - HTTP-5310-0NA
- All contributors and testers

## Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test
```

## API Documentation

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - User login
- GET /api/auth/profile - Get user profile

### Bookings
- POST /api/bookings - Create booking
- GET /api/bookings - Get user bookings
- GET /api/bookings/:id - Get booking details
- PATCH /api/bookings/:id - Update booking status

### Coaches
- GET /api/coaches - Get all coaches
- GET /api/coaches/:id - Get coach details
- POST /api/coaches - Create coach profile
- PATCH /api/coaches/:id - Update coach profile

### Payments
- POST /api/payments/create-intent - Create payment intent
- POST /api/payments/confirm - Confirm payment

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License. 