# Cricket Coach Booking App 🏏

A full-stack web application for booking cricket coaching sessions, built with the MERN stack (MongoDB, Express.js, React.js, Node.js).

## Features 🌟

### For Clients
- Browse and search for cricket coaches
- View coach profiles, specializations, and ratings
- Book coaching sessions
- Manage bookings (reschedule/cancel)
- Real-time payment processing with Stripe
- Submit reviews and ratings
- Profile management with image upload
- Password change functionality
- View booking history

### For Coaches
- Create and manage coaching profile
- Set availability and time slots
- Manage session bookings
- Track earnings and performance
- View client reviews and ratings
- Emergency time-off management
- Profile customization with image upload
- Session feedback system

### For Admins
- Approve/reject coach applications
- Manage users and coaches
- Monitor bookings and payments
- Generate reports and analytics
- Review moderation
- Export data in various formats
- System performance monitoring

## Tech Stack 💻

### Frontend
- React.js with Vite
- Material-UI (MUI) for UI components
- TailwindCSS for styling
- React Router for navigation
- Axios for API requests
- Stripe for payments
- React-Toastify for notifications
- Recharts for analytics

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT for authentication
- Multer for file uploads
- Stripe API integration
- Express-validator for validation
- Bcrypt for password hashing
- Cors for cross-origin requests

## Getting Started 🚀

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Stripe account
- npm or yarn

### Environment Variables

#### Frontend (.env)
\`\`\`env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
\`\`\`

#### Backend (.env)
\`\`\`env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
PORT=5000
NODE_ENV=development
\`\`\`

### Installation

1. Clone the repository
\`\`\`bash
git clone https://github.com/yourusername/cricket-coach-booking-app.git
cd cricket-coach-booking-app
\`\`\`

2. Install frontend dependencies
\`\`\`bash
cd frontend
npm install
\`\`\`

3. Install backend dependencies
\`\`\`bash
cd backend
npm install
\`\`\`

4. Start the development servers

Frontend:
\`\`\`bash
cd frontend
npm run dev
\`\`\`

Backend:
\`\`\`bash
cd backend
npm run dev
\`\`\`

## Deployment 🌐

### Frontend (Vercel)
1. Create a Vercel account
2. Install Vercel CLI: \`npm i -g vercel\`
3. Configure environment variables in Vercel dashboard
4. Deploy: \`vercel\`

### Backend (Your preferred hosting)
1. Set up MongoDB Atlas
2. Configure environment variables
3. Deploy Node.js application

## API Documentation 📚

### Authentication Routes
- POST /api/auth/register - Register new user
- POST /api/auth/login - User login
- POST /api/auth/logout - User logout
- GET /api/auth/me - Get current user

### User Routes
- GET /api/users/profile - Get user profile
- PUT /api/users/profile - Update user profile
- PUT /api/users/password - Change password
- DELETE /api/users/profile - Delete account

### Coach Routes
- GET /api/coaches - Get all coaches
- GET /api/coaches/:id - Get coach by ID
- PUT /api/coaches/profile - Update coach profile
- GET /api/coaches/availability - Get coach availability
- PUT /api/coaches/availability - Update availability
- POST /api/coaches/emergency-off - Set emergency time off

### Booking Routes
- POST /api/bookings - Create booking
- GET /api/bookings/client - Get client bookings
- GET /api/bookings/coach - Get coach bookings
- PATCH /api/bookings/:id/status - Update booking status
- POST /api/bookings/:id/cancel - Cancel booking

### Payment Routes
- POST /api/payments/create-intent - Create payment intent
- POST /api/payments/confirm - Confirm payment
- GET /api/payments/history - Get payment history
- POST /api/payments/:id/refund - Request refund

### Admin Routes
- GET /api/admin/dashboard - Get dashboard stats
- GET /api/admin/users - Get all users
- GET /api/admin/coaches/pending - Get pending coaches
- POST /api/admin/coaches/:id/approve - Approve coach
- GET /api/admin/reports/* - Generate reports

## Security 🔒

- JWT authentication
- Password hashing with bcrypt
- Input validation and sanitization
- File upload restrictions
- CORS configuration
- Rate limiting
- Error handling
- Secure payment processing

## Contributing 🤝

1. Fork the repository
2. Create your feature branch: \`git checkout -b feature/YourFeature\`
3. Commit your changes: \`git commit -m 'Add YourFeature'\`
4. Push to the branch: \`git push origin feature/YourFeature\`
5. Open a pull request

## License 📝

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments 🙏

- Material-UI for the component library
- Stripe for payment processing
- MongoDB Atlas for database hosting
- Vercel for frontend hosting 