import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Grid, 
  Divider, 
  Card, 
  CardContent, 
  CardActions,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
  Chip,
  Stack
} from '@mui/material';
import { format } from 'date-fns';
import { coachApi } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const CoachBookingRequests = () => {
  const { user } = useAuth();
  const [bookingRequests, setBookingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState({ show: false, message: '', isError: false });

  useEffect(() => {
    fetchBookingRequests();
  }, []);

  // Fetch booking requests that are in pending_approval state
  const fetchBookingRequests = async () => {
    try {
      setLoading(true);
      const response = await coachApi.getCoachBookings();
      
      // Extract pending booking requests
      if (response.data && response.data.status === 'success' && 
          response.data.data && Array.isArray(response.data.data.bookings)) {
        const pendingRequests = response.data.data.bookings.filter(booking => 
          booking.status === 'pending_approval'
        );
        
        setBookingRequests(pendingRequests);
      } else {
        console.error('Unexpected response format:', response.data);
        setError('The server returned an unexpected response format.');
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching booking requests:', err);
      setError('Failed to load booking requests. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle approving a booking request
  const handleApprove = async (bookingId) => {
    setProcessingAction(true);
    try {
      const response = await coachApi.approveBooking(bookingId);
      
      // Update the local state to remove the approved booking
      setBookingRequests(prevRequests => 
        prevRequests.filter(booking => booking._id !== bookingId)
      );
      
      // Show success message
      setActionSuccess({
        show: true,
        message: 'Booking request approved successfully! The user will be notified to proceed with payment.',
        isError: false
      });
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setActionSuccess({ show: false, message: '', isError: false });
      }, 5000);
      
    } catch (err) {
      console.error('Error approving booking:', err);
      setActionSuccess({
        show: true,
        message: `Failed to approve booking: ${err.response?.data?.message || 'Unknown error'}`,
        isError: true
      });
    } finally {
      setProcessingAction(false);
    }
  };

  // Open rejection dialog
  const openRejectDialog = (booking) => {
    setSelectedBooking(booking);
    setRejectionReason('');
    setOpenDialog(true);
  };

  // Handle rejecting a booking request
  const handleReject = async () => {
    if (!selectedBooking) return;
    
    setProcessingAction(true);
    try {
      const response = await coachApi.rejectBooking(selectedBooking._id, {
        reason: rejectionReason || 'Request declined by coach.'
      });
      
      // Update the local state to remove the rejected booking
      setBookingRequests(prevRequests => 
        prevRequests.filter(booking => booking._id !== selectedBooking._id)
      );
      
      // Show success message
      setActionSuccess({
        show: true,
        message: 'Booking request rejected. The user has been notified.',
        isError: false
      });
      
      // Close dialog
      setOpenDialog(false);
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setActionSuccess({ show: false, message: '', isError: false });
      }, 5000);
      
    } catch (err) {
      console.error('Error rejecting booking:', err);
      setActionSuccess({
        show: true,
        message: `Failed to reject booking: ${err.response?.data?.message || 'Unknown error'}`,
        isError: true
      });
    } finally {
      setProcessingAction(false);
      setOpenDialog(false);
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
    
    // Convert 24h format to 12h format
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const period = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12; // Convert 0 to 12
      return `${hour12}:${minutes} ${period}`;
    } catch (error) {
      return timeString;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Booking Requests
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Review and manage booking requests from students. Approved requests will require payment from the student to be confirmed.
        </Typography>
        
        {actionSuccess.show && (
          <Alert 
            severity={actionSuccess.isError ? "error" : "success"} 
            sx={{ mb: 3 }}
          >
            {actionSuccess.message}
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {bookingRequests.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No pending booking requests at this time.
            </Typography>
            <Button 
              variant="contained" 
              onClick={fetchBookingRequests} 
              sx={{ mt: 2 }}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {bookingRequests.map((booking) => (
              <Grid item xs={12} key={booking._id}>
                <Card>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="h6">
                          Session with {booking.user?.name || 'Student'}
                        </Typography>
                        
                        <Typography variant="body1" color="text.secondary">
                          {booking.timeSlot ? (
                            <>
                              {formatDate(booking.timeSlot.date)} at {formatTime(booking.timeSlot.startTime)} - {formatTime(booking.timeSlot.endTime)}
                            </>
                          ) : (
                            'Time not specified'
                          )}
                        </Typography>
                        
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Payment Amount: CAD ${booking.paymentAmount?.toFixed(2) || '0.00'}
                        </Typography>
                        
                        {booking.notes && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Notes: {booking.notes}
                          </Typography>
                        )}
                        
                        <Box sx={{ mt: 2 }}>
                          <Chip 
                            label="Pending Approval" 
                            color="warning" 
                            size="small"
                          />
                        </Box>
                      </Box>
                      
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary">
                          Requested on {format(new Date(booking.createdAt), 'MMM d, yyyy')}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end' }}>
                    <Button 
                      size="small" 
                      color="error" 
                      onClick={() => openRejectDialog(booking)}
                      disabled={processingAction}
                    >
                      Reject
                    </Button>
                    <Button 
                      size="small" 
                      variant="contained" 
                      color="primary"
                      onClick={() => handleApprove(booking._id)}
                      disabled={processingAction}
                    >
                      Approve
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
      
      {/* Rejection Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Reject Booking Request</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please provide a reason for rejecting this booking request. This reason will be shared with the student.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for rejection"
            fullWidth
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={processingAction}>
            Cancel
          </Button>
          <Button 
            onClick={handleReject} 
            color="error" 
            disabled={processingAction}
          >
            {processingAction ? 'Processing...' : 'Reject Booking'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CoachBookingRequests; 