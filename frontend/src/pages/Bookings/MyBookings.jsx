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
import { getApiByRole, adminApi } from '../../services/api';
import LeaveReviewDialog from '../../components/Reviews/LeaveReviewDialog';

const MyBookings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const api = getApiByRole(user?.role);
  const isCoach = user?.role === 'coach';
  const isAdmin = user?.role === 'admin';
  
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
  const [totalBookings, setTotalBookings] = useState(0);
  
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Log debug information
        console.log('Fetching bookings as', user?.role, 'with ID:', user?.id);
        
        let response;
        // Different endpoints based on user role
        if (isCoach) {
          response = await api.getCoachBookings();
        } else if (user?.role === 'admin') {
          // Use the correct admin API function with no parameters to get ALL bookings
          console.log('Admin: Fetching ALL bookings with no filters');
          response = await adminApi.getAllBookings();
        } else {
          // Regular user
          response = await api.getUserBookings();
        }
        
        console.log('API Response:', response);
        console.log('Bookings response status:', response.data?.status);
        console.log('Full bookings response data:', response.data);
        
        if (response.data.status === 'success') {
          const bookingsData = response.data.data.bookings || [];
          console.log('Bookings data length:', bookingsData.length);
          
          // Set total bookings count for admins
          if (isAdmin) {
            setTotalBookings(bookingsData.length);
          }
          
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
  }, [api, isCoach, isAdmin, user]);
  
  // Helper function to get session date and time from a booking
  const getSessionDateTime = (booking) => {
    if (!booking) {
      console.log('No booking provided to getSessionDateTime');
      return null;
    }
    
    try {
      // Admin data structure - check for specific fields
      if (isAdmin) {
        // Check for bookingDate (direct property)
        if (booking.bookingDate) {
          const date = new Date(booking.bookingDate);
          if (booking.startTime) {
            const [hours, minutes] = booking.startTime.split(':');
            date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
            return date;
          }
          return date;
        }
        
        // Check for timeSlotData (expanded data)
        if (booking.timeSlotData && booking.timeSlotData.date) {
          const date = new Date(booking.timeSlotData.date);
          if (booking.timeSlotData.startTime) {
            const [hours, minutes] = booking.timeSlotData.startTime.split(':');
            date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
            return date;
          }
          return date;
        }
      }
      
      // Standard structure - check if booking has timeSlot with date and time
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
      
      // Fallback to direct date property
      if (booking.date) {
        const date = new Date(booking.date);
        if (booking.startTime) {
          const [hours, minutes] = booking.startTime.split(':');
          date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
          return date;
        }
        return date;
      }
      
      // Fallback to startTime if available
      if (booking.startTime && booking.startTime instanceof Date) {
        return booking.startTime;
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
  
  // Filter bookings based on active tab - special handling for admin
  useEffect(() => {
    if (!bookings.length) {
      setFilteredBookings([]);
      console.log('No bookings to filter');
      return;
    }
    
    // For admin users, create a comprehensive view of all bookings with minimal filtering
    if (isAdmin) {
      console.log('Admin view - using minimal filtering to show all bookings');
      
      // Admin needs to see all bookings with minimal filtering
      switch (activeTab) {
        case 0: // Upcoming tab - show everything except cancelled/rejected
          const upcomingBookings = bookings.filter(booking => 
            booking.status !== 'cancelled' && booking.status !== 'rejected' && !isSessionPast(getSessionDateTime(booking))
          );
          console.log('Admin upcoming bookings:', upcomingBookings.length);
          setFilteredBookings(upcomingBookings);
          break;
        
        case 1: // Past tab - show everything that's in the past
          const pastBookings = bookings.filter(booking => 
            isSessionPast(getSessionDateTime(booking)) && 
            booking.status !== 'cancelled' && booking.status !== 'rejected'
          );
          console.log('Admin past bookings:', pastBookings.length);
          setFilteredBookings(pastBookings);
          break;
        
        case 2: // Cancelled tab 
          const cancelledBookings = bookings.filter(booking => 
            booking.status === 'cancelled' || booking.status === 'rejected'
          );
          console.log('Admin cancelled bookings:', cancelledBookings.length);
          setFilteredBookings(cancelledBookings);
          break;
        
        case 3: // ALL tab (admin only) - show everything with no filtering
          console.log('Admin showing ALL bookings without filtering:', bookings.length);
          setFilteredBookings(bookings);
          break;
        
        default:
          setFilteredBookings(bookings);
      }
      return;
    }
    
    // Standard filtering for non-admin users
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
  }, [activeTab, bookings, isAdmin]);
  
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
    // For admin view, handle expanded data structure - bookingDate is directly in booking object
    if (isAdmin && booking.bookingDate) {
      return formatDate(booking.bookingDate);
    }
    
    // For admin view with different structure - check timeSlot ID
    if (isAdmin && booking.timeSlotId && booking.timeSlotData) {
      return formatDate(booking.timeSlotData.date);
    }
    
    // Standard structure
    if (booking.timeSlot && booking.timeSlot.date) {
      return formatDate(booking.timeSlot.date);
    }
    
    // Fallback to direct date field
    if (booking.date) {
      return formatDate(booking.date);
    }
    
    return 'N/A';
  };
  
  // Get formatted session time from booking
  const getSessionTime = (booking) => {
    // For admin view, look for startTime/endTime at top level
    if (isAdmin) {
      if (booking.startTime && booking.endTime) {
        return `${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}`;
      }
      
      // Check timeSlotData for admin expanded view
      if (booking.timeSlotData) {
        return `${formatTime(booking.timeSlotData.startTime)} - ${formatTime(booking.timeSlotData.endTime)}`;
      }
    }
    
    // Standard structure
    if (booking.timeSlot) {
      return `${formatTime(booking.timeSlot.startTime)} - ${formatTime(booking.timeSlot.endTime)}`;
    }
    
    return 'N/A';
  };
  
  // Get session duration from booking
  const getSessionDuration = (booking) => {
    // For admin view, check for direct duration property
    if (isAdmin) {
      if (booking.duration) {
        return `${booking.duration} min`;
      }
      
      // Check timeSlotData for admin expanded view
      if (booking.timeSlotData && booking.timeSlotData.duration) {
        return `${booking.timeSlotData.duration} min`;
      }
    }
    
    // Standard structure
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
  
  // Add this function for status chip color mapping
  const getChipColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'completed':
        return 'primary';
      case 'pending_approval':
      case 'approved':
        return 'info';
      case 'cancelled':
      case 'rejected':
        return 'error';
      case 'no-show':
        return 'secondary';
      default:
        return 'default';
    }
  };
  
  // Add this function for payment status chip color mapping
  const getPaymentChipColor = (paymentStatus) => {
    switch (paymentStatus) {
      case 'paid':
        return 'success';
      case 'awaiting_payment':
        return 'warning';
      case 'refunded':
        return 'info';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
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
  
  // Add detailed booking structure logging for admin users
  useEffect(() => {
    if (isAdmin && bookings.length > 0) {
      // Log the structure of the first booking to debug
      console.log('Admin bookings - first booking structure:', JSON.stringify(bookings[0], null, 2));
      console.log('Coach property:', bookings[0].coach);
      console.log('TimeSlot property:', bookings[0].timeSlot);
      
      // Check if necessary properties exist
      if (!bookings[0].coach) {
        console.error('MISSING COACH property in admin booking data');
      }
      
      if (!bookings[0].timeSlot) {
        console.error('MISSING TIMESLOT property in admin booking data');
      }
    }
  }, [bookings, isAdmin]);
  
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {isCoach ? 'My Sessions' : isAdmin ? 'All Bookings' : 'My Bookings'}
          </Typography>
          
          {isAdmin && (
            <Chip 
              label={`Total: ${totalBookings}`} 
              color="primary" 
              size="medium"
              sx={{ fontWeight: 'bold' }}
            />
          )}
        </Box>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="booking tabs">
            <Tab label="Upcoming" />
            <Tab label="Past" />
            <Tab label="Cancelled" />
            {isAdmin && <Tab label="All" />}
          </Tabs>
        </Box>
        
        {filteredBookings.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              {isAdmin 
                ? `No ${activeTab === 0 ? 'upcoming' : activeTab === 1 ? 'past' : activeTab === 2 ? 'cancelled' : ''} bookings found in the system.`
                : `No ${activeTab === 0 ? 'upcoming' : activeTab === 1 ? 'past' : 'cancelled'} ${isCoach ? 'sessions' : 'bookings'} found.`
              }
            </Typography>
            
            {activeTab === 0 && !isCoach && !isAdmin && (
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
                    {isAdmin
                      ? "There are no bookings in the system yet."
                      : isCoach 
                        ? "You don't have any bookings yet. When clients book sessions with you, they will appear here."
                        : "You don't have any bookings yet. Find a coach and book a session to get started."
                    }
                  </Typography>
                </Alert>
                
                {!isCoach && !isAdmin && (
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
                  <TableCell>{isCoach ? 'Student' : isAdmin ? 'User / Coach' : 'Coach'}</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payment</TableCell>
                  {!isAdmin && <TableCell>Actions</TableCell>}
                  {/* {isAdmin && <TableCell>Debug</TableCell>} */}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBookings.map((booking) => {
                  // Calculate the other party name based on user role
                  let otherPartyName = '';
                  
                  if (isAdmin) {
                    // For admin, show both user and coach
                    otherPartyName = `${booking.userName || 'Unknown User'} / ${booking.coachName || 'Unknown Coach'}`;
                  } else if (isCoach) {
                    // For coach, show the student/user
                    otherPartyName = booking.user?.name || booking.userName || 'Unknown Student';
                  } else {
                    // For regular user, show the coach
                    otherPartyName = booking.coach?.user?.name || booking.coachName || 'Unknown Coach';
                  }
                  
                  // Get session date and time
                  const sessionDate = getSessionDate(booking);
                  const sessionTime = getSessionTime(booking);
                  const sessionDuration = getSessionDuration(booking);
                  
                  // Determine action buttons visibility
                  const sessionDateTime = getSessionDateTime(booking);
                  const isUpcoming = sessionDateTime && !isSessionPast(sessionDateTime);
                  const canCancel = isUpcoming && 
                                    (booking.status !== 'cancelled' && 
                                     booking.status !== 'rejected' && 
                                     booking.status !== 'completed');
                  const isPendingApproval = booking.status === 'pending_approval';
                  const needsPayment = isUpcoming && 
                                       booking.status === 'approved' && 
                                       booking.paymentStatus === 'awaiting_payment' && 
                                       !isCoach;

                  return (
                    <TableRow key={booking._id}>
                      <TableCell>{otherPartyName}</TableCell>
                      <TableCell>{sessionDate}</TableCell>
                      <TableCell>{sessionTime}</TableCell>
                      <TableCell>{sessionDuration ? `${sessionDuration} minutes` : 'N/A'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={booking.status} 
                          color={getChipColor(booking.status)} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={booking.paymentStatus} 
                          color={getPaymentChipColor(booking.paymentStatus)} 
                          size="small" 
                        />
                      </TableCell>
                      {!isAdmin && (
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
                      )}
                      {isAdmin && (
                        <TableCell>
                          <Button 
                            size="small" 
                            variant="outlined" 
                            color="info"
                            onClick={() => {
                              // console.log('Booking Debug Info:', JSON.stringify(booking, null, 2));
                              console.log('Raw booking object:', booking);
                              
                              // Check specific properties
                              console.log('coach:', booking.coach);
                              console.log('user:', booking.user);
                              console.log('timeSlot:', booking.timeSlot);
                              console.log('timeSlotData:', booking.timeSlotData);
                              console.log('bookingDate:', booking.bookingDate);
                              console.log('date:', booking.date);
                              console.log('startTime:', booking.startTime);
                              console.log('endTime:', booking.endTime);
                            }}
                          >
                            {/* Debug */}
                          </Button>
                        </TableCell>
                      )}
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
