import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, isAfter, isBefore, startOfDay } from 'date-fns';
import { bookingService } from '../../services/api';

const TimeSlot = ({ time, selected, available, onClick }) => (
  <Button
    variant={selected ? "contained" : "outlined"}
    onClick={onClick}
    disabled={!available}
    fullWidth
    sx={{ mb: 1 }}
  >
    {time}
  </Button>
);

const BookingCalendar = ({ coachId, onTimeSelect }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedDate && coachId) {
      fetchAvailableSlots();
    }
  }, [selectedDate, coachId]);

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getAvailableSlots(
        coachId, 
        format(selectedDate, 'yyyy-MM-dd')
      );
      if (response?.data?.data?.slots) {
        setAvailableSlots(response.data.data.slots);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching available slots');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    if (onTimeSelect) {
      onTimeSelect({
        date: selectedDate,
        time: time
      });
    }
  };

  const isDateDisabled = (date) => {
    const today = startOfDay(new Date());
    const maxDate = startOfDay(new Date());
    maxDate.setMonth(maxDate.getMonth() + 3);
    
    return isBefore(date, today) || isAfter(date, maxDate);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper sx={{ p: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Select Date
            </Typography>
            <DateCalendar
              value={selectedDate}
              onChange={handleDateChange}
              shouldDisableDate={isDateDisabled}
              sx={{ width: '100%' }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Available Time Slots
            </Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : availableSlots.length > 0 ? (
              <Box>
                {availableSlots.map((slot) => (
                  <TimeSlot
                    key={slot.time}
                    time={slot.time}
                    selected={selectedTime === slot.time}
                    available={slot.available}
                    onClick={() => handleTimeSelect(slot.time)}
                  />
                ))}
              </Box>
            ) : (
              <Alert severity="info">
                No available slots for the selected date
              </Alert>
            )}
          </Grid>
        </Grid>
      </Paper>
    </LocalizationProvider>
  );
};

export default BookingCalendar; 