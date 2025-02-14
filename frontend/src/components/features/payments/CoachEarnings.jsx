import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { paymentService } from '../../../services/api';

const CoachEarnings = () => {
  const [earnings, setEarnings] = useState({
    summary: {
      totalEarnings: 0,
      pendingPayouts: 0,
      completedSessions: 0,
      averageRating: 0
    },
    recentTransactions: [],
    monthlyEarnings: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEarningsData();
  }, []);

  const fetchEarningsData = async () => {
    try {
      const response = await paymentService.getCoachEarnings();
      if (response?.data?.data) {
        setEarnings({
          summary: {
            totalEarnings: response.data.data.summary?.totalEarnings || 0,
            pendingPayouts: response.data.data.summary?.pendingPayouts || 0,
            completedSessions: response.data.data.summary?.completedSessions || 0,
            averageRating: response.data.data.summary?.averageRating || 0
          },
          recentTransactions: response.data.data.recentTransactions || [],
          monthlyEarnings: response.data.data.monthlyEarnings || []
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching earnings:', err);
      setError(err.response?.data?.message || 'Error fetching earnings data');
    } finally {
      setLoading(false);
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
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Earnings
              </Typography>
              <Typography variant="h4">
                ${earnings?.summary?.totalEarnings?.toFixed(2) || '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Payouts
              </Typography>
              <Typography variant="h4">
                ${earnings?.summary?.pendingPayouts?.toFixed(2) || '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Completed Sessions
              </Typography>
              <Typography variant="h4">
                {earnings?.summary?.completedSessions || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Average Rating
              </Typography>
              <Typography variant="h4">
                {earnings?.summary?.averageRating?.toFixed(1) || '0.0'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Earnings Chart */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Monthly Earnings
        </Typography>
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={earnings?.monthlyEarnings || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#8884d8"
                name="Earnings"
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/* Recent Transactions */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Transactions
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Session Type</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(earnings?.recentTransactions || []).map((transaction) => (
                <TableRow key={transaction._id}>
                  <TableCell>
                    {new Date(transaction.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{transaction.client?.name || 'Unknown Client'}</TableCell>
                  <TableCell>{transaction.sessionType || 'N/A'}</TableCell>
                  <TableCell align="right">${transaction.amount?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>{transaction.status || 'N/A'}</TableCell>
                </TableRow>
              ))}
              {(!earnings?.recentTransactions || earnings.recentTransactions.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No recent transactions
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default CoachEarnings; 