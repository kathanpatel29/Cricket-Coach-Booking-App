import React, { useState, useEffect } from 'react';
import { DashboardIcon , EventIcon , HistoryIcon , FeedbackIcon } from '../../components/shared/MuiComponents';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert
} from '@mui/material';
import { clientService } from '../../services/api';
import BookingHistory from '../../components/features/bookings/BookingHistory';
import PaymentHistory from '../../components/features/payments/PaymentHistory';
import MyReviews from '../../components/features/reviews/MyReviews';

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingBookings: [],
    totalSpent: 0,
    recentReviews: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await clientService.getDashboardStats();
      if (response?.data?.data) {
        setStats(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">Total Sessions</Typography>
                <Typography variant="h4">{stats.totalBookings || 0}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">Upcoming Sessions</Typography>
                <Typography variant="h4">{stats.upcomingBookings.length || 0}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">Total Spent</Typography>
                <Typography variant="h4">${stats.totalSpent?.toFixed(2) || '0.00'}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">Reviews Given</Typography>
                <Typography variant="h4">{stats.recentReviews.length || 0}</Typography>
              </Paper>
            </Grid>
          </Grid>
        );
      case 1:
        return <BookingHistory />;
      case 2:
        return <PaymentHistory />;
      case 3:
        return <MyReviews />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" gutterBottom>
          My Dashboard
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<DashboardIcon/>} label="Overview" />
            <Tab icon={<EventIcon />} label="Bookings" />
            <Tab icon={<HistoryIcon />} label="Payments" />
            <Tab icon={<FeedbackIcon />} label="Reviews" />
          </Tabs>
        </Paper>

        {renderTabContent()}
      </Container>
    </Box>
  );
};

export default UserDashboard;