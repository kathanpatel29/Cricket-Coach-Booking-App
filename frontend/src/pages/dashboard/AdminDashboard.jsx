import React, { useState, useEffect } from 'react';
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
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  SupervisorAccount as SupervisorIcon,
  RateReview as ReviewIcon
} from '@mui/icons-material';
import { adminService } from '../../services/api';
import Reports from '../../components/features/admin/Reports';
import UserManagement from '../../components/features/admin/UserManagement';
import CoachApprovals from '../../components/features/admin/CoachApprovals';
import ReviewModeration from '../../components/features/admin/ReviewModeration';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await adminService.getDashboardStats();
      if (response?.data?.data?.stats) {
        setStats(response.data.data.stats);
      }
    } catch (err) {
      console.error('Dashboard stats error:', err);
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
                <Typography variant="h6" color="primary">Total Users</Typography>
                <Typography variant="h4">{stats.totalUsers || 0}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">Total Coaches</Typography>
                <Typography variant="h4">{stats.totalCoaches || 0}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">Total Bookings</Typography>
                <Typography variant="h4">{stats.totalBookings || 0}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">Total Revenue</Typography>
                <Typography variant="h4">${stats.totalRevenue?.toFixed(2) || '0.00'}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">Pending Reviews</Typography>
                <Typography variant="h4">{stats.pendingReviews || 0}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">Pending Coaches</Typography>
                <Typography variant="h4">{stats.pendingCoaches || 0}</Typography>
              </Paper>
            </Grid>
          </Grid>
        );
      case 1:
        return <UserManagement />;
      case 2:
        return <CoachApprovals />;
      case 3:
        return <ReviewModeration />;
      case 4:
        return <Reports />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
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
            <Tab icon={<DashboardIcon />} label="Overview" />
            <Tab icon={<PeopleIcon />} label="User Management" />
            <Tab icon={<SupervisorIcon />} label="Coach Approvals" />
            <Tab icon={<ReviewIcon />} label="Review Moderation" />
            <Tab icon={<AssessmentIcon />} label="Reports" />
          </Tabs>
        </Paper>

        {renderTabContent()}
      </Container>
    </Box>
  );
};

export default AdminDashboard;