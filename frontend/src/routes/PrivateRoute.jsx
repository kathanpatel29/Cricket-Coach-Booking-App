import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Box, CircularProgress, Typography } from '@mui/material';

const PrivateRoute = ({ children, requiredRole, requireApproval = true }) => {
  const { user, loading, initialCheckDone, isAuthenticated } = useAuth();
  const location = useLocation();

  // Less verbose logging in production
  if (process.env.NODE_ENV !== 'production') {
    console.log('PrivateRoute - Current path:', location.pathname);
    console.log('PrivateRoute - Required role:', requiredRole);
    console.log('PrivateRoute - User:', user);
    console.log('PrivateRoute - Require approval:', requireApproval);
  }

  // Show loading state only while initial auth check is in progress
  if (loading && !initialCheckDone) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  // If auth check is done and user is not authenticated, redirect to login
  if (initialCheckDone && !isAuthenticated) {
    console.log('PrivateRoute - User not authenticated, redirecting to login');
    // Save the current location they were trying to access
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If a specific role is required, check if user has that role
  if (requiredRole && user?.role !== requiredRole) {
    console.log(`PrivateRoute - Role mismatch: Required ${requiredRole}, User has ${user?.role}`);
    // Redirect to appropriate dashboard based on user role
    return <Navigate to="/dashboard" replace />;
  }

  // Check for coach approval status if needed
  if (requireApproval && user.role === 'coach' && !user.isApproved) {
    console.log('PrivateRoute - Coach not approved, redirecting to pending approval');
    // Coach is not approved, show limited access version
    // Note: We'll check in the CoachDashboard component to show appropriate content
    if (!location.pathname.includes('/coach/pending-approval')) {
      return <Navigate to="/coach/pending-approval" replace />;
    }
  }

  console.log('PrivateRoute - All checks passed, rendering children');
  // If authenticated and has required role (or no specific role required), render the children
  return children;
};

export default PrivateRoute;
