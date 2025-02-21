import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Rating,
  Divider,
  Alert,
  CircularProgress,
  Pagination,
  Stack,
  Chip
} from '@mui/material';
import { reviewService } from '../../services/api';
import { formatDateTime } from '../../utils/dateUtils';

const ReviewList = ({ coachId, showPagination = true }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchReviews();
  }, [coachId, page]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await (coachId 
        ? reviewService.getCoachReviews(coachId, page)
        : reviewService.getUserReviews(page));

      if (response?.data?.data) {
        setReviews(response.data.data.reviews);
        setTotalPages(response.data.data.totalPages);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching reviews');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (reviews.length === 0) {
    return <Alert severity="info">No reviews yet</Alert>;
  }

  return (
    <Stack spacing={2}>
      {reviews.map((review) => (
        <Paper key={review._id} sx={{ p: 2 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              src={review.user.profileImage}
              alt={review.user.name}
            >
              {review.user.name[0]}
            </Avatar>
            <Box flex={1}>
              <Typography variant="subtitle1">
                {review.user.name}
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Rating value={review.rating} readOnly precision={0.5} />
                <Typography variant="body2" color="text.secondary">
                  {formatDateTime(review.createdAt)}
                </Typography>
              </Box>
            </Box>
            <Chip
              label={review.status}
              color={review.status === 'approved' ? 'success' : 'default'}
              size="small"
            />
          </Box>
          
          <Typography sx={{ mt: 2 }}>
            {review.comment}
          </Typography>

          {review.coachReply && (
            <Box sx={{ mt: 2, pl: 2, borderLeft: 2, borderColor: 'primary.main' }}>
              <Typography variant="subtitle2" color="primary">
                Coach's Reply:
              </Typography>
              <Typography variant="body2">
                {review.coachReply}
              </Typography>
            </Box>
          )}
        </Paper>
      ))}

      {showPagination && totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}
    </Stack>
  );
};

export default ReviewList; 