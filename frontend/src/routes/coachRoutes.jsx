import Dashboard from '../pages/coach/Dashboard';
import Sessions from '../pages/coach/Sessions';
import Availability from '../pages/coach/Availability';
import CoachReviews from '../components/reviews/CoachReviews';
import Profile from '../pages/profile/Profile';
import PaymentHistory from '../components/payments/PaymentHistory';

export const coachRoutes = [
  {
    path: '/coach/dashboard',
    element: <Dashboard />
  },
  {
    path: '/coach/sessions',
    element: <Sessions />
  },
  {
    path: '/coach/availability',
    element: <Availability />
  },
  {
    path: '/coach/reviews',
    element: <CoachReviews />
  },
  {
    path: '/coach/profile',
    element: <Profile />
  },
  {
    path: '/coach/earnings',
    element: <PaymentHistory />
  }
]; 