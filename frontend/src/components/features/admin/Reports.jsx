import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { adminService } from '../../../services/api';
import { format } from 'date-fns';
import DownloadIcon from '@mui/icons-material/Download';

const Reports = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reports, setReports] = useState({
    users: [],
    bookings: [],
    revenue: [],
    coachPerformance: []
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [users, bookings, revenue, coachPerformance] = await Promise.all([
        adminService.getUserStats(),
        adminService.getBookingStats(),
        adminService.getRevenueStats(),
        adminService.getCoachPerformance()
      ]);

      setReports({
        users: users.data.data.stats,
        bookings: bookings.data.data.stats,
        revenue: revenue.data.data.stats,
        coachPerformance: coachPerformance.data.data.performance
      });
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.response?.data?.message || 'Error fetching reports');
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
          throw new Error('Invalid export type');
      }
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || `Error exporting ${type} report`);
    }
  };

  const renderUserStats = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>User Distribution</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reports.users}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" name="Total Users" />
              <Bar dataKey="active" fill="#82ca9d" name="Active Users" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Role</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Active</TableCell>
                <TableCell align="right">Inactive</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.users.map((stat) => (
                <TableRow key={stat._id}>
                  <TableCell>{stat._id}</TableCell>
                  <TableCell align="right">{stat.count}</TableCell>
                  <TableCell align="right">{stat.active}</TableCell>
                  <TableCell align="right">{stat.inactive}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );

  const renderBookingStats = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Booking Status Distribution</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reports.bookings}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" name="Number of Bookings" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell align="right">Count</TableCell>
                <TableCell align="right">Total Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.bookings.map((stat) => (
                <TableRow key={stat._id}>
                  <TableCell>{stat._id}</TableCell>
                  <TableCell align="right">{stat.count}</TableCell>
                  <TableCell align="right">
                    ${stat.totalAmount?.toFixed(2) || '0.00'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );

  const renderRevenueStats = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Monthly Revenue</Typography>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={reports.revenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="_id" 
                tickFormatter={(value) => format(new Date(2023, value - 1), 'MMM')}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Total Revenue" />
              <Line type="monotone" dataKey="platformFees" stroke="#82ca9d" name="Platform Fees" />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderCoachPerformance = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Coach Name</TableCell>
                <TableCell align="right">Average Rating</TableCell>
                <TableCell align="right">Total Bookings</TableCell>
                <TableCell align="right">Total Earnings</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.coachPerformance.map((coach) => (
                <TableRow key={coach._id}>
                  <TableCell>{coach.name}</TableCell>
                  <TableCell align="right">
                    {coach.averageRating?.toFixed(1) || 'N/A'}
                  </TableCell>
                  <TableCell align="right">{coach.totalBookings}</TableCell>
                  <TableCell align="right">
                    ${coach.totalEarnings?.toFixed(2) || '0.00'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Users" />
          <Tab label="Bookings" />
          <Tab label="Revenue" />
          <Tab label="Coach Performance" />
        </Tabs>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => handleExport(
            activeTab === 0 ? 'users' : 
            activeTab === 1 ? 'bookings' : 
            'revenue'
          )}
          sx={{ mr: 1 }}
        >
          Export Report
        </Button>
      </Box>

      {activeTab === 0 && renderUserStats()}
      {activeTab === 1 && renderBookingStats()}
      {activeTab === 2 && renderRevenueStats()}
      {activeTab === 3 && renderCoachPerformance()}
    </Box>
  );
};

export default Reports; 