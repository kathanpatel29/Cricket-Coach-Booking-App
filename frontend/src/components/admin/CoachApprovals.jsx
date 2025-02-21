import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Alert,
  CircularProgress
} from '@mui/material';
import { adminService } from '../../services/api';
import { toast } from 'react-hot-toast';

const CoachApprovals = () => {
  const [pendingCoaches, setPendingCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPendingCoaches();
  }, []);

  const fetchPendingCoaches = async () => {
    try {
      setLoading(true);
      const response = await adminService.getPendingCoaches();
      setPendingCoaches(response.data.coaches || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch pending coaches');
      toast.error('Error loading pending coaches');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (coachId) => {
    try {
      setActionLoading(true);
      await adminService.approveCoach(coachId, 'Approved by admin');
      setPendingCoaches(pendingCoaches.filter(coach => coach.id !== coachId));
      toast.success('Coach approved successfully');
      fetchPendingCoaches();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve coach');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (coachId, reason) => {
    try {
      setActionLoading(true);
      await adminService.rejectCoach(coachId, reason);
      setPendingCoaches(pendingCoaches.filter(coach => coach.id !== coachId));
      toast.success('Coach rejected successfully');
      fetchPendingCoaches();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject coach');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRejectDialog = (coach) => {
    setSelectedCoach(coach);
    setRejectReason('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedCoach(null);
    setRejectReason('');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box m={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Pending Coach Approvals
      </Typography>

      {pendingCoaches.length === 0 ? (
        <Alert severity="info">No pending coach approvals</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Specializations</TableCell>
                <TableCell>Experience</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingCoaches.map((coach) => (
                <TableRow key={coach._id}>
                  <TableCell>{coach.user?.name}</TableCell>
                  <TableCell>{coach.user?.email}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      {coach.specializations?.map((spec) => (
                        <Chip key={spec} label={spec} size="small" />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell>{coach.experience} years</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={2}>
                      <Button 
                        variant="contained" 
                        color="success" 
                        onClick={() => handleApprove(coach._id)}
                        disabled={actionLoading}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => handleOpenRejectDialog(coach)}
                        disabled={actionLoading}
                      >
                        Reject
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Reject Coach Application</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for Rejection"
            fullWidth
            multiline
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={() => handleReject(selectedCoach._id, rejectReason)} color="error" variant="contained">
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CoachApprovals; 