import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Rating,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Divider,
  Pagination
} from '@mui/material';
import { adminApi } from '../../services/api';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import { format } from 'date-fns';

const ModerateReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [moderationDialogOpen, setModerationDialogOpen] = useState(false);
  const [moderationStatus, setModerationStatus] = useState('approved');
  const [moderationNotes, setModerationNotes] = useState('');
  const [moderating, setModerating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch all reviews that need moderation
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await adminApi.getAllReviews({ page, limit: 10 });

        if (response.data && response.data.status === 'success') {
          setReviews(response.data.data.reviews || []);
          setTotalPages(response.data.data.pagination?.pages || 1);
        } else {
          throw new Error('Failed to fetch reviews');
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError('Failed to load reviews. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [page]);

  // Handle opening moderation dialog
  const handleOpenModerationDialog = (review) => {
    setSelectedReview(review);
    setModerationStatus(review.status || 'pending');
    setModerationNotes(review.moderationNotes || '');
    setModerationDialogOpen(true);
  };

  // Handle closing moderation dialog
  const handleCloseModerationDialog = () => {
    setModerationDialogOpen(false);
    setSelectedReview(null);
    setModerationStatus('approved');
    setModerationNotes('');
    setSuccess(false);
  };

  // Handle moderation submission
  const handleModerateReview = async () => {
    if (!selectedReview) return;

    try {
      setModerating(true);
      setError(null);

      const response = await adminApi.moderateReview(selectedReview._id, {
        status: moderationStatus,
        moderationNotes: moderationNotes.trim()
      });

      if (response.data && response.data.status === 'success') {
        setSuccess(true);
        
        // Update local state
        setReviews(reviews.map(review => 
          review._id === selectedReview._id
            ? { ...review, status: moderationStatus, moderationNotes }
            : review
        ));

        // Close dialog after a short delay
        setTimeout(() => {
          handleCloseModerationDialog();
        }, 1500);
      } else {
        throw new Error('Failed to moderate review');
      }
    } catch (err) {
      console.error('Error moderating review:', err);
      setError(err.response?.data?.message || 'Failed to moderate review. Please try again.');
    } finally {
      setModerating(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get status chip for display
  const getStatusChip = (status) => {
    let color;
    let icon;
    
    switch (status) {
      case 'approved':
        color = 'success';
        icon = <CheckCircleIcon fontSize="small" />;
        break;
      case 'rejected':
        color = 'error';
        icon = <BlockIcon fontSize="small" />;
        break;
      default:
        color = 'warning';
        icon = null;
    }
    
    return (
      <Chip 
        size="small" 
        color={color} 
        icon={icon}
        label={status?.toUpperCase() || 'PENDING'} 
      />
    );
  };

  // Handle page change
  const handlePageChange = (event, value) => {
    setPage(value);
  };

  if (loading && reviews.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Moderate Reviews
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {reviews.length === 0 ? (
          <Alert severity="info" sx={{ my: 2 }}>
            No reviews found to moderate.
          </Alert>
        ) : (
          <>
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Coach</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell>Comment</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reviews.map((review) => (
                    <TableRow key={review._id} hover>
                      <TableCell>{review.user?.name || 'Unknown User'}</TableCell>
                      <TableCell>{review.coach?.user?.name || 'Unknown Coach'}</TableCell>
                      <TableCell>
                        <Rating value={review.rating} readOnly size="small" />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant="body2" noWrap title={review.comment}>
                          {review.comment}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDate(review.createdAt)}</TableCell>
                      <TableCell>{getStatusChip(review.status)}</TableCell>
                      <TableCell>
                        <Button 
                          size="small" 
                          variant="outlined"
                          onClick={() => handleOpenModerationDialog(review)}
                        >
                          Moderate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Pagination 
                count={totalPages} 
                page={page} 
                onChange={handlePageChange} 
                color="primary" 
              />
            </Box>
          </>
        )}
      </Paper>
      
      {/* Moderation Dialog */}
      <Dialog
        open={moderationDialogOpen}
        onClose={handleCloseModerationDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Moderate Review
          <IconButton
            aria-label="close"
            onClick={handleCloseModerationDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          {selectedReview && (
            <>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Review moderated successfully!
                </Alert>
              )}
              
              <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">User</Typography>
                    <Typography variant="body1">{selectedReview.user?.name || 'Unknown User'}</Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Coach</Typography>
                    <Typography variant="body1">{selectedReview.coach?.user?.name || 'Unknown Coach'}</Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Date</Typography>
                    <Typography variant="body1">{formatDate(selectedReview.createdAt)}</Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Rating</Typography>
                    <Rating value={selectedReview.rating} readOnly />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Comment</Typography>
                    <Typography variant="body1">{selectedReview.comment}</Typography>
                  </Grid>
                </Grid>
              </Paper>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                Moderation Decision
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="moderation-status-label">Status</InputLabel>
                <Select
                  labelId="moderation-status-label"
                  value={moderationStatus}
                  onChange={(e) => setModerationStatus(e.target.value)}
                  label="Status"
                  disabled={moderating || success}
                >
                  <MenuItem value="approved">Approve</MenuItem>
                  <MenuItem value="rejected">Reject</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                label="Moderation Notes"
                multiline
                rows={3}
                value={moderationNotes}
                onChange={(e) => setModerationNotes(e.target.value)}
                fullWidth
                placeholder="Enter any notes or reasons for this moderation decision..."
                disabled={moderating || success}
              />
            </>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseModerationDialog} disabled={moderating}>
            Cancel
          </Button>
          <Button 
            onClick={handleModerateReview} 
            variant="contained" 
            color="primary"
            disabled={moderating || success}
          >
            {moderating ? <CircularProgress size={24} /> : 'Submit Decision'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ModerateReviews; 