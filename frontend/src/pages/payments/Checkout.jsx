import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Button,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import PaymentForm from '../../components/payments/PaymentForm';
import PaymentSummary from '../../components/payments/PaymentSummary';
import { paymentService } from '../../services/api';
import { toast } from 'react-hot-toast';

const steps = ['Review Order', 'Payment Details', 'Confirmation'];

const Checkout = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingDetails, setBookingDetails] = useState(null);

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getBookingDetails(bookingId);
      if (response?.data?.data) {
        setBookingDetails(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching booking details');
      toast.error('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentComplete = async (paymentData) => {
    try {
      setLoading(true);
      const response = await paymentService.processPayment({
        bookingId,
        paymentData
      });

      if (response?.data?.status === 'success') {
        setActiveStep(2);
        navigate(`/payments/${response.data.data.paymentId}/status`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment processing failed');
      toast.error('Payment failed');
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
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Checkout
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <PaymentForm
              booking={bookingDetails}
              onPaymentComplete={handlePaymentComplete}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <PaymentSummary booking={bookingDetails} />
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default Checkout; 