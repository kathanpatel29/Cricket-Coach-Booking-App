import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Grid, 
  Card, 
  CardContent,
  CircularProgress,
  Alert,
  TextField,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { userApi } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const BookingPayment = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Add refresh interval state
  const [refreshInterval, setRefreshInterval] = useState(null);
  
  // Form state
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Stepper state
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Review Booking', 'Payment Details', 'Confirmation'];

  useEffect(() => {
    fetchBookingDetails();
    
    // Set up interval to periodically refresh booking status from backend
    const interval = setInterval(() => {
      if (activeStep < 2) { // Only refresh if not on confirmation step
        fetchBookingDetails(false); // false = silent refresh (no loading indicator)
      }
    }, 30000); // Refresh every 30 seconds
    
    setRefreshInterval(interval);
    
    // Clean up interval on unmount
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [bookingId]);

  const fetchBookingDetails = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      
      console.log("Fetching booking details for ID:", bookingId);
      const response = await userApi.getBookingById(bookingId);
      
      console.log("Booking response:", response.data);
      
      if (response.data && response.data.data) {
        // Check both possible response formats
        const fetchedBooking = response.data.data.booking || response.data.data;
        
        // Log booking details for debugging
        console.log("Extracted booking:", fetchedBooking);
        
        // Log booking status information for debugging
        console.log("Booking status:", fetchedBooking.status);
        console.log("Payment status:", fetchedBooking.paymentStatus);
        
        // Check if booking is approved and awaiting payment
        if (fetchedBooking.status !== 'approved' || fetchedBooking.paymentStatus !== 'awaiting_payment') {
          console.log("Booking not available for payment. Status:", fetchedBooking.status, "Payment status:", fetchedBooking.paymentStatus);
          
          // Provide more helpful error messages based on status
          if (fetchedBooking.status === 'pending_approval') {
            setError('This booking is still waiting for coach approval before payment can be made.');
          } else if (fetchedBooking.status === 'rejected') {
            setError('This booking was rejected by the coach and cannot be paid for.');
          } else if (fetchedBooking.status === 'confirmed' || fetchedBooking.paymentStatus === 'paid') {
            setError('This booking has already been paid for and confirmed.');
          } else if (fetchedBooking.status === 'cancelled') {
            setError('This booking was cancelled and cannot be paid for.');
          } else {
            setError('This booking is not available for payment or has already been paid.');
          }
        } else {
          setBooking(fetchedBooking);
        }
      } else {
        console.log("No booking data in response");
        setError('Unable to find booking details.');
      }
    } catch (err) {
      console.error('Error fetching booking details:', err);
      if (err.response && err.response.status === 404) {
        setError('Booking not found. It may have been cancelled or removed.');
      } else if (err.response && err.response.data && err.response.data.message) {
        setError(`Error: ${err.response.data.message}`);
      } else {
        setError('Failed to load booking details. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const validatePaymentForm = () => {
    const errors = {};
    
    if (paymentMethod === 'credit_card') {
      if (!cardNumber) errors.cardNumber = 'Card number is required';
      else if (!/^\d{16}$/.test(cardNumber)) errors.cardNumber = 'Card number must be 16 digits';
      
      if (!expiryDate) errors.expiryDate = 'Expiry date is required';
      else if (!/^\d{2}\/\d{2}$/.test(expiryDate)) errors.expiryDate = 'Use format MM/YY';
      
      if (!cvv) errors.cvv = 'CVV is required';
      else if (!/^\d{3,4}$/.test(cvv)) errors.cvv = 'CVV must be 3 or 4 digits';
      
      if (!nameOnCard) errors.nameOnCard = 'Name on card is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePaymentSubmit = async () => {
    if (!validatePaymentForm()) return;
    
    try {
      setProcessingPayment(true);
      setError(null);
      
      console.log("Processing payment for booking:", bookingId);
      
      // In a real app, you'd securely process the payment
      // Here we're just simulating a payment process
      const paymentData = {
        paymentMethod,
        // Don't include sensitive card details in a real application
        // This is for demo purposes only
        amount: booking.paymentAmount,
        cardLastFour: cardNumber.slice(-4)
      };
      
      console.log("Sending payment data:", { bookingId, amount: paymentData.amount });
      
      const response = await userApi.processBookingPayment(bookingId, paymentData);
      
      console.log("Payment response:", response.data);
      
      if (response.data && response.data.status === 'success') {
        // Fetch the updated booking from backend to ensure we have the latest status
        try {
          console.log("Fetching updated booking details after payment");
          const updatedBookingResponse = await userApi.getBookingById(bookingId);
          
          if (updatedBookingResponse.data && updatedBookingResponse.data.data) {
            // Update the local booking state with fresh data from server
            const freshBookingData = updatedBookingResponse.data.data.booking || updatedBookingResponse.data.data;
            setBooking(freshBookingData);
            
            console.log("Updated booking status:", freshBookingData.status);
            console.log("Updated payment status:", freshBookingData.paymentStatus);
          }
        } catch (refreshError) {
          console.error("Error refreshing booking after payment:", refreshError);
          // Continue with success flow even if refresh fails
        }
        
        setSuccess(true);
        setActiveStep(2); // Move to confirmation step
        
        // Clear refresh interval after successful payment
        if (refreshInterval) {
          clearInterval(refreshInterval);
          setRefreshInterval(null);
        }
      } else {
        setError('Payment processing failed. Please try again.');
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      
      // Provide more specific error information
      if (err.response && err.response.data) {
        console.log("Error response data:", err.response.data);
        
        if (err.response.status === 400 && err.response.data.message) {
          setError(`Payment failed: ${err.response.data.message}`);
        } else if (err.response.status === 404) {
          setError('Booking not found or has been cancelled.');
        } else if (err.response.status === 403) {
          setError('You are not authorized to pay for this booking.');
        } else if (err.response.data.message) {
          setError(`Payment failed: ${err.response.data.message}`);
        } else {
          setError('Payment processing failed. Please try again later.');
        }
      } else {
        setError('Payment processing failed. Please try again later.');
      }
    } finally {
      setProcessingPayment(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const period = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${period}`;
    } catch (error) {
      return timeString;
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return renderBookingReview();
      case 1:
        return renderPaymentForm();
      case 2:
        return renderConfirmation();
      default:
        return 'Unknown step';
    }
  };

  const renderBookingReview = () => {
    if (!booking) return null;
    
    return (
      <Box>
        <Typography variant="h6" gutterBottom>Booking Details</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">Coach:</Typography>
            <Typography variant="body1">
              {booking.coach && booking.coach.user ? booking.coach.user.name : 'Coach'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">Date and Time:</Typography>
            <Typography variant="body1">
              {booking.timeSlot ? (
                <>
                  {formatDate(booking.timeSlot.date)}<br />
                  {formatTime(booking.timeSlot.startTime)} - {formatTime(booking.timeSlot.endTime)}
                </>
              ) : (
                'Time not specified'
              )}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">Type:</Typography>
            <Typography variant="body1">
              {booking.bookingType || 'Standard Session'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">Amount Due:</Typography>
            <Typography variant="body1" fontWeight="bold">
              CAD ${booking.paymentAmount?.toFixed(2) || '0.00'}
            </Typography>
          </Grid>
        </Grid>
        <Button
          variant="contained"
          onClick={handleNext}
          sx={{ mt: 3, ml: 1 }}
        >
          Proceed to Payment
        </Button>
      </Box>
    );
  };

  const renderPaymentForm = () => {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>Payment Method</Typography>
        
        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <RadioGroup
            name="paymentMethod"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <FormControlLabel value="credit_card" control={<Radio />} label="Credit Card" />
            <FormControlLabel value="debit_card" control={<Radio />} label="Debit Card" />
          </RadioGroup>
        </FormControl>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Name on Card"
              variant="outlined"
              value={nameOnCard}
              onChange={(e) => setNameOnCard(e.target.value)}
              error={!!formErrors.nameOnCard}
              helperText={formErrors.nameOnCard}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Card Number"
              variant="outlined"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
              error={!!formErrors.cardNumber}
              helperText={formErrors.cardNumber}
              inputProps={{ maxLength: 16 }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Expiry Date (MM/YY)"
              variant="outlined"
              value={expiryDate}
              onChange={(e) => {
                let value = e.target.value.replace(/[^\d/]/g, '');
                if (value.length === 2 && !value.includes('/') && expiryDate.length !== 3) {
                  value = value + '/';
                }
                setExpiryDate(value.slice(0, 5));
              }}
              error={!!formErrors.expiryDate}
              helperText={formErrors.expiryDate}
              inputProps={{ maxLength: 5 }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="CVV"
              variant="outlined"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
              error={!!formErrors.cvv}
              helperText={formErrors.cvv}
              inputProps={{ maxLength: 4 }}
            />
          </Grid>
        </Grid>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button onClick={handleBack}>
            Back
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handlePaymentSubmit}
            disabled={processingPayment}
          >
            {processingPayment ? 'Processing...' : 'Pay Now'}
          </Button>
        </Box>
      </Box>
    );
  };

  const renderConfirmation = () => {
    if (!booking) return null;
    
    // Get coach name, safely handling the different ways it might be available
    const coachName = booking.coach?.user?.name || booking.coach?.name || 'your coach';
    
    // Format session date/time
    const sessionDate = booking.timeSlot?.date ? formatDate(booking.timeSlot.date) : 'Scheduled date';
    const sessionTime = booking.timeSlot ? 
      `${formatTime(booking.timeSlot.startTime)} - ${formatTime(booking.timeSlot.endTime)}` : 
      'Scheduled time';
    
    return (
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <CheckCircleOutlineIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h5" component="h2" gutterBottom>
          Payment Successful!
        </Typography>
        <Typography variant="body1" paragraph>
          Your booking with {coachName} has been confirmed.
          You will receive a confirmation email shortly with all details.
        </Typography>
        <Typography variant="body2" paragraph>
          Session on {sessionDate} at {sessionTime}
        </Typography>
        <Typography variant="body2" paragraph color="text.secondary">
          Thank you for your payment. You can view your booking details in your bookings page.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/user/bookings')}
          sx={{ mt: 2 }}
        >
          View Your Bookings
        </Button>
      </Paper>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button
            variant="contained"
            onClick={() => navigate('/user/dashboard')}
          >
            Return to Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Complete Your Booking
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {getStepContent(activeStep)}
      </Paper>
    </Container>
  );
};

export default BookingPayment; 