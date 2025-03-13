import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PrivateRoute from './PrivateRoute';

// Public Pages
import Home from '../pages/Home';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import About from '../pages/About';
import Contact from '../pages/Contact';
import FAQ from '../pages/FAQ';
import Terms from '../pages/Terms';
import Privacy from '../pages/Privacy';
import TranslationExample from '../components/TranslationExample';

// Dashboard Pages
import Dashboard from '../pages/Dashboard/Dashboard';
import UserDashboard from '../pages/Dashboard/UserDashboard';
import CoachDashboard from '../pages/Dashboard/CoachDashboard';
import AdminDashboard from '../pages/Dashboard/AdminDashboard';
import PendingApprovalPage from '../pages/Coach/PendingApprovalPage';
import CoachesList from '../pages/Coaches/CoachesList';
import CoachProfile from '../pages/Coaches/CoachProfile';
import BookCoach from '../pages/Bookings/BookCoach';
import MyBookings from '../pages/Bookings/MyBookings';
import PaymentHistory from '../pages/Payments/PaymentHistory';
import Checkout from '../pages/Payments/Checkout';
import Profile from '../pages/Profile/Profile';
import EditProfile from '../pages/Profile/EditProfile';
import ManageUsers from '../pages/Admin/ManageUsers';
import ManageCoaches from '../pages/Admin/ManageCoaches';
import CoachSchedule from '../pages/Coach/CoachSchedule';

// New Booking Flow Components
import CoachBookingRequests from '../pages/Bookings/CoachBookingRequests';
import PendingPaymentBookings from '../pages/Bookings/PendingPaymentBookings';
import BookingPayment from '../pages/Bookings/BookingPayment';

// Admin-specific components
import ModerateReviews from '../pages/Admin/ModerateReviews';

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={
        user ? <Navigate to="/dashboard" replace /> : <Login />
      } />
      <Route path="/register" element={
        user ? <Navigate to="/dashboard" replace /> : <Register />
      } />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/language-demo" element={<TranslationExample />} />
      <Route path="/coaches" element={<CoachesList />} />
      <Route path="/coaches/:id" element={<CoachProfile />} />
      <Route path="/book/:coachId" element={
        <PrivateRoute>
          <BookCoach />
        </PrivateRoute>
      } />

      {/* Private Routes - Main Dashboard */}
      <Route path="/dashboard" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />

      {/* Profile Routes */}
      <Route path="/profile" element={
        <PrivateRoute>
          <Profile />
        </PrivateRoute>
      } />
      <Route path="/profile/edit" element={
        <PrivateRoute>
          <EditProfile />
        </PrivateRoute>
      } />

      {/* Payment Routes */}
      <Route path="/payment/checkout/:bookingId" element={
        <PrivateRoute>
          <Checkout />
        </PrivateRoute>
      } />

      {/* User-specific routes */}
      <Route path="/user/*" element={
        <PrivateRoute requiredRole="user">
          <Routes>
            <Route path="dashboard" element={<UserDashboard />} />
            <Route path="bookings" element={<MyBookings />} />
            <Route path="bookings/pending-payment" element={<PendingPaymentBookings />} />
            <Route path="payments" element={<PaymentHistory />} />
            
            {/* Fallback for any undefined user routes */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </PrivateRoute>
      } />

      {/* New payment processing route */}
      <Route path="/bookings/:bookingId/payment" element={
        <PrivateRoute requiredRole="user">
          <BookingPayment />
        </PrivateRoute>
      } />

      {/* Coach-specific routes */}
      <Route path="/coach/*" element={
        <PrivateRoute requiredRole="coach">
          <Routes>
            <Route path="dashboard" element={<CoachDashboard />} />
            <Route path="pending-approval" element={
              <PrivateRoute requiredRole="coach" requireApproval={false}>
                <PendingApprovalPage />
              </PrivateRoute>
            } />
            <Route path="schedule" element={
              <PrivateRoute requiredRole="coach">
                <CoachSchedule />
              </PrivateRoute>
            } />
            {/* New booking requests route */}
            <Route path="booking-requests" element={<CoachBookingRequests />} />
            {/* Redirects for old routes */}
            <Route path="availability" element={<Navigate to="/coach/schedule" replace />} />
            <Route path="time-slots" element={<Navigate to="/coach/schedule" replace />} />
            {/* Other coach-specific routes */}
            <Route path="bookings" element={<MyBookings />} />
            
            {/* Fallback for any undefined coach routes */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </PrivateRoute>
      } />

      {/* Admin-specific routes */}
      <Route path="/admin/*" element={
        <PrivateRoute requiredRole="admin">
          <Routes>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="coaches" element={<ManageCoaches />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="reviews" element={<ModerateReviews />} />
            
            {/* Fallback for any undefined admin routes */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </PrivateRoute>
      } />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
