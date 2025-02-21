import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  Event as EventIcon,
  Timer as TimerIcon,
  Star as StarIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { userService } from '../../services/api';
import { CURRENCY } from '../../utils/constants';
import BookingList from '../../components/bookings/BookingList';
import CoachList from '../../components/coaches/CoachList';

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
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await userService.getDashboardStats();
      if (response?.data?.data) {
        setStats(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

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
            value={stats.upcomingSessions}
            icon={<EventIcon fontSize="large" />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Hours"
            value={stats.totalHours}
            icon={<TimerIcon fontSize="large" />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Reviews Given"
            value={stats.reviewsCount}
            icon={<StarIcon fontSize="large" />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Spent"
            value={CURRENCY.format(stats.totalSpent)}
            icon={<PaymentIcon fontSize="large" />}
            color="#9c27b0"
          />
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                component={RouterLink}
                to="/user/book"
                startIcon={<EventIcon />}
              >
                Book New Session
              </Button>
              <Button
                variant="outlined"
                component={RouterLink}
                to="/coaches"
                startIcon={<StarIcon />}
              >
                Find Coaches
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Upcoming Sessions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Upcoming Sessions</Typography>
              <Button
                component={RouterLink}
                to="/user/bookings"
                color="primary"
              >
                View All
              </Button>
            </Box>
            <BookingList limit={5} status="upcoming" />
          </Paper>
        </Grid>

        {/* Recommended Coaches */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Recommended Coaches</Typography>
              <Button
                component={RouterLink}
                to="/coaches"
                color="primary"
              >
                View All
              </Button>
            </Box>
            <CoachList limit={3} recommended={true} />
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            {stats.recentActivity?.length > 0 ? (
              stats.recentActivity.map((activity, index) => (
                <Box key={activity.id}>
                  <Box display="flex" justifyContent="space-between" py={1}>
                    <Box>
                      <Typography variant="body1">
                        {activity.description}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {activity.date}
                      </Typography>
                    </Box>
                    <Typography 
                      variant="body2" 
                      color={activity.type === 'payment' ? 'error.main' : 'success.main'}
                    >
                      {activity.type === 'payment' && '-'}
                      {CURRENCY.format(activity.amount)}
                    </Typography>
                  </Box>
                  {index < stats.recentActivity.length - 1 && <Divider />}
                </Box>
              ))
            ) : (
              <Typography color="text.secondary">
                No recent activity
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 