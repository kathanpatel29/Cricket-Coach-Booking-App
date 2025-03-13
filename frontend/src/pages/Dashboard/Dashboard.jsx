import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Box, CircularProgress, Container, Typography, Alert } from '@mui/material';

// Role-specific dashboards
import UserDashboard from './UserDashboard';
import CoachDashboard from './CoachDashboard';
import AdminDashboard from './AdminDashboard';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is authenticated
    if (!authLoading && !user) {
      setError('You must be logged in to access this page.');
    }
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
          <CircularProgress size={60} sx={{ mb: 4 }} />
          <Typography variant="h6" color="text.secondary">
            Loading your dashboard...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error || !user) {
    return <Navigate to="/login" replace />;
  }

  // Render the appropriate dashboard based on user role
  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'coach':
      return <CoachDashboard />;
    case 'user':
      return <UserDashboard />;
    default:
      // Fallback for unknown role
      return (
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Alert severity="error">
            Invalid user role detected. Please contact support.
          </Alert>
        </Container>
      );
  }
};

export default Dashboard; 