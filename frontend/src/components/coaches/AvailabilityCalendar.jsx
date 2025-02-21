import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack
} from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';
import { coachService } from '../../services/api';

const TimeSlot = ({ slot, selected, onClick }) => (
  <Chip
    label={`${slot.start} - ${slot.end}`}
    color={selected ? "primary" : "default"}
    onClick={onClick}
    sx={{ m: 0.5 }}
  />
);

const AvailabilityCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeZone, setTimeZone] = useState('UTC');

  useEffect(() => {
    fetchAvailability();
  }, [selectedDate]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const response = await coachService.getAvailability(format(selectedDate, 'yyyy-MM-dd'));
      if (response?.data?.data?.slots) {
        setAvailableSlots(response.data.data.slots);
        setSelectedSlots(response.data.data.slots.filter(slot => slot.isAvailable));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching availability');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotToggle = (slot) => {
    setSelectedSlots(prev => {
      const isSelected = prev.some(s => 
        s.start === slot.start && s.end === slot.end
      );
      if (isSelected) {
        return prev.filter(s => 
          s.start !== slot.start || s.end !== slot.end
        );
      }
      return [...prev, slot];
    });
  };

  const handleSaveAvailability = async () => {
    try {
      setLoading(true);
      await coachService.updateAvailability({
        date: format(selectedDate, 'yyyy-MM-dd'),
        slots: selectedSlots,
        timeZone
      });
      // Refresh the availability after saving
      await fetchAvailability();
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating availability');
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    let hour = 6; // Start at 6 AM
    while (hour < 22) { // End at 10 PM
      slots.push({
        start: `${hour.toString().padStart(2, '0')}:00`,
        end: `${(hour + 1).toString().padStart(2, '0')}:00`
      });
      hour++;
    }
    return slots;
  };

  return (
    <Paper sx={{ p: 3 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Select Date
          </Typography>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateCalendar
              value={selectedDate}
              onChange={setSelectedDate}
              minDate={startOfDay(new Date())}
              maxDate={addDays(new Date(), 90)}
            />
          </LocalizationProvider>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box mb={2}>
            <Typography variant="h6" gutterBottom>
              Time Slots
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Time Zone</InputLabel>
              <Select
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
                label="Time Zone"
              >
                <MenuItem value="UTC">UTC</MenuItem>
                <MenuItem value="America/New_York">Eastern Time</MenuItem>
                <MenuItem value="America/Chicago">Central Time</MenuItem>
                <MenuItem value="America/Denver">Mountain Time</MenuItem>
                <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center">
              <CircularProgress />
            </Box>
          ) : (
            <Stack direction="row" flexWrap="wrap">
              {generateTimeSlots().map((slot) => (
                <TimeSlot
                  key={slot.start}
                  slot={slot}
                  selected={selectedSlots.some(s => 
                    s.start === slot.start && s.end === slot.end
                  )}
                  onClick={() => handleSlotToggle(slot)}
                />
              ))}
            </Stack>
          )}

          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleSaveAvailability}
            disabled={loading}
            sx={{ mt: 2 }}
          >
            Save Availability
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default AvailabilityCalendar; 