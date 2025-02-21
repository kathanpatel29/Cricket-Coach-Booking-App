import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import {
  Event as EventIcon,
  AttachMoney as MoneyIcon,
  Star as StarIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { coachService, authService } from '../../services/api';
import { CURRENCY } from '../../utils/constants';
import BookingList from '../../components/bookings/BookingList';
import ReviewList from '../../components/reviews/ReviewList';
import { useAuth } from '../../contexts/AuthContext';

const StatCard = ({ title, value, icon, color }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center">
        <Box sx={{ color, mr: 2 }}>{icon}</Box>
        <Box>
          <Typography variant="h5">{value}</Typography>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.isApproved) {
      fetchDashboardData();
    }
  }, [user?.isApproved]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await coachService.getDashboardStats();
      if (response?.data?.data) {
        setStats(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (!user?.isApproved) {
    return (
      <Box p={3}>
        <Alert severity="info" sx={{ mb: 3 }}>
          Your coach profile is pending approval. You'll have limited access until an admin approves your profile.
        </Alert>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Profile Status
          </Typography>
          <Typography>
            • Profile completion: Complete
          </Typography>
          <Typography>
            • Approval status: Pending
          </Typography>
          <Typography sx={{ mt: 2 }}>
            You'll be notified once your profile is approved. Meanwhile, you can:
          </Typography>
          <ul>
            <li>View and update your profile</li>
            <li>Complete any pending documentation</li>
            <li>Prepare your coaching schedule</li>
          </ul>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={refreshUser} 
            sx={{ mt: 2 }}
          >
            Check Approval Status
          </Button>
        </Paper>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Stats Section */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Upcoming Sessions"
            value={stats?.upcomingSessions || 0}
            icon={<EventIcon fontSize="large" />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Monthly Earnings"
            value={CURRENCY.format(stats?.monthlyEarnings || 0)}
            icon={<MoneyIcon fontSize="large" />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Average Rating"
            value={(stats?.averageRating || 0).toFixed(1)}
            icon={<StarIcon fontSize="large" />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Hours Coached"
            value={stats?.totalHours || 0}
            icon={<ScheduleIcon fontSize="large" />}
            color="#9c27b0"
          />
        </Grid>

        {/* Upcoming Sessions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Upcoming Sessions</Typography>
              <Button
                component={RouterLink}
                to="/coach/sessions"
                color="primary"
              >
                View All
              </Button>
            </Box>
            <BookingList limit={5} />
          </Paper>
        </Grid>

        {/* Recent Reviews */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Recent Reviews</Typography>
              <Button
                component={RouterLink}
                to="/coach/reviews"
                color="primary"
              >
                View All
              </Button>
            </Box>
            <ReviewList showPagination={false} limit={3} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 