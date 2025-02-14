import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Tab,
  Tabs,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { adminService } from '../../../services/api';

const Reports = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    userStats: [],
    bookingStats: [],
    revenueStats: [],
    coachPerformance: []
  });

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const [userStats, bookingStats, revenueStats, coachPerformance] = await Promise.all([
        adminService.getUserStats(),
        adminService.getBookingStats(),
        adminService.getRevenueStats(),
        adminService.getCoachPerformance()
      ]);

      setStats({
        userStats: userStats.data,
        bookingStats: bookingStats.data,
        revenueStats: revenueStats.data,
        coachPerformance: coachPerformance.data
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Error fetching report data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type) => {
    try {
      let response;
      switch (type) {
        case 'users':
          response = await adminService.exportUsers();
          break;
        case 'bookings':
          response = await adminService.exportBookings();
          break;
        case 'revenue':
          response = await adminService.exportRevenue();
          break;
        default:
          return;
      }

      // Create blob and download
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Error exporting report');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Export Reports</Typography>
        <Box display="flex" gap={2}>
          <Button variant="contained" onClick={() => handleExport('users')}>
            Export Users
          </Button>
          <Button variant="contained" onClick={() => handleExport('bookings')}>
            Export Bookings
          </Button>
          <Button variant="contained" onClick={() => handleExport('revenue')}>
            Export Revenue
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Revenue Trends */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" gutterBottom>Revenue Trends</Typography>
            <ResponsiveContainer>
              <LineChart data={stats.revenueStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Booking Statistics */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" gutterBottom>Booking Statistics</Typography>
            <ResponsiveContainer>
              <BarChart data={stats.bookingStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* User Growth */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" gutterBottom>User Growth</Typography>
            <ResponsiveContainer>
              <LineChart data={stats.userStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Coach Performance */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" gutterBottom>Coach Performance</Typography>
            <ResponsiveContainer>
              <BarChart data={stats.coachPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="rating" fill="#8884d8" />
                <Bar dataKey="bookings" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports; 