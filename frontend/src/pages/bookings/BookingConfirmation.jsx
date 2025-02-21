import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Grid,
  Stack
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingService } from '../../services/api';
import { formatDateTime } from '../../utils/dateUtils';
import { CURRENCY } from '../../utils/constants';

const BookingConfirmation = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getBookingDetails(bookingId);
      if (response?.data?.data?.booking) {
        setBooking(response.data.data.booking);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching booking details');
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
    return <Alert severity="error">{error}</Alert>;
  }

  if (!booking) {
    return <Alert severity="error">Booking not found</Alert>;
  }

  return (
    <Box>
      <Paper sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
        <Box display="flex" alignItems="center" mb={3}>
          <SuccessIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
          <Typography variant="h4">
            Booking Confirmed!
          </Typography>
        </Box>

        <Alert severity="success" sx={{ mb: 4 }}>
          Your booking has been successfully confirmed. A confirmation email has been sent to your registered email address.
        </Alert>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Session Details
            </Typography>
            <Stack spacing={2}>
              <Box display="flex" alignItems="center">
                <CalendarIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Date
                  </Typography>
                  <Typography>
                    {formatDateTime(booking.date)}
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" alignItems="center">
                <TimeIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Duration
                  </Typography>
                  <Typography>
                    {booking.duration} minutes
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" alignItems="center">
                <LocationIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Location
                  </Typography>
                  <Typography>
                    {booking.location}
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Coach Details
            </Typography>
            <Box display="flex" alignItems="center" mb={2}>
              <PersonIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Coach Name
                </Typography>
                <Typography>
                  {booking.coach.name}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Payment Summary
            </Typography>
            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Session Fee</Typography>
                <Typography>{CURRENCY.format(booking.amount)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Tax</Typography>
                <Typography>{CURRENCY.format(booking.tax)}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="h6">Total Paid</Typography>
                <Typography variant="h6" color="primary">
                  {CURRENCY.format(booking.totalAmount)}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Box display="flex" justifyContent="center" gap={2} mt={4}>
          <Button
            variant="contained"
            onClick={() => navigate('/user/bookings')}
          >
            View My Bookings
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/user/book')}
          >
            Book Another Session
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default BookingConfirmation; 