import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Chip
} from '@mui/material';
import {
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon
} from '@mui/icons-material';
import { adminService } from '../../services/api';
import { formatDateTime } from '../../utils/dateUtils';

const PaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await adminService.getPayments();
      if (response?.data?.data?.payments) {
        setPayments(response.data.data.payments);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching payments');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = async (paymentId) => {
    try {
      await adminService.processRefund(paymentId);
      fetchPayments();
      setViewDialog(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error processing refund');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'succeeded':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'refunded':
        return 'info';
      default:
        return 'default';
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
    <Box p={3}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Payment ID</TableCell>
              <TableCell>Booking ID</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Coach</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment._id}>
                <TableCell>{payment._id}</TableCell>
                <TableCell>{payment.booking._id}</TableCell>
                <TableCell>{payment.user.name}</TableCell>
                <TableCell>{payment.coach.name}</TableCell>
                <TableCell>${payment.amount}</TableCell>
                <TableCell>
                  <Chip 
                    label={payment.status}
                    color={getStatusColor(payment.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{formatDateTime(payment.createdAt)}</TableCell>
                <TableCell>
                  <IconButton 
                    onClick={() => {
                      setSelectedPayment(payment);
                      setViewDialog(true);
                    }}
                    size="small"
                  >
                    <ViewIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* View Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Payment Details</DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle1">Payment Information</Typography>
              <Typography>ID: {selectedPayment._id}</Typography>
              <Typography>Amount: ${selectedPayment.amount}</Typography>
              <Typography>Status: {selectedPayment.status}</Typography>
              <Typography>Date: {formatDateTime(selectedPayment.createdAt)}</Typography>

              <Typography variant="subtitle1" sx={{ mt: 2 }}>Booking Information</Typography>
              <Typography>Booking ID: {selectedPayment.booking._id}</Typography>
              <Typography>Date: {formatDateTime(selectedPayment.booking.date)}</Typography>
              
              <Typography variant="subtitle1" sx={{ mt: 2 }}>User Information</Typography>
              <Typography>Name: {selectedPayment.user.name}</Typography>
              <Typography>Email: {selectedPayment.user.email}</Typography>

              <Typography variant="subtitle1" sx={{ mt: 2 }}>Coach Information</Typography>
              <Typography>Name: {selectedPayment.coach.name}</Typography>
              <Typography>Email: {selectedPayment.coach.email}</Typography>

              {selectedPayment.status === 'succeeded' && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    onClick={() => handleProcessRefund(selectedPayment._id)}
                    color="primary"
                    variant="contained"
                  >
                    Process Refund
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentManagement; 