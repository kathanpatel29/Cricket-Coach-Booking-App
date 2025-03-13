# Cricket Coach Booking App - Backend API

## Route Structure

The API routes are organized by role with a linear path structure for better organization and security:

### Public Routes (`/api/public`)
Routes that don't require authentication:
- `/api/public/auth/register` - Register a new user
- `/api/public/auth/login` - Login for users/coaches/admins
- `/api/public/coaches` - Get all approved coaches
- `/api/public/coaches/:id` - Get a specific coach's public profile
- `/api/public/reviews` - Get public reviews

### User Routes (`/api/user`)
Routes for authenticated users:
- `/api/user/profile` - Get/update user profile
- `/api/user/dashboard` - Get user dashboard statistics
- `/api/user/bookings` - Manage user bookings
- `/api/user/payments` - Manage user payments
- `/api/user/reviews` - Manage user reviews
- `/api/user/notifications` - Manage user notifications

### Coach Routes (`/api/coach`)
Routes for authenticated coaches:
- `/api/coach/profile` - Get/update coach profile
- `/api/coach/dashboard` - Get coach dashboard statistics
- `/api/coach/availability` - Manage coach availability
- `/api/coach/schedules` - Manage coach schedules
- `/api/coach/bookings` - Manage coach bookings
- `/api/coach/payments` - View coach payments
- `/api/coach/reviews` - View coach reviews
- `/api/coach/notifications` - Manage coach notifications

### Admin Routes (`/api/admin`)
Routes for authenticated admins:
- `/api/admin/profile` - Get admin profile
- `/api/admin/dashboard` - Get admin dashboard statistics
- `/api/admin/users` - Manage all users
- `/api/admin/coaches/pending` - Manage coach approvals
- `/api/admin/bookings` - Manage all bookings
- `/api/admin/payments` - Manage all payments
- `/api/admin/reviews` - Moderate reviews
- `/api/admin/reports` - Generate and view reports
- `/api/admin/notifications` - Manage admin notifications

## Authentication and Authorization

- All non-public routes require authentication via JWT token
- Role-based access control (RBAC) is implemented for all routes
- Coaches have additional approval status checks

## Error Handling

The API uses a centralized error handling middleware that returns consistent error responses. 