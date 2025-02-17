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
  Chip,
  TablePagination
} from '../../shared/MuiComponents';
import { paymentService } from '../../../services/api';
import { format } from 'date-fns';

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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
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
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Coach</TableCell>
              <TableCell>Session Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((payment) => (
                <TableRow key={payment._id}>
                  <TableCell>
                    {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>${payment.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={payment.status} 
                      color={getStatusChip(payment.status).props.color}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{payment.coach?.name}</TableCell>
                  <TableCell>
                    {format(new Date(payment.booking?.date), 'MMM dd, yyyy')}
                  </TableCell>
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

      <TablePagination
        component="div"
        count={payments.length}
        page={page}
        onPageChange={(event, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
      />

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