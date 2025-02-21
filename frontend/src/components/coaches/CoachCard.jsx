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
import { format } from 'date-fns';

const CoachCard = ({ coach, onBookSession }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!coach) {
    return null;
  }

  const handleViewProfile = () => {
    navigate(`/coaches/${coach._id}`);
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'Not available';
    try {
      return format(new Date(dateTime), 'MMM dd, yyyy hh:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const canBook = user && 
    user.role !== 'coach' && 
    coach._id !== user._id && 
    coach.hasAvailability;

  const getBookingButtonText = () => {
    if (!coach.hasAvailability) {
      return 'No Availability';
    }
    return 'Book Session';
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar
            src={coach.profileImage}
            alt={coach.name || 'Coach'}
            sx={{ width: 64, height: 64, mr: 2 }}
          />
          <Box>
            <Typography variant="h6" gutterBottom>
              {coach.name || 'Unnamed Coach'}
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Rating value={coach.averageRating || 0} readOnly precision={0.5} />
              <Typography variant="body2" color="text.secondary">
                ({coach.totalReviews || 0} reviews)
              </Typography>
            </Box>
          </Box>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
          {(coach.specializations || []).map((spec) => (
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
          {(coach.bio || '').substring(0, 150)}...
        </Typography>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle1" color="primary">
            ${coach.hourlyRate || 0}/hour
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {coach.experience || 0} years experience
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={1} mt={2}>
          <Chip
            label={coach.hasAvailability ? 'Available' : 'No Availability'}
            color={coach.hasAvailability ? 'success' : 'default'}
            size="small"
          />
          {coach.hasAvailability && coach.nextAvailableSlot && (
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