import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, isAfter, startOfDay } from 'date-fns';
import { coachService } from '../../services/api';

const Availability = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [availabilityData, setAvailabilityData] = useState([]);
  const [emergencyOffDates, setEmergencyOffDates] = useState([]);

  useEffect(() => {
    fetchAvailability();
    fetchEmergencyOff();
  }, []);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const response = await coachService.getAvailability();
      if (response?.data?.data?.availability) {
        setAvailabilityData(response.data.data.availability);
      }
    } catch (err) {
      setError('Error fetching availability');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmergencyOff = async () => {
    try {
      const response = await coachService.getEmergencyOff();
      if (response?.data?.data?.emergencyOff) {
        setEmergencyOffDates(response.data.data.emergencyOff);
      }
    } catch (err) {
      setError('Error fetching emergency off dates');
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    const existingSlots = availabilityData.find(
      (a) => format(new Date(a.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    )?.slots || [];
    setTimeSlots(existingSlots);
  };

  const handleAddTimeSlot = () => {
    if (!startTime || !endTime) {
      setError('Please select both start and end time');
      return;
    }

    const newSlot = {
      startTime: format(startTime, 'HH:mm'),
      endTime: format(endTime, 'HH:mm'),
      isBooked: false
    };

    setTimeSlots([...timeSlots, newSlot]);
    setStartTime(null);
    setEndTime(null);
    setOpenDialog(false);
  };

  const handleSaveAvailability = async () => {
    try {
      setLoading(true);
      const updatedAvailability = {
        date: selectedDate,
        slots: timeSlots
      };

      await coachService.updateAvailability({
        dates: [selectedDate],
        slots: timeSlots
      });

      setAvailabilityData([
        ...availabilityData.filter(
          (a) => format(new Date(a.date), 'yyyy-MM-dd') !== format(selectedDate, 'yyyy-MM-dd')
        ),
        updatedAvailability
      ]);

      setError('');
    } catch (err) {
      setError('Error saving availability');
    } finally {
      setLoading(false);
    }
  };

  const handleSetEmergencyOff = async () => {
    if (!selectedDate) {
      setError('Please select a date first');
      return;
    }

    try {
      setLoading(true);
      await coachService.setEmergencyOff({
        date: selectedDate,
        reason: 'Emergency day off',
        options: {
          refund: true,
          reschedule: true,
          cancel: true
        }
      });

      setEmergencyOffDates([...emergencyOffDates, { date: selectedDate }]);
      setError('');
    } catch (err) {
      setError('Error setting emergency off');
    } finally {
      setLoading(false);
    }
  };

  const isDateDisabled = (date) => {
    return !isAfter(startOfDay(date), startOfDay(new Date()));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Manage Availability
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <DatePicker
              label="Select Date"
              value={selectedDate}
              onChange={handleDateSelect}
              shouldDisableDate={isDateDisabled}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={() => setOpenDialog(true)}
              disabled={!selectedDate}
              sx={{ mr: 2 }}
            >
              Add Time Slot
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleSetEmergencyOff}
              disabled={!selectedDate}
            >
              Set Emergency Off
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Time Slots for {selectedDate ? format(selectedDate, 'MMMM dd, yyyy') : 'selected date'}
            </Typography>
            {timeSlots.map((slot, index) => (
              <Chip
                key={index}
                label={`${slot.startTime} - ${slot.endTime}`}
                onDelete={() => {
                  const newSlots = timeSlots.filter((_, i) => i !== index);
                  setTimeSlots(newSlots);
                }}
                sx={{ m: 0.5 }}
              />
            ))}
          </Grid>

          {timeSlots.length > 0 && (
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveAvailability}
                disabled={loading}
              >
                Save Availability
              </Button>
            </Grid>
          )}
        </Grid>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>Add Time Slot</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TimePicker
                label="Start Time"
                value={startTime}
                onChange={setStartTime}
                renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
              />
              <TimePicker
                label="End Time"
                value={endTime}
                onChange={setEndTime}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleAddTimeSlot} variant="contained">
              Add
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </LocalizationProvider>
  );
};

export default Availability; 