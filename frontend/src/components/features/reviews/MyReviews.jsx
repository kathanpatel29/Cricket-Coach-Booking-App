import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Rating,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { format } from 'date-fns';
import { clientService } from '../../../services/api';

const MyReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [editedRating, setEditedRating] = useState(0);
  const [editedComment, setEditedComment] = useState('');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await clientService.getMyReviews();
      setReviews(response.data.data.reviews);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (review) => {
    setSelectedReview(review);
    setEditedRating(review.rating);
    setEditedComment(review.comment);
    setOpenDialog(true);
  };

  const handleUpdateReview = async () => {
    try {
      await clientService.updateReview(selectedReview._id, {
        rating: editedRating,
        comment: editedComment
      });
      fetchReviews();
      setOpenDialog(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating review');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          My Reviews
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={3}>
          {reviews.map((review) => (
            <Grid item xs={12} md={6} key={review._id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle1">
                      Coach: {review.coach.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {format(new Date(review.createdAt), 'MMM dd, yyyy')}
                    </Typography>
                  </Box>
                  <Rating value={review.rating} readOnly />
                  <Typography variant="body1" mt={1}>
                    {review.comment}
                  </Typography>
                  <Box mt={2}>
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => handleEditClick(review)}
                    >
                      Edit Review
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Edit Review</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Rating
              value={editedRating}
              onChange={(event, newValue) => setEditedRating(newValue)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Review Comment"
              value={editedComment}
              onChange={(e) => setEditedComment(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateReview} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MyReviews; 