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
  Stack,
  TextField
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { addDays, format, isAfter, isBefore, startOfDay } from 'date-fns';
import { coachService } from '../../services/api';
import { toast } from 'react-hot-toast';
import withApprovalCheck from '../../components/hoc/withApprovalCheck';

const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00'
];

const Availability = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [recurringAvailability, setRecurringAvailability] = useState({});
  const [settings, setSettings] = useState({
    bookingCutoffHours: 12,
    availabilityDays: 30, // How many days in advance they want to show availability
    defaultSessionDuration: 60,
    timeSlots: [],
    recurringAvailability: {}
  });

  useEffect(() => {
    fetchAvailability();
    fetchAvailabilitySettings();
  }, [selectedDate]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const response = await coachService.getAvailability(format(selectedDate, 'yyyy-MM-dd'));
      if (response?.data?.data) {
        setAvailableSlots(response.data.data.availableSlots || []);
        setRecurringAvailability(response.data.data.recurringAvailability || {});
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching availability');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailabilitySettings = async () => {
    try {
      const response = await coachService.getAvailabilitySettings();
      if (response.data?.settings) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      toast.error('Failed to fetch availability settings');
    }
  };

  const handleSlotToggle = (slot) => {
    setAvailableSlots(prev => {
      if (prev.includes(slot)) {
        return prev.filter(s => s !== slot);
      }
      return [...prev, slot].sort();
    });
  };

  const handleRecurringChange = (day, slots) => {
    setRecurringAvailability(prev => ({
      ...prev,
      [day]: slots
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await coachService.updateAvailability({
        date: format(selectedDate, 'yyyy-MM-dd'),
        slots: availableSlots,
        recurring: recurringAvailability
      });

      if (response?.data?.status === 'success') {
        toast.success('Availability updated successfully');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating availability');
      toast.error('Failed to update availability');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      await coachService.updateAvailabilitySettings(settings);
      toast.success('Availability settings updated successfully');
    } catch (error) {
      toast.error('Failed to update availability settings');
    }
  };

  const isSlotAvailable = (slot) => availableSlots.includes(slot);

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Manage Availability
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Select Date"
                value={selectedDate}
                onChange={setSelectedDate}
                minDate={startOfDay(new Date())}
                maxDate={addDays(new Date(), 90)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Available Time Slots
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {timeSlots.map((slot) => (
                <Chip
                  key={slot}
                  label={slot}
                  onClick={() => handleSlotToggle(slot)}
                  color={isSlotAvailable(slot) ? 'primary' : 'default'}
                  variant={isSlotAvailable(slot) ? 'filled' : 'outlined'}
                  sx={{ minWidth: 80 }}
                />
              ))}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Recurring Availability
            </Typography>
            <Stack spacing={2}>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <FormControl key={day} fullWidth>
                  <InputLabel>{day}</InputLabel>
                  <Select
                    multiple
                    value={recurringAvailability[day] || []}
                    onChange={(e) => handleRecurringChange(day, e.target.value)}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((slot) => (
                          <Chip key={slot} label={slot} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {timeSlots.map((slot) => (
                      <MenuItem key={slot} value={slot}>
                        {slot}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Booking Cutoff Hours"
              name="bookingCutoffHours"
              value={settings.bookingCutoffHours}
              onChange={handleSettingsChange}
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
              onChange={handleSettingsChange}
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
              onChange={handleSettingsChange}
              helperText="Default duration for coaching sessions"
              InputProps={{ inputProps: { min: 30, max: 180, step: 15 } }}
            />
          </Grid>
        </Grid>

        <Box display="flex" justifyContent="flex-end" mt={3}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} /> : 'Save Availability'}
          </Button>
        </Box>

        <Box mt={3}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveSettings}
          >
            Save Settings
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default withApprovalCheck(Availability); 