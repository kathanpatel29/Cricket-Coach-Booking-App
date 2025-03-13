import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Button, 
  Avatar, 
  Chip, 
  Rating, 
  Divider,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Snackbar
} from '@mui/material';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { publicApi, userApi } from '../../services/api';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SportsCricketIcon from '@mui/icons-material/SportsCricket';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DateRangeIcon from '@mui/icons-material/DateRange';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { format, parseISO, differenceInHours } from 'date-fns';

const CoachProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [openBookingModal, setOpenBookingModal] = useState(false);
  const [bookingProcessing, setBookingProcessing] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [hasAvailability, setHasAvailability] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  
  // Fetch coach profile and available dates
  useEffect(() => {
    const fetchCoachProfileAndDates = async () => {
      try {
        setLoading(true);
        const response = await publicApi.getCoachById(id);
        
        if (response.data && response.data.status === 'success') {
          setCoach(response.data.data.coach);
          
          // After fetching coach, fetch available dates
          await fetchAvailableDates();
          
          // Check if this coach is in favorites
          if (isAuthenticated && user && user.role === 'user') {
            await checkIfFavorite();
          }
          
          // Fetch coach reviews
          await fetchCoachReviews();
        } else {
          setError('Failed to fetch coach profile.');
        }
      } catch (err) {
        console.error('Error fetching coach profile:', err);
        setError('An error occurred while fetching coach profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchCoachProfileAndDates();
    }
  }, [id, isAuthenticated, user]);
  
  // Fetch available dates
  const fetchAvailableDates = async () => {
    try {
      setLoadingDates(true);
      
      const response = await publicApi.getAvailableDates(id);
      
      if (response.data && response.data.status === 'success') {
        const dates = response.data.data.dates || [];
        setAvailableDates(dates);
        setHasAvailability(dates.length > 0);
        
        // Auto-select first date if available
        if (dates.length > 0) {
          setSelectedDate(dates[0]);
        }
      } else {
        setAvailableDates([]);
        setHasAvailability(false);
      }
    } catch (err) {
      console.error('Error fetching available dates:', err);
      setAvailableDates([]);
      setHasAvailability(false);
    } finally {
      setLoadingDates(false);
    }
  };
  
  // Fetch time slots for selected date
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!selectedDate || !id) return;
      
      try {
        setLoadingTimeSlots(true);
        
        const response = await publicApi.getTimeSlotsByDate(id, selectedDate);
        
        if (response.data && response.data.status === 'success') {
          setTimeSlots(response.data.data.timeSlots || []);
        } else {
          setTimeSlots([]);
        }
      } catch (err) {
        console.error('Error fetching time slots:', err);
        setTimeSlots([]);
      } finally {
        setLoadingTimeSlots(false);
      }
    };
    
    fetchTimeSlots();
  }, [selectedDate, id]);
  
  // Fetch coach reviews
  const fetchCoachReviews = async () => {
    try {
      setLoadingReviews(true);
      const response = await publicApi.getCoachReviews(id);
      if (response.data && response.data.status === 'success') {
        setReviews(response.data.data.reviews);
      }
    } catch (err) {
      console.error('Error fetching coach reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };
  
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
    setSelectedTimeSlot(null);
  };
  
  // Handle time slot selection
  const handleTimeSlotSelect = (timeSlot) => {
    setSelectedTimeSlot(timeSlot);
  };
  
  // Open booking modal
  const handleOpenBookingModal = () => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      navigate('/login', { state: { from: `/coaches/${id}` } });
      return;
    }
    
    setOpenBookingModal(true);
  };
  
  // Close booking modal
  const handleCloseBookingModal = () => {
    setOpenBookingModal(false);
    setBookingError(null);
  };
  
  // Create booking
  const handleCreateBooking = async () => {
    if (!isAuthenticated || !selectedTimeSlot) {
      return;
    }
    
    try {
      setBookingProcessing(true);
      setBookingError(null);
      
      const response = await userApi.createBooking({
        coachId: id,
        timeSlotId: selectedTimeSlot.id,
      });
      
      if (response.data && response.data.status === 'success') {
        setBookingSuccess(true);
        setOpenBookingModal(false);
        
        // Show success message instead of navigating to payment
        setSnackbarMessage('Booking request submitted successfully! You will be notified when the coach approves your request.');
        setSnackbarOpen(true);
        
        // Navigate to my bookings page to see the pending booking
        setTimeout(() => {
          navigate('/bookings');
        }, 2000);
      } else {
        setBookingError('Failed to create booking. Please try again.');
      }
    } catch (err) {
      console.error('Error creating booking:', err);
      setBookingError(err.response?.data?.message || 'An error occurred while creating booking.');
    } finally {
      setBookingProcessing(false);
    }
  };
  
  // Check if coach is in user's favorites
  const checkIfFavorite = async () => {
    if (!isAuthenticated || !user || user.role !== 'user') return;
    
    try {
      setFavoritesLoading(true);
      const response = await userApi.getFavoriteCoaches();
      if (response.data && response.data.status === 'success') {
        const favorites = response.data.data.favoriteCoaches || [];
        const isFav = favorites.some(coach => coach.id === id);
        setIsFavorite(isFav);
      }
    } catch (err) {
      console.error('Error checking favorites:', err);
    } finally {
      setFavoritesLoading(false);
    }
  };
  
  // Toggle favorite status
  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      navigate('/login', { state: { from: `/coaches/${id}` } });
      return;
    }
    
    try {
      setFavoritesLoading(true);
      
      if (isFavorite) {
        // Remove from favorites
        await userApi.removeFromFavorites(id);
        setIsFavorite(false);
        setSnackbarMessage('Coach removed from favorites');
      } else {
        // Add to favorites
        await userApi.addToFavorites(id);
        setIsFavorite(true);
        setSnackbarMessage('Coach added to favorites');
      }
      
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Error toggling favorite status:', err);
      setSnackbarMessage('Error updating favorites. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setFavoritesLoading(false);
    }
  };
  
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  
  // Render the component
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', mb: 3 }}>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBackIcon />} 
            component={Link} 
            to="/coaches" 
          >
            Back to Coaches
          </Button>
        </Box>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={250} sx={{ mb: 4, borderRadius: 1 }} />
            <Skeleton variant="text" height={60} sx={{ mb: 1 }} />
            <Skeleton variant="text" height={30} sx={{ mb: 3 }} width="80%" />
            <Skeleton variant="rectangular" height={120} sx={{ mb: 4, borderRadius: 1 }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 1 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }
  
  if (error || !coach) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', mb: 3 }}>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBackIcon />} 
            component={Link} 
            to="/coaches" 
          >
            Back to Coaches
          </Button>
        </Box>
        
        <Alert severity="error" sx={{ my: 2 }}>
          {error || "Coach not found"}
          </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back Button */}
      <Box sx={{ display: 'flex', mb: 3 }}>
      <Button 
          variant="outlined" 
        startIcon={<ArrowBackIcon />} 
        component={Link} 
        to="/coaches" 
      >
        Back to Coaches
      </Button>
      </Box>
      
      <Grid container spacing={4}>
        {/* Left Column: Coach Info */}
        <Grid item xs={12} md={8}>
          {/* Coach Header */}
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar 
                  src={coach?.user?.profileImage || '/default-avatar.png'}
                  alt={coach?.user?.name || 'Coach'}
                  sx={{ width: 80, height: 80, mr: 2 }}
                />
              <Box>
                  <Typography variant="h4" component="h1">
                    {coach?.user?.name || 'Coach Profile'}
                </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    {coach?.specializations?.join(', ') || 'Cricket Coach'}
                </Typography>
                </Box>
              </Box>
              
              {/* Favorite Button */}
              {isAuthenticated && user?.role === 'user' && (
                <Tooltip title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}>
                  <IconButton 
                    color={isFavorite ? "error" : "default"} 
                    onClick={handleToggleFavorite}
                    disabled={favoritesLoading}
                    size="large"
                  >
                    {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {coach.specializations && coach.specializations.map((spec, index) => (
                  <Chip 
                    key={index} 
                  label={spec} 
                    color="primary" 
                  variant="outlined" 
                  icon={<SportsCricketIcon />}
                  />
                ))}
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Experience:</strong> {coach.experience} years
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Rate:</strong> ${coach.hourlyRate}/hour
              </Typography>
            </Box>
            
            <Button 
              variant="contained" 
              color="primary"
              size="large"
              onClick={() => document.getElementById('booking-section').scrollIntoView({ behavior: 'smooth' })}
            >
              Book a Session
            </Button>
          </Paper>
          
          {/* Coach Bio */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              About Coach {coach.user?.name}
            </Typography>
            <Typography variant="body1" paragraph>
              {coach.bio || "No bio provided."}
              </Typography>
            </Paper>
          
          {/* Coach Reviews */}
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Reviews & Ratings
            </Typography>
            
            {loadingReviews ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                <CircularProgress />
              </Box>
            ) : reviews && reviews.length > 0 ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Rating 
                    value={coach?.averageRating || 0} 
                    precision={0.5} 
                    readOnly 
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="h6">
                    {coach?.averageRating ? coach.averageRating.toFixed(1) : '0'}/5
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                {reviews.map((review) => (
                  <Box key={review._id} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2 }}>
                          {review.user?.name ? review.user.name.charAt(0) : 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1">{review.user?.name || 'Anonymous'}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {review.createdAt ? format(new Date(review.createdAt), 'MMM dd, yyyy') : ''}
                          </Typography>
                        </Box>
                      </Box>
                      <Rating value={review.rating} readOnly size="small" />
                    </Box>
                    
                    <Typography variant="body2" sx={{ mt: 1, ml: 7 }}>
                      {review.comment}
                    </Typography>
                    
                    <Divider sx={{ mt: 2 }} />
                  </Box>
                ))}
              </>
            ) : (
              <Alert severity="info">
                No reviews yet. Be the first to review this coach after a session!
              </Alert>
            )}
          </Paper>
        </Grid>
        
        {/* Right Column: Booking and Availability */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }} id="booking-section">
            <Typography variant="h6" gutterBottom>
              Book a Session
            </Typography>
            
            {/* Date Selection */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Select a Date:
              </Typography>
              
              {loadingDates ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : availableDates.length === 0 ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    No available dates found for this coach.
                  </Typography>
                </Alert>
              ) : (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <Select
                    value={selectedDate || ''}
                    onChange={handleDateChange}
                    displayEmpty
                    sx={{ width: '100%' }}
                  >
                    <MenuItem value="" disabled>
                      Select a date
                    </MenuItem>
                    {availableDates.map((date) => (
                      <MenuItem key={date} value={date}>
                        {formatDate(date)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              
              {selectedDate && (
              <Typography variant="body2" color="text.secondary">
                  Selected: {formatDate(selectedDate)}
              </Typography>
              )}
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Time Slots */}
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Available Time Slots:
              </Typography>
              
              {!selectedDate ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Please select a date first.
                  </Typography>
                </Alert>
              ) : loadingTimeSlots ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : timeSlots.length === 0 ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    No available time slots for this date.
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Please select another date or check back later.
                  </Typography>
                </Alert>
              ) : (
                <Box sx={{ mb: 3 }}>
                  <Grid container spacing={1}>
                    {timeSlots.map((slot) => (
                      <Grid item xs={12} sm={6} key={slot.id}>
                        <Button
                          variant={selectedTimeSlot?.id === slot.id ? "contained" : "outlined"}
                          fullWidth
                          onClick={() => handleTimeSlotSelect(slot)}
                          sx={{ 
                            py: 1, 
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: 'center',
                            height: '100%',
                            textAlign: 'center',
                            borderColor: selectedTimeSlot?.id === slot.id ? 'primary.main' : 'divider'
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {slot.duration} min session
                          </Typography>
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
              
              {/* Booking Button */}
              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                disabled={!selectedTimeSlot || !hasAvailability}
                onClick={handleOpenBookingModal}
                sx={{ mt: 2 }}
              >
                {hasAvailability ? "Book Session" : "No Availability"}
              </Button>
              
              {/* Booking Information */}
              <Box sx={{ mt: 2 }}>
                <Alert severity="info" icon={<AccessTimeIcon />}>
                  <Typography variant="body2">
                    Book your session and get ready to improve your cricket skills!
                  </Typography>
                </Alert>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Booking Confirmation Modal */}
      <Dialog
        open={openBookingModal}
        onClose={handleCloseBookingModal}
        aria-labelledby="booking-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="booking-dialog-title" sx={{ pb: 1 }}>
          <Typography variant="h5" fontWeight="bold">Request Booking</Typography>
        </DialogTitle>
        <DialogContent>
          {bookingError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {bookingError}
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar 
              src={coach.user?.profileImage || ''} 
              alt={coach.user?.name}
              sx={{ width: 50, height: 50, mr: 2 }}
            >
              {coach.user?.name?.charAt(0) || 'C'}
            </Avatar>
            <Box>
              <Typography variant="h6">
                Session with {coach.user?.name}
              </Typography>
            </Box>
          </Box>
          
          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Date</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarMonthIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                  <Typography variant="body1" fontWeight="medium">
                    {selectedDate && formatDate(selectedDate)}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Time</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccessTimeIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                  <Typography variant="body1" fontWeight="medium">
                    {selectedTimeSlot && 
                      `${formatTime(selectedTimeSlot.startTime)} - ${formatTime(selectedTimeSlot.endTime)}`
                    }
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Duration</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {selectedTimeSlot?.duration || 60} minutes
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Rate</Typography>
                <Typography variant="body1" fontWeight="medium">
                  ${coach.hourlyRate}/hour
                </Typography>
              </Grid>
            </Grid>
          </Paper>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Estimated Cost
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body1">
                Session Fee ({selectedTimeSlot?.duration || 60} min)
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                ${selectedTimeSlot ? ((selectedTimeSlot.duration / 60) * coach.hourlyRate).toFixed(2) : '0.00'}
              </Typography>
            </Box>
          </Box>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              By confirming, you are requesting this booking. The coach will need to approve your request before you can proceed with payment.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBookingModal} disabled={bookingProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateBooking} 
            variant="contained" 
            color="primary" 
            disabled={bookingProcessing}
          >
            {bookingProcessing ? 'Processing...' : 'Request Booking'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionProps={{ 
          onEnter: undefined,
          onEntered: undefined,
          onEntering: undefined,
          onExit: undefined,
          onExited: undefined,
          onExiting: undefined
        }}
      />
    </Container>
  );
};

export default CoachProfile; 