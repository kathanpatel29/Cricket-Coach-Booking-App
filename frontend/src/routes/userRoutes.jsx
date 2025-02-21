import Dashboard from '../pages/user/Dashboard';
import BookSession from '../pages/bookings/BookSession';
import MyBookings from '../pages/bookings/MyBookings';
import BookingConfirmation from '../pages/bookings/BookingConfirmation';
import Checkout from '../pages/payments/Checkout';
import PaymentStatus from '../pages/payments/PaymentStatus';
import Profile from '../pages/profile/Profile';

export const userRoutes = [
  {
    path: '/user/dashboard',
    element: <Dashboard />
  },
  {
    path: '/user/book',
    element: <BookSession />
  },
  {
    path: '/user/bookings',
    element: <MyBookings />
  },
  {
    path: '/user/bookings/:bookingId/confirmation',
    element: <BookingConfirmation />
  },
  {
    path: '/user/checkout/:bookingId',
    element: <Checkout />
  },
  {
    path: '/user/payments/:paymentId/status',
    element: <PaymentStatus />
  },
  {
    path: '/user/profile',
    element: <Profile />
  }
]; 