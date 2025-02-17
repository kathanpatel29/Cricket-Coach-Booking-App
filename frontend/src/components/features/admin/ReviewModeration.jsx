import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
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
  Rating,
  Grid,
  MenuItem
} from '@mui/material';
import { adminService } from '../../../services/api';
import { format } from 'date-fns';

const ReviewModeration = () => {
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [moderateDialog, setModerateDialog] = useState({ 
    open: false, 
    review: null,
    status: '',
    notes: '' 
  });

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  const fetchPendingReviews = async () => {
    try {
      setLoading(true);
      const response = await adminService.getPendingReviews();
      setPendingReviews(response.data.data.reviews || []);
    } catch (err) {
      console.error('Error fetching pending reviews:', err);
      setError(err.response?.data?.message || 'Error fetching pending reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async () => {
    try {
      await adminService.moderateReview(moderateDialog.review._id, {
        status: moderateDialog.status,
        moderationNotes: moderateDialog.notes
      });
      setModerateDialog({ open: false, review: null, status: '', notes: '' });
      fetchPendingReviews();
    } catch (err) {
      setError(err.response?.data?.message || 'Error moderating review');
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
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Review Moderation ({pendingReviews.length} pending)
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {pendingReviews.map((review) => (
          <Grid item xs={12} md={6} key={review._id}>
            <Card>
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Client: {review.client?.name}
                  </Typography>
                  <Typography variant="subtitle2" color="textSecondary">
                    Coach: {review.coach?.name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" display="block">
                    Submitted: {format(new Date(review.createdAt), 'MMM dd, yyyy HH:mm')}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Rating value={review.rating} readOnly />
                </Box>

                <Typography variant="body1" gutterBottom>
                  {review.comment}
                </Typography>
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  color="primary"
                  onClick={() => setModerateDialog({ 
                    open: true, 
                    review,
                    status: '',
                    notes: '' 
                  })}
                >
                  Moderate
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}

        {pendingReviews.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography>No pending reviews to moderate</Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      <Dialog
        open={moderateDialog.open}
        onClose={() => setModerateDialog({ open: false, review: null, status: '', notes: '' })}
      >
        <DialogTitle>Moderate Review</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Status"
            value={moderateDialog.status}
            onChange={(e) => setModerateDialog({ 
              ...moderateDialog, 
              status: e.target.value 
            })}
            margin="normal"
          >
            <MenuItem value="approved">Approve</MenuItem>
            <MenuItem value="rejected">Reject</MenuItem>
          </TextField>

          <TextField
            fullWidth
            label="Moderation Notes"
            multiline
            rows={4}
            value={moderateDialog.notes}
            onChange={(e) => setModerateDialog({ 
              ...moderateDialog, 
              notes: e.target.value 
            })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setModerateDialog({ 
              open: false, 
              review: null, 
              status: '', 
              notes: '' 
            })}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleModerate}
            variant="contained" 
            color="primary"
            disabled={!moderateDialog.status}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReviewModeration;

 