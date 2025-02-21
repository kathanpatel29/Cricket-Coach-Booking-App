import Dashboard from '../pages/admin/Dashboard';
import UserManagement from '../components/admin/UserManagement';
import CoachApprovals from '../components/admin/CoachApprovals';
import BookingManagement from '../components/admin/BookingManagement';
import PaymentManagement from '../components/admin/PaymentManagement';
import Profile from '../pages/profile/Profile';

export const adminRoutes = [
  {
    path: '',
    element: <Dashboard />
  },
  {
    path: 'dashboard',
    element: <Dashboard />
  },
  {
    path: 'users',
    element: <UserManagement />
  },
  {
    path: 'coaches',
    element: <CoachApprovals />
  },
  {
    path: 'bookings',
    element: <BookingManagement />
  },
  {
    path: 'payments',
    element: <PaymentManagement />
  },
  {
    path: 'profile',
    element: <Profile />
  }
]; 