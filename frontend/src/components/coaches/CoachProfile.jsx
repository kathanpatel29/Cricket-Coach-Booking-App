import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Avatar,
  Button,
  Rating,
  Chip,
  Divider,
  Stack,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar
} from '@mui/material';
import {
  Event as EventIcon,
  Star as StarIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import { publicService } from '../../services/api';
import BookingCalendar from '../bookings/BookingCalendar';
import { formatDateTime } from '../../utils/dateUtils';

const CoachProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBooking, setShowBooking] = useState(false);

  useEffect(() => {
    fetchCoachProfile();
  }, [id]);

  const fetchCoachProfile = async () => {
    try {
      setLoading(true);
      const response = await publicService.getCoachById(id);
      if (response?.data?.data?.coach) {
        setCoach(response.data.data.coach);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching coach profile');
    } finally {
      setLoading(false);
    }
  };

  const handleBookSession = () => {
    setShowBooking(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!coach) {
    return <Alert severity="info">Coach not found</Alert>;
  }

  return (
    <Box p={3}>
      <Grid container spacing={3}>
        {/* Coach Info */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" flexDirection="column" alignItems="center">
              <Avatar
                src={coach.profileImage}
                alt={coach.name}
                sx={{ width: 120, height: 120, mb: 2 }}
              />
              <Typography variant="h5" gutterBottom>
                {coach.name}
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Rating value={coach.averageRating} readOnly precision={0.5} />
                <Typography variant="body2" color="text.secondary">
                  ({coach.totalReviews} reviews)
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
                {coach.specializations.map((spec) => (
                  <Chip
                    key={spec}
                    label={spec}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Stack>
              <Typography variant="h6" color="primary" gutterBottom>
                ${coach.hourlyRate}/hour
              </Typography>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleBookSession}
                sx={{ mt: 2 }}
              >
                Book Session
              </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            <List>
              <ListItem>
                <ListItemAvatar>
                  <PersonIcon color="primary" />
                </ListItemAvatar>
                <ListItemText
                  primary="Experience"
                  secondary={`${coach.experience} years`}
                />
              </ListItem>
              <ListItem>
                <ListItemAvatar>
                  <LocationIcon color="primary" />
                </ListItemAvatar>
                <ListItemText
                  primary="Location"
                  secondary={coach.location}
                />
              </ListItem>
              <ListItem>
                <ListItemAvatar>
                  <TimerIcon color="primary" />
                </ListItemAvatar>
                <ListItemText
                  primary="Availability"
                  secondary={coach.availability}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              About Me
            </Typography>
            <Typography paragraph>
              {coach.bio}
            </Typography>
          </Paper>

          {/* Reviews Section */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Reviews
            </Typography>
            {coach.reviews?.length > 0 ? (
              coach.reviews.map((review) => (
                <Box key={review._id} mb={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar src={review.user.profileImage}>
                      {review.user.name[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">
                        {review.user.name}
                      </Typography>
                      <Rating value={review.rating} readOnly size="small" />
                    </Box>
                    <Typography variant="caption" color="text.secondary" ml="auto">
                      {formatDateTime(review.createdAt)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" mt={1}>
                    {review.comment}
                  </Typography>
                  <Divider sx={{ mt: 2 }} />
                </Box>
              ))
            ) : (
              <Alert severity="info">No reviews yet</Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Booking Calendar */}
      {showBooking && (
        <Paper sx={{ mt: 3, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Book a Session
          </Typography>
          <BookingCalendar coachId={id} />
        </Paper>
      )}
    </Box>
  );
};

export default CoachProfile; 