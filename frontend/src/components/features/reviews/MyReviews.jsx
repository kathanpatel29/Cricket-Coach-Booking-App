import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Rating,
  Alert,
  CircularProgress
} from '@mui/material';
import { clientService } from '../../../services/api';

const MyReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await clientService.getBookings();
      if (response?.data?.data?.bookings) {
        // Filter bookings with reviews
        const reviewedBookings = response.data.data.bookings.filter(
          booking => booking.review
        );
        setReviews(reviewedBookings.map(booking => booking.review));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching reviews');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        My Reviews
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {reviews.map((review) => (
          <Grid item xs={12} sm={6} md={4} key={review._id}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1">
                Coach: {review.coach?.name}
              </Typography>
              <Rating value={review.rating} readOnly />
              <Typography variant="body2" sx={{ mt: 1 }}>
                {review.comment}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(review.createdAt).toLocaleDateString()}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default MyReviews; 