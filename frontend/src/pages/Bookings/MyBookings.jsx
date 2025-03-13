import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Avatar,
  Grid,
  Divider,
  Snackbar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PaymentIcon from '@mui/icons-material/Payment';
import CancelIcon from '@mui/icons-material/Cancel';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CloseIcon from '@mui/icons-material/Close';
import RateReviewIcon from '@mui/icons-material/RateReview';
import { format, isPast, parseISO, addHours, isBefore } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { getApiByRole } from '../../services/api';
import LeaveReviewDialog from '../../components/Reviews/LeaveReviewDialog';

const MyBookings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const api = getApiByRole(user?.role);
  const isCoach = user?.role === 'coach';
  
  const [activeTab, setActiveTab] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(false);
  const [completingBooking, setCompletingBooking] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Log debug information
        console.log('Fetching bookings as', user?.role, 'with ID:', user?.id);
        
        // Different endpoints for coaches and users
        const response = isCoach
          ? await api.getCoachBookings()
          : await api.getUserBookings();
        
        console.log('API Response:', response);
        console.log('Bookings response status:', response.data?.status);
        console.log('Full bookings response data:', response.data);
        
        if (response.data.status === 'success') {
          const bookingsData = response.data.data.bookings || [];
          console.log('Bookings data length:', bookingsData.length);
          console.log('Bookings data details:', bookingsData);
          setBookings(bookingsData);
          
          // Auto-complete bookings for coaches when session has started
          if (isCoach) {
            autoCompleteStartedBookings(bookingsData);
          }
        } else {
          throw new Error('Failed to fetch bookings');
        }
      } catch (err) {
        console.error('Error fetching bookings:', err);
        console.error('Error details:', err.response?.data || err.message);
        setError('Failed to load bookings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
    fetchBookings();
    } else {
      console.log('No user available to fetch bookings');
      setLoading(false);
    }
  }, [api, isCoach, user]);
  
  // Helper function to get session date and time from a booking
  const getSessionDateTime = (booking) => {
    if (!booking) {
      console.log('No booking provided to getSessionDateTime');
      return null;
    }
    
    try {
      // Check if booking has timeSlot with date and time
      if (booking.timeSlot && booking.timeSlot.date) {
        console.log(`Processing booking ${booking._id} with timeSlot:`, booking.timeSlot);
        const date = new Date(booking.timeSlot.date);
        if (booking.timeSlot.startTime) {
          const [hours, minutes] = booking.timeSlot.startTime.split(':');
          date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
          console.log(`Generated datetime for booking ${booking._id}:`, date);
          return date;
        }
        console.log(`Only date available for booking ${booking._id}, no startTime:`, date);
        return date;
      }
      
      // Fallback to startTime if available
      if (booking.startTime) {
        const date = new Date(booking.startTime);
        console.log(`Using fallback startTime for booking ${booking._id}:`, date);
        return date;
      }
      
      console.log(`No valid date/time found for booking ${booking._id}`);
      return null;
    } catch (error) {
      console.error(`Error processing date/time for booking ${booking._id}:`, error);
      return null;
    }
  };
  
  // Helper function to check if a session is past with a 4-hour buffer
  const isSessionPast = (sessionTime) => {
    if (!sessionTime) return false;
    
    // Add 4 hours buffer to the current time
    const bufferTime = addHours(new Date(), -4);
    
    // Session is only considered past if it's before the buffer time
    return isBefore(sessionTime, bufferTime);
  };
  
  // Filter bookings based on active tab
  useEffect(() => {
    if (!bookings.length) {
      setFilteredBookings([]);
      console.log('No bookings to filter');
      return;
    }
    
    const now = new Date();
    console.log('Total bookings before filtering:', bookings.length);
    
    switch (activeTab) {
      case 0: // Upcoming
        const upcomingBookings = bookings.filter(booking => {
          const sessionTime = getSessionDateTime(booking);
          const result = sessionTime && 
                 !isSessionPast(sessionTime) && 
                 booking.status !== 'cancelled' &&
                 booking.status !== 'rejected';
          if (sessionTime) {
            console.log(`Booking ${booking._id}: date=${sessionTime}, isSessionPast=${isSessionPast(sessionTime)}, status=${booking.status}, isUpcoming=${result}`);
          } else {
            console.log(`Booking ${booking._id}: No valid session time found, timeSlot=`, booking.timeSlot);
          }
          return result;
        });
        console.log('Upcoming bookings after filtering:', upcomingBookings.length);
        setFilteredBookings(upcomingBookings);
        break;
      
      case 1: // Past
        const pastBookings = bookings.filter(booking => {
          const sessionTime = getSessionDateTime(booking);
          return sessionTime && 
                 isSessionPast(sessionTime) && 
                 booking.status !== 'cancelled' &&
                 booking.status !== 'rejected';
        });
        console.log('Past bookings after filtering:', pastBookings.length);
        setFilteredBookings(pastBookings);
        break;
      
      case 2: // Cancelled
        const cancelledBookings = bookings.filter(booking => 
          booking.status === 'cancelled' || booking.status === 'rejected'
        );
        console.log('Cancelled bookings after filtering:', cancelledBookings.length);
        setFilteredBookings(cancelledBookings);
        break;
      
      default:
        setFilteredBookings(bookings);
    }
  }, [activeTab, bookings]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  };
  
  // Format time for display
  const formatTime = (timeString) => {
    try {
      if (!timeString) return 'N/A';
      // Handle time format like "13:30"
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      return format(date, 'h:mm a');
    } catch (error) {
      console.error('Time formatting error:', error);
      return 'Invalid time';
    }
  };
  
  // Get formatted session date from booking
  const getSessionDate = (booking) => {
    if (booking.timeSlot && booking.timeSlot.date) {
      return formatDate(booking.timeSlot.date);
    }
    return 'N/A';
  };
  
  // Get formatted session time from booking
  const getSessionTime = (booking) => {
    if (booking.timeSlot) {
      return `${formatTime(booking.timeSlot.startTime)} - ${formatTime(booking.timeSlot.endTime)}`;
    }
    return 'N/A';
  };
  
  // Get session duration from booking
  const getSessionDuration = (booking) => {
    if (booking.timeSlot && booking.timeSlot.duration) {
      return `${booking.timeSlot.duration} min`;
    }
    return 'N/A';
  };
  
  // Handle opening cancel dialog
  const handleOpenCancelDialog = (booking) => {
    setSelectedBooking(booking);
    setCancelDialogOpen(true);
  };
  
  // Handle closing cancel dialog
  const handleCloseCancelDialog = () => {
    setCancelDialogOpen(false);
    setSelectedBooking(null);
  };
  
  // Handle booking cancellation
  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    
    try {
      setCancellingBooking(true);
      
      await api.cancelBooking(selectedBooking._id);
      
      // Update local state
      setBookings(bookings.map(booking => 
        booking._id === selectedBooking._id
          ? { ...booking, status: 'cancelled' }
          : booking
      ));
      
      setCancelDialogOpen(false);
      setSelectedBooking(null);
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setError('Failed to cancel booking. Please try again.');
    } finally {
      setCancellingBooking(false);
    }
  };
  
  // Navigate to checkout
  const handleProceedToCheckout = (bookingId) => {
    navigate(`/bookings/${bookingId}/payment`);
  };
  
  // Helper function to render status chip
  const getStatusChip = (status) => {
    let color = 'default';
    let label = status || 'Unknown';
    
    switch (status?.toLowerCase()) {
      case 'pending_approval':
        color = 'warning';
        label = 'Pending Approval';
        break;
      case 'approved':
        color = 'info';
        label = 'Approved - Payment Required';
        break;
      case 'pending':
        color = 'warning';
        label = 'Pending';
        break;
      case 'confirmed':
        color = 'success';
        label = 'Confirmed';
        break;
      case 'completed':
        color = 'success';
        label = 'Completed';
        break;
      case 'cancelled':
        color = 'error';
        label = 'Cancelled';
        break;
      case 'rejected':
        color = 'error';
        label = 'Rejected';
        break;
      case 'no-show':
        color = 'error';
        label = 'No Show';
        break;
      default:
        color = 'default';
    }
    
    return <Chip size="small" color={color} label={label.toUpperCase()} />;
  };
  
  // Handle booking completion
  const handleCompleteBooking = async (bookingId) => {
    try {
      setCompletingBooking(true);
      
      const response = await api.completeBooking(bookingId);
      
      if (response.data.status === 'success') {
        // Update local state
        setBookings(bookings.map(booking => 
          booking._id === bookingId
            ? { ...booking, status: 'completed' }
            : booking
        ));
        
        // Show notification
        setNotification({
          open: true,
          message: 'Booking marked as completed successfully',
          severity: 'success'
        });
      }
    } catch (err) {
      console.error('Error completing booking:', err);
      setNotification({
        open: true,
        message: err.response?.data?.message || 'Failed to complete booking',
        severity: 'error'
      });
    } finally {
      setCompletingBooking(false);
    }
  };
  
  // Handle notification close
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };
  
  // Function to auto-complete bookings when session has started
  const autoCompleteStartedBookings = async (bookingsData) => {
    const now = new Date();
    const bookingsToComplete = [];
    
    // Find confirmed bookings that have started and are not yet completed
    bookingsData.forEach(booking => {
      if (booking.status === 'confirmed' && 
          booking.paymentStatus === 'paid' && 
          booking.status !== 'completed') {
        
        const sessionTime = getSessionDateTime(booking);
        if (sessionTime && sessionTime <= now) {
          console.log(`Auto-completing booking ${booking._id}, session time: ${sessionTime}, current time: ${now}`);
          bookingsToComplete.push(booking._id);
        }
      }
    });
    
    // If we found bookings to auto-complete
    if (bookingsToComplete.length > 0) {
      console.log(`Auto-completing ${bookingsToComplete.length} bookings`);
      
      // Complete each booking sequentially
      const completedBookings = [];
      
      for (const bookingId of bookingsToComplete) {
        try {
          const response = await api.completeBooking(bookingId);
          if (response.data.status === 'success') {
            completedBookings.push(bookingId);
          }
        } catch (error) {
          console.error(`Failed to auto-complete booking ${bookingId}:`, error);
        }
      }
      
      // Update local state if any bookings were completed
      if (completedBookings.length > 0) {
        setBookings(prev => prev.map(booking => 
          completedBookings.includes(booking._id)
            ? { ...booking, status: 'completed' }
            : booking
        ));
        
        setNotification({
          open: true,
          message: `${completedBookings.length} booking(s) were automatically marked as completed`,
          severity: 'info'
        });
      }
    }
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  
  // Handle opening the review dialog
  const handleOpenReviewDialog = (booking) => {
    setSelectedBookingForReview(booking);
    setReviewDialogOpen(true);
  };
  
  // Handle closing the review dialog
  const handleCloseReviewDialog = () => {
    setReviewDialogOpen(false);
    setSelectedBookingForReview(null);
  };
  
  // Handle review submission
  const handleReviewSubmitted = (review) => {
    // Show success message
    setSnackbarMessage('Review submitted successfully!');
    setSnackbarOpen(true);
    
    // Update local state to mark booking as reviewed
    setBookings(bookings.map(booking => 
      booking._id === selectedBookingForReview._id
        ? { ...booking, reviewed: true }
        : booking
    ));
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isCoach ? 'My Sessions' : 'My Bookings'}
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="booking tabs">
            <Tab label="Upcoming" />
            <Tab label="Past" />
            <Tab label="Cancelled" />
          </Tabs>
        </Box>
        
        {filteredBookings.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No {activeTab === 0 ? 'upcoming' : activeTab === 1 ? 'past' : 'cancelled'} {isCoach ? 'sessions' : 'bookings'} found.
            </Typography>
            
            {activeTab === 0 && !isCoach && (
              <Button
                variant="contained"
                sx={{ mt: 2 }}
                onClick={() => navigate('/coaches')}
              >
                Find a Coach
              </Button>
            )}
            
            {bookings.length === 0 && (
              <>
                <Alert severity="info" sx={{ mt: 3, maxWidth: 600, mx: 'auto' }}>
                  <Typography variant="body2">
                    {isCoach 
                      ? "You don't have any bookings yet. When clients book sessions with you, they will appear here."
                      : "You don't have any bookings yet. Find a coach and book a session to get started."
                    }
                  </Typography>
                </Alert>
                
                {!isCoach && (
                  <Button
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/coaches')}
                  >
                    Find a Coach
                  </Button>
                )}
              </>
            )}
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{isCoach ? 'Student' : 'Coach'}</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBookings.map((booking) => {
                  const isPending = booking.status === 'pending';
                  const isPaid = booking.paymentStatus === 'paid';
                  
                  // Determine if the booking is upcoming based on the time slot
                  const sessionTime = getSessionDateTime(booking);
                  const isUpcoming = sessionTime && !isSessionPast(sessionTime);
                  
                  const canCancel = isUpcoming && 
                                   (booking.status !== 'cancelled' && 
                                    booking.status !== 'rejected' && 
                                    booking.status !== 'completed');
                  
                  // Get payment status
                  const isApproved = booking.status === 'approved';
                  const isPendingApproval = booking.status === 'pending_approval';
                  const isAwaitingPayment = booking.paymentStatus === 'awaiting_payment';
                  
                  // Determine if payment action is needed
                  const needsPayment = isUpcoming && 
                                       booking.status === 'approved' && 
                                       booking.paymentStatus === 'awaiting_payment' && 
                                       !isCoach;
                  
                  // Get the name of the other party (coach for user, student for coach)
                  const otherPartyName = isCoach
                    ? (booking.user?.name || 'Unknown Student')
                    : (booking.coach?.user?.name || 'Unknown Coach');
                  
                  return (
                    <TableRow key={booking._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                            {otherPartyName.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body2">{otherPartyName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{getSessionDate(booking)}</TableCell>
                      <TableCell>{getSessionTime(booking)}</TableCell>
                      <TableCell>{getSessionDuration(booking)}</TableCell>
                      <TableCell>{getStatusChip(booking.status)}</TableCell>
                      <TableCell>
                        <Chip 
                          size="small"
                          color={booking.paymentStatus === 'paid' ? 'success' : 
                                 booking.paymentStatus === 'awaiting_payment' ? 'warning' : 'default'} 
                          label={booking.paymentStatus?.toUpperCase() || 'PENDING'} 
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {needsPayment && (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<PaymentIcon />}
                              onClick={() => handleProceedToCheckout(booking._id)}
                            >
                              Pay Now
                            </Button>
                          )}
                          
                          {canCancel && !isCoach && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<CancelIcon />}
                              onClick={() => handleOpenCancelDialog(booking)}
                            >
                              Cancel
                            </Button>
                          )}
                          
                          {isCoach && isPendingApproval && (
                            <>
                              <Button
                                size="small"
                                variant="outlined"
                                color="success"
                                onClick={() => api.approveBooking(booking._id).then(() => {
                                  // Update local state
                                  setBookings(bookings.map(b => 
                                    b._id === booking._id
                                      ? { ...b, status: 'approved', paymentStatus: 'awaiting_payment' }
                                      : b
                                  ));
                                })}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => handleOpenCancelDialog(booking)}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          
                          {/* Add Mark Complete button for coaches */}
                          {isCoach && 
                           isUpcoming && 
                           booking.status === 'confirmed' && 
                           booking.paymentStatus === 'paid' && 
                           booking.status !== 'completed' && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              onClick={() => handleCompleteBooking(booking._id)}
                              disabled={completingBooking}
                            >
                              {completingBooking ? 'Processing...' : 'Mark Complete'}
                            </Button>
                          )}
                          
                          {/* Add Review button for completed bookings */}
                          {!isCoach && 
                           booking.status === 'completed' && 
                           booking.paymentStatus === 'paid' && 
                           !booking.reviewed && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              startIcon={<RateReviewIcon />}
                              onClick={() => handleOpenReviewDialog(booking)}
                            >
                              Leave Review
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      
      {/* Cancellation Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={handleCloseCancelDialog}
        aria-labelledby="cancel-dialog-title"
      >
        <DialogTitle id="cancel-dialog-title">
          Cancel Booking
          <IconButton
            aria-label="close"
            onClick={handleCloseCancelDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedBooking && (
            <Box>
              <Typography variant="body1" paragraph>
                Are you sure you want to cancel your booking with {selectedBooking.coach?.user?.name || 'this coach'}?
              </Typography>
              
              <Box sx={{ my: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EventIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                        Date: {getSessionDate(selectedBooking)}
                  </Typography>
                    </Box>
                </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccessTimeIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                        Time: {getSessionTime(selectedBooking)}
                  </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
              
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Please note that cancellations may be subject to our cancellation policy. 
                  Refunds will be processed according to the policy.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelDialog}>
            Keep Booking
          </Button>
          <Button
            onClick={handleCancelBooking}
            color="error" 
            variant="contained"
            disabled={cancellingBooking}
          >
            {cancellingBooking ? 'Cancelling...' : 'Confirm Cancellation'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionProps={{ 
          onEnter: undefined,
          onEntered: undefined,
          onEntering: undefined,
          onExit: undefined,
          onExited: undefined,
          onExiting: undefined
        }}
      >
        <Alert 
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: '100%' }}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
      
      {/* Review Dialog */}
      <LeaveReviewDialog
        open={reviewDialogOpen}
        onClose={handleCloseReviewDialog}
        onReviewSubmitted={handleReviewSubmitted}
        booking={selectedBookingForReview}
      />
      
      {/* Snackbar for review submission */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionProps={{ 
          onEnter: undefined,
          onEntered: undefined,
          onEntering: undefined,
          onExit: undefined,
          onExited: undefined,
          onExiting: undefined
        }}
      >
        <Alert 
          onClose={handleSnackbarClose}
          severity="success"
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MyBookings;
