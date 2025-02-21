import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { bookingService } from '../../services/api';

const BookingForm = ({ coachId, selectedSlot, onBookingComplete }) => {
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedSlot) {
      setError('Please select a time slot first');
      return;
    }

    try {
      setLoading(true);
      const response = await bookingService.create({
        coachId,
        date: selectedSlot.date,
        time: selectedSlot.time,
        duration,
        notes
      });

      if (response?.data?.data?.booking) {
        if (onBookingComplete) {
          onBookingComplete(response.data.data.booking);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Booking Details
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Duration</InputLabel>
          <Select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            label="Duration"
          >
            <MenuItem value={60}>1 hour</MenuItem>
            <MenuItem value={90}>1.5 hours</MenuItem>
            <MenuItem value={120}>2 hours</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Additional Notes"
          multiline
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading || !selectedSlot}
        >
          {loading ? <CircularProgress size={24} /> : 'Proceed to Payment'}
        </Button>
      </form>
    </Paper>
  );
};

export default BookingForm; 