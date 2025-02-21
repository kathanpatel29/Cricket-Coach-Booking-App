import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import CoachList from '../../components/coaches/CoachList';
import BookingCalendar from '../../components/bookings/BookingCalendar';
import BookingForm from '../../components/bookings/BookingForm';
import PaymentForm from '../../components/payments/PaymentForm';
import PaymentSummary from '../../components/payments/PaymentSummary';
import { bookingService } from '../../services/api';
import { toast } from 'react-hot-toast';

const steps = ['Select Coach', 'Choose Time', 'Booking Details', 'Payment'];

const BookSession = () => {
  const navigate = useNavigate();
  const { coachId } = useParams();
  const [activeStep, setActiveStep] = useState(coachId ? 1 : 0);
  const [bookingData, setBookingData] = useState({
    coachId: coachId || '',
    date: null,
    time: '',
    duration: 60,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCoachSelect = (coach) => {
    setBookingData(prev => ({ ...prev, coachId: coach._id }));
    setActiveStep(1);
  };

  const handleTimeSelect = (date, time) => {
    setBookingData(prev => ({ ...prev, date, time }));
    setActiveStep(2);
  };

  const handleBookingSubmit = (formData) => {
    setBookingData(prev => ({ ...prev, ...formData }));
    setActiveStep(3);
  };

  const handlePaymentComplete = async (paymentData) => {
    try {
      setLoading(true);
      const response = await bookingService.createBooking({
        ...bookingData,
        paymentId: paymentData.id
      });

      if (response?.data?.data?.booking) {
        toast.success('Booking confirmed successfully!');
        navigate(`/user/bookings/${response.data.data.booking._id}/confirmation`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating booking');
      toast.error('Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <CoachList 
            onCoachSelect={handleCoachSelect}
            selectedCoachId={bookingData.coachId}
          />
        );
      case 1:
        return (
          <BookingCalendar
            coachId={bookingData.coachId}
            onTimeSelect={handleTimeSelect}
          />
        );
      case 2:
        return (
          <BookingForm
            bookingData={bookingData}
            onSubmit={handleBookingSubmit}
          />
        );
      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <PaymentForm
                booking={bookingData}
                onPaymentComplete={handlePaymentComplete}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <PaymentSummary booking={bookingData} />
            </Grid>
          </Grid>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Book a Coaching Session
        </Typography>

        <Stepper activeStep={activeStep} sx={{ my: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Box>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {getStepContent(activeStep)}
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                {activeStep !== 0 && (
                  <Button onClick={handleBack} sx={{ mr: 1 }}>
                    Back
                  </Button>
                )}
              </Box>
            </>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default BookSession; 