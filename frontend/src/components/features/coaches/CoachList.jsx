import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating,
  Chip,
  Alert,
  CircularProgress,
  Avatar,
  CardActions,
  Paper
} from '@mui/material';
import { coachService } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../common/LoadingSpinner';

const CoachList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    specialization: '',
    experience: '',
    rating: '',
    search: ''
  });

  useEffect(() => {
    fetchCoaches();
  }, []);

  const fetchCoaches = async () => {
    try {
      setLoading(true);
      const response = await coachService.getAll();
      if (response?.data?.data?.coaches) {
        // Only show coaches that are approved and have availability
        setCoaches(response.data.data.coaches);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch coaches');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleViewProfile = (coachId) => {
    navigate(`/coaches/${coachId}`);
  };

  const handleBookSession = (coachId) => {
    if (!user) {
      navigate('/login', { state: { from: `/book/${coachId}` } });
      return;
    }
    navigate(`/book/${coachId}`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (coaches.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No Coaches Available
          </Typography>
          <Typography color="textSecondary">
            There are currently no coaches available for booking. Please check back later.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Available Coaches
      </Typography>
      <Grid container spacing={3}>
        {coaches.map((coach) => (
          <Grid item xs={12} sm={6} md={4} key={coach._id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    src={coach.profileImage}
                    alt={coach.name}
                    sx={{ width: 56, height: 56, mr: 2 }}
                  />
                  <Box>
                    <Typography variant="h6">{coach.name}</Typography>
                    <Rating value={coach.rating} readOnly precision={0.5} />
                    <Typography variant="body2" color="textSecondary">
                      {coach.totalReviews} reviews
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Experience: {coach.experience} years
                </Typography>

                <Box sx={{ mb: 2 }}>
                  {coach.specializations.map((spec, index) => (
                    <Chip
                      key={index}
                      label={spec}
                      size="small"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Box>

                <Typography variant="body2" sx={{ mb: 2 }}>
                  {coach.bio.substring(0, 150)}...
                </Typography>

                <Typography variant="h6" color="primary" gutterBottom>
                  ${coach.hourlyRate}/hour
                </Typography>
              </CardContent>

              <CardActions>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => handleViewProfile(coach._id)}
                >
                  View Profile & Book
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default CoachList; 