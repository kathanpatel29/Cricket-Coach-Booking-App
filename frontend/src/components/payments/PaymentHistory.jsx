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
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import {
  Visibility as ViewIcon,
  GetApp as DownloadIcon
} from '@mui/icons-material';
import { paymentService } from '../../services/api';
import { formatDateTime } from '../../utils/dateUtils';
import { CURRENCY } from '../../utils/constants';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getPaymentHistory();
      if (response?.data?.data?.payments) {
        setPayments(response.data.data.payments);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching payment history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (paymentId) => {
    try {
      await paymentService.downloadReceipt(paymentId);
    } catch (err) {
      setError(err.response?.data?.message || 'Error downloading receipt');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
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
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Payment ID</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Method</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment._id}>
                <TableCell>{formatDateTime(payment.createdAt)}</TableCell>
                <TableCell>{payment._id}</TableCell>
                <TableCell>{CURRENCY.format(payment.amount)}</TableCell>
                <TableCell>
                  <Chip
                    label={payment.status}
                    color={getStatusColor(payment.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{payment.method}</TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => {
                      setSelectedPayment(payment);
                      setDetailsOpen(true);
                    }}
                    size="small"
                  >
                    <ViewIcon />
                  </IconButton>
                  {payment.status === 'completed' && (
                    <IconButton
                      onClick={() => handleDownloadReceipt(payment._id)}
                      size="small"
                    >
                      <DownloadIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)}>
        <DialogTitle>Payment Details</DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Box sx={{ pt: 2 }}>
              <Typography>
                <strong>Payment ID:</strong> {selectedPayment._id}
              </Typography>
              <Typography>
                <strong>Date:</strong> {formatDateTime(selectedPayment.createdAt)}
              </Typography>
              <Typography>
                <strong>Amount:</strong> {CURRENCY.format(selectedPayment.amount)}
              </Typography>
              <Typography>
                <strong>Status:</strong> {selectedPayment.status}
              </Typography>
              <Typography>
                <strong>Method:</strong> {selectedPayment.method}
              </Typography>
              {selectedPayment.booking && (
                <>
                  <Typography sx={{ mt: 2 }}>
                    <strong>Booking Details:</strong>
                  </Typography>
                  <Typography>
                    Coach: {selectedPayment.booking.coach.name}
                  </Typography>
                  <Typography>
                    Date: {formatDateTime(selectedPayment.booking.date)}
                  </Typography>
                  <Typography>
                    Duration: {selectedPayment.booking.duration} minutes
                  </Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          {selectedPayment?.status === 'completed' && (
            <Button
              onClick={() => handleDownloadReceipt(selectedPayment._id)}
              startIcon={<DownloadIcon />}
            >
              Download Receipt
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentHistory; 