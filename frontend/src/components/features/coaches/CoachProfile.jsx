import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Avatar,
  Rating,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
  Card,
  CardContent
} from '../../shared/MuiComponents.jsx';
import {
  CricketIcon,
  StarIcon,
  ScheduleIcon,
  LocationIcon,
  MoneyIcon,
  SchoolIcon
} from '../../shared/MuiComponents.jsx';
import { useParams, useNavigate } from 'react-router-dom';
import { coachService } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../common/LoadingSpinner';
import { formatDate } from '../../../utils/helpers';
import axios from 'axios';

const CoachProfile = () => {
  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    fetchCoachProfile();
  }, [id]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate]);

  const fetchCoachProfile = async () => {
    try {
      setLoading(true);
      const response = await coachService.getCoachById(id);
      if (response?.data?.data?.coach) {
        setCoach(response.data.data.coach);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch coach profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      setError('');
      const response = await axios.get(`/api/bookings/slots/${id}?date=${selectedDate}`);
      
      if (response.data.status === 'success') {
        setAvailableSlots(response.data.data.slots);
        if (response.data.data.slots.length === 0) {
          setError(response.data.message || 'No slots available for selected date');
        }
      } else {
        setError(response.data.message || 'Failed to fetch available slots');
        setAvailableSlots([]);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
      setError(err.response?.data?.message || 'Failed to fetch available slots');
      setAvailableSlots([]);
    }
  };

  const handleBookSession = () => {
    if (!user) {
      navigate('/login', { state: { from: `/coaches/${id}` } });
      return;
    }
    
    if (!selectedSlot) {
      setError('Please select a time slot');
      return;
    }

    navigate('/book', { 
      state: { 
        coachId: id,
        date: selectedDate,
        time: selectedSlot,
        coachName: `${coach.firstName} ${coach.lastName}`
      } 
    });
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!coach) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Coach not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar
                src={coach.profileImage}
                alt={`${coach.firstName} ${coach.lastName}`}
                sx={{ width: 100, height: 100 }}
              />
            </Grid>
            <Grid item xs>
              <Typography variant="h4">{`${coach.firstName} ${coach.lastName}`}</Typography>
              <Typography variant="subtitle1" color="text.secondary">{coach.specialization}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Rating value={coach.rating || 0} readOnly precision={0.5} />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  ({coach.totalReviews} reviews)
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>About</Typography>
          <Typography variant="body1">{coach.bio}</Typography>
        </CardContent>
      </Card>

      {coach.isApproved ? (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Book a Session</Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Select Date:</Typography>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                style={{ padding: '8px', marginBottom: '16px' }}
              />
            </Box>

            {availableSlots.length > 0 ? (
              <>
                <Typography variant="subtitle1" gutterBottom>Available Slots:</Typography>
                <Grid container spacing={1} sx={{ mb: 2 }}>
                  {availableSlots.map((slot) => (
                    <Grid item key={slot}>
                      <Button
                        variant={selectedSlot === slot ? "contained" : "outlined"}
                        onClick={() => setSelectedSlot(slot)}
                        size="small"
                      >
                        {slot}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
                
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleBookSession}
                  disabled={!selectedSlot}
                  fullWidth
                >
                  {user ? 'Book Session' : 'Login to Book Session'}
                </Button>
              </>
            ) : (
              <Alert severity="info">No available slots for selected date</Alert>
            )}
          </CardContent>
        </Card>
      ) : (
        <Alert severity="info">This coach is not currently accepting bookings</Alert>
      )}

      {coach.reviews && coach.reviews.length > 0 && (
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Reviews</Typography>
            <List>
              {coach.reviews.map((review, index) => (
                <React.Fragment key={review._id}>
                  <ListItem>
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2">{review.client.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(review.createdAt)}
                        </Typography>
                      </Box>
                      <Rating value={review.rating} readOnly size="small" />
                      <Typography variant="body2" sx={{ mt: 1 }}>{review.comment}</Typography>
                    </Box>
                  </ListItem>
                  {index < coach.reviews.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default CoachProfile; 