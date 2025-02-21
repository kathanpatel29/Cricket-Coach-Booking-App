import React from 'react';
import {
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Box
} from '@mui/material';
import { toast } from 'react-hot-toast';

const AvailabilitySettings = ({ settings, onSettingsChange, onSave }) => {
  const handleSave = async () => {
    try {
      await onSave();
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Availability Settings
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Booking Cutoff Hours"
            name="bookingCutoffHours"
            value={settings.bookingCutoffHours}
            onChange={onSettingsChange}
            helperText="Minimum hours before session start time that bookings are allowed"
            InputProps={{ inputProps: { min: 1, max: 72 } }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Availability Window (Days)"
            name="availabilityDays"
            value={settings.availabilityDays}
            onChange={onSettingsChange}
            helperText="How many days in advance can users book sessions"
            InputProps={{ inputProps: { min: 1, max: 90 } }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Default Session Duration (Minutes)"
            name="defaultSessionDuration"
            value={settings.defaultSessionDuration}
            onChange={onSettingsChange}
            helperText="Default duration for coaching sessions"
            InputProps={{ inputProps: { min: 30, max: 180, step: 15 } }}
          />
        </Grid>
      </Grid>

      <Box mt={3}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
        >
          Save Settings
        </Button>
      </Box>
    </Paper>
  );
};

export default AvailabilitySettings; 