import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Rating,
  LinearProgress,
  Grid,
  Stack
} from '@mui/material';

const RatingBar = ({ value, total, rating }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
      <Box sx={{ minWidth: 45 }}>
        <Typography variant="body2">{rating} stars</Typography>
      </Box>
      <Box sx={{ flexGrow: 1 }}>
        <LinearProgress
          variant="determinate"
          value={percentage}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              backgroundColor: rating >= 4 ? 'success.main' : 
                             rating >= 3 ? 'warning.main' : 'error.main'
            }
          }}
        />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2">{value}</Typography>
      </Box>
    </Box>
  );
};

const ReviewStats = ({ stats }) => {
  const {
    averageRating,
    totalReviews,
    ratingDistribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    }
  } = stats;

  return (
    <Paper sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Stack alignItems="center" spacing={1}>
            <Typography variant="h3" color="primary">
              {averageRating?.toFixed(1) || '0.0'}
            </Typography>
            <Rating 
              value={averageRating || 0} 
              readOnly 
              precision={0.5}
              size="large"
            />
            <Typography variant="body2" color="text.secondary">
              Based on {totalReviews} reviews
            </Typography>
          </Stack>
        </Grid>

        <Grid item xs={12} md={8}>
          <Box>
            {[5, 4, 3, 2, 1].map((rating) => (
              <RatingBar
                key={rating}
                rating={rating}
                value={ratingDistribution[rating] || 0}
                total={totalReviews}
              />
            ))}
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              * Reviews are from verified sessions only
            </Typography>
            <Typography variant="body2" color="text.secondary">
              * All reviews are moderated before being published
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ReviewStats; 