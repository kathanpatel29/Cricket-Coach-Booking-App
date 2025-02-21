import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Divider
} from '@mui/material';
import { CURRENCY } from '../../utils/constants';
import { paymentService } from '../../services/api';

const PaymentForm = ({ booking, onPaymentComplete }) => {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await paymentService.processPayment({
        bookingId: booking._id,
        amount: booking.amount,
        paymentMethod
      });

      if (response?.data?.data?.payment) {
        onPaymentComplete(response.data.data.payment);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error processing payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Payment Details
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <Typography variant="subtitle1" gutterBottom>
          Amount to Pay: {CURRENCY.format(booking.amount)}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <FormLabel component="legend">Payment Method</FormLabel>
          <RadioGroup
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <FormControlLabel 
              value="card" 
              control={<Radio />} 
              label="Credit/Debit Card" 
            />
            <FormControlLabel 
              value="interac" 
              control={<Radio />} 
              label="Interac e-Transfer" 
            />
          </RadioGroup>
        </FormControl>

        {paymentMethod === 'card' && (
          <>
            <TextField
              fullWidth
              label="Card Number"
              required
              sx={{ mb: 2 }}
            />
            <Box display="flex" gap={2} mb={2}>
              <TextField
                label="Expiry Date"
                required
                sx={{ flex: 1 }}
              />
              <TextField
                label="CVV"
                required
                sx={{ flex: 1 }}
              />
            </Box>
            <TextField
              fullWidth
              label="Cardholder Name"
              required
              sx={{ mb: 2 }}
            />
          </>
        )}

        {paymentMethod === 'interac' && (
          <Alert severity="info" sx={{ mb: 2 }}>
            You will receive instructions for Interac e-Transfer after clicking "Process Payment"
          </Alert>
        )}

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Process Payment'}
        </Button>
      </Box>
    </Paper>
  );
};

export default PaymentForm; 