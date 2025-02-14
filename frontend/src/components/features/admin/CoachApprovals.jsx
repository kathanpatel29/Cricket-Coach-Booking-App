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
import { toast } from 'react-hot-toast';

const CoachApprovals = () => {
  const [pendingCoaches, setPendingCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [approvalDialog, setApprovalDialog] = useState({ open: false, type: null });
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchPendingCoaches();
  }, []);

  const fetchPendingCoaches = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getPendingCoaches();
      
      if (response?.data?.data) {
        setPendingCoaches(response.data.data.coaches || []);
      } else {
        setPendingCoaches([]);
      }
    } catch (error) {
      console.error('Error fetching pending coaches:', error);
      setError('Unable to load pending coach approvals. Please try again later.');
      setPendingCoaches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setError('');
      await adminService.approveCoach(selectedCoach._id, { notes });
      setPendingCoaches(pendingCoaches.filter(coach => coach._id !== selectedCoach._id));
      setApprovalDialog({ open: false, type: null });
      setSelectedCoach(null);
      setNotes('');
      toast.success('Coach approved successfully');
    } catch (error) {
      console.error('Error approving coach:', error);
      setError(error.response?.data?.message || 'Error approving coach');
    }
  };

  const handleReject = async () => {
    try {
      setError('');
      await adminService.rejectCoach(selectedCoach._id, { notes });
      setPendingCoaches(pendingCoaches.filter(coach => coach._id !== selectedCoach._id));
      setApprovalDialog({ open: false, type: null });
      setSelectedCoach(null);
      setNotes('');
      toast.success('Coach rejected successfully');
    } catch (error) {
      console.error('Error rejecting coach:', error);
      setError(error.response?.data?.message || 'Error rejecting coach');
    }
  };

  const openDialog = (coach, type) => {
    setSelectedCoach(coach);
    setApprovalDialog({ open: true, type });
    setNotes('');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Typography variant="h5" gutterBottom>
        Pending Coach Approvals ({pendingCoaches?.length || 0})
      </Typography>

      <Grid container spacing={3}>
        {pendingCoaches && pendingCoaches.length > 0 ? (
          pendingCoaches.map((coach) => (
            <Grid item xs={12} md={6} key={coach._id}>
              <Card>
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6">
                      {coach.user?.name || 'Name not available'}
                    </Typography>
                    <Typography color="textSecondary">
                      {coach.user?.email || 'Email not available'}
                    </Typography>
                    {coach.user?.phone && (
                      <Typography color="textSecondary">
                        Phone: {coach.user.phone}
                      </Typography>
                    )}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Experience"
                        secondary={`${coach.experience} years`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Hourly Rate"
                        secondary={`$${coach.hourlyRate}/hour`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Location"
                        secondary={coach.location || 'Not specified'}
                      />
                    </ListItem>
                  </List>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Specializations:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {coach.specializations?.map((spec, index) => (
                        <Chip
                          key={index}
                          label={spec}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>

                  {coach.bio && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Bio:
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {coach.bio}
                      </Typography>
                    </Box>
                  )}

                  {coach.certifications && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Certifications:
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {coach.certifications}
                      </Typography>
                    </Box>
                  )}

                  {coach.documents && coach.documents.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Uploaded Documents:
                      </Typography>
                      <List dense>
                        {coach.documents.map((doc, index) => (
                          <ListItem key={index}>
                            <ListItemText
                              primary={doc.name}
                              secondary={`Type: ${doc.type}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </CardContent>

                <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => openDialog(coach, 'reject')}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => openDialog(coach, 'approve')}
                  >
                    Approve
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">
                No pending coach approvals at this time
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Approval/Rejection Dialog */}
      <Dialog
        open={approvalDialog.open}
        onClose={() => setApprovalDialog({ open: false, type: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {approvalDialog.type === 'approve' ? 'Approve Coach' : 'Reject Coach'}
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom sx={{ mt: 2 }}>
            {approvalDialog.type === 'approve'
              ? 'Please provide any notes for approving this coach:'
              : 'Please provide a reason for rejecting this coach:'}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label={approvalDialog.type === 'approve' ? 'Approval Notes' : 'Rejection Reason'}
            fullWidth
            multiline
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            required={approvalDialog.type === 'reject'}
            error={approvalDialog.type === 'reject' && !notes}
            helperText={approvalDialog.type === 'reject' && !notes ? 'Reason is required for rejection' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialog({ open: false, type: null })}>
            Cancel
          </Button>
          <Button
            onClick={approvalDialog.type === 'approve' ? handleApprove : handleReject}
            variant="contained"
            color={approvalDialog.type === 'approve' ? 'primary' : 'error'}
            disabled={approvalDialog.type === 'reject' && !notes}
          >
            {approvalDialog.type === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CoachApprovals; 