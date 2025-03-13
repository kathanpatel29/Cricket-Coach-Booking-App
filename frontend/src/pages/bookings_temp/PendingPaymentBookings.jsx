import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Chip,
  Grid,
  Card,
  CardContent,
  Avatar,
  CardActions
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PaymentIcon from '@mui/icons-material/Payment';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { getApiByRole } from '../../services/api';

const PendingPaymentBookings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const api = getApiByRole(user?.role);
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchPendingPaymentBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get bookings where payment is awaiting
        const response = await api.getUserBookings();
        
        if (response.data.status === 'success') {
          // Filter bookings with awaiting_payment status
          const pendingPaymentBookings = response.data.data.bookings.filter(
            booking => booking.status === 'approved' && booking.paymentStatus === 'awaiting_payment'
          );
          
          setBookings(pendingPaymentBookings);
        } else {
          throw new Error('Failed to fetch bookings');
        }
      } catch (err) {
        console.error('Error fetching pending payment bookings:', err);
        setError('Failed to load bookings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchPendingPaymentBookings();
    } else {
      setLoading(false);
    }
  }, [api, user]);
  
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
  
  // Get session details
  const getSessionDetails = (booking) => {
    if (!booking.timeSlot) return { date: 'N/A', time: 'N/A', duration: 'N/A' };
    
    return {
      date: formatDate(booking.timeSlot.date),
      time: `${formatTime(booking.timeSlot.startTime)} - ${formatTime(booking.timeSlot.endTime)}`,
      duration: booking.timeSlot.duration ? `${booking.timeSlot.duration} min` : 'N/A'
    };
  };
  
  // Navigate to payment page
  const handleProceedToPayment = (bookingId) => {
    navigate(`/bookings/${bookingId}/payment`);
  };
  
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Pending Payments
        </Typography>
        
        {bookings.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              You don't have any bookings awaiting payment.
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={() => navigate('/bookings')}
            >
              View All Bookings
            </Button>
          </Box>
        ) : (
          <>
            <Alert severity="info" sx={{ mb: 3 }}>
              The following bookings have been approved and are waiting for payment.
              Please complete payment to confirm your coaching sessions.
            </Alert>
            
            <Grid container spacing={3}>
              {bookings.map((booking) => {
                const sessionDetails = getSessionDetails(booking);
                const coachName = booking.coach?.user?.name || 'Unknown Coach';
                
                return (
                  <Grid item xs={12} key={booking._id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ mr: 2 }}>{coachName.charAt(0).toUpperCase()}</Avatar>
                          <Typography variant="h6">{coachName}</Typography>
                          <Chip 
                            size="small" 
                            color="warning" 
                            label="PAYMENT REQUIRED" 
                            sx={{ ml: 'auto' }}
                          />
                        </Box>
                        
                        <Divider sx={{ mb: 2 }} />
                        
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={4}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <EventIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                              <Typography variant="body2">
                                Date: {sessionDetails.date}
                              </Typography>
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} sm={4}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <AccessTimeIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                              <Typography variant="body2">
                                Time: {sessionDetails.time}
                              </Typography>
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} sm={4}>
                            <Typography variant="body2">
                              Duration: {sessionDetails.duration}
                            </Typography>
                          </Grid>
                        </Grid>
                        
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            This booking has been approved by the coach. Complete the payment to confirm your session.
                          </Typography>
                        </Box>
                      </CardContent>
                      
                      <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<PaymentIcon />}
                          onClick={() => handleProceedToPayment(booking._id)}
                        >
                          Pay Now
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default PendingPaymentBookings; 