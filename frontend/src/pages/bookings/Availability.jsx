import { useState, useEffect } from 'react';
import { coachService } from '../../services/api';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { styled } from '@mui/material/styles';
import { Box, Typography, Paper, Grid, Card, CardContent, CardActions, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Alert, FormGroup, FormControlLabel, Checkbox, TextField } from '@mui/material';
import { toast } from 'react-hot-toast';

// Styled wrapper for the calendar
const StyledCalendarWrapper = styled('div')({
  '.selected-date': {
    backgroundColor: '#0077b6 !important',
    color: 'white !important',
    '&:hover': {
      backgroundColor: '#005b8e !important',
    }
  },
  '.react-calendar__tile--now': {
    backgroundColor: '#e6f3f9 !important',
    '&.selected-date': {
      backgroundColor: '#0077b6 !important'
    }
  }
});

const Availability = () => {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDates, setSelectedDates] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartDate, setDragStartDate] = useState(null);
  const [timeSlot, setTimeSlot] = useState({
    startTime: '',
    endTime: ''
  });
  const [emergencyOff, setEmergencyOff] = useState([]);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [selectedEmergencyDate, setSelectedEmergencyDate] = useState(null);
  const [emergencyReason, setEmergencyReason] = useState('');
  const [emergencyOffDialog, setEmergencyOffDialog] = useState({
    open: false,
    date: null,
    reason: '',
    options: {
      refund: true,
      reschedule: true,
      cancel: true
    }
  });

  // Time slots from 6 AM to 10 PM in 30-minute intervals
  const timeOptions = [];
  for (let hour = 6; hour < 22; hour++) {
    const formattedHour = hour.toString().padStart(2, '0');
    timeOptions.push(`${formattedHour}:00`);
    timeOptions.push(`${formattedHour}:30`);
  }

  useEffect(() => {
    fetchAvailability();
    fetchEmergencyOff();
  }, []);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const response = await coachService.getAvailability();
      if (response?.data?.data?.availability) {
        setAvailability(response.data.data.availability);
      }
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError(err.response?.data?.message || 'Failed to fetch availability');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmergencyOff = async () => {
    try {
      const response = await coachService.getEmergencyOff();
      if (response?.data?.data?.emergencyOff) {
        setEmergencyOff(response.data.data.emergencyOff);
      }
    } catch (err) {
      console.error('Error fetching emergency off dates:', err);
      setError(err.response?.data?.message || 'Failed to fetch emergency off dates');
    }
  };

  const handleDateClick = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const index = selectedDates.findIndex(d => 
      d.toISOString().split('T')[0] === dateStr
    );
    
    if (index > -1) {
      setSelectedDates(prev => prev.filter((_, i) => i !== index));
    } else {
      setSelectedDates(prev => [...prev, date]);
    }
  };

  const handleRangeSelect = (range) => {
    if (!range || !range[0] || !range[1]) return;
    
    const [start, end] = range;
    const dates = [];
    const current = new Date(start);
    
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    setSelectedDates(dates);
  };

  const handleAddTimeSlot = async () => {
    if (selectedDates.length === 0) {
      setError('Please select at least one date');
      return;
    }

    if (!timeSlot.startTime || !timeSlot.endTime) {
      setError('Please select both start and end time');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Format the availability data
      const newSlots = selectedDates.map(date => ({
        date: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        isBooked: false
      }));

      // Get existing availability
      const existingAvailability = availability.filter(slot => {
        const slotDate = new Date(slot.date);
        return !selectedDates.some(selectedDate => 
          selectedDate.toISOString().split('T')[0] === slot.date
        );
      });

      // Combine existing and new slots
      const updatedAvailability = [...existingAvailability, ...newSlots].sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        return dateCompare || a.startTime.localeCompare(b.startTime);
      });

      // Update availability
      await coachService.updateAvailability(updatedAvailability);

      // Refresh availability data
      await fetchAvailability();
      
      // Reset form
      setSelectedDates([]);
      setTimeSlot({ startTime: '', endTime: '' });
      setSuccess('Time slots added successfully');
    } catch (err) {
      console.error('Error adding time slots:', err);
      setError(err.response?.data?.message || 'Failed to add time slots');
    } finally {
      setLoading(false);
    }
  };

  const handleSetEmergencyOff = async () => {
    try {
      setError('');
      const { date, reason, options } = emergencyOffDialog;
      
      if (!date || !reason) {
        setError('Please provide both date and reason for emergency off');
        return;
      }

      await coachService.setEmergencyOff({
        date: date.toISOString().split('T')[0],
        reason,
        options
      });

      // Refresh emergency off dates
      await fetchEmergencyOff();
      
      // Close dialog and reset form
      setEmergencyOffDialog({
        open: false,
        date: null,
        reason: '',
        options: {
          refund: true,
          reschedule: true,
          cancel: true
        }
      });

      // Show success message
      toast.success('Emergency off set successfully');
    } catch (err) {
      console.error('Error setting emergency off:', err);
      setError(err.response?.data?.message || 'Failed to set emergency off');
    }
  };

  const handleRemoveEmergencyOff = async (date) => {
    try {
      setError('');
      await coachService.removeEmergencyOff(date);
      await fetchEmergencyOff();
      toast.success('Emergency off removed successfully');
    } catch (err) {
      console.error('Error removing emergency off:', err);
      setError(err.response?.data?.message || 'Failed to remove emergency off');
    }
  };

  const handleDeleteTimeSlot = async (dateToDelete, timeToDelete) => {
    try {
      const updatedAvailability = availability.filter(
        slot => !(slot.date === dateToDelete && 
                 slot.startTime === timeToDelete.startTime && 
                 slot.endTime === timeToDelete.endTime)
      );
      await coachService.updateAvailability(updatedAvailability);
      setAvailability(updatedAvailability);
      setSuccess('Time slot deleted successfully');
    } catch (err) {
      setError('Failed to delete time slot');
    }
  };

  const renderAvailability = () => {
    // Group by date instead of day
    const groupedByDate = availability.reduce((acc, slot) => {
      if (!acc[slot.date]) acc[slot.date] = [];
      acc[slot.date].push(slot);
      return acc;
    }, {});

    // Sort dates
    const sortedDates = Object.keys(groupedByDate).sort();

    return sortedDates.map(date => {
      const slots = groupedByDate[date] || [];
      if (slots.length === 0) return null;

      return (
        <div key={date} className="border-b last:border-b-0 pb-4">
          <h3 className="font-semibold text-lg text-gray-800 mb-3">
            {new Date(date).toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {slots
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((slot, index) => (
                <div
                  key={index}
                  className={`flex justify-between items-center p-3 rounded-md ${
                    slot.isBooked 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <span className="text-gray-700">
                    {slot.startTime} - {slot.endTime}
                  </span>
                  {slot.isBooked ? (
                    <span className="text-blue-600 text-sm font-medium">
                      Booked
                    </span>
                  ) : (
                    <button
                      onClick={() => handleDeleteTimeSlot(slot.date, slot)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      );
    }).filter(Boolean);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Manage Availability
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Emergency Off Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Emergency Off Dates</Typography>
          <Button
            variant="contained"
            onClick={() => setEmergencyOffDialog({ ...emergencyOffDialog, open: true })}
          >
            Set Emergency Off
          </Button>
        </Box>

        {emergencyOff.length > 0 ? (
          <Grid container spacing={2}>
            {emergencyOff.map((off) => (
              <Grid item xs={12} sm={6} md={4} key={off.date}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1">
                      {new Date(off.date).toLocaleDateString()}
                    </Typography>
                    <Typography color="textSecondary">{off.reason}</Typography>
                    <Box mt={1}>
                      {off.options.refund && <Chip size="small" label="Refund" sx={{ mr: 0.5 }} />}
                      {off.options.reschedule && <Chip size="small" label="Reschedule" sx={{ mr: 0.5 }} />}
                      {off.options.cancel && <Chip size="small" label="Cancel" />}
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleRemoveEmergencyOff(off.date)}
                    >
                      Remove
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography color="textSecondary">No emergency off dates set</Typography>
        )}
      </Paper>

      {/* Emergency Off Dialog */}
      <Dialog
        open={emergencyOffDialog.open}
        onClose={() => setEmergencyOffDialog({ ...emergencyOffDialog, open: false })}
      >
        <DialogTitle>Set Emergency Off</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <DatePicker
              label="Select Date"
              value={emergencyOffDialog.date}
              onChange={(newDate) => setEmergencyOffDialog({ ...emergencyOffDialog, date: newDate })}
              renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
              minDate={new Date()}
            />
            <TextField
              fullWidth
              label="Reason"
              value={emergencyOffDialog.reason}
              onChange={(e) => setEmergencyOffDialog({ ...emergencyOffDialog, reason: e.target.value })}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={emergencyOffDialog.options.refund}
                    onChange={(e) => setEmergencyOffDialog({
                      ...emergencyOffDialog,
                      options: { ...emergencyOffDialog.options, refund: e.target.checked }
                    })}
                  />
                }
                label="Allow Refunds"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={emergencyOffDialog.options.reschedule}
                    onChange={(e) => setEmergencyOffDialog({
                      ...emergencyOffDialog,
                      options: { ...emergencyOffDialog.options, reschedule: e.target.checked }
                    })}
                  />
                }
                label="Allow Rescheduling"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={emergencyOffDialog.options.cancel}
                    onChange={(e) => setEmergencyOffDialog({
                      ...emergencyOffDialog,
                      options: { ...emergencyOffDialog.options, cancel: e.target.checked }
                    })}
                  />
                }
                label="Allow Cancellation"
              />
            </FormGroup>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmergencyOffDialog({ ...emergencyOffDialog, open: false })}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSetEmergencyOff}>
            Set Emergency Off
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rest of your component JSX */}
    </Box>
  );
};

export default Availability;