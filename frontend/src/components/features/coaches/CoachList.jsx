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
  CircularProgress
} from '@mui/material';
import { coachService } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

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
  }, [filters]);

  const fetchCoaches = async () => {
    try {
      setLoading(true);
      const response = await coachService.getAll(filters);
      if (response?.data?.data?.coaches) {
        // Only show approved coaches
        const approvedCoaches = response.data.data.coaches.filter(
          coach => coach.approvalStatus === 'approved'
        );
        setCoaches(approvedCoaches);
      }
    } catch (err) {
      console.error('Error fetching coaches:', err);
      setError(err.response?.data?.message || 'Error fetching coaches');
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
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  // Show message for pending coaches
  if (user?.role === 'coach' && user?.approvalStatus === 'pending') {
    return (
      <Box p={3}>
        <Alert severity="info" sx={{ mb: 3 }}>
          Your coach profile is pending approval. Once approved, you will be listed here and can:
          <ul style={{ marginTop: '10px', marginLeft: '20px', listStyleType: 'disc' }}>
            <li>Accept booking requests</li>
            <li>Manage your availability</li>
            <li>Access earnings dashboard</li>
            <li>Receive client reviews</li>
          </ul>
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Find a Coach
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel>Specialization</InputLabel>
            <Select
              name="specialization"
              value={filters.specialization}
              onChange={handleFilterChange}
              label="Specialization"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="batting">Batting</MenuItem>
              <MenuItem value="bowling">Bowling</MenuItem>
              <MenuItem value="fielding">Fielding</MenuItem>
              <MenuItem value="wicket-keeping">Wicket Keeping</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel>Experience</InputLabel>
            <Select
              name="experience"
              value={filters.experience}
              onChange={handleFilterChange}
              label="Experience"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="0-2">0-2 years</MenuItem>
              <MenuItem value="3-5">3-5 years</MenuItem>
              <MenuItem value="5-10">5-10 years</MenuItem>
              <MenuItem value="10+">10+ years</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel>Rating</InputLabel>
            <Select
              name="rating"
              value={filters.rating}
              onChange={handleFilterChange}
              label="Rating"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="4">4+ Stars</MenuItem>
              <MenuItem value="3">3+ Stars</MenuItem>
              <MenuItem value="2">2+ Stars</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            label="Search"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search by name or specialization"
          />
        </Grid>
      </Grid>

      {/* Coach List */}
      {coaches.length === 0 ? (
        <Alert severity="info">
          No coaches found matching your criteria.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {coaches.map((coach) => (
            <Grid item xs={12} sm={6} md={4} key={coach._id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {coach.name}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Rating value={coach.averageRating || 0} readOnly precision={0.5} />
                    <Typography variant="body2" color="text.secondary">
                      ({coach.totalReviews || 0} reviews)
                    </Typography>
                  </Box>

                  <Typography color="text.secondary" gutterBottom>
                    Experience: {coach.experience} years
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    {coach.specializations?.map((spec) => (
                      <Chip
                        key={spec}
                        label={spec}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>

                  <Typography variant="h6" color="primary" gutterBottom>
                    ${coach.hourlyRate}/hour
                  </Typography>

                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      onClick={() => handleViewProfile(coach._id)}
                    >
                      View Profile
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => handleBookSession(coach._id)}
                    >
                      Book Session
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default CoachList; 