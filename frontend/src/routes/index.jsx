import Home from '../pages/Home';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import About from '../pages/static/About';
import Contact from '../pages/static/Contact';
import FAQ from '../pages/static/FAQ';
import Terms from '../pages/static/Terms';
import Privacy from '../pages/static/Privacy';
import Profile from '../pages/profile/Profile';
import Availability from '../pages/bookings/Availability';
import UserDashboard from '../pages/dashboard/UserDashboard';
import CoachDashboard from '../pages/dashboard/CoachDashboard';
import AdminDashboard from '../pages/dashboard/AdminDashboard';
import Bookings from '../pages/bookings/Bookings';
import MyBookings from '../pages/bookings/MyBookings';
import CoachList from '../components/features/coaches/CoachList';
import CoachProfile from '../components/features/coaches/CoachProfile';
import ReviewModeration from '../components/features/admin/ReviewModeration';
import UserManagement from '../components/features/admin/UserManagement';
import PaymentHistory from '../components/features/payments/PaymentHistory';
import CoachEarnings from '../components/features/payments/CoachEarnings';
import SessionManagement from '../components/features/coaches/SessionManagement';

export const publicRoutes = [
  { path: '/', element: <Home />, label: 'Home' },
  { path: '/login', element: <Login />, label: 'Login' },
  { path: '/register', element: <Register />, label: 'Register' },
  { path: '/about', element: <About />, label: 'About' },
  { path: '/contact', element: <Contact />, label: 'Contact' },
  { path: '/faq', element: <FAQ />, label: 'FAQ' },
  { path: '/terms', element: <Terms />, label: 'Terms' },
  { path: '/privacy', element: <Privacy />, label: 'Privacy' },
  { path: '/coaches', element: <CoachList />, label: 'Find a Coach' },
  { path: '/coaches/:id', element: <CoachProfile />, label: 'Coach Profile' },
];

export const clientRoutes = [
  { path: '/dashboard', element: <UserDashboard />, label: 'Dashboard', roles: ['client'] },
  { path: '/book/:coachId', element: <Bookings />, label: 'Book Coach', roles: ['client'] },
  { path: '/bookings', element: <MyBookings />, label: 'My Bookings', roles: ['client'] },
  { path: '/my-bookings', element: <MyBookings />, label: 'My Bookings', roles: ['client'] },
  { path: '/payments', element: <PaymentHistory />, label: 'Payment History', roles: ['client'] },
  { path: '/payments/history', element: <PaymentHistory />, label: 'Payment History', roles: ['client'] },
  { path: '/my-sessions', element: <SessionManagement />, label: 'My Sessions', roles: ['client'] },
];

export const coachRoutes = [
  { path: '/coach/dashboard', element: <CoachDashboard />, label: 'Dashboard', roles: ['coach'] },
  { path: '/coach/availability', element: <Availability />, label: 'Availability', roles: ['coach'] },
  { path: '/coach/sessions', element: <SessionManagement />, label: 'Session Management', roles: ['coach'] },
  { path: '/coach/earnings', element: <CoachEarnings />, label: 'My Earnings', roles: ['coach'] },
];

export const adminRoutes = [
  { path: '/admin-dashboard', element: <AdminDashboard />, label: 'Admin Dashboard', roles: ['admin'] },
  { path: '/admin/users', element: <UserManagement />, label: 'User Management', roles: ['admin'] },
  { path: '/admin/reviews', element: <ReviewModeration />, label: 'Review Moderation', roles: ['admin'] },
  { path: '/admin/transactions', element: <PaymentHistory />, label: 'Transaction Management', roles: ['admin'] },
];

export const sharedProtectedRoutes = [
  { path: '/profile', element: <Profile />, label: 'Profile', roles: ['client', 'coach'] },
  { path: '/settings', element: <Profile />, label: 'Settings', roles: ['client', 'coach'] },
  { path: '/account/delete', element: <Profile />, label: 'Delete Account', roles: ['client', 'coach', 'admin'] },
]; 