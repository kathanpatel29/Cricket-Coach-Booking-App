import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DateRangeIcon from '@mui/icons-material/DateRange';
import PaymentIcon from '@mui/icons-material/Payment';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../../hooks/useAuth';
import { publicApi, getApiByRole } from '../../services/api';

const BookCoach = () => {
  const { coachId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const api = getApiByRole(user?.role);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [coach, setCoach] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  
  // Fetch coach details and available dates
  useEffect(() => {
    const fetchCoachAndDates = async () => {
      if (!coachId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch coach details
        const coachResponse = await publicApi.getCoachById(coachId);
        const coachData = coachResponse.data.data;
        setCoach(coachData);
        
        // Fetch available dates for the coach
        const datesResponse = await publicApi.getAvailableDates(coachId);
        if (datesResponse.data.status === 'success' && datesResponse.data.data.dates) {
          setAvailableDates(datesResponse.data.data.dates);
          
          // If there are available dates, set the first one as selected
          if (datesResponse.data.data.dates.length > 0) {
            setSelectedDate(datesResponse.data.data.dates[0]);
          }
        } else {
          setAvailableDates([]);
        }
        
      } catch (err) {
        console.error('Error fetching coach details:', err);
        setError('Failed to load coach details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCoachAndDates();
  }, [coachId]);
  
  // Fetch time slots when a date is selected
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!selectedDate || !coachId) return;
      
      try {
        setSlotsLoading(true);
        
        const slotsResponse = await publicApi.getTimeSlotsByDate(coachId, selectedDate);
        if (slotsResponse.data.status === 'success' && slotsResponse.data.data.timeSlots) {
          setTimeSlots(slotsResponse.data.data.timeSlots);
        } else {
          setTimeSlots([]);
        }
      } catch (err) {
        console.error('Error fetching time slots:', err);
        setTimeSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };
    
    fetchTimeSlots();
  }, [selectedDate, coachId]);
  
  // Format date for display
  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'EEEE, MMMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Format time for display
  const formatTime = (timeString) => {
    try {
      // Handle time format like "13:30"
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      return format(date, 'h:mm a');
    } catch (error) {
      return timeString; // Return original if parsing fails
    }
  };
  
  // Handle date selection
  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
    setSelectedSlot(null); // Reset selected slot when date changes
  };
  
  // Get duration in hours
  const getDurationHours = (durationMinutes) => {
    return durationMinutes / 60;
  };
  
  // Calculate session fee
  const calculateFee = (durationHours, hourlyRate) => {
    return durationHours * hourlyRate;
  };
  
  // Handle slot selection
  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
  };
  
  // Handle confirm booking dialog
  const handleConfirmBooking = async () => {
    if (!selectedSlot || !user || !coach) return;
    
    try {
      setSubmitting(true);
      
      const bookingData = {
        coachId: coachId,
        timeSlotId: selectedSlot.id
      };
      
      console.log('Creating booking with data:', bookingData);
      
      const response = await api.createBooking(bookingData);
      
      if (response.data.status === 'success') {
        console.log('Booking created successfully:', response.data);
        setBookingSuccess(true);
        setBookingId(response.data.data?.booking?._id);
        setConfirmDialogOpen(false);
        
        // Update available slots
        setTimeSlots(timeSlots.filter(slot => slot.id !== selectedSlot.id));
      } else {
        setError(response.data.message || 'Failed to create booking');
        setConfirmDialogOpen(false);
      }
    } catch (err) {
      console.error('Error creating booking:', err);
      setError(err.response?.data?.message || 'Failed to create booking. Please try again.');
      setConfirmDialogOpen(false);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleCloseDialog = () => {
    setConfirmDialogOpen(false);
  };
  
  const handleProceedToCheckout = () => {
    navigate(`/bookings/${bookingId}/payment`);
  };
  
  const handleBackToCoach = () => {
    navigate(`/coaches/${coachId}`);
  };
  
  const openConfirmDialog = () => {
    if (selectedSlot) {
      setConfirmDialogOpen(true);
    } else {
      setNotification({
        open: true,
        message: 'Please select a time slot first',
        severity: 'warning'
      });
    }
  };
  
  // Render date selection dropdown
  const renderDateSelection = () => {
    if (availableDates.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No available dates found for this coach. Please check back later.
        </Alert>
      );
    }
    
    return (
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel id="date-select-label">Select Date</InputLabel>
        <Select
          labelId="date-select-label"
          id="date-select"
          value={selectedDate || ''}
          label="Select Date"
          onChange={handleDateChange}
        >
          {availableDates.map((date) => (
            <MenuItem key={date} value={date}>
              {formatDate(date)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  };
  
  // Render time slots
  const renderTimeSlots = () => {
    if (!selectedDate) {
      return (
        <Alert severity="info">
          Please select a date to see available time slots.
        </Alert>
      );
    }
    
    if (slotsLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      );
    }
    
    if (timeSlots.length === 0) {
      return (
        <Alert severity="info">
          No available time slots found for the selected date.
        </Alert>
      );
    }
    
    return (
      <Grid container spacing={2}>
        {timeSlots.map((slot) => (
          <Grid item xs={12} sm={6} md={4} key={slot.id}>
            <Card 
              variant="outlined" 
              sx={{
                cursor: 'pointer',
                borderColor: selectedSlot?.id === slot.id ? 'primary.main' : 'divider',
                borderWidth: selectedSlot?.id === slot.id ? 2 : 1,
                '&:hover': { borderColor: 'primary.main' }
              }}
              onClick={() => handleSelectSlot(slot)}
            >
              <CardContent>
                <Typography variant="subtitle1">
                  {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {slot.duration} minutes
                </Typography>
                {coach?.hourlyRate && (
                  <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                    ${calculateFee(getDurationHours(slot.duration), coach.hourlyRate).toFixed(2)}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/coaches')}
        >
          Back to Coaches
        </Button>
      </Container>
    );
  }
  
  if (bookingSuccess) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Booking Request Sent!
          </Typography>
          <Typography variant="body1" paragraph>
            Your booking request with {coach?.user?.name} has been sent successfully.
          </Typography>
          <Typography variant="body1" paragraph>
            Date: {formatDate(selectedDate)}<br />
            Time: {formatTime(selectedSlot?.startTime)} - {formatTime(selectedSlot?.endTime)}<br />
            Duration: {selectedSlot?.duration} minutes
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3, mx: 'auto', maxWidth: '80%' }}>
            The coach will review your request and either approve or reject it. 
            Once approved, you'll be able to complete your booking by making a payment.
          </Alert>
          
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => navigate('/user/dashboard')}
            >
              Go to Dashboard
            </Button>
            <Button 
              variant="outlined"
              onClick={() => navigate('/user/bookings')}
            >
              View My Bookings
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button 
        variant="outlined" 
        startIcon={<ArrowBackIcon />}
        onClick={handleBackToCoach}
        sx={{ mb: 3 }}
      >
        Back to Coach Profile
      </Button>
      
      {coach && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar 
              src={coach.user?.profileImage}
              alt={coach.user?.name} 
              sx={{ width: 80, height: 80, mr: 2 }}
            />
            <Box>
              <Typography variant="h5">
                Book a Session with {coach.user?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {coach.specializations?.join(', ')}
              </Typography>
              <Typography variant="subtitle1" color="primary" sx={{ mt: 1 }}>
                ${coach.hourlyRate}/hour
              </Typography>
            </Box>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          <Typography variant="h6" gutterBottom>
            Select a Date and Time
          </Typography>
          
          {renderDateSelection()}
          
          {renderTimeSlots()}
          
          {selectedSlot && (
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Card variant="outlined" sx={{ mb: 3, maxWidth: 400, mx: 'auto', p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Selected Time Slot
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1">
                    {formatDate(selectedDate)}
                  </Typography>
                  <Typography variant="body1">
                    {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedSlot.duration} minutes
                  </Typography>
                </Box>
                <Typography variant="h6" color="primary">
                  Total: ${calculateFee(getDurationHours(selectedSlot.duration), coach.hourlyRate).toFixed(2)}
                </Typography>
              </Card>
              
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={openConfirmDialog}
                disabled={submitting}
              >
                {submitting ? 'Processing...' : 'Confirm Booking'}
              </Button>
            </Box>
          )}
        </Paper>
      )}
      
      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>
          Confirm Booking
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedSlot && coach && (
            <>
              <Typography variant="body1" paragraph>
                You are about to request a session with <strong>{coach.user?.name}</strong>.
              </Typography>
              
              <Box sx={{ my: 2 }}>
                <Typography variant="body1">
                  <strong>Date:</strong> {formatDate(selectedDate)}
                </Typography>
                <Typography variant="body1">
                  <strong>Time:</strong> {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                </Typography>
                <Typography variant="body1">
                  <strong>Duration:</strong> {selectedSlot.duration} minutes
                </Typography>
                <Typography variant="body1">
                  <strong>Price:</strong> ${calculateFee(getDurationHours(selectedSlot.duration), coach.hourlyRate).toFixed(2)}
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary">
                After submitting, the coach will review your request. Once approved, you'll be notified to complete the payment.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleConfirmBooking} 
            color="primary" 
            variant="contained"
            disabled={submitting}
          >
            {submitting ? 'Processing...' : 'Confirm Booking'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BookCoach;
