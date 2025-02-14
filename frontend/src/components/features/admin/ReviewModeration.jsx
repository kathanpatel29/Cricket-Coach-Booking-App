import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  Rating
} from '@mui/material';
import { adminService } from '../../../services/api';

const ReviewModeration = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [moderationDialog, setModerationDialog] = useState({
    open: false,
    review: null,
    action: null
  });
  const [moderationNote, setModerationNote] = useState('');

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  const fetchPendingReviews = async () => {
    try {
      const response = await adminService.getPendingReviews();
      setReviews(response.data.data.reviews || []);
    } catch (error) {
      setError(error.response?.data?.message || 'Error fetching reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleModeration = async () => {
    try {
      await adminService.moderateReview(moderationDialog.review._id, {
        status: moderationDialog.action,
        comment: moderationNote
      });
      
      setReviews(reviews.filter(review => review._id !== moderationDialog.review._id));
      setModerationDialog({ open: false, review: null, action: null });
      setModerationNote('');
    } catch (error) {
      setError(error.response?.data?.message || 'Error moderating review');
    }
  };

  const openModerationDialog = (review, action) => {
    setModerationDialog({
      open: true,
      review,
      action
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Typography variant="h6" gutterBottom>
        Review Moderation ({reviews?.length || 0} pending)
      </Typography>

      <Grid container spacing={3}>
        {reviews && reviews.length > 0 ? (
          reviews.map((review) => (
            <Grid item xs={12} md={6} key={review._id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle1">
                      {review.client?.name || 'Unknown Client'} → {review.coach?.name || 'Unknown Coach'}
                    </Typography>
                    <Chip
                      label={review.moderationStatus || 'Pending'}
                      color={review.moderationStatus === 'approved' ? 'success' : 'warning'}
                    />
                  </Box>

                  <Rating value={review.rating || 0} readOnly precision={0.5} />
                  
                  <Typography variant="body1" sx={{ mt: 2 }}>
                    {review.comment || 'No comment provided'}
                  </Typography>

                  <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
                    Posted on: {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Date not available'}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    color="primary"
                    onClick={() => openModerationDialog(review, 'approved')}
                  >
                    Approve
                  </Button>
                  <Button
                    color="error"
                    onClick={() => openModerationDialog(review, 'rejected')}
                  >
                    Reject
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">
                No reviews pending moderation
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Moderation Dialog */}
      <Dialog
        open={moderationDialog.open}
        onClose={() => setModerationDialog({ open: false, review: null, action: null })}
      >
        <DialogTitle>
          {moderationDialog.action === 'approved' ? 'Approve Review' : 'Reject Review'}
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            {moderationDialog.action === 'approved'
              ? 'Are you sure you want to approve this review?'
              : 'Are you sure you want to reject this review?'}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Moderation Notes"
            value={moderationNote}
            onChange={(e) => setModerationNote(e.target.value)}
            margin="normal"
            placeholder={
              moderationDialog.action === 'approved'
                ? 'Add any approval notes (optional)'
                : 'Please provide a reason for rejection'
            }
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setModerationDialog({ open: false, review: null, action: null })}
          >
            Cancel
          </Button>
          <Button
            onClick={handleModeration}
            variant="contained"
            color={moderationDialog.action === 'approved' ? 'primary' : 'error'}
          >
            {moderationDialog.action === 'approved' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReviewModeration;

 