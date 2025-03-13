import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { userApi } from '../../services/api';
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
  ListItemText,
  CircularProgress,
  Alert,
  Chip,
  Container,
  AlertTitle
} from '@mui/material';
import { Link } from 'react-router-dom';
import { format, parseISO, isValid } from 'date-fns';

// Helper function to normalize payment status
const normalizePaymentStatus = (status) => {
  if (!status) return 'pending';
  
  // Convert to lowercase for consistent comparison
  const lowerStatus = status.toLowerCase();
  
  // Map various payment status values to standardized ones
  if (lowerStatus === 'succeeded' || lowerStatus === 'success' || lowerStatus === 'completed' || lowerStatus === 'paid') {
    return 'paid';
  }
  
  if (lowerStatus === 'refunded' || lowerStatus === 'refund' || lowerStatus === 'cancelled' || lowerStatus === 'canceled') {
    return 'refunded';
  }
  
  if (lowerStatus === 'failed' || lowerStatus === 'rejected' || lowerStatus === 'error') {
    return 'failed';
  }
  
  // If it's none of the above mappings, keep original or default to pending
  return lowerStatus === 'pending' ? 'pending' : lowerStatus;
};

const UserDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch dashboard data, bookings data, and payment history
        const [dashboardResponse, bookingsResponse, paymentsResponse] = await Promise.all([
          userApi.getUserDashboard(),
          userApi.getUserBookings(),
          userApi.getPaymentHistory()
        ]);
        
        console.log('Dashboard data response:', dashboardResponse.data);
        console.log('Bookings data response:', bookingsResponse.data);
        console.log('Payments data response:', paymentsResponse.data);
        
        const dashData = dashboardResponse.data.data;
        
        // Process bookings to get upcoming ones
        let upcomingBookings = [];
        if (bookingsResponse.data && bookingsResponse.data.status === 'success') {
          const allBookings = bookingsResponse.data.data.bookings || [];
          
          // Filter for upcoming bookings (status confirmed, not completed/cancelled)
          upcomingBookings = allBookings.filter(booking => 
            booking.status === 'confirmed' || booking.status === 'pending'
          );
          
          console.log('Filtered upcoming bookings:', upcomingBookings);
        }
        
        // Process payments data
        let recentPayments = [];
        if (paymentsResponse.data && paymentsResponse.data.status === 'success') {
          // Extract payments from the response
          const paymentsData = paymentsResponse.data.data;
          
          if (Array.isArray(paymentsData)) {
            recentPayments = paymentsData.slice(0, 3);  // Take only first 3 payments
          } else if (paymentsData && Array.isArray(paymentsData.payments)) {
            recentPayments = paymentsData.payments.slice(0, 3);
          } else if (paymentsData && Array.isArray(paymentsData.history)) {
            recentPayments = paymentsData.history.slice(0, 3);
          }
          
          // Process the payments to standardize format
          recentPayments = recentPayments.map(payment => {
            // Extract booking information
            const booking = payment.booking || {};
            
            // Get coach name
            let coachName = 'N/A';
            if (payment.coachName) {
              coachName = payment.coachName;
            } else if (booking.coach) {
              if (typeof booking.coach === 'object') {
                coachName = booking.coach.user?.name || 'Coach';
              }
            }
            
            // Get and normalize payment status
            let paymentStatus;
            
            // Log raw payment status for debugging
            console.log('Raw payment status:', {
              paymentStatus: payment.status,
              bookingPaymentStatus: booking.paymentStatus,
              bookingStatus: booking.status
            });
            
            // First check payment's direct status
            if (payment.status) {
              paymentStatus = payment.status;
            } 
            // Then check booking payment status
            else if (booking.paymentStatus) {
              paymentStatus = booking.paymentStatus;
            }
            // Then check if booking is confirmed and assume paid
            else if (booking.status === 'confirmed') {
              paymentStatus = 'paid';
            }
            // Fall back to pending
            else {
              paymentStatus = 'pending';
            }
            
            // Normalize the status to consistent values
            const normalizedStatus = normalizePaymentStatus(paymentStatus);
            
            return {
              id: payment._id || payment.id || '',
              date: payment.createdAt || payment.date || new Date(),
              amount: payment.amount || booking.paymentAmount || 0,
              status: normalizedStatus,
              rawStatus: paymentStatus, // Store original status for debugging
              coachName: coachName
            };
          });
          
          console.log('Processed recent payments:', recentPayments);
        }
        
        // Merge the bookings and payment data with dashboard data
        setDashboardData({
          ...dashData,
          upcomingBookings: upcomingBookings.slice(0, 3), // Show only top 3 most recent
          recentPayments: recentPayments, // Use directly fetched payment data
          pendingApprovalBookings: bookingsResponse.data.data.bookings.filter(b => b.status === 'pending'),
          pendingPaymentBookings: bookingsResponse.data.data.bookings.filter(b => b.status === 'confirmed')
        });
        
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // If the backend is not yet implemented, show a placeholder
  const placeholderData = {
    upcomingBookings: [],
    recentPayments: [],
    favoriteCoaches: [],
    notifications: []
  };

  const data = dashboardData || placeholderData;
  
  // Checking if we have upcoming bookings with proper error handling
  const hasUpcomingBookings = data && data.upcomingBookings && Array.isArray(data.upcomingBookings) && data.upcomingBookings.length > 0;
  console.log('Has upcoming bookings:', hasUpcomingBookings);
  
  // Check if we have payment history
  const hasPaymentHistory = data && data.recentPayments && Array.isArray(data.recentPayments) && data.recentPayments.length > 0;
  console.log('Has payment history:', hasPaymentHistory);

  // Helper to get display text for payment status
  const getStatusDisplay = (status) => {
    switch(status) {
      case 'paid':
        return 'Paid';
      case 'refunded':
        return 'Refunded';
      case 'failed':
        return 'Failed';
      case 'pending':
        return 'Pending';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* User greeting and summary */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.name || 'User'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's an overview of your cricket coaching activity.
        </Typography>
      </Box>
      
      {/* Pending Action Alerts */}
      {data.pendingApprovalBookings && data.pendingApprovalBookings.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>Pending Approval Bookings</AlertTitle>
          You have {data.pendingApprovalBookings.length} booking request(s) waiting for coach approval.
          <Button 
            color="inherit" 
            size="small"
            component={Link}
            to="/user/bookings"
            sx={{ ml: 2 }}
          >
            View Bookings
          </Button>
        </Alert>
      )}
      
      {data.pendingPaymentBookings && data.pendingPaymentBookings.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>Payment Required</AlertTitle>
          You have {data.pendingPaymentBookings.length} approved booking(s) that require payment.
          <Button 
            color="inherit" 
            size="small"
            component={Link}
            to="/user/bookings/pending-payment"
            sx={{ ml: 2 }}
          >
            Complete Payment
          </Button>
        </Alert>
      )}
      
      {/* Dashboard content */}
      <Grid container spacing={3}>
        {/* Welcome Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              Welcome, {user.name}!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              This is your personal dashboard where you can manage your cricket coaching sessions.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                component={Link} 
                to="/coaches"
                sx={{ mr: 2 }}
              >
                Find Coaches
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

        {/* Pending Payment Bookings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Bookings Awaiting Payment
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                component={Link}
                to="/user/bookings/pending-payment"
              >
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body1" gutterBottom>
                You may have bookings approved by coaches that need payment
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                component={Link} 
                to="/user/bookings/pending-payment"
                sx={{ mt: 2 }}
              >
                Complete Bookings
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Upcoming Bookings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" gutterBottom>
                Upcoming Bookings
              </Typography>
              <Button 
                variant="text" 
                color="primary" 
                component={Link} 
                to="/user/bookings"
                size="small"
              >
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {hasUpcomingBookings ? (
              <List>
                {data.upcomingBookings.map((booking) => (
                  <ListItem key={booking._id} disablePadding sx={{ mb: 1 }}>
                    <Card sx={{ width: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1">
                          Session with {booking.coach && booking.coach.user ? booking.coach.user.name : 'Coach'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {booking.timeSlot ? `${formatDate(booking.timeSlot.date)} at ${booking.timeSlot.startTime}` : 'Date not specified'}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Chip 
                            label={booking.status || 'Pending'} 
                            color={booking.status === 'confirmed' ? 'success' : booking.status === 'cancelled' ? 'error' : 'primary'}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button size="small" component={Link} to={`/user/bookings/${booking._id}`}>
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
                  You don't have any upcoming bookings.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  component={Link} 
                  to="/coaches"
                  sx={{ mt: 2, mr: 2 }}
                >
                  Book a Coach
                </Button>
                <Button 
                  variant="outlined"
                  component={Link} 
                  to="/user/bookings"
                  sx={{ mt: 2 }}
                >
                  View All Bookings
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Favorite Coaches */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" gutterBottom>
                Favorite Coaches
              </Typography>
              <Button 
                variant="text" 
                color="primary" 
                component={Link} 
                to="/coaches"
                size="small"
              >
                Browse All Coaches
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {data && data.favoriteCoaches && data.favoriteCoaches.length > 0 ? (
              <List>
                {data.favoriteCoaches.map((coach) => (
                  <ListItem key={coach.id} disablePadding sx={{ mb: 1 }}>
                    <Card sx={{ width: '100%' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          {coach.profileImage ? (
                            <img 
                              src={coach.profileImage} 
                              alt={coach.name} 
                              style={{ 
                                width: 40, 
                                height: 40, 
                                borderRadius: '50%', 
                                marginRight: 10 
                              }}
                            />
                          ) : (
                            <Box 
                              sx={{ 
                                width: 40, 
                                height: 40, 
                                borderRadius: '50%', 
                                backgroundColor: 'primary.light', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                color: 'white',
                                marginRight: 1
                              }}
                            >
                              {coach.name ? coach.name.charAt(0).toUpperCase() : 'C'}
                            </Box>
                          )}
                          <Typography variant="subtitle1">
                            {coach.name || 'Coach'}
                          </Typography>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary">
                          {coach.specializations && coach.specializations.length > 0 
                            ? `Specializations: ${coach.specializations.join(', ')}`
                            : 'No specializations listed'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                            Rate: ${coach.hourlyRate || 0}/hr
                          </Typography>
                          |
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            Rating: {coach.rating || 'N/A'}{coach.rating ? '/5' : ''}
                          </Typography>
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button size="small" component={Link} to={`/coaches/${coach.id}`}>
                          View Profile
                        </Button>
                        <Button size="small" component={Link} to={`/coaches/${coach.id}`} variant="contained" color="primary">
                          Book Session
                        </Button>
                      </CardActions>
                    </Card>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  You haven't added any coaches to your favorites yet.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  component={Link} 
                  to="/coaches"
                  sx={{ mt: 2 }}
                >
                  Explore Coaches
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Recent Payments */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" gutterBottom>
                Recent Payments
              </Typography>
              <Button 
                variant="text" 
                color="primary" 
                component={Link} 
                to="/user/payments"
                size="small"
              >
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {hasPaymentHistory ? (
              <List>
                {data.recentPayments.map((payment, index) => (
                  <ListItem key={payment.id || index} disablePadding sx={{ mb: 1 }}>
                    <Card sx={{ width: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle2">
                          Payment #{payment.id ? payment.id.toString().substring(0, 8) : 'Unknown'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Amount: CAD ${typeof payment.amount === 'number' ? payment.amount.toFixed(2) : '0.00'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Date: {formatDate(payment.date)}
                        </Typography>
                        {payment.coachName && (
                          <Typography variant="body2" color="text.secondary">
                            Coach: {payment.coachName}
                          </Typography>
                        )}
                        {payment.rawStatus && payment.rawStatus !== payment.status && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            Original status: {payment.rawStatus}
                          </Typography>
                        )}
                        <Box sx={{ mt: 1 }}>
                          <Chip 
                            label={getStatusDisplay(payment.status)} 
                            color={
                              payment.status === 'paid' ? 'success' : 
                              payment.status === 'refunded' ? 'warning' : 
                              payment.status === 'failed' ? 'error' : 
                              'default'
                            }
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  No payment history yet.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UserDashboard;
