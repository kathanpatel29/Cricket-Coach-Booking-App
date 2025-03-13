import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { coachApi } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  Divider,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  CircularProgress,
  Alert,
  LinearProgress,
  Stack,
  Chip
} from '@mui/material';
import { Link } from 'react-router-dom';

const CoachDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncingApproval, setSyncingApproval] = useState(false);
  const [approvalSynced, setApprovalSynced] = useState(false);
  const [timeSlots, setTimeSlots] = useState([]);
  const [timeSlotLoading, setTimeSlotLoading] = useState(false);

  useEffect(() => {
    // Redirect unapproved coaches to the pending approval page
    if (user && user.role === 'coach' && !user.isApproved) {
      console.log('CoachDashboard - User is not approved, redirecting to pending approval');
      navigate('/coach/pending-approval');
      return;
    }

    console.log('CoachDashboard - User:', user);

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await coachApi.getCoachDashboard();
        setDashboardData(response.data.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        // Check if the error is due to approval status discrepancy
        if (err.response && err.response.status === 403 && 
            err.response.data.message === "Your profile has not been approved yet" &&
            user && user.isApproved) {
          setError('There appears to be a discrepancy between your user and coach approval status. Please click "Sync Approval Status" to fix this issue.');
        } else {
          setError('Failed to load dashboard data. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    // Fetch time slots for the dashboard
    const fetchTimeSlots = async () => {
      try {
        setTimeSlotLoading(true);
        const response = await coachApi.getTimeSlots();
        
        if (response.data && response.data.data) {
          // Extract time slots from the nested response structure
          const rawSlots = response.data.data?.data || [];
          
          if (rawSlots.length > 0) {
            // Format time slots similar to CoachSchedule component
            const formattedSlots = rawSlots.map((slot) => {
              try {
                const slotDate = new Date(slot.date);
                return {
                  id: slot._id,
                  date: slotDate.toISOString().split('T')[0],
                  startTime: slot.startTime,
                  endTime: slot.endTime,
                  duration: slot.duration,
                  status: slot.status,
                  isBooked: slot.status === 'booked',
                  formattedDate: slotDate.toLocaleDateString(undefined, { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  }),
                  isPast: new Date(`${slotDate.toISOString().split('T')[0]}T${slot.endTime}`) < new Date()
                };
              } catch (err) {
                console.error('Error formatting time slot:', err);
                return null;
              }
            }).filter(slot => slot !== null);
            
            // Sort by date and time
            const sortedSlots = formattedSlots.sort((a, b) => {
              const dateA = new Date(`${a.date}T${a.startTime}`);
              const dateB = new Date(`${b.date}T${b.startTime}`);
              return dateA - dateB;
            });
            
            // Only show upcoming/available slots
            const upcomingSlots = sortedSlots.filter(slot => !slot.isPast);
            // Get the first 5 upcoming slots
            setTimeSlots(upcomingSlots.slice(0, 5));
          } else {
            setTimeSlots([]);
          }
        }
      } catch (err) {
        console.error('Error fetching time slots:', err);
      } finally {
        setTimeSlotLoading(false);
      }
    };

    if (user && user.isApproved) {
      fetchDashboardData();
      fetchTimeSlots();
    }
  }, [user, navigate]);

  // Function to sync coach approval status with user approval status
  const handleSyncApproval = async () => {
    try {
      setSyncingApproval(true);
      const response = await coachApi.syncApprovalStatus();
      console.log('Sync approval response:', response);
      
      setApprovalSynced(true);
      setError(null);
      
      // Reload the dashboard data
      const dashboardResponse = await coachApi.getCoachDashboard();
      setDashboardData(dashboardResponse.data.data);
      
      // Set a timeout to reset the synced status after 5 seconds
      setTimeout(() => {
        setApprovalSynced(false);
      }, 5000);
    } catch (err) {
      console.error('Error syncing approval status:', err);
      setError('Failed to sync approval status. Please try again later.');
    } finally {
      setSyncingApproval(false);
    }
  };

  if (!user || !user.isApproved) {
    return null; // Will be redirected by the useEffect
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Alert severity="error" sx={{ mb: 2, maxWidth: '600px' }}>
          {error}
        </Alert>
        {error.includes('discrepancy') && (
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleSyncApproval}
            disabled={syncingApproval}
            sx={{ mt: 2 }}
          >
            {syncingApproval ? 'Syncing...' : 'Sync Approval Status'}
          </Button>
        )}
      </Box>
    );
  }

  // If the backend is not yet implemented, show a placeholder
  const placeholderData = {
    upcomingBookings: [],
    pendingBookings: [],
    monthlyStats: {
      totalBookings: 0,
      completedBookings: 0,
      earnings: 0
    },
    timeSlots: []
  };

  const data = dashboardData || placeholderData;

  return (
    <Box sx={{ flexGrow: 1, py: 4 }}>
      {approvalSynced && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          onClose={() => setApprovalSynced(false)}
        >
          Your approval status has been successfully synchronized! You can now access all coach features.
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Welcome Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              Welcome, Coach {user.name}!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              This is your coaching dashboard where you can manage your sessions and bookings.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                component={Link} 
                to="/coach/schedule"
                sx={{ mr: 2 }}
              >
                Manage Schedule
              </Button>
              <Button 
                variant="outlined" 
                component={Link} 
                to="/profile"
              >
                View Profile
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Monthly Stats */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Monthly Statistics
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={6} sm={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Bookings
                  </Typography>
                  <Typography variant="h4">
                    {data.monthlyStats?.totalBookings || 0}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                  <Typography variant="h4">
                    {data.monthlyStats?.completedBookings || 0}
                  </Typography>
                  {data.monthlyStats?.totalBookings > 0 && (
                    <LinearProgress 
                      variant="determinate" 
                      value={(data.monthlyStats.completedBookings / data.monthlyStats.totalBookings) * 100} 
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Earnings
                  </Typography>
                  <Typography variant="h4">
                    ${data.monthlyStats?.earnings || 0}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Available Slots
                  </Typography>
                  <Typography variant="h4">
                    {timeSlots.filter(slot => slot.status === 'available').length}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Booking Requests Card */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Booking Requests
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                component={Link}
                to="/coach/booking-requests"
              >
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body1" gutterBottom>
                Review and approve booking requests from students
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                component={Link} 
                to="/coach/booking-requests"
                sx={{ mt: 2 }}
              >
                Manage Booking Requests
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Pending Bookings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Pending Bookings
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {data.pendingBookings && data.pendingBookings.length > 0 ? (
              <List>
                {data.pendingBookings.map((booking) => (
                  <ListItem key={booking.id} disablePadding sx={{ mb: 2 }}>
                    <Card sx={{ width: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1">
                          Session with {booking.userName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(booking.date).toLocaleDateString()} at {booking.time}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                          <Chip 
                            label={booking.status} 
                            color="warning" 
                            size="small" 
                            variant="outlined" 
                          />
                          <Chip 
                            label={`$${booking.amount}`} 
                            color="primary" 
                            size="small" 
                            variant="outlined" 
                          />
                        </Stack>
                      </CardContent>
                      <CardActions>
                        <Button size="small" color="primary">
                          Accept
                        </Button>
                        <Button size="small" color="error">
                          Decline
                        </Button>
                        <Button size="small" component={Link} to={`/coach/bookings/${booking.id}`}>
                          View Details
                        </Button>
                      </CardActions>
                    </Card>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  You don't have any pending bookings.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Upcoming Sessions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Upcoming Sessions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {data.upcomingBookings && data.upcomingBookings.length > 0 ? (
              <List>
                {data.upcomingBookings.map((booking) => (
                  <ListItem key={booking.id} disablePadding sx={{ mb: 2 }}>
                    <Card sx={{ width: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1">
                          Session with {booking.userName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(booking.date).toLocaleDateString()} at {booking.time}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                          <Chip 
                            label={booking.status} 
                            color="success" 
                            size="small" 
                          />
                        </Stack>
                      </CardContent>
                      <CardActions>
                        <Button size="small" component={Link} to={`/coach/bookings/${booking.id}`}>
                          View Details
                        </Button>
                      </CardActions>
                    </Card>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  You don't have any upcoming sessions.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  component={Link} 
                  to="/coach/schedule"
                  sx={{ mt: 2 }}
                >
                  Manage Schedule
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Available Time Slots */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Your Upcoming Availability
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                component={Link}
                to="/coach/schedule"
              >
                Manage
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {timeSlotLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : timeSlots.length > 0 ? (
              <List>
                {timeSlots.map((slot) => (
                  <ListItem key={slot.id} disablePadding sx={{ mb: 1 }}>
                    <Box sx={{ 
                      width: '100%', 
                      p: 2, 
                      border: '1px solid #eee', 
                      borderRadius: 1,
                      borderLeft: '4px solid',
                      borderLeftColor: slot.status === 'booked' ? 'primary.main' : 'success.main'
                    }}>
                      <Typography variant="subtitle2">
                        {slot.formattedDate}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {slot.startTime} - {slot.endTime} ({slot.duration} minutes)
                      </Typography>
                      <Chip 
                        label={slot.status === 'booked' ? 'Booked' : 'Available'} 
                        color={slot.status === 'booked' ? 'primary' : 'success'} 
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  You haven't set any available time slots.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  component={Link} 
                  to="/coach/schedule"
                  sx={{ mt: 2 }}
                >
                  Manage Schedule
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CoachDashboard;
