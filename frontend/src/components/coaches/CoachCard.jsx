import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Avatar,
  Box,
  Rating,
  Chip,
  Stack
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { differenceInHours, parseISO } from 'date-fns';

const CoachCard = ({ coach, onBookSession }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleViewProfile = () => {
    navigate(`/coaches/${coach._id}`);
  };

  const isBookingAllowed = (slotTime) => {
    const now = new Date();
    const slotDateTime = parseISO(slotTime);
    const hoursDifference = differenceInHours(slotDateTime, now);
    return hoursDifference >= coach.availabilitySettings.bookingCutoffHours;
  };

  const canBook = user && 
    user.role !== 'coach' && 
    coach._id !== user._id && 
    coach.hasAvailability &&
    coach.nextAvailableSlot && 
    isBookingAllowed(coach.nextAvailableSlot);

  const getBookingButtonText = () => {
    if (!coach.hasAvailability) {
      return 'No Availability';
    }
    if (!isBookingAllowed(coach.nextAvailableSlot)) {
      return `Booking closes ${coach.availabilitySettings.bookingCutoffHours}h before`;
    }
    return 'Book Session';
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar
            src={coach.profileImage}
            alt={coach.name}
            sx={{ width: 64, height: 64, mr: 2 }}
          />
          <Box>
            <Typography variant="h6" gutterBottom>
              {coach.name}
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Rating value={coach.averageRating} readOnly precision={0.5} />
              <Typography variant="body2" color="text.secondary">
                ({coach.totalReviews} reviews)
              </Typography>
            </Box>
          </Box>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
          {coach.specializations.map((spec) => (
            <Chip
              key={spec}
              label={spec}
              size="small"
              color="primary"
              variant="outlined"
            />
          ))}
        </Stack>

        <Typography variant="body2" color="text.secondary" paragraph>
          {coach.bio?.substring(0, 150)}...
        </Typography>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle1" color="primary">
            ${coach.hourlyRate}/hour
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {coach.experience} years experience
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={1} mt={2}>
          <Chip
            label={coach.hasAvailability ? 'Available' : 'No Availability'}
            color={coach.hasAvailability ? 'success' : 'default'}
            size="small"
          />
          {coach.hasAvailability && (
            <Typography variant="caption" color="text.secondary">
              Next available: {formatDateTime(coach.nextAvailableSlot)}
            </Typography>
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button 
          size="small" 
          onClick={handleViewProfile}
          sx={{ mr: 1 }}
        >
          View Profile
        </Button>
        {user && user.role !== 'coach' && (
          <Button
            size="small"
            variant="contained"
            onClick={() => onBookSession(coach)}
            disabled={!canBook}
            color={canBook ? 'primary' : 'default'}
          >
            {getBookingButtonText()}
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default CoachCard; 