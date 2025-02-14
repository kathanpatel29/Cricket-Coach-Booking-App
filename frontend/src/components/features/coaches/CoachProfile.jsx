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

const CoachProfile = () => {
  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchCoachProfile();
  }, [id]);

  const fetchCoachProfile = async () => {
    try {
      const response = await coachService.getPublicProfile(id);
      setCoach(response.data.coach);
    } catch (error) {
      setError(error.response?.data?.message || 'Error fetching coach profile');
    } finally {
      setLoading(false);
    }
  };

  const handleBookSession = () => {
    if (!user) {
      navigate('/login', { state: { from: `/book/${id}` } });
    } else {
      navigate(`/book/${id}`);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!coach) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">Coach not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* Profile Header */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item>
                <Avatar
                  src={coach.profileImage}
                  alt={coach.name}
                  sx={{ width: 120, height: 120 }}
                />
              </Grid>
              <Grid item xs>
                <Typography variant="h4" gutterBottom>
                  {coach.name}
                </Typography>
                <Box display="flex" alignItems="center" mb={1}>
                  <Rating value={coach.averageRating} readOnly precision={0.5} />
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    ({coach.reviews?.length || 0} reviews)
                  </Typography>
                </Box>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {coach.specializations.map((spec, index) => (
                    <Chip key={index} label={spec} color="primary" size="small" />
                  ))}
                </Box>
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleBookSession}
                >
                  Book Session
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* About */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              About
            </Typography>
            <Typography>{coach.bio}</Typography>
          </Paper>

          {/* Experience & Expertise */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Experience & Expertise
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <CricketIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Experience"
                  secondary={`${coach.experience} years of coaching experience`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <SchoolIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Certifications"
                  secondary={coach.certifications || 'Not specified'}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <StarIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Specializations"
                  secondary={coach.specializations.join(', ')}
                />
              </ListItem>
            </List>
          </Paper>

          {/* Reviews */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Reviews
            </Typography>
            {coach.reviews?.length > 0 ? (
              coach.reviews.map((review) => (
                <Card key={review._id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="subtitle1">
                        {review.client.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Rating value={review.rating} readOnly size="small" />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {review.comment}
                    </Typography>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Typography color="textSecondary">
                No reviews yet
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Session Info */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Session Information
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <ScheduleIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Session Duration"
                  secondary={`${coach.sessionDuration} minutes`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <LocationIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Location"
                  secondary={coach.location}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <MoneyIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Session Rate"
                  secondary={`$${coach.hourlyRate}/hour`}
                />
              </ListItem>
            </List>
          </Paper>

          {/* Availability Summary */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Availability
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Book a session to view available time slots
            </Typography>
            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 2 }}
              onClick={handleBookSession}
            >
              Check Availability
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CoachProfile; 