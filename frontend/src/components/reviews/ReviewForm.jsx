import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Rating,
  Alert,
  CircularProgress
} from '@mui/material';
import { reviewService } from '../../services/api';

const ReviewForm = ({ booking, onReviewSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please provide a rating');
      return;
    }

    try {
      setLoading(true);
      const response = await reviewService.createReview({
        bookingId: booking._id,
        coachId: booking.coach._id,
        rating,
        comment
      });

      if (response?.data?.data?.review) {
        if (onReviewSubmit) {
          onReviewSubmit(response.data.data.review);
        }
        setRating(0);
        setComment('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Rate Your Session with {booking.coach.name}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <Box sx={{ mb: 3 }}>
          <Typography component="legend" gutterBottom>
            Rating *
          </Typography>
          <Rating
            value={rating}
            onChange={(event, newValue) => {
              setRating(newValue);
            }}
            size="large"
            precision={0.5}
          />
        </Box>

        <TextField
          fullWidth
          label="Your Review"
          multiline
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with the coach..."
          sx={{ mb: 2 }}
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Submit Review'}
        </Button>
      </Box>
    </Paper>
  );
};

export default ReviewForm; 