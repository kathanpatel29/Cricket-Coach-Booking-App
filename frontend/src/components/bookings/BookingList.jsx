import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { bookingService } from '../../services/api';
import { formatDateTime } from '../../utils/dateUtils';
import BookingDetails from './BookingDetails';

const BookingList = ({ userRole = 'user' }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await (userRole === 'coach' 
        ? bookingService.getCoachBookings()
        : bookingService.getUserBookings());
      
      if (response?.data?.data?.bookings) {
        setBookings(response.data.data.bookings);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await bookingService.cancelBooking(bookingId);
      fetchBookings();
    } catch (err) {
      setError(err.response?.data?.message || 'Error cancelling booking');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date & Time</TableCell>
              <TableCell>{userRole === 'coach' ? 'User' : 'Coach'}</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking._id}>
                <TableCell>{formatDateTime(booking.date)}</TableCell>
                <TableCell>
                  {userRole === 'coach' ? booking.user.name : booking.coach.name}
                </TableCell>
                <TableCell>{booking.duration} minutes</TableCell>
                <TableCell>
                  <Chip 
                    label={booking.status}
                    color={getStatusColor(booking.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>${booking.amount}</TableCell>
                <TableCell>
                  <IconButton 
                    onClick={() => {
                      setSelectedBooking(booking);
                      setDetailsOpen(true);
                    }}
                    size="small"
                  >
                    <ViewIcon />
                  </IconButton>
                  {booking.status === 'pending' && (
                    <IconButton
                      onClick={() => handleCancelBooking(booking._id)}
                      size="small"
                      color="error"
                    >
                      <CancelIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <BookingDetails
        booking={selectedBooking}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        userRole={userRole}
      />
    </Box>
  );
};

export default BookingList; 