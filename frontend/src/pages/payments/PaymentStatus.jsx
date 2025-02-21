import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { paymentService } from '../../services/api';

const PaymentStatus = () => {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentDetails, setPaymentDetails] = useState(null);

  useEffect(() => {
    checkPaymentStatus();
  }, [paymentId]);

  const checkPaymentStatus = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getPaymentStatus(paymentId);
      if (response?.data?.data) {
        setPaymentDetails(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error checking payment status');
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

  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        {paymentDetails?.status === 'success' ? (
          <>
            <SuccessIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Payment Successful!
            </Typography>
            <Typography variant="body1" paragraph>
              Your payment has been processed successfully.
              A confirmation email has been sent to your registered email address.
            </Typography>
          </>
        ) : (
          <>
            <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Payment Failed
            </Typography>
            <Typography variant="body1" color="error" paragraph>
              {error || 'There was an error processing your payment.'}
            </Typography>
          </>
        )}

        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            onClick={() => navigate('/user/bookings')}
            sx={{ mr: 2 }}
          >
            View Bookings
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/user/book')}
          >
            Book Another Session
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default PaymentStatus; 