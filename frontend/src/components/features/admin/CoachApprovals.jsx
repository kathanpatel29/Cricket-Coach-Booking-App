import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { adminService } from '../../../services/api';
import { format } from 'date-fns';

const CoachApprovals = () => {
  const [pendingCoaches, setPendingCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [rejectDialog, setRejectDialog] = useState({ open: false, coach: null });
  const [rejectReason, setRejectReason] = useState('');
  const [detailsDialog, setDetailsDialog] = useState({ open: false, coach: null });

  useEffect(() => {
    fetchPendingCoaches();
  }, []);

  const fetchPendingCoaches = async () => {
    try {
      setLoading(true);
      const response = await adminService.getPendingCoaches();
      setPendingCoaches(response.data.data.coaches || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching pending coaches');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (coachId) => {
    try {
      await adminService.approveCoach(coachId);
      fetchPendingCoaches();
    } catch (err) {
      setError(err.response?.data?.message || 'Error approving coach');
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.coach) return;
    try {
      await adminService.rejectCoach(rejectDialog.coach._id, { reason: rejectReason });
      setRejectDialog({ open: false, coach: null });
      setRejectReason('');
      fetchPendingCoaches();
    } catch (err) {
      setError(err.response?.data?.message || 'Error rejecting coach');
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
        Pending Coach Approvals ({pendingCoaches.length})
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {pendingCoaches.map((coach) => (
          <Grid item xs={12} md={6} key={coach._id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {coach.user?.name}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  {coach.user?.email}
                </Typography>
                
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Specializations"
                      secondary={coach.specializations?.join(', ')}
                    />
                  </ListItem>
                  <Divider />
                  
                  <ListItem>
                    <ListItemText 
                      primary="Experience"
                      secondary={`${coach.experience} years`}
                    />
                  </ListItem>
                  <Divider />
                  
                  <ListItem>
                    <ListItemText 
                      primary="Hourly Rate"
                      secondary={`$${coach.hourlyRate}/hour`}
                    />
                  </ListItem>
                  <Divider />
                  
                  <ListItem>
                    <ListItemText 
                      primary="Location"
                      secondary={coach.location || 'Not specified'}
                    />
                  </ListItem>
                  <Divider />
                  
                  <ListItem>
                    <ListItemText 
                      primary="Bio"
                      secondary={coach.bio}
                      secondaryTypographyProps={{ 
                        style: { 
                          maxHeight: '100px', 
                          overflow: 'auto' 
                        } 
                      }}
                    />
                  </ListItem>
                </List>

                {coach.certifications && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Certifications
                    </Typography>
                    <Typography variant="body2">
                      {coach.certifications}
                    </Typography>
                  </Box>
                )}

                {coach.documents?.length > 0 && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Uploaded Documents
                    </Typography>
                    {coach.documents.map((doc, index) => (
                      <Chip
                        key={index}
                        label={doc.name}
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>
                )}
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  color="primary"
                  onClick={() => handleApprove(coach._id)}
                >
                  Approve
                </Button>
                <Button
                  size="small"
                  color="error"
                  onClick={() => setRejectDialog({ open: true, coach })}
                >
                  Reject
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
          

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialog.open}
        onClose={() => setRejectDialog({ open: false, coach: null })}
      >
        <DialogTitle>Reject Coach Application</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Please provide a reason for rejecting {rejectDialog.coach?.user?.name}'s application:
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Reason"
            fullWidth
            multiline
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog({ open: false, coach: null })}>
            Cancel
          </Button>
          <Button onClick={handleReject} color="error" disabled={!rejectReason}>
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CoachApprovals;