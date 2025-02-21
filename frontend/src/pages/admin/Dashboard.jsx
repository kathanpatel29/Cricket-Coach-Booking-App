import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Tab,
  Tabs,
  CircularProgress,
  Alert
} from '@mui/material';
import DashboardOverview from '../../components/admin/DashboardOverview';
import UserManagement from '../../components/admin/UserManagement';
import BookingManagement from '../../components/admin/BookingManagement';
import PaymentManagement from '../../components/admin/PaymentManagement';
import ReviewModeration from '../../components/admin/ReviewModeration';
import CoachApprovals from '../../components/admin/CoachApprovals';
import { adminService } from '../../services/api';

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`admin-tabpanel-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await adminService.getDashboardStats();
      if (response?.data?.data) {
        setStats(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Overview" />
          <Tab label="Users" />
          <Tab label="Bookings" />
          <Tab label="Payments" />
          <Tab label="Reviews" />
          <Tab label="Coach Approvals" />
        </Tabs>
      </Paper>

      <TabPanel value={activeTab} index={0}>
        <DashboardOverview stats={stats} />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <UserManagement />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <BookingManagement />
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <PaymentManagement />
      </TabPanel>

      <TabPanel value={activeTab} index={4}>
        <ReviewModeration />
      </TabPanel>

      <TabPanel value={activeTab} index={5}>
        <CoachApprovals />
      </TabPanel>
    </Box>
  );
};

export default Dashboard; 