import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Alert,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { coachService } from '../../../services/api';

const AvailabilityManagement = () => {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [newSlot, setNewSlot] = useState({
    date: '',
    startTime: '',
    endTime: ''
  });

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const response = await coachService.getAvailability();
      setAvailability(response?.data?.data?.availability || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching availability');
      setAvailability([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async () => {
    try {
      await coachService.addAvailability(newSlot);
      setOpenDialog(false);
      setNewSlot({ date: '', startTime: '', endTime: '' });
      fetchAvailability();
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding slot');
    }
  };

  const handleDeleteSlot = async (id) => {
    try {
      await coachService.deleteAvailability(id);
      fetchAvailability();
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting slot');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Manage Availability
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpenDialog(true)}
        >
          Add New Slot
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {availability.length > 0 ? (
          availability.map((slot) => (
            <Grid item xs={12} sm={6} md={4} key={slot._id}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1">
                  {new Date(slot.date).toLocaleDateString()}
                </Typography>
                <Typography>
                  {slot.startTime} - {slot.endTime}
                </Typography>
                <Button
                  color="error"
                  size="small"
                  onClick={() => handleDeleteSlot(slot._id)}
                  sx={{ mt: 1 }}
                >
                  Delete
                </Button>
              </Paper>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="textSecondary">
                No availability slots found. Add some slots to get started.
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Add New Availability Slot</DialogTitle>
        <DialogContent>
          <TextField
            label="Date"
            type="date"
            fullWidth
            margin="normal"
            value={newSlot.date}
            onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Start Time"
            type="time"
            fullWidth
            margin="normal"
            value={newSlot.startTime}
            onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End Time"
            type="time"
            fullWidth
            margin="normal"
            value={newSlot.endTime}
            onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddSlot} 
            variant="contained"
            disabled={!newSlot.date || !newSlot.startTime || !newSlot.endTime}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AvailabilityManagement; 