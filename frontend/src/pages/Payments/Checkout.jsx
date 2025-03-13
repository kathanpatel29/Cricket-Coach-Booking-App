import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { publicApi, userApi } from '../../services/api';

const steps = ['Booking Details', 'Payment Method', 'Confirmation'];

const Checkout = () => {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const api = userApi;
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(null);
  const [coach, setCoach] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: ''
  });
  
  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch booking details using userApi instead of api
        const bookingResponse = await userApi.getBookingById(bookingId);
        console.log('Booking data:', bookingResponse.data);
        const bookingData = bookingResponse.data.data.booking;
        setBooking(bookingData);
        
        // Use the coach data that's already populated in the booking response
        console.log('Coach data from booking:', bookingData.coach);
        
        // If the coach object has a user ID but not the full user details, fetch them
        if (bookingData.coach && bookingData.coach.user && typeof bookingData.coach.user === 'string') {
          // User is just an ID, need to fetch user details
          try {
            const coachResponse = await publicApi.getCoachById(bookingData.coach._id);
            setCoach(coachResponse.data.data.coach);
          } catch (err) {
            console.error('Error fetching coach details:', err);
            setCoach(bookingData.coach);
          }
        } else {
          setCoach(bookingData.coach);
        }
        
      } catch (err) {
        console.error('Error fetching booking details:', err);
        setError('Failed to load booking details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookingDetails();
  }, [bookingId]);
  
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  const handleCardDetailsChange = (e) => {
    const { name, value } = e.target;
    setCardDetails({ ...cardDetails, [name]: value });
  };
  
  const handlePaymentMethodChange = (e) => {
    setPaymentMethod(e.target.value);
  };
  
  const handleProcessPayment = async () => {
    try {
      setProcessing(true);
      setError(null);
      
      // Alert user that payment will automatically confirm booking
      console.log('Processing payment - this will automatically confirm your booking');
      
      // Step 1: Create a payment intent
      const intentResponse = await userApi.createPaymentIntent(bookingId);
      if (intentResponse.data.status !== 'success') {
        throw new Error(intentResponse.data.message || 'Failed to create payment intent');
      }
      
      console.log('Payment intent created:', intentResponse.data);
      const { clientSecret, paymentId } = intentResponse.data.data;
      
      // Extract the payment intent ID from the client secret (format: pi_xxxxx_secret_xxxxx)
      const paymentIntentId = clientSecret.split('_secret_')[0];
      console.log('Extracted payment intent ID:', paymentIntentId);
      
      // Step 2: For test/demo purposes, we'll use mock card data
      // In a real application, we would use Stripe Elements to securely collect card details
      
      // Step 3: Confirm the payment with the backend
      const confirmResponse = await userApi.completePayment(bookingId, {
        paymentIntentId: paymentIntentId,
        paymentMethod,
        ...(paymentMethod === 'card' && { cardDetails }),
      });
      
      if (confirmResponse.data.status === 'success') {
        // Update booking status locally to reflect immediate confirmation
        setBooking({
          ...booking,
          status: 'confirmed',
          paymentStatus: 'paid'
        });
        
        console.log('Payment completed successfully:', confirmResponse.data);
        console.log('Your booking has been automatically confirmed!');
        
        // Move to confirmation step
        handleNext();
      } else {
        throw new Error(confirmResponse.data.message || 'Payment processing failed');
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      setError(err.response?.data?.message || 'Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };
  
  const handleCompleteCheckout = () => {
    navigate('/user/bookings');
  };
  
  // Format date for display
  const formatDateTime = (dateObj, timeString) => {
    try {
      if (!dateObj || !timeString) return 'N/A';
      
      const date = new Date(dateObj);
      const [hours, minutes] = timeString.split(':');
      date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (error) {
      console.error('Error formatting date/time:', error);
      return 'Invalid date';
    }
  };
  
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error">{error}</Alert>
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" onClick={() => navigate('/user/bookings')}>
            Return to Bookings
          </Button>
        </Box>
      </Container>
    );
  }
  
  if (!booking || !coach) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="warning">Booking details not found.</Alert>
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" onClick={() => navigate('/user/bookings')}>
            Return to Bookings
          </Button>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Checkout
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ my: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Booking Summary
            </Typography>
            
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Coach
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {coach?.user?.name || 'Coach'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Session Date & Time
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {booking?.timeSlot ? 
                        `${format(new Date(booking.timeSlot.date), 'MMM d, yyyy')} ${booking.timeSlot.startTime} - ${booking.timeSlot.endTime}` 
                        : 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Duration
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {booking?.timeSlot?.duration || 'N/A'} minutes
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {booking?.status?.toUpperCase() || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            <Typography variant="h6" gutterBottom>
              Payment Summary
            </Typography>
            
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body1">Session Fee</Typography>
                      <Typography variant="body1">CAD ${booking?.paymentAmount || 0}</Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body1">Platform Fee</Typography>
                      <Typography variant="body1">CAD $0.00</Typography>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6">Total</Typography>
                      <Typography variant="h6" color="primary">CAD ${booking?.paymentAmount || 0}</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ShoppingCartIcon />}
              >
                Proceed to Payment
              </Button>
            </Box>
          </Box>
        )}
        
        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Payment Method
            </Typography>
            
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <FormLabel component="legend">Select Payment Method</FormLabel>
              <RadioGroup
                name="paymentMethod"
                value={paymentMethod}
                onChange={handlePaymentMethodChange}
              >
                <FormControlLabel value="card" control={<Radio />} label="Credit/Debit Card" />
                <FormControlLabel value="paypal" control={<Radio />} label="PayPal" />
              </RadioGroup>
            </FormControl>
            
            {paymentMethod === 'card' && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    name="cardNumber"
                    label="Card Number"
                    fullWidth
                    value={cardDetails.cardNumber}
                    onChange={handleCardDetailsChange}
                    placeholder="1234 5678 9012 3456"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    name="cardholderName"
                    label="Cardholder Name"
                    fullWidth
                    value={cardDetails.cardholderName}
                    onChange={handleCardDetailsChange}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="expiryDate"
                    label="Expiry Date (MM/YY)"
                    fullWidth
                    value={cardDetails.expiryDate}
                    onChange={handleCardDetailsChange}
                    placeholder="MM/YY"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="cvv"
                    label="CVV"
                    fullWidth
                    value={cardDetails.cvv}
                    onChange={handleCardDetailsChange}
                    type="password"
                  />
                </Grid>
              </Grid>
            )}
            
            {paymentMethod === 'paypal' && (
              <Box sx={{ my: 2 }}>
                <Typography>
                  You will be redirected to PayPal to complete your payment.
                </Typography>
              </Box>
            )}
            
            {error && (
              <Alert severity="error" sx={{ mt: 3 }}>
                {error}
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button onClick={handleBack} variant="outlined">
                Back
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                onClick={handleProcessPayment}
                disabled={processing}
                startIcon={processing ? <CircularProgress size={24} /> : <PaymentIcon />}
              >
                {processing ? 'Processing...' : 'Pay Now'}
              </Button>
            </Box>
          </Box>
        )}
        
        {activeStep === 2 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
            
            <Typography variant="h5" gutterBottom>
              Payment Successful & Booking Confirmed!
            </Typography>
            
            <Typography variant="body1" paragraph>
              Your booking has been confirmed automatically and payment has been processed successfully.
            </Typography>
            
            <Typography variant="body1" paragraph>
              The coach has been notified of your confirmed booking.
            </Typography>
            
            <Typography variant="body1" paragraph>
              A confirmation email has been sent to your registered email address.
            </Typography>
            
            <Alert severity="info" sx={{ my: 2, maxWidth: 500, mx: 'auto', textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>Note:</strong> If the coach needs to cancel this session for any reason, your payment will be automatically refunded.
              </Typography>
            </Alert>
            
            <Box sx={{ mt: 4 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCompleteCheckout}
              >
                View My Bookings
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Checkout;
