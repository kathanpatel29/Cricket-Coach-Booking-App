import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Stack,
  Card,
  CardContent,
  CardActions,
  Badge,
  Snackbar,
  useMediaQuery,
  useTheme,
  ToggleButtonGroup,
  ToggleButton,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';

import { coachApi } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { getCachedData, setCachedData, clearCacheEntry, generateCacheKey } from '../../utils/cacheUtils';

// Icons
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DeleteIcon from '@mui/icons-material/Delete';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import AddIcon from '@mui/icons-material/Add';
import ListIcon from '@mui/icons-material/List';
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import InfoIcon from '@mui/icons-material/Info';
import RefreshIcon from '@mui/icons-material/Refresh';

// Date utilities
import { 
  format, 
  parseISO, 
  isBefore, 
  isAfter, 
  addDays, 
  addMinutes, 
  isValid, 
  startOfDay, 
  endOfDay, 
  isWithinInterval,
  addHours,
  parse,
  setHours,
  setMinutes,
  startOfToday
} from 'date-fns';

const CoachSchedule = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // View management
  const [activeView, setActiveView] = useState('calendar');
  const [activeTab, setActiveTab] = useState(0);
  
  // Time slots state
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Time slot creation state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeRange, setTimeRange] = useState('morning');
  const [customStartTime, setCustomStartTime] = useState('09:00');
  const [customEndTime, setCustomEndTime] = useState('17:00');
  const [duration, setDuration] = useState(60);
  const [repeat, setRepeat] = useState(false);
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState(null);
  
  // Notification state
  const [notification, setNotification] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });

  // Capacity dialog state
  const [capacityDialogOpen, setCapacityDialogOpen] = useState(false);
  const [selectedSlotForCapacity, setSelectedSlotForCapacity] = useState(null);
  const [newCapacity, setNewCapacity] = useState(1);
  const [capacityError, setCapacityError] = useState('');
  
  // Add capacity field to the newSlot state or wherever the form data is stored
  const [newSlot, setNewSlot] = useState({
    date: null,
    startTime: '',
    endTime: '',
    duration: 60,
    capacity: 1,
    location: {
      type: 'online', // 'online' or 'in-person'
      address: '',
      notes: ''
    }
  });
  
  // Add the missing creatingSlot state
  const [creatingSlot, setCreatingSlot] = useState(false);

  // Time slot fetch management
  const lastFetchTimeRef = useRef(0);
  const fetchInProgressRef = useRef(false);
  const TIME_SLOTS_CACHE_KEY = 'coach_time_slots';
  const RATE_LIMIT_INTERVAL = 30000; // 30 seconds between fetches
  const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache

  // Add refresh button state to show countdown
  const [refreshDisabled, setRefreshDisabled] = useState(false);
  const [refreshCountdown, setRefreshCountdown] = useState(0);
  const refreshTimerRef = useRef(null);

  // Add state for backend status
  const [backendStatus, setBackendStatus] = useState({
    isDown: false,
    lastChecked: null
  });

  // Auto-sync approval status on component mount
  useEffect(() => {
    if (user && user.role === 'coach' && user.isApproved) {
      const syncApprovalIfNeeded = async () => {
        try {
          await coachApi.syncApprovalStatus();
          console.log('Approval status synchronized automatically');
        } catch (error) {
          console.error('Auto-sync failed:', error);
        }
      };
      
      syncApprovalIfNeeded();
    }
  }, [user]);
  
  // Authorization check and data fetching
  useEffect(() => {
    console.log('CoachSchedule component mounted/updated');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('user:', user);
    
    if (!isAuthenticated) {
      console.log('Not authenticated, navigating to login');
      navigate('/login');
      return;
    }
    
    if (user && !user.isApproved) {
      console.log('User not approved, navigating to pending-approval');
      navigate('/coach/pending-approval');
      return;
    }
    
    console.log('Calling fetchTimeSlots...');
    
    // Try to load from cache first
    const cachedData = getCachedData(TIME_SLOTS_CACHE_KEY);
    if (cachedData) {
      console.log('Using cached time slots data');
      setTimeSlots(cachedData);
      setLoading(false);
    }
    
    // Then fetch fresh data if not too soon since last fetch
    fetchTimeSlotsWithRateLimit(false);
  }, [isAuthenticated, user, navigate]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle view change
  const handleViewChange = (event, newView) => {
    if (newView) setActiveView(newView);
  };
  
  // Fetch time slots with rate limiting
  const fetchTimeSlotsWithRateLimit = useCallback(async (forceRefresh = false, showLoading = true) => {
    const now = Date.now();
    
    // Skip if we're already fetching
    if (fetchInProgressRef.current) {
      console.log('Fetch already in progress, skipping duplicate request');
      return;
    }
    
    // Check rate limiting unless forced refresh
    if (!forceRefresh && now - lastFetchTimeRef.current < RATE_LIMIT_INTERVAL) {
      console.log('Rate limiting time slot fetch, using cached data if available');
      
      // Use cached data if within rate limit period
      const cachedData = getCachedData(TIME_SLOTS_CACHE_KEY);
      if (cachedData) {
        console.log('Using cached time slots data due to rate limiting');
        return;
      }
      
      // If here, we're rate limited but no cache available
      if (timeSlots.length === 0) {
        // Only show this if we don't have data yet
        setError('Please wait a moment before refreshing again.');
      }
      
      return;
    }
    
    // Update fetch timestamp and mark fetch as in progress
    lastFetchTimeRef.current = now;
    fetchInProgressRef.current = true;
    
    if (showLoading) {
      setLoading(true);
    }
    
    // Actual fetch with retry logic
    await fetchTimeSlots(showLoading);
    
    // Mark fetch as complete
    fetchInProgressRef.current = false;
  }, [timeSlots.length]);
  
  // Fetch time slots
  const fetchTimeSlots = async (showLoading = true) => {
    // Use exponential backoff for retries
    const maxRetries = 3;
    let retryCount = 0;
    let delay = 1000; // Start with 1 second
    
    // If already showing data, don't show error banner on fetch fail
    const hasExistingData = timeSlots.length > 0;
    
    const attemptFetch = async () => {
      try {
        if (showLoading) {
          setLoading(true);
        }
        if (!hasExistingData) {
          setError(null);
        }
        
        // Reset backend status if we're trying a fresh fetch
        if (backendStatus.isDown) {
          setBackendStatus(prev => ({
            ...prev,
            lastChecked: new Date()
          }));
        }
        
        console.log('Fetching time slots...');
        
        const response = await coachApi.getTimeSlots();
        console.log('API response:', response);
        
        // Check if this is a fallback response due to backend issues
        if (response._fromEmergencyFallback) {
          console.log('Using emergency fallback data');
          setBackendStatus({
            isDown: true,
            lastChecked: new Date()
          });
          
          // Show a non-blocking notification about backend status
          setNotification({
            open: true,
            message: 'Server is currently unavailable. Using cached data where possible.',
            severity: 'warning'
          });
          
          // If we have existing data, keep using it
          if (hasExistingData) {
            setLoading(false);
            return;
          }
        }
        
        // If response is from cache during backend issues, show notification
        if (response._fromCache) {
          console.log('Using cached data due to backend issues');
          setNotification({
            open: true,
            message: 'Using cached data while server is unavailable.',
            severity: 'info'
          });
        }
        
        // The API returns time slots in response.data.data.data
        if (response.data) {
          // Extract the actual time slots array
          const rawSlots = response.data.data?.data || [];
          console.log('Raw slots extracted:', rawSlots);
          
          // Handle empty array
          if (!rawSlots.length) {
            console.log('No time slots found in response');
            setTimeSlots([]);
            setLoading(false);
            return;
          }
          
          // Format time slots for display
          const formattedSlots = rawSlots.map((slot) => {
            try {
              const slotDate = new Date(slot.date);
              const dateStr = slotDate.toISOString().split('T')[0];
              
              return {
                id: slot._id,
                date: dateStr,
                startTime: slot.startTime,
                endTime: slot.endTime,
                duration: slot.duration,
                status: slot.status === 'booked' ? 'booked' : 'available',
                bookingId: slot.bookingId || null,
                formattedDate: format(slotDate, 'EEEE, MMMM d, yyyy'),
                formattedStartTime: format(parseISO(`${dateStr}T${slot.startTime}`), 'h:mm a'),
                formattedEndTime: format(parseISO(`${dateStr}T${slot.endTime}`), 'h:mm a'),
                isPast: isBefore(parseISO(`${dateStr}T${slot.endTime}`), new Date()),
                isWithin24Hours: isBefore(
                  parseISO(`${dateStr}T${slot.startTime}`),
                  addHours(new Date(), 24)
                ),
                capacity: slot.capacity || 1,
                bookedCount: slot.bookedCount || 0,
                location: slot.location || { type: 'online', address: '', notes: '' }
              };
            } catch (formatError) {
              console.error('Error formatting time slot:', formatError, slot);
              return null;
            }
          }).filter(slot => slot !== null);
          
          // Log the formatted slots
          console.log('Formatted slots:', formattedSlots);
          
          // Sort by date and time
          const sortedSlots = formattedSlots.sort((a, b) => {
            const dateA = parseISO(`${a.date}T${a.startTime}`);
            const dateB = parseISO(`${b.date}T${b.startTime}`);
            return dateA - dateB;
          });
          
          // Set slots in state and cache
          setTimeSlots(sortedSlots);
          setCachedData(TIME_SLOTS_CACHE_KEY, sortedSlots, CACHE_DURATION);
          console.log('Set time slots state with:', sortedSlots.length, 'slots');
          
          // If we successfully got data, reset backend status
          if (backendStatus.isDown) {
            setBackendStatus({
              isDown: false,
              lastChecked: new Date()
            });
          }
        } else {
          console.error('Unexpected API response format:', response);
          if (!hasExistingData) {
            setTimeSlots([]);
            setError('Unexpected API response format');
          }
        }
      } catch (err) {
        console.error('Error fetching time slots:', err);
        
        // Check if this is a handled error (backend down)
        if (err.isServerDown) {
          console.log('Backend server is down');
          setBackendStatus({
            isDown: true,
            lastChecked: new Date()
          });
          
          // Show a non-blocking notification
          setNotification({
            open: true,
            message: 'Server is currently unavailable. Using cached data where possible.',
            severity: 'warning'
          });
          
          // If we have existing data, keep showing it
          if (hasExistingData) {
            setLoading(false);
            return;
          }
        }
        
        // Only retry on network errors or rate limiting
        if ((err.response && err.response.status === 429) || !err.response) {
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying fetch (${retryCount}/${maxRetries}) after ${delay}ms`);
            
            // Wait with exponential backoff
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Double the delay for next retry
            
            // Try again
            return attemptFetch();
          }
        }
        
        // Show error only if we don't already have data
        if (!hasExistingData) {
          if (err.response && err.response.status === 403 && 
              err.response.data.message === "Your profile has not been approved yet" &&
              user && user.isApproved) {
            setError('There appears to be a discrepancy between your user and coach approval status. Please refresh the page to automatically sync your status.');
          } else if (err.response && err.response.status === 429) {
            setError('Too many requests. Please try again in a moment.');
          } else if (err.isRateLimit) {
            setError(`Too many requests. Please try again in ${Math.ceil(err.retryAfter/1000)} seconds.`);
          } else if (err.isServerDown || err.isHandled) {
            setError(err.message || 'Server is currently unavailable. Please try again later.');
          } else {
            setError('Failed to fetch your schedule. Please try again later.');
          }
        }
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    };
    
    // Start the fetch attempt
    return attemptFetch();
  };
  
  // Get time range values based on selection
  const getTimeRangeValues = () => {
    switch (timeRange) {
      case 'morning':
        return { start: '09:00', end: '12:00' };
      case 'afternoon':
        return { start: '13:00', end: '17:00' };
      case 'evening':
        return { start: '18:00', end: '21:00' };
      case 'custom':
        return { start: customStartTime, end: customEndTime };
      default:
        return { start: '09:00', end: '17:00' };
    }
  };
  
  // Generate time slots
  const generateTimeSlots = () => {
    if (!selectedDate) {
      setNotification({
        open: true,
        message: 'Please select a date first',
        severity: 'warning'
      });
      return null;
    }
    
    // Validate address if in-person
    if (newSlot.location.type === 'in-person' && !newSlot.location.address.trim()) {
      setNotification({
        open: true,
        message: 'Please enter an address for in-person sessions',
        severity: 'warning'
      });
      return null;
    }
    
    // Get start and end times
    const { start, end } = getTimeRangeValues();
    
    // Prepare dates to create slots for
    const dates = [selectedDate];
    if (repeat) {
      for (let i = 1; i <= 4; i++) {
        dates.push(addDays(selectedDate, i * 7)); // Weekly recurrence
      }
    }
    
    // Generate slots for each date
    let allTimeSlots = [];
    
    for (const slotDate of dates) {
      // Skip dates in the past
      if (isBefore(slotDate, startOfToday())) {
        continue;
      }
      
      let currentStartTime = parse(start, 'HH:mm', slotDate);
      const endDateTime = parse(end, 'HH:mm', slotDate);
      
      while (isBefore(currentStartTime, endDateTime)) {
        const slotEndTime = addMinutes(currentStartTime, duration);
        
        if (isAfter(slotEndTime, endDateTime)) {
          break;
        }
        
        allTimeSlots.push({
          date: format(slotDate, 'yyyy-MM-dd'),
          startTime: format(currentStartTime, 'HH:mm'),
          endTime: format(slotEndTime, 'HH:mm'),
          duration,
          location: {
            type: newSlot.location.type,
            address: newSlot.location.address,
            notes: newSlot.location.notes
          }
        });
        
        currentStartTime = slotEndTime;
      }
    }
    
    return allTimeSlots;
  };
  
  // Create time slots
  const createTimeSlots = async () => {
    const slots = generateTimeSlots();
    
    if (!slots || slots.length === 0) {
      setNotification({
        open: true,
        message: 'No valid time slots could be generated with the selected criteria',
        severity: 'warning'
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Check if backend is down before attempting to create
      if (backendStatus.isDown) {
        setNotification({
          open: true,
          message: 'Cannot create time slots while server is unavailable. Please try again later.',
          severity: 'error'
        });
        setLoading(false);
        return;
      }
      
      // Send all time slots in a single API call
      console.log('Creating time slots:', slots);
      const response = await coachApi.createTimeSlot({ slots });
      
      setNotification({
        open: true,
        message: `Successfully created ${slots.length} time slots`,
        severity: 'success'
      });
      
      // Reset form
      setSelectedDate(new Date());
      setTimeRange('morning');
      setDuration(60);
      setRepeat(false);
      
      // Clear cache and refresh time slots
      clearCacheEntry(TIME_SLOTS_CACHE_KEY);
      fetchTimeSlotsWithRateLimit(true);
    } catch (err) {
      console.error('Error creating time slots:', err);
      
      // Handle specific error for backend unavailability
      if (err.isHandled || err.isServerDown) {
        setNotification({
          open: true,
          message: err.message || 'Cannot create time slots while server is unavailable',
          severity: 'error'
        });
      } else {
        setNotification({
          open: true,
          message: err.response?.data?.message || 'Failed to create time slots',
          severity: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Delete time slot
  const deleteTimeSlot = async (id) => {
    try {
      setLoading(true);
      
      // Check if backend is down before attempting to delete
      if (backendStatus.isDown) {
        setNotification({
          open: true,
          message: 'Cannot delete time slots while server is unavailable. Please try again later.',
          severity: 'error'
        });
        setLoading(false);
        setDeleteDialogOpen(false);
        setSlotToDelete(null);
        return;
      }
      
      await coachApi.deleteTimeSlot(id);
      
      setNotification({
        open: true,
        message: 'Time slot deleted successfully',
        severity: 'success'
      });
      
      // Clear cache and refresh time slots
      clearCacheEntry(TIME_SLOTS_CACHE_KEY);
      fetchTimeSlotsWithRateLimit(true);
    } catch (err) {
      console.error('Error deleting time slot:', err);
      
      // Handle specific error for backend unavailability
      if (err.isHandled || err.isServerDown) {
        setNotification({
          open: true,
          message: err.message || 'Cannot delete time slots while server is unavailable',
          severity: 'error'
        });
      } else {
        setNotification({
          open: true,
          message: err.response?.data?.message || 'Failed to delete time slot',
          severity: 'error'
        });
      }
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setSlotToDelete(null);
    }
  };
  
  // Open delete dialog
  const openDeleteDialog = (slot) => {
    setSlotToDelete(slot);
    setDeleteDialogOpen(true);
  };
  
  // Close notification
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };
  
  // Filter time slots based on tab
  const getFilteredTimeSlots = () => {
    switch (activeTab) {
      case 0: // All
        return timeSlots;
      case 1: // Available
        return timeSlots.filter(slot => slot.status === 'available' && !slot.isPast);
      case 2: // Booked
        return timeSlots.filter(slot => slot.status === 'booked');
      case 3: // Past
        return timeSlots.filter(slot => slot.isPast);
      default:
        return timeSlots;
    }
  };
  
  // Group time slots by date
  const groupSlotsByDate = () => {
    const grouped = {};
    
    getFilteredTimeSlots().forEach(slot => {
      if (!grouped[slot.date]) {
        grouped[slot.date] = [];
      }
      grouped[slot.date].push(slot);
    });
    
    return grouped;
  };
  
  // Calendar View Component
  const CalendarView = () => {
    // Organize slots by date
    const slotsByDate = groupSlotsByDate();
    const dates = Object.keys(slotsByDate).sort();
    
    console.log('CalendarView: Number of dates:', dates.length);
    console.log('CalendarView: Dates:', dates);
    
    if (dates.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No time slots found for the selected filter. 
          Use the "Create Time Slots" section below to add availability.
        </Alert>
      );
    }
    
    return (
      <Grid container spacing={2}>
        {dates.map(date => (
          <Grid item xs={12} key={date}>
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
              </Typography>
              
              <Grid container spacing={1}>
                {slotsByDate[date].map(slot => (
                  <Grid item xs={12} sm={6} md={4} key={slot.id}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        borderLeft: '4px solid',
                        borderLeftColor: slot.isPast 
                          ? 'grey.400'
                          : slot.status === 'booked' 
                            ? 'primary.main' 
                            : 'success.main'
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle2">
                            {slot.formattedStartTime} - {slot.formattedEndTime}
                          </Typography>
                          <Chip 
                            label={slot.isPast ? 'Past' : slot.status === 'booked' ? 'Booked' : 'Available'} 
                            color={slot.isPast ? 'default' : slot.status === 'booked' ? 'primary' : 'success'} 
                            size="small"
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {slot.duration} minutes
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary">
                          Capacity: {slot.capacity || 1} {slot.bookedCount > 0 && `(${slot.bookedCount} booked)`}
                        </Typography>
                        
                        {/* Location information */}
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                          <Chip 
                            label={slot.location?.type === 'in-person' ? 'In-Person' : 'Online'} 
                            size="small" 
                            color={slot.location?.type === 'in-person' ? 'secondary' : 'info'}
                            sx={{ mr: 1 }}
                          />
                        </Box>
                        
                        {slot.location?.type === 'in-person' && slot.location?.address && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.8rem' }}>
                            {slot.location.address}
                            {slot.location.notes && (
                              <Box component="span" sx={{ display: 'block', fontStyle: 'italic', mt: 0.5 }}>
                                {slot.location.notes}
                              </Box>
                            )}
                          </Typography>
                        )}
                      </CardContent>
                      
                      <CardActions>
                        <Button 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCapacityDialog(slot);
                          }}
                        >
                          Edit Capacity
                        </Button>
                        
                        {!slot.isPast && slot.status !== 'booked' && !slot.isWithin24Hours && (
                          <Button 
                            size="small" 
                            color="error" 
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteDialog(slot);
                            }}
                          >
                            Delete
                          </Button>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  };
  
  // List View Component
  const ListView = () => {
    const filteredSlots = getFilteredTimeSlots();
    
    if (filteredSlots.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No time slots found for the selected filter.
          Use the "Create Time Slots" section below to add availability.
        </Alert>
      );
    }
    
    console.log('Rendering ListView with slots:', filteredSlots.length);
    
    return (
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSlots.map(slot => (
              <TableRow key={slot.id}>
                <TableCell>{slot.formattedDate}</TableCell>
                <TableCell>{slot.formattedStartTime} - {slot.formattedEndTime}</TableCell>
                <TableCell>{slot.duration} min</TableCell>
                <TableCell>
                  <Chip 
                    label={slot.location?.type === 'in-person' ? 'In-Person' : 'Online'} 
                    size="small" 
                    color={slot.location?.type === 'in-person' ? 'secondary' : 'info'}
                  />
                  {slot.location?.type === 'in-person' && slot.location?.address && (
                    <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                      {slot.location.address}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={slot.isPast ? 'Past' : slot.status === 'booked' ? 'Booked' : 'Available'} 
                    color={slot.isPast ? 'default' : slot.status === 'booked' ? 'primary' : 'success'} 
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {!slot.isPast && slot.status !== 'booked' && !slot.isWithin24Hours && (
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteDialog(slot);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };
  
  // Stats calculation
  const stats = {
    total: timeSlots.length,
    available: timeSlots.filter(slot => slot.status === 'available' && !slot.isPast).length,
    booked: timeSlots.filter(slot => slot.status === 'booked').length,
    past: timeSlots.filter(slot => slot.isPast).length
  };
  
  console.log('Stats calculation:', stats);
  
  // Debug helper for component render
  console.log('Component render state - timeSlots length:', timeSlots.length);
  
  // Add a function to handle opening the capacity dialog
  const handleOpenCapacityDialog = (slot) => {
    setSelectedSlotForCapacity(slot);
    setNewCapacity(slot.capacity || 1);
    setCapacityError('');
    setCapacityDialogOpen(true);
  };

  // Add a function to handle closing the capacity dialog
  const handleCloseCapacityDialog = () => {
    setCapacityDialogOpen(false);
    setSelectedSlotForCapacity(null);
  };

  // Add a function to handle updating the capacity
  const handleUpdateCapacity = async () => {
    if (!selectedSlotForCapacity) return;
    
    // Validate capacity
    if (!newCapacity || newCapacity < 1) {
      setCapacityError('Capacity must be at least 1');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await coachApi.updateTimeSlot(selectedSlotForCapacity.id, {
        capacity: parseInt(newCapacity)
      });
      
      if (response.data.status === 'success') {
        // Update local state
        setTimeSlots(timeSlots.map(slot => 
          slot.id === selectedSlotForCapacity.id 
            ? { ...slot, capacity: parseInt(newCapacity) }
            : slot
        ));
        
        // Show success message
        setNotification({
          open: true,
          message: 'Time slot capacity updated successfully',
          severity: 'success'
        });
        
        handleCloseCapacityDialog();
      }
    } catch (err) {
      console.error('Error updating capacity:', err);
      setCapacityError(err.response?.data?.message || 'Failed to update capacity');
    } finally {
      setLoading(false);
    }
  };
  
  // In the form handling section, make sure to include capacity in the API call
  const handleCreateSlot = async () => {
    // Validate the date is selected
    if (!selectedDate) {
      setNotification({
        open: true,
        message: 'Please select a date',
        severity: 'warning'
      });
      return;
    }
    
    // Validate address if in-person
    if (newSlot.location.type === 'in-person' && !newSlot.location.address.trim()) {
      setNotification({
        open: true,
        message: 'Please enter an address for in-person sessions',
        severity: 'warning'
      });
      return;
    }
    
    // Generate time slots using the existing function that divides by duration
    const slots = generateTimeSlots();
    
    if (!slots || slots.length === 0) {
      setNotification({
        open: true,
        message: 'No valid time slots could be generated with the selected criteria',
        severity: 'warning'
      });
      return;
    }
    
    try {
      setCreatingSlot(true);
      
      // Add capacity and location to each slot
      const slotsWithDetails = slots.map(slot => ({
        ...slot,
        capacity: parseInt(newSlot.capacity || 1),
        location: {
          type: newSlot.location.type,
          address: newSlot.location.address,
          notes: newSlot.location.notes
        }
      }));
      
      // Create the time slots
      const slotData = {
        slots: slotsWithDetails
      };
      
      console.log('Creating time slots:', slotData);
      console.log('Number of slots being created:', slotsWithDetails.length);
      
      const response = await coachApi.createTimeSlot(slotData);
      
      if (response.data.status === 'success') {
        setNotification({
          open: true,
          message: `Successfully created ${slotsWithDetails.length} time slots`,
          severity: 'success'
        });
        
        // Reset form
        setSelectedDate(new Date());
        setTimeRange('morning');
        setDuration(60);
        setRepeat(false);
        setNewSlot({
          ...newSlot,
          capacity: 1,
          location: {
            type: 'online',
            address: '',
            notes: ''
          }
        });
        
        // Refresh time slots
        fetchTimeSlotsWithRateLimit(true);
      }
    } catch (error) {
      console.error('Error creating time slots:', error);
      setNotification({
        open: true,
        message: error.response?.data?.message || 'Failed to create time slots',
        severity: 'error'
      });
    } finally {
      setCreatingSlot(false);
    }
  };

  // Update the refresh function to include countdown timer
  const refreshTimeSlots = useCallback(() => {
    // Check if already loading or rate limited
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    
    if (loading) {
      setNotification({
        open: true,
        message: 'Already loading data...',
        severity: 'info'
      });
      return;
    }
    
    if (timeSinceLastFetch < RATE_LIMIT_INTERVAL) {
      const secondsRemaining = Math.ceil((RATE_LIMIT_INTERVAL - timeSinceLastFetch) / 1000);
      setRefreshDisabled(true);
      setRefreshCountdown(secondsRemaining);
      
      // Clear any existing timer
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      
      // Start countdown timer
      refreshTimerRef.current = setInterval(() => {
        setRefreshCountdown(prev => {
          if (prev <= 1) {
            clearInterval(refreshTimerRef.current);
            setRefreshDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      setNotification({
        open: true,
        message: `Please wait ${secondsRemaining} seconds before refreshing again`,
        severity: 'info'
      });
      return;
    }
    
    // Force refresh with rate limiting
    fetchTimeSlotsWithRateLimit(true, true);
    
    setNotification({
      open: true,
      message: 'Refreshing time slots...',
      severity: 'info'
    });
  }, [loading, fetchTimeSlotsWithRateLimit]);
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, []);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        {/* Backend Status Alert */}
        {backendStatus.isDown && (
          <Alert 
            severity="warning" 
            sx={{ mb: 3 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={refreshTimeSlots}
                disabled={refreshDisabled || loading}
              >
                Check Server
              </Button>
            }
          >
            Server is currently unavailable. Using cached data where possible.
          </Alert>
        )}
        
        {/* Error Alert for API issues */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={refreshTimeSlots}
                disabled={refreshDisabled || loading}
              >
                {refreshDisabled ? `Retry (${refreshCountdown}s)` : 'Retry'}
              </Button>
            }
          >
            {error}
          </Alert>
        )}
        
        {/* Page Header */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ mb: { xs: 2, sm: 0 } }}>
            My Schedule
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              color="primary"
              startIcon={refreshDisabled ? null : <RefreshIcon />}
              onClick={refreshTimeSlots}
              disabled={refreshDisabled || loading}
            >
              {refreshDisabled ? `Refresh (${refreshCountdown}s)` : 'Refresh'}
            </Button>
            
            <Button 
              variant="contained" 
              onClick={() => navigate('/coach/availability')}
              startIcon={<EventAvailableIcon />}
            >
              Set Regular Hours
            </Button>
          </Box>
        </Box>
        
        {/* Main content */}
        <Grid container spacing={3}>
          {/* Schedule View Section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">My Coaching Schedule</Typography>
                
                <ToggleButtonGroup
                  value={activeView}
                  exclusive
                  onChange={handleViewChange}
                  size="small"
                >
                  <ToggleButton value="calendar">
                    <CalendarViewMonthIcon sx={{ mr: 1 }} />
                    Calendar
                  </ToggleButton>
                  <ToggleButton value="list">
                    <ListIcon sx={{ mr: 1 }} />
                    List
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
              
              {/* Stats Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">Total</Typography>
                    <Typography variant="h4">{stats.total}</Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'success.50', textAlign: 'center' }}>
                    <Typography variant="h6" color="success.main">Available</Typography>
                    <Typography variant="h4" color="success.main">{stats.available}</Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'primary.50', textAlign: 'center' }}>
                    <Typography variant="h6" color="primary.main">Booked</Typography>
                    <Typography variant="h4" color="primary.main">{stats.booked}</Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.100', textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">Past</Typography>
                    <Typography variant="h4" color="text.secondary">{stats.past}</Typography>
                  </Paper>
                </Grid>
              </Grid>
              
              {/* Filter Tabs */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab label="All Slots" />
                  <Tab label="Available" />
                  <Tab label="Booked" />
                  <Tab label="Past" />
                </Tabs>
              </Box>
              
              {/* Capacity Info Section */}
              <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: 'info.50' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <InfoIcon color="info" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">Time Slot Capacity Management</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  You can now set a capacity for each time slot, allowing multiple students to book the same time slot.
                  Set capacity when creating new slots or edit existing ones. The time slot will be marked as full
                  when capacity is reached. You cannot reduce capacity below the number of existing bookings.
                </Typography>
              </Paper>
              
              {/* Loading Indicator */}
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                // View Content
                activeView === 'calendar' ? <CalendarView /> : <ListView />
              )}
            </Paper>
          </Grid>
          
          {/* Create Time Slots Section */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ mb: 3 }}>Create Time Slots</Typography>
              
              {/* Date Selection */}
              <DatePicker
                label="Select Date"
                value={selectedDate}
                onChange={setSelectedDate}
                minDate={new Date()}
                slotProps={{ textField: { fullWidth: true, sx: { mb: 3 } } }}
              />
              
              {/* Time Range Selection */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  label="Time Range"
                >
                  <MenuItem value="morning">Morning (9:00 AM - 12:00 PM)</MenuItem>
                  <MenuItem value="afternoon">Afternoon (1:00 PM - 5:00 PM)</MenuItem>
                  <MenuItem value="evening">Evening (6:00 PM - 9:00 PM)</MenuItem>
                  <MenuItem value="custom">Custom Range</MenuItem>
                </Select>
              </FormControl>
              
              {/* Custom Time Range */}
              {timeRange === 'custom' && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <TextField
                      label="Start Time"
                      type="time"
                      value={customStartTime}
                      onChange={(e) => setCustomStartTime(e.target.value)}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ step: 300 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="End Time"
                      type="time"
                      value={customEndTime}
                      onChange={(e) => setCustomEndTime(e.target.value)}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ step: 300 }}
                    />
                  </Grid>
                </Grid>
              )}
              
              {/* Session Duration */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Session Duration</InputLabel>
                <Select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  label="Session Duration"
                >
                  <MenuItem value={30}>30 minutes</MenuItem>
                  <MenuItem value={45}>45 minutes</MenuItem>
                  <MenuItem value={60}>1 hour</MenuItem>
                  <MenuItem value={90}>1.5 hours</MenuItem>
                  <MenuItem value={120}>2 hours</MenuItem>
                </Select>
              </FormControl>
              
              {/* Repeat Option */}
              <FormControlLabel
                control={
                  <Switch
                    checked={repeat}
                    onChange={(e) => setRepeat(e.target.checked)}
                    color="primary"
                  />
                }
                label="Repeat weekly for next 4 weeks"
                sx={{ mb: 3 }}
              />

              {/* Capacity field to the newSlot state */}
              <TextField
                label="Capacity"
                type="number"
                fullWidth
                value={newSlot.capacity}
                onChange={(e) => setNewSlot({ ...newSlot, capacity: e.target.value })}
                InputProps={{ inputProps: { min: 1 } }}
                helperText="Maximum number of students for this time slot"
                margin="normal"
              />
              
              {/* Session Type Selection */}
              <FormControl fullWidth sx={{ mb: 3, mt: 2 }}>
                <InputLabel>Session Type</InputLabel>
                <Select
                  value={newSlot.location.type}
                  onChange={(e) => setNewSlot({
                    ...newSlot,
                    location: {
                      ...newSlot.location,
                      type: e.target.value
                    }
                  })}
                  label="Session Type"
                >
                  <MenuItem value="online">Online Session</MenuItem>
                  <MenuItem value="in-person">In-Person Session</MenuItem>
                </Select>
              </FormControl>
              
              {/* Location fields - only show if in-person is selected */}
              {newSlot.location.type === 'in-person' && (
                <Box sx={{ mb: 3 }}>
                  <TextField
                    label="Address"
                    fullWidth
                    value={newSlot.location.address}
                    onChange={(e) => setNewSlot({
                      ...newSlot,
                      location: {
                        ...newSlot.location,
                        address: e.target.value
                      }
                    })}
                    placeholder="Enter the full address"
                    margin="normal"
                    required
                  />
                  <TextField
                    label="Location Notes"
                    fullWidth
                    value={newSlot.location.notes}
                    onChange={(e) => setNewSlot({
                      ...newSlot,
                      location: {
                        ...newSlot.location,
                        notes: e.target.value
                      }
                    })}
                    placeholder="E.g., 'Meet at the cricket field entrance', 'Parking available'"
                    margin="normal"
                    multiline
                    rows={2}
                  />
                </Box>
              )}
              
              {/* Create Button */}
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleCreateSlot}
                disabled={loading || creatingSlot}
                startIcon={loading || creatingSlot ? <CircularProgress size={20} /> : <AddIcon />}
              >
                {loading || creatingSlot ? 'Creating...' : 'Create Time Slots'}
              </Button>
            </Paper>
          </Grid>
          
          {/* Help Section */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ mb: 3 }}>Quick Guide</Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                How to create time slots:
              </Typography>
              
              <Typography variant="body2" paragraph>
                1. Select a date from the calendar.
              </Typography>
              
              <Typography variant="body2" paragraph>
                2. Choose a time range (morning, afternoon, evening) or set a custom range.
              </Typography>
              
              <Typography variant="body2" paragraph>
                3. Select the duration for each coaching session.
              </Typography>
              
              <Typography variant="body2" paragraph>
                4. Set the capacity (maximum number of students per session).
              </Typography>
              
              <Typography variant="body2" paragraph>
                5. Choose the session type (online or in-person) and provide location details if needed.
              </Typography>
              
              <Typography variant="body2" paragraph>
                6. If you want this schedule to repeat weekly, toggle the switch.
              </Typography>
              
              <Typography variant="body2" paragraph>
                7. Click "Create Time Slots" to add them to your schedule.
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                Important notes:
              </Typography>
              
              <Typography variant="body2" paragraph>
                • You cannot delete slots that have been booked by students.
              </Typography>
              
              <Typography variant="body2" paragraph>
                • Slots within 24 hours cannot be deleted.
              </Typography>
              
              <Typography variant="body2" paragraph>
                • For in-person sessions, always provide a complete address to help students find the location.
              </Typography>
              
              <Typography variant="body2" paragraph>
                • Use the location notes field to provide additional details like parking information or meeting points.
              </Typography>
              
              <Typography variant="body2" paragraph>
                • Use the tabs to filter your slots by status.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
        
        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete the time slot on 
              {slotToDelete && ` ${slotToDelete.formattedDate} at ${slotToDelete.formattedStartTime}`}?
              This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => deleteTimeSlot(slotToDelete?.id)} 
              color="error" 
              variant="contained"
              startIcon={<DeleteIcon />}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Notification Snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          sx={{ '& .MuiSnackbarContent-root': { minWidth: '200px' } }}
          TransitionProps={{ 
            onEnter: undefined,
            onEntered: undefined,
            onEntering: undefined,
            onExit: undefined,
            onExited: undefined,
            onExiting: undefined
          }}
        >
          <Alert 
            onClose={handleCloseNotification} 
            severity={notification.severity} 
            sx={{ width: '100%' }}
            variant="filled"
          >
            {notification.message}
          </Alert>
        </Snackbar>
        
        {/* Capacity Dialog */}
        <Dialog open={capacityDialogOpen} onClose={handleCloseCapacityDialog}>
          <DialogTitle>Update Capacity</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Set the maximum number of students that can book this time slot.
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              label="Capacity"
              type="number"
              fullWidth
              variant="outlined"
              value={newCapacity}
              onChange={(e) => setNewCapacity(e.target.value)}
              error={!!capacityError}
              helperText={capacityError}
              InputProps={{ inputProps: { min: 1 } }}
            />
            {selectedSlotForCapacity?.bookedCount > 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                This time slot already has {selectedSlotForCapacity.bookedCount} booking(s). 
                The capacity cannot be lower than this number.
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCapacityDialog}>Cancel</Button>
            <Button onClick={handleUpdateCapacity} color="primary">
              Update
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default CoachSchedule; 