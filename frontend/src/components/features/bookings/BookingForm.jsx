import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { loadStripe } from '@stripe/stripe-js';
import {
  CardElement,
  Elements,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { bookingService } from '../../../services/api';

// Move this outside the component
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Separate the form component
const CheckoutForm = ({ coachId, selectedDate, selectedSlot, amount, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      setError('Stripe has not been initialized');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create booking
      const bookingResponse = await bookingService.create({
        coachId,
        date: selectedDate,
        timeSlot: selectedSlot,
        amount: Number(amount)
      });

      if (!bookingResponse.data?.data?.booking?._id) {
        throw new Error('Failed to create booking');
      }

      const bookingId = bookingResponse.data.data.booking._id;

      // Create payment intent
      const paymentIntentResponse = await bookingService.createPaymentIntent(bookingId);
      
      if (!paymentIntentResponse.data?.data?.clientSecret) {
        throw new Error('Failed to initialize payment');
      }

      // Process payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        paymentIntentResponse.data.data.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
          },
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        await bookingService.confirmPayment(bookingId);
        onSuccess();
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Card Details
        </Typography>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </Box>

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={!stripe || loading}
        sx={{ mt: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : `Pay $${amount}`}
      </Button>
    </form>
  );
};

// Main component
const BookingForm = (props) => {
  // Verify stripe is initialized
  useEffect(() => {
    if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
      console.error('Stripe publishable key is missing');
    }
  }, []);

  return (
    <Elements stripe={stripePromise}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Complete Your Booking
          </Typography>
          <CheckoutForm {...props} />
        </CardContent>
      </Card>
    </Elements>
  );
};

export default BookingForm; 