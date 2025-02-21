import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import BookingList from '../../components/bookings/BookingList';
import { bookingService } from '../../services/api';
import { toast } from 'react-hot-toast';

const MyBookings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCancelBooking = async () => {
    try {
      setLoading(true);
      const response = await bookingService.cancelBooking(selectedBooking._id, {
        reason: cancelReason
      });

      if (response?.data?.status === 'success') {
        toast.success('Booking cancelled successfully');
        setCancelDialog(false);
        setSelectedBooking(null);
        setCancelReason('');
        // Refresh bookings list
        window.location.reload();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error cancelling booking');
      toast.error('Failed to cancel booking');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = (bookingId) => {
    navigate(`/user/bookings/${bookingId}/review`);
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'upcoming':
        return 'Upcoming';
      case 'completed':
        return 'Past';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'All';
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">
            My Bookings
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/user/book')}
          >
            Book New Session
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        >
          <Tab label="Upcoming" />
          <Tab label="Past" />
          <Tab label="Cancelled" />
        </Tabs>

        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <BookingList
            status={getStatusLabel(activeTab).toLowerCase()}
            onCancelBooking={setSelectedBooking}
            onReviewSubmit={handleReviewSubmit}
          />
        )}
      </Paper>

      {/* Cancel Booking Dialog */}
      <Dialog
        open={cancelDialog}
        onClose={() => setCancelDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Are you sure you want to cancel this booking? Please provide a reason:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Cancellation Reason"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            required
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Note: Cancellation policy applies. You may be charged a cancellation fee
            depending on how close to the session time you are cancelling.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog(false)}>
            Back
          </Button>
          <Button
            onClick={handleCancelBooking}
            color="error"
            variant="contained"
            disabled={!cancelReason.trim()}
          >
            Cancel Booking
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyBookings; 