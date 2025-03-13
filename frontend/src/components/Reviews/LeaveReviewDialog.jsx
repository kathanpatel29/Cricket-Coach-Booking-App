import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Rating,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { userApi } from '../../services/api';

const LeaveReviewDialog = ({ open, onClose, booking, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = async () => {
    if (!booking) {
      setError('Booking information is missing');
      return;
    }
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    
    if (!comment.trim()) {
      setError('Please enter a comment');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await userApi.createReview({
        bookingId: booking._id,
        rating,
        comment: comment.trim()
      });
      
      if (response.data && response.data.status === 'success') {
        setSuccess(true);
        
        // Notify parent component that review was submitted
        if (onReviewSubmitted) {
          onReviewSubmitted(response.data.data.review);
        }
        
        // Close dialog after a short delay
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        setError('Failed to submit review. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err.response?.data?.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleClose = () => {
    // Reset form state
    setRating(0);
    setComment('');
    setError(null);
    setSuccess(false);
    
    // Close dialog
    onClose();
  };
  
  if (!open) return null;
  
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Leave a Review
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        {!booking ? (
          <Alert severity="error" sx={{ my: 2 }}>
            Booking information is missing. Please try again.
          </Alert>
        ) : success ? (
          <Alert severity="success" sx={{ my: 2 }}>
            Your review has been submitted successfully!
          </Alert>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Box sx={{ my: 2 }}>
              <Typography component="legend">Rating</Typography>
              <Rating
                name="rating"
                value={rating}
                onChange={(event, newValue) => {
                  setRating(newValue);
                }}
                size="large"
                precision={1}
              />
            </Box>
            
            <TextField
              label="Your Review"
              multiline
              rows={4}
              fullWidth
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this coach..."
              variant="outlined"
              disabled={submitting}
            />
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        {booking && !success && (
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Submit Review'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default LeaveReviewDialog; 