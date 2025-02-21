import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider
} from '@mui/material';
import { formatDateTime } from '../../utils/dateUtils';

const BookingDetails = ({ booking, open, onClose, userRole = 'user' }) => {
  if (!booking) return null;

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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Booking Details</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Status: 
            <Chip 
              label={booking.status}
              color={getStatusColor(booking.status)}
              size="small"
              sx={{ ml: 1 }}
            />
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1">Session Information</Typography>
          <Typography>Date & Time: {formatDateTime(booking.date)}</Typography>
          <Typography>Duration: {booking.duration} minutes</Typography>
          <Typography>Amount: ${booking.amount}</Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1">
            {userRole === 'coach' ? 'User' : 'Coach'} Information
          </Typography>
          <Typography>
            Name: {userRole === 'coach' ? booking.user.name : booking.coach.name}
          </Typography>
          <Typography>
            Email: {userRole === 'coach' ? booking.user.email : booking.coach.email}
          </Typography>

          {booking.notes && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1">Additional Notes</Typography>
              <Typography>{booking.notes}</Typography>
            </>
          )}

          {booking.cancellationReason && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" color="error">
                Cancellation Reason
              </Typography>
              <Typography>{booking.cancellationReason}</Typography>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookingDetails; 