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
  Snackbar
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import SportsIcon from '@mui/icons-material/Sports';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import StarIcon from '@mui/icons-material/Star';

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

const DashboardSection = ({ title, children, action, actionLink, actionText = "View All" }) => (
  <Paper sx={{ p: 3, height: '100%' }}>
    <Typography variant="h6" gutterBottom>
      {title}
    </Typography>
    <Divider sx={{ mb: 2 }} />
    
    {children}
    
    {action && (
      <Box sx={{ mt: 2, textAlign: 'right' }}>
        <Button 
          variant="outlined" 
          component={Link} 
          to={actionLink}
          size="small"
        >
          {actionText}
        </Button>
      </Box>
    )}
  </Paper>
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // State for reject dialog
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // State for notifications
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await adminApi.getAdminDashboard();
        console.log('Admin Dashboard API Response:', response.data);
        
        // Set the dashboard data with proper structure
        const initialData = response.data.data || {
          stats: {
            totalUsers: 0,
            totalCoaches: 0,
            pendingCoaches: 0,
            totalBookings: 0,
            totalRevenue: 0,
            averageRating: 0
          },
          recentUsers: [],
          pendingCoaches: [],
          recentBookings: [],
          activeCoaches: 0
        };
        
        setDashboardData(initialData);
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
  
  // Approve coach handler
  const handleApproveCoach = async (coachId) => {
    try {
      setActionLoading(true);
      await adminApi.approveCoach(coachId);
      
      // Show success notification
      setNotification({
        open: true,
        message: 'Coach application approved successfully',
        severity: 'success'
      });
      
      // Refresh dashboard data
      const response = await adminApi.getAdminDashboard();
      setDashboardData(response.data.data);
    } catch (err) {
      console.error('Error approving coach:', err);
      setNotification({
        open: true,
        message: `Failed to approve coach: ${err.response?.data?.message || 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };
  
  // Open reject dialog
  const handleOpenRejectDialog = (coach) => {
    if (!coach || !coach.id) {
      console.error('Cannot open rejection dialog: Invalid coach data', coach);
      setNotification({
        open: true,
        message: 'Cannot process this coach application due to missing data',
        severity: 'error'
      });
      return;
    }
    setSelectedCoach(coach);
    setRejectionReason('');
    setOpenRejectDialog(true);
  };
  
  // Close reject dialog
  const handleCloseRejectDialog = () => {
    setOpenRejectDialog(false);
    // Delay clearing the coach data until the dialog animation completes
    setTimeout(() => setSelectedCoach(null), 300);
    setRejectionReason('');
  };
  
  // Reject coach handler
  const handleRejectCoach = async () => {
    try {
      if (!rejectionReason.trim()) {
        setNotification({
          open: true,
          message: 'Please provide a reason for rejection',
          severity: 'error'
        });
        return;
      }
      
      if (!selectedCoach || !selectedCoach.id) {
        setNotification({
          open: true,
          message: 'Cannot reject: Coach data is missing or invalid',
          severity: 'error'
        });
        handleCloseRejectDialog();
        return;
      }
      
      setActionLoading(true);
      await adminApi.rejectCoach(selectedCoach.id, { reason: rejectionReason })
        .catch(error => {
          console.error('Error from rejection API:', error);
          throw new Error(error.response?.data?.message || error.message || 'Server error');
        });
      
      // Show success notification
      setNotification({
        open: true,
        message: 'Coach application rejected successfully',
        severity: 'success'
      });
      
      // Close dialog
      handleCloseRejectDialog();
      
      // Refresh dashboard data
      setTimeout(async () => {
        try {
          const response = await adminApi.getAdminDashboard();
          setDashboardData(response.data.data);
        } catch (refreshError) {
          console.error('Error refreshing dashboard data:', refreshError);
          // Don't show another notification for this secondary error
        }
      }, 500);
    } catch (err) {
      console.error('Error rejecting coach:', err);
      setNotification({
        open: true,
        message: `Failed to reject coach: ${err.message || 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };
  
  // Handle notification close
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };
  
  // Navigate to manage coaches page
  const handleViewAllCoaches = () => {
    navigate('/admin/coaches');
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

  // Safely access data with fallbacks
  const data = dashboardData || {
    stats: {
      totalUsers: 0,
      totalCoaches: 0,
      pendingCoaches: 0,
      totalBookings: 0,
      totalRevenue: 0,
      averageRating: 0
    },
    recentUsers: [],
    pendingCoaches: [],
    recentBookings: [],
    activeCoaches: 0
  };

  // Use optional chaining for safe property access
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
            actionLink="/admin/coaches" 
            action={true}
            actionText="Manage All Coaches"
          >
            {pendingCoachCount > 0 ? (
              <>
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <Typography variant="subtitle1" color="warning.main" sx={{ mr: 1 }}>
                    {pendingCoachCount} pending {pendingCoachCount === 1 ? 'application' : 'applications'} awaiting review
                  </Typography>
                </Box>
                
                {data.pendingCoaches && data.pendingCoaches.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Coach Name</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell>Experience</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.pendingCoaches
                          .filter(coach => coach.name && coach.email) // Filter out coaches without name or email
                          .map((coach) => (
                          <TableRow key={coach.id}>
                            <TableCell>{coach.name}</TableCell>
                            <TableCell>{coach.email}</TableCell>
                            <TableCell>{coach.experience ? `${coach.experience} years` : 'Not specified'}</TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1}>
                                <Button 
                                  size="small" 
                                  variant="outlined" 
                                  color="success"
                                  onClick={() => handleApproveCoach(coach.id)}
                                  disabled={actionLoading}
                                >
                                  Approve
                                </Button>
                                <Button 
                                  size="small" 
                                  variant="outlined" 
                                  color="error"
                                  onClick={() => handleOpenRejectDialog(coach)}
                                  disabled={actionLoading}
                                >
                                  Reject
                                </Button>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      No valid pending coach applications to display.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      There may be applications with incomplete profile information.
                    </Typography>
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  No pending coach applications.
                </Typography>
              </Box>
            )}
          </DashboardSection>
        </Grid>

        {/* Recent Users */}
        <Grid item xs={12} md={6}>
          <DashboardSection 
            title="Recent Users" 
            actionLink="/admin/users" 
            action={true}
            actionText="Manage All Users"
          >
            {data.recentUsers && data.recentUsers.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Joined On</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.recentUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  No recent users.
                </Typography>
              </Box>
            )}
          </DashboardSection>
        </Grid>

        {/* Recent Bookings */}
        <Grid item xs={12} md={6}>
          <DashboardSection 
            title="Recent Bookings" 
            actionLink="/admin/bookings" 
            action={true}
            actionText="View All Bookings"
          >
            {data.recentBookings && data.recentBookings.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Coach</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.recentBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>{booking.userName}</TableCell>
                        <TableCell>{booking.coachName}</TableCell>
                        <TableCell>{new Date(booking.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip 
                            label={booking.status} 
                            color={
                              booking.status === 'completed' 
                                ? 'success' 
                                : booking.status === 'pending' 
                                  ? 'warning' 
                                  : booking.status === 'cancelled' 
                                    ? 'error' 
                                    : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>${booking.amount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  No recent bookings.
                </Typography>
              </Box>
            )}
          </DashboardSection>
        </Grid>
      </Grid>
      
      {/* Reject Coach Dialog */}
      <Dialog open={openRejectDialog} onClose={handleCloseRejectDialog}>
        <DialogTitle>Reject Coach Application</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please provide a reason for rejecting the coach application from{' '}
            {selectedCoach?.name || 'this coach'}.
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
          <Button onClick={handleCloseRejectDialog} color="primary" disabled={actionLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleRejectCoach} 
            color="error" 
            disabled={!rejectionReason.trim() || actionLoading || !selectedCoach}
          >
            {actionLoading ? 'Rejecting...' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
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
