import Home from '../pages/Home';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Profile from '../pages/profile/Profile';
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
import AvailabilityManagement from '../components/features/coaches/AvailabilityManagement';
import MyReviews from '../components/features/reviews/MyReviews';
import ProtectedRoute from '../components/common/ProtectedRoute';
// 📌 Public Routes (Accessible to everyone)
export const publicRoutes = [
  { path: "/", element: <Home /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/coaches", element: <CoachList /> },
  { path: "/coaches/:id", element: <CoachProfile /> }
];

// 📌 Client Routes (Protected)
export const clientRoutes = [
  { path: "/client/dashboard", element: <UserDashboard />, roles: ["client"] },
  { path: "/client/bookings", element: <MyBookings />, roles: ["client"] },
  { path: "/client/reviews", element: <MyReviews />, roles: ["client"] },
  { path: "/client/payments", element: <PaymentHistory />, roles: ["client"] },
  { path: "/client/profile", element: <Profile />, roles: ["client"] }
];

// 📌 Coach Routes (Protected)
export const coachRoutes = [
  { path: "/coach/dashboard", element: <CoachDashboard />, roles: ["coach"] },
  { path: "/coach/availability", element: <AvailabilityManagement />, roles: ["coach"] },
  { path: "/coach/sessions", element: <SessionManagement />, roles: ["coach"] },
  { path: "/coach/earnings", element: <CoachEarnings />, roles: ["coach"] },
  { path: "/coach/profile", element: <Profile />, roles: ["coach"] }
];

// 📌 Admin Routes (Protected)
export const adminRoutes = [
  { path: "/admin/dashboard", element: <AdminDashboard />, roles: ["admin"] },
  { path: "/admin/users", element: <UserManagement />, roles: ["admin"] },
  { path: "/admin/reviews", element: <ReviewModeration />, roles: ["admin"] },
  { path: "/admin/payments", element: <PaymentHistory />, roles: ["admin"] }
];

// 📌 Shared Protected Routes (Available to multiple roles)
export const sharedProtectedRoutes = [
  { path: "/profile", element: <Profile />, roles: ["client", "coach", "admin"] }
];

// Add this to your routes
export const defaultRoutes = [
  { 
    path: "/dashboard", 
    element: <ProtectedRoute>
      {/* This will be handled by the ProtectedRoute component */}
      <div />
    </ProtectedRoute>
  }
];

// Update the routes export if needed
export const allRoutes = [
  ...publicRoutes,
  ...clientRoutes,
  ...coachRoutes,
  ...adminRoutes,
  ...defaultRoutes
];
