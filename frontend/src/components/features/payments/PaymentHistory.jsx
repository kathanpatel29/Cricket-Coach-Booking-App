import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip
} from '../../shared/MuiComponents';
import { paymentService } from '../../../services/api';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refundDialog, setRefundDialog] = useState({
    open: false,
    payment: null
  });
  const [refundReason, setRefundReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      const response = await paymentService.getPaymentHistory();
      if (response?.data?.data?.payments) {
        setPayments(response.data.data.payments);
      } else {
        setError('Invalid response format from server');
        setPayments([]);
      }
    } catch (err) {
      console.error('Payment history error:', err);
      setError(err.response?.data?.message || 'Error fetching payment history');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefundRequest = async () => {
    if (!refundDialog.payment) return;

    setProcessing(true);
    try {
      await paymentService.requestRefund(refundDialog.payment._id, { reason: refundReason });
      // Update the payment status in the list
      setPayments(payments.map(payment => 
        payment._id === refundDialog.payment._id
          ? { ...payment, status: 'refund_requested' }
          : payment
      ));
      setRefundDialog({ open: false, payment: null });
      setRefundReason('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error requesting refund');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      succeeded: { color: 'success', label: 'Paid' },
      refund_requested: { color: 'warning', label: 'Refund Requested' },
      refunded: { color: 'info', label: 'Refunded' },
      failed: { color: 'error', label: 'Failed' }
    };

    const config = statusConfig[status] || { color: 'default', label: status };
    return <Chip size="small" color={config.color} label={config.label} />;
  };

  const getPaymentDescription = (payment) => {
    if (!payment.booking) return 'Payment';
    return `Coaching Session on ${new Date(payment.booking.date).toLocaleDateString()} at ${payment.booking.timeSlot} (${payment.booking.duration} minutes)`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Payment History
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment._id}>
                <TableCell>
                  {new Date(payment.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>{getPaymentDescription(payment)}</TableCell>
                <TableCell align="right">${payment.amount.toFixed(2)}</TableCell>
                <TableCell>{getStatusChip(payment.status)}</TableCell>
                <TableCell>
                  {payment.status === 'succeeded' && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      onClick={() => setRefundDialog({ open: true, payment })}
                    >
                      Request Refund
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {payments.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No payment history found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Refund Request Dialog */}
      <Dialog
        open={refundDialog.open}
        onClose={() => setRefundDialog({ open: false, payment: null })}
      >
        <DialogTitle>Request Refund</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Please provide a reason for the refund request:
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Reason"
            fullWidth
            multiline
            rows={4}
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setRefundDialog({ open: false, payment: null })}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleRefundRequest}
            variant="contained"
            disabled={!refundReason || processing}
          >
            {processing ? <CircularProgress size={24} /> : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default PaymentHistory; 