import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Rating,
  TextField
} from '@mui/material';
import {
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon
} from '@mui/icons-material';
import { adminService } from '../../services/api';
import { formatDateTime } from '../../utils/dateUtils';

const ReviewModeration = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReview, setSelectedReview] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [moderationComment, setModerationComment] = useState('');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await adminService.getPendingReviews();
      if (response?.data?.data?.reviews) {
        setReviews(response.data.data.reviews);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleModerateReview = async (reviewId, status) => {
    try {
      await adminService.moderateReview(reviewId, {
        status,
        comment: moderationComment
      });
      fetchReviews();
      setViewDialog(false);
      setModerationComment('');
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
    <Box p={3}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Review ID</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Coach</TableCell>
              <TableCell>Rating</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reviews.map((review) => (
              <TableRow key={review._id}>
                <TableCell>{review._id}</TableCell>
                <TableCell>{review.user.name}</TableCell>
                <TableCell>{review.coach.name}</TableCell>
                <TableCell>
                  <Rating value={review.rating} readOnly />
                </TableCell>
                <TableCell>{review.status}</TableCell>
                <TableCell>{formatDateTime(review.createdAt)}</TableCell>
                <TableCell>
                  <IconButton 
                    onClick={() => {
                      setSelectedReview(review);
                      setViewDialog(true);
                    }}
                    size="small"
                  >
                    <ViewIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* View/Moderate Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Review Details</DialogTitle>
        <DialogContent>
          {selectedReview && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle1">Review Information</Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography>Rating:</Typography>
                <Rating value={selectedReview.rating} readOnly />
              </Box>
              <Typography>Comment: {selectedReview.comment}</Typography>
              <Typography>Date: {formatDateTime(selectedReview.createdAt)}</Typography>

              <Typography variant="subtitle1" sx={{ mt: 2 }}>User Information</Typography>
              <Typography>Name: {selectedReview.user.name}</Typography>
              <Typography>Email: {selectedReview.user.email}</Typography>

              <Typography variant="subtitle1" sx={{ mt: 2 }}>Coach Information</Typography>
              <Typography>Name: {selectedReview.coach.name}</Typography>
              <Typography>Email: {selectedReview.coach.email}</Typography>

              <TextField
                fullWidth
                label="Moderation Comment"
                multiline
                rows={3}
                value={moderationComment}
                onChange={(e) => setModerationComment(e.target.value)}
                sx={{ mt: 2 }}
              />

              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button
                  onClick={() => handleModerateReview(selectedReview._id, 'approved')}
                  color="success"
                  variant="contained"
                  startIcon={<ApproveIcon />}
                >
                  Approve
                </Button>
                <Button
                  onClick={() => handleModerateReview(selectedReview._id, 'rejected')}
                  color="error"
                  variant="contained"
                  startIcon={<RejectIcon />}
                >
                  Reject
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReviewModeration; 