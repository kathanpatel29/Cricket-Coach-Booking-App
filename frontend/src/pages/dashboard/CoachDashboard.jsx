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
} from '../../components/shared/MuiComponents';
import {
  DashboardIcon,
  EventIcon,
  ScheduleIcon,
  AssessmentIcon
} from '../../components/shared/MuiComponents';
import { coachService } from '../../services/api';
import SessionManagement from '../../components/features/coaches/SessionManagement';
import Availability from '../../pages/bookings/Availability';
import Analytics from '../../components/features/coaches/Analytics';

const CoachDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await coachService.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Error fetching dashboard stats');
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
                <Typography variant="h4">{stats.totalSessions || 0}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">Upcoming Sessions</Typography>
                <Typography variant="h4">{stats.upcomingSessions || 0}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">Total Earnings</Typography>
                <Typography variant="h4">${stats.totalEarnings?.toFixed(2) || '0.00'}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">Average Rating</Typography>
                <Typography variant="h4">{stats.averageRating?.toFixed(1) || '0.0'}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">Total Reviews</Typography>
                <Typography variant="h4">{stats.totalReviews || 0}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">Completion Rate</Typography>
                <Typography variant="h4">{stats.completionRate || 0}%</Typography>
              </Paper>
            </Grid>
          </Grid>
        );
      case 1:
        return <SessionManagement />;
      case 2:
        return <Availability />;
      case 3:
        return <Analytics />;
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
          Coach Dashboard
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
            <Tab icon={<EventIcon />} label="Sessions" />
            <Tab icon={<ScheduleIcon />} label="Availability" />
            <Tab icon={<AssessmentIcon />} label="Analytics" />
          </Tabs>
        </Paper>

        {renderTabContent()}
      </Container>
    </Box>
  );
};

export default CoachDashboard;