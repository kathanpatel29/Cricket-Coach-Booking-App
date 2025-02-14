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
  Alert
} from '@mui/material';
import { coachService } from '../../../services/api';

const SessionFeedback = ({ open, sessionId, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please provide a rating');
      return;
    }

    setLoading(true);
    try {
      await coachService.submitSessionFeedback(sessionId, {
        rating,
        feedback
      });
      onSubmit();
    } catch (error) {
      setError(error.response?.data?.message || 'Error submitting feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Session Feedback</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Box sx={{ mb: 3 }}>
          <Typography component="legend">Rate your session</Typography>
          <Rating
            value={rating}
            onChange={(event, newValue) => setRating(newValue)}
            size="large"
            precision={0.5}
          />
        </Box>

        <TextField
          fullWidth
          multiline
          rows={4}
          label="Additional Feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Share your thoughts about the session..."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          Submit Feedback
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SessionFeedback; 