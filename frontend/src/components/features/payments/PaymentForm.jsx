import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { loadStripe } from '@stripe/stripe-js';
import {
  CardElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { paymentService } from '../../../services/api';

// Make sure VITE_STRIPE_PUBLIC_KEY is defined in your .env file
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

if (!STRIPE_PUBLIC_KEY) {
  throw new Error('Stripe public key is not defined in environment variables');
}

// Initialize Stripe outside of component with error handling
let stripePromise;
try {
  stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
} catch (error) {
  console.error('Failed to initialize Stripe:', error);
}

const PaymentFormContent = ({ bookingId, amount, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    const fetchPaymentIntent = async () => {
      try {
        const response = await paymentService.createPaymentIntent(bookingId);
        setClientSecret(response.data.clientSecret);
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to initialize payment';
        setError(errorMessage);
        onError?.(errorMessage);
      }
    };

    if (bookingId) {
      fetchPaymentIntent();
    }
  }, [bookingId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      setError('Stripe has not been properly initialized');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message);
        onError?.(stripeError.message);
      } else if (paymentIntent.status === 'succeeded') {
        // Confirm payment on our backend
        await paymentService.confirmPayment(bookingId);
        onSuccess?.();
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Payment failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  if (!stripe || !elements) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Payment Details
        </Typography>
        <Typography color="textSecondary" gutterBottom>
          Amount to pay: ${amount}
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
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

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={!stripe || processing}
        sx={{ mt: 2 }}
      >
        {processing ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          `Pay $${amount}`
        )}
      </Button>
    </form>
  );
};

const PaymentForm = ({ bookingId, amount, onSuccess, onError }) => {
  if (!stripePromise) {
    return (
      <Alert severity="error">
        Failed to initialize payment system. Please try again later.
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Elements stripe={stripePromise}>
        <PaymentFormContent
          bookingId={bookingId}
          amount={amount}
          onSuccess={onSuccess}
          onError={onError}
        />
      </Elements>
    </Paper>
  );
};

export default PaymentForm; 