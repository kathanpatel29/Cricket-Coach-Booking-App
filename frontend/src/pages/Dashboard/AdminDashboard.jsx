import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { adminApi } from '../../services/api';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  Divider, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Snackbar,
  Rating
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import SportsIcon from '@mui/icons-material/Sports';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import StarIcon from '@mui/icons-material/Star';
import { format, parseISO, isValid } from 'date-fns';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import VisibilityIcon from '@mui/icons-material/Visibility';

// Add a safe date formatting function
const formatSafeDate = (booking) => {
  if (!booking) return 'N/A';
  
  // Check all possible date fields in order of preference
  const possibleDateFields = [
    booking.date,
    booking.bookingDate,
    booking.sessionDate,
    booking.timeSlot?.date,
    booking.createdAt
  ];
  
  // Try each field until we find a valid date
  for (const dateField of possibleDateFields) {
    if (!dateField) continue;
    
    try {
      // Try as an ISO string
      const date = parseISO(dateField);
      if (isValid(date)) {
        return format(date, 'MMM d, yyyy');
      }
      
      // Try as a regular date string/timestamp
      const regularDate = new Date(dateField);
      if (isValid(regularDate)) {
        return format(regularDate, 'MMM d, yyyy');
      }
    } catch (err) {
      console.warn('Error formatting date field:', dateField, err);
      // Continue to the next field
    }
  }
  
  // If we reach here, none of the date fields worked
  console.warn('No valid date found in booking:', booking);
  return 'Invalid date';
};

// Reusable components to reduce duplication
const StatsCard = ({ icon, value, label, color = "primary" }) => (
  <Card>
    <CardContent sx={{ textAlign: 'center' }}>
      {icon && React.cloneElement(icon, { color, sx: { fontSize: 40 } })}
      <Typography variant="h5" component="div" sx={{ mt: 1 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </CardContent>
  </Card>
);

// DashboardSection component for consistent styling
const DashboardSection = ({ title, children, action, actionText, actionLink }) => {
  return (
    <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2 
      }}>
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
        {action && (
          <Button 
            variant="contained" 
            color="primary" 
            size="small" 
            component={Link} 
            to={actionLink}
            startIcon={actionText.includes('View') ? <VisibilityIcon /> : null}
          >
            {actionText}
          </Button>
        )}
      </Box>
      <Box sx={{ flexGrow: 1 }}>
        {children}
      </Box>
    </Paper>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState({
    pendingCoaches: [],
    recentUsers: [],
    recentBookings: [],
    recentReviews: [],
    stats: {
      totalUsers: 0,
      totalCoaches: 0,
      totalBookings: 0,
      totalRevenue: 0
    },
    revenue: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentCoach, setCurrentCoach] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  // Keep approval/rejection dialog handlers
  const handleOpenApprovalDialog = (coach) => {
    setCurrentCoach(coach);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentCoach(null);
    setRejectionReason('');
  };

  const handleApproveCoach = async (coachId) => {
    try {
      await adminApi.approveCoach(coachId);
      setData(prevData => ({
        ...prevData,
        pendingCoaches: prevData.pendingCoaches.filter(coach => coach.id !== coachId)
      }));
      setNotification({ open: true, message: 'Coach approved successfully', severity: 'success' });
    } catch (error) {
      console.error('Error approving coach:', error);
      setNotification({ open: true, message: 'Failed to approve coach', severity: 'error' });
    }
    handleCloseDialog();
  };

  const handleRejectCoach = async (coachId) => {
    try {
      await adminApi.rejectCoach(coachId, { reason: rejectionReason });
      setData(prevData => ({
        ...prevData,
        pendingCoaches: prevData.pendingCoaches.filter(coach => coach.id !== coachId)
      }));
      setNotification({ open: true, message: 'Coach application rejected', severity: 'success' });
    } catch (error) {
      console.error('Error rejecting coach:', error);
      setNotification({ open: true, message: 'Failed to reject coach', severity: 'error' });
    }
    handleCloseDialog();
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await adminApi.getAdminDashboard();
        const dashboardData = response.data.data;
        
        // Create a structured data object with all required properties
        const initialData = {
          stats: {
            totalUsers: dashboardData?.stats?.totalUsers || 0,
            totalCoaches: dashboardData?.stats?.totalCoaches || 0,
            pendingCoaches: dashboardData?.stats?.pendingCoaches || 0,
            totalBookings: dashboardData?.stats?.totalBookings || 0,
            totalRevenue: dashboardData?.stats?.totalRevenue || 0,
            averageRating: dashboardData?.stats?.averageRating || 0
          },
          recentUsers: dashboardData?.recentUsers || [],
          pendingCoaches: dashboardData?.pendingCoaches || [],
          recentBookings: dashboardData?.recentBookings || [],
          recentReviews: dashboardData?.recentReviews || [],
          revenue: dashboardData?.revenue || {
            totalRevenue: 0,
            weeklyRevenue: 0,
            completedBookings: 0,
            pendingPayments: 0,
            platformFees: 0
          }
        };
        
        setData(initialData);
        setError(null);
      } catch (err) {
        console.error("Error fetching admin dashboard data:", err);
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === 'admin') {
      fetchDashboardData();
    }
  }, [user]);
  
  // Add a debugging effect to log booking data
  useEffect(() => {
    if (data && data.recentBookings && data.recentBookings.length > 0) {
      console.log('Recent booking data structure:', data.recentBookings[0]);
    }
  }, [data]);

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

  // Safely access data with fallbacks
  const stats = data.stats || {};
  const pendingCoachCount = stats.pendingCoaches || 0;

  return (
    <Box sx={{ flexGrow: 1, py: 4 }}>
      <Grid container spacing={3}>
        {/* Welcome Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              Welcome, Admin {user.name}!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              This is your admin dashboard where you can manage the entire platform.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                component={Link} 
                to="/admin/users"
                sx={{ mr: 2 }}
              >
                Manage Users
              </Button>
              <Button 
                variant="outlined" 
                component={Link} 
                to="/admin/coaches"
                sx={{ mr: 2 }}
              >
                Manage Coaches
              </Button>
              <Button 
                variant="outlined" 
                component={Link} 
                to="/admin/reviews"
              >
                Moderate Reviews
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Stats Cards */}
        <Grid item xs={12}>
          <Grid container spacing={3}>
            <Grid item xs={6} sm={4} md={2}>
              <StatsCard 
                icon={<PeopleIcon />} 
                value={stats.totalUsers || 0} 
                label="Total Users" 
              />
            </Grid>
            
            <Grid item xs={6} sm={4} md={2}>
              <StatsCard 
                icon={<SportsIcon />} 
                value={stats.totalCoaches || 0} 
                label="Coaches" 
              />
            </Grid>
            
            <Grid item xs={6} sm={4} md={2}>
              <StatsCard 
                icon={<PersonIcon />} 
                value={stats.pendingCoaches || 0} 
                label="Pending Coaches" 
                color="warning"
              />
            </Grid>
            
            <Grid item xs={6} sm={4} md={2}>
              <StatsCard 
                icon={<BookOnlineIcon />} 
                value={stats.totalBookings || 0} 
                label="Total Bookings" 
              />
            </Grid>
            
            <Grid item xs={6} sm={4} md={2}>
              <StatsCard 
                icon={<AttachMoneyIcon />} 
                value={`$${stats.totalRevenue || 0}`} 
                label="Total Revenue" 
                color="success"
              />
            </Grid>
            
            <Grid item xs={6} sm={4} md={2}>
              <StatsCard 
                icon={<StarIcon />} 
                value={`${stats.averageRating || 0}/5`} 
                label="Average Rating" 
                color="warning"
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Pending Coach Approvals */}
        <Grid item xs={12} md={6}>
          <DashboardSection 
            title="Coach Applications" 
            action={true}
            actionText="Manage All Coaches"
            actionLink="/admin/coaches"
          >
            {pendingCoachCount > 0 ? (
              <Box sx={{ width: '100%' }}>
                <Typography variant="subtitle1" color="warning.main" sx={{ mb: 2, textAlign: 'center' }}>
                  {pendingCoachCount} pending {pendingCoachCount === 1 ? 'application' : 'applications'} awaiting review
                </Typography>
                
                {data.pendingCoaches && data.pendingCoaches.length > 0 && (
                  <List sx={{ width: '100%' }}>
                    {data.pendingCoaches.slice(0, 3).map((coach) => (
                      <ListItem key={coach.id} sx={{ 
                        border: '1px solid #eee', 
                        borderRadius: 1, 
                        mb: 1.5, 
                        p: 0,
                        display: 'block',
                        width: '100%'
                      }}>
                        <Box sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle1">{coach.name}</Typography>
                            <Chip size="small" label={`${coach.experience || 0} years`} color="primary" />
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{coach.email}</Typography>
                          
                          <Box sx={{ 
                            mt: 'auto', 
                            display: 'flex', 
                            justifyContent: 'flex-end', 
                            gap: 1, 
                            borderTop: '1px solid #eee',
                            pt: 1.5
                          }}>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              color="success"
                              onClick={() => handleApproveCoach(coach.id)}
                            >
                              Approve
                            </Button>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              color="error"
                              onClick={() => handleOpenApprovalDialog(coach)}
                            >
                              Reject
                            </Button>
                          </Box>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            ) : (
              <Box sx={{ 
                textAlign: 'center', 
                py: 5, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '100%'
              }}>
                <SportsIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  No pending coach applications.
                </Typography>
                <Button 
                  variant="contained" 
                  component={Link} 
                  to="/admin/coaches"
                  sx={{ mt: 2 }}
                >
                  Manage Coaches
                </Button>
              </Box>
            )}
          </DashboardSection>
        </Grid>

        {/* Recent Users */}
        <Grid item xs={12} md={6}>
          <DashboardSection 
            title="Recent Users" 
            action={true}
            actionText="Manage All Users"
            actionLink="/admin/users"
          >
            {data.recentUsers && data.recentUsers.length > 0 ? (
              <List sx={{ width: '100%' }}>
                {data.recentUsers.slice(0, 5).map((user) => (
                  <ListItem key={user.id} sx={{ 
                    borderBottom: '1px solid #eee', 
                    py: 1.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '100%'
                  }}>
                    <Box>
                      <Typography variant="subtitle2">{user.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={user.role} 
                        color={
                          user.role === 'admin' 
                            ? 'secondary' 
                            : user.role === 'coach' 
                              ? 'primary' 
                              : 'default'
                        }
                        size="small"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ 
                textAlign: 'center', 
                py: 5, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '100%'
              }}>
                <PeopleIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  No users registered in the system yet.
                </Typography>
                <Button 
                  variant="contained" 
                  component={Link}
                  to="/admin/users"
                  sx={{ mt: 2 }}
                >
                  Manage Users
                </Button>
              </Box>
            )}
          </DashboardSection>
        </Grid>

        {/* Recent Bookings */}
        <Grid item xs={12} md={6}>
          <DashboardSection 
            title="Recent Bookings" 
            action={true}
            actionText="View All Bookings"
            actionLink="/admin/bookings"
          >
            <Box sx={{ 
              textAlign: 'center', 
              py: 3, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%'
            }}>
              <BookOnlineIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
              <Typography variant="body1" gutterBottom>
                {data.recentBookings && data.recentBookings.length > 0 
                  ? `${data.recentBookings.length} recent bookings available` 
                  : 'No bookings in the system yet.'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Click "View All Bookings" to manage bookings.
              </Typography>
              <Button 
                variant="contained" 
                component={Link}
                to="/admin/bookings"
                startIcon={<VisibilityIcon />}
              >
                View All Bookings
              </Button>
            </Box>
          </DashboardSection>
        </Grid>
        
        {/* Recent Reviews Section */}
        <Grid item xs={12} md={6}>
          <DashboardSection 
            title="Recent Reviews" 
            action={true}
            actionText="Moderate All Reviews"
            actionLink="/admin/reviews"
          >
            {data.recentReviews && data.recentReviews?.length > 0 ? (
              <List sx={{ width: '100%' }}>
                {data.recentReviews.slice(0, 5).map((review) => (
                  <ListItem key={review.id} sx={{ 
                    borderBottom: '1px solid #eee', 
                    py: 1.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '100%'
                  }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="subtitle2">{review.userName || 'User'}</Typography>
                        <Typography variant="body2" color="text.secondary">→</Typography>
                        <Typography variant="subtitle2">{review.coachName || 'Coach'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Rating value={review.rating || 0} readOnly size="small" />
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip 
                      label={review.status} 
                      color={
                        review.status === 'approved' 
                          ? 'success' 
                          : review.status === 'pending'
                            ? 'warning' 
                            : review.status === 'rejected'
                              ? 'error' 
                              : 'default'
                      }
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ 
                textAlign: 'center', 
                py: 5, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '100%'
              }}>
                <StarIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  No reviews submitted yet.
                </Typography>
                <Button 
                  variant="contained" 
                  component={Link}
                  to="/admin/reviews"
                  sx={{ mt: 2 }}
                >
                  Moderate Reviews
                </Button>
              </Box>
            )}
          </DashboardSection>
        </Grid>
      </Grid>
      
      {/* Reject Coach Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Reject Coach Application</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please provide a reason for rejecting the coach application from{' '}
            {currentCoach?.name || 'this coach'}.
            This reason will be shared with the applicant.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="rejectionReason"
            label="Rejection Reason"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            error={!rejectionReason.trim() && rejectionReason !== ''}
            helperText={!rejectionReason.trim() && rejectionReason !== '' ? "Rejection reason cannot be empty" : ""}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={() => handleRejectCoach(currentCoach?.id)} 
            color="error" 
            disabled={!rejectionReason.trim() || !currentCoach}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setNotification({ ...notification, open: false })} 
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminDashboard;
