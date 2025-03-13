import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Grid,
  Stack,
  List,
  ListItem,
  ListItemText,
  Divider,
  Pagination
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import { format } from 'date-fns';

const ManageCoaches = () => {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  // Fetch pending coaches
  const fetchCoaches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching pending coaches...');
      
      // Fetch both sources to compare
      const [pendingResponse, dashboardResponse] = await Promise.all([
        adminApi.getPendingCoaches({ page, limit: 10 }),
        adminApi.getAdminDashboard()
      ]);
      
      console.log('Pending coaches API response:', pendingResponse);
      console.log('Dashboard API response (for comparison):', dashboardResponse?.data?.data?.pendingCoaches);
      
      // Compare the two data sources
      const pendingFromAPI = pendingResponse?.data?.data?.coaches || [];
      const pendingFromDashboard = dashboardResponse?.data?.data?.pendingCoaches || [];
      
      console.log(`Pending coaches count from dedicated API: ${pendingFromAPI.length}`);
      console.log(`Pending coaches count from dashboard API: ${pendingFromDashboard.length}`);
      
      // Check if we should use data from the dashboard instead
      let coachesToUse = pendingFromAPI;
      
      // If no pending coaches in the dedicated endpoint but some in dashboard, use dashboard data
      if (pendingFromAPI.length === 0 && pendingFromDashboard.length > 0) {
        console.log('Using dashboard data instead of dedicated API');
        console.log('Dashboard coach data sample:', pendingFromDashboard[0]);
        
        coachesToUse = pendingFromDashboard.map(coach => {
          // Extract and convert hourlyRate appropriately
          let hourlyRate = 0;
          if (coach.hourlyRate !== undefined) {
            hourlyRate = typeof coach.hourlyRate === 'number' 
              ? coach.hourlyRate 
              : (parseFloat(coach.hourlyRate) || 0);
          }
          
          return {
            _id: coach.id,
            status: 'pending',
            user: {
              name: coach.name,
              email: coach.email
            },
            experience: coach.experience || 0,
            specializations: coach.specializations || [],
            hourlyRate: hourlyRate,
            bio: coach.bio || 'No bio provided',
            createdAt: coach.createdAt || new Date().toISOString()
          };
        });
      }
      
      // Format the final data
      const normalizedCoaches = coachesToUse
        .filter(coach => {
          // Ensure coach has user data or direct name/email
          if (!coach.user && !(coach.name && coach.email)) {
            console.warn('Coach missing user data:', coach._id || coach.id);
            return false;
          }
          return true;
        })
        .map(coach => {
          // Log raw coach data for debugging hourly rate and date issues
          console.log('Raw coach data before mapping:', coach);
          console.log('Raw hourlyRate value:', coach.hourlyRate);
          
          // Convert potential string hourlyRate to number
          let hourlyRateValue = 0;
          if (typeof coach.hourlyRate === 'number') {
            hourlyRateValue = coach.hourlyRate;
          } else if (typeof coach.hourlyRate === 'string' && !isNaN(parseFloat(coach.hourlyRate))) {
            hourlyRateValue = parseFloat(coach.hourlyRate);
          }
          
          return {
            _id: coach._id || coach.id,
            id: coach._id || coach.id, // For consistency
            status: coach.status || 'pending',
            experience: coach.experience || 0,
            specializations: Array.isArray(coach.specializations) ? coach.specializations : [],
            hourlyRate: hourlyRateValue,
            bio: coach.bio || 'No bio provided',
            // Ensure createdAt has a valid date value
            createdAt: coach.createdAt || coach.updatedAt || coach.applicationDate || new Date().toISOString(),
            user: {
              name: coach.user?.name || coach.name || 'Unknown',
              email: coach.user?.email || coach.email || 'Unknown Email',
              _id: coach.user?._id || coach.id || 'Unknown ID'
            }
          };
        });
      
      console.log('Final normalized coaches data:', normalizedCoaches);
      setCoaches(normalizedCoaches);
      
      // Set pagination
      const total = pendingResponse?.data?.data?.pagination?.total || pendingFromDashboard.length;
      setTotalPages(Math.ceil(total / 10) || 1);
      
      // Set debug information for troubleshooting
      setDebugInfo({
        pendingAPICount: pendingFromAPI.length,
        dashboardAPICount: pendingFromDashboard.length,
        finalCount: normalizedCoaches.length,
        sourceSample: {
          pendingAPI: pendingFromAPI[0],
          dashboardAPI: pendingFromDashboard[0]
        },
        hasHourlyRateIssues: normalizedCoaches.some(coach => !coach.hourlyRate),
        hasDateIssues: normalizedCoaches.some(coach => !coach.createdAt)
      });
      
    } catch (err) {
      console.error('Error fetching coaches:', err);
      setError(`Failed to load coaches: ${err.message || 'Unknown error'}`);
      setCoaches([]);
      setDebugInfo({ error: err.toString(), response: err.response?.data });
    } finally {
      setLoading(false);
    }
  };

  // Load coaches when page changes or on refresh
  useEffect(() => {
    fetchCoaches();
  }, [page]);

  // Handle page change
  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // Open coach details dialog
  const handleViewDetails = (coach) => {
    setSelectedCoach(coach);
    setOpenDetailsDialog(true);
  };

  // Close coach details dialog
  const handleCloseDetailsDialog = () => {
    setOpenDetailsDialog(false);
    setTimeout(() => setSelectedCoach(null), 300);
  };

  // Open reject dialog
  const handleOpenRejectDialog = (coach) => {
    if (!coach) {
      console.error('Cannot open rejection dialog: Coach data is missing');
      setError('Cannot reject: Coach data is missing or invalid');
      return;
    }
    setSelectedCoach(coach);
    setRejectionReason('');
    setOpenRejectDialog(true);
  };

  // Close reject dialog
  const handleCloseRejectDialog = () => {
    setOpenRejectDialog(false);
    setTimeout(() => setSelectedCoach(null), 300);
  };

  // Handle approve coach
  const handleApproveCoach = async (coachId) => {
    if (!coachId) {
      setError('Cannot approve: Coach ID is missing');
      return;
    }
    
    try {
      setActionLoading(true);
      const response = await adminApi.approveCoach(coachId);
      console.log('Coach approval response:', response);
      
      // Show success message
      setError(null);
      // Refresh the list after a slight delay to let the backend update
      setTimeout(() => fetchCoaches(), 500);
    } catch (err) {
      console.error('Error approving coach:', err);
      setError(`Failed to approve coach: ${err.response?.data?.message || err.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reject coach
  const handleRejectCoach = async () => {
    if (!selectedCoach || !selectedCoach._id) {
      setError('Cannot reject: Coach data is missing or invalid');
      return;
    }
    
    try {
      if (!rejectionReason.trim()) {
        setError('Please provide a reason for rejection.');
        return;
      }
      
      setActionLoading(true);
      const response = await adminApi.rejectCoach(selectedCoach._id, { reason: rejectionReason });
      console.log('Coach rejection response:', response);
      
      handleCloseRejectDialog();
      // Refresh the list after a slight delay to let the backend update
      setTimeout(() => fetchCoaches(), 500);
    } catch (err) {
      console.error('Error rejecting coach:', err);
      setError(`Failed to reject coach: ${err.response?.data?.message || err.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) {
      console.warn('Date formatting failed: No date string provided');
      return 'N/A';
    }
    
    try {
      // Try to create a date object - handle both string dates and Date objects
      const dateObj = typeof dateString === 'string' ? new Date(dateString) : dateString;
      
      // Validate the date object
      if (isNaN(dateObj.getTime())) {
        console.warn(`Invalid date object created from: ${dateString}`);
        return 'Invalid Date';
      }
      
      // Format the date
      return format(dateObj, 'MMM d, yyyy');
    } catch (err) {
      console.error('Error formatting date:', err, 'Date string was:', dateString);
      return 'Invalid Date';
    }
  };

  // Render when no coaches found
  const renderEmptyState = () => {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          No pending coach applications found.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          All coach applications have been processed or there are no new applications.
        </Typography>
        <Button 
          variant="outlined" 
          color="primary" 
          sx={{ mt: 2 }} 
          onClick={fetchCoaches}
          startIcon={<RefreshIcon />}
        >
          Refresh Data
        </Button>
        
        {debugInfo && (
          <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, textAlign: 'left' }}>
            <Typography variant="subtitle2" gutterBottom>Debug Information:</Typography>
            <Stack spacing={1}>
              <Typography variant="body2">
                Pending coaches API count: {debugInfo.pendingAPICount || 0}
              </Typography>
              <Typography variant="body2">
                Dashboard API count: {debugInfo.dashboardAPICount || 0}
              </Typography>
              <Typography variant="body2">
                Final normalized count: {debugInfo.finalCount || 0}
              </Typography>
              {debugInfo.hasHourlyRateIssues && (
                <Typography variant="body2" color="error.main">
                  Warning: Some coaches are missing hourly rate information
                </Typography>
              )}
              {debugInfo.hasDateIssues && (
                <Typography variant="body2" color="error.main">
                  Warning: Some coaches are missing application date information
                </Typography>
              )}
              <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>
                If you see coaches in the Admin Dashboard but not here, try refreshing this page.
              </Typography>
            </Stack>
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption">Technical details:</Typography>
              <pre style={{ overflow: 'auto', maxHeight: '200px', fontSize: '0.7rem' }}>
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Pending Coach Applications
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />} 
          onClick={fetchCoaches}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      <Paper sx={{ width: '100%', mb: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : coaches.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Specializations</TableCell>
                    <TableCell>Experience</TableCell>
                    <TableCell>Hourly Rate</TableCell>
                    <TableCell>Date Applied</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {coaches.map((coach) => (
                    <TableRow key={coach._id}>
                      <TableCell>{coach.user.name}</TableCell>
                      <TableCell>{coach.user.email}</TableCell>
                      <TableCell>
                        {coach.specializations?.length > 0 ? (
                          coach.specializations.map((spec, index) => (
                            <Chip 
                              key={`${coach._id}-${spec}-${index}`} 
                              label={spec} 
                              size="small" 
                              sx={{ mr: 0.5, mb: 0.5 }} 
                            />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">None specified</Typography>
                        )}
                      </TableCell>
                      <TableCell>{coach.experience ? `${coach.experience} years` : 'Not specified'}</TableCell>
                      <TableCell>
                        {(() => {
                          console.log(`Rendering hourly rate for ${coach.user.name}: ${coach.hourlyRate}, type: ${typeof coach.hourlyRate}`);
                          return coach.hourlyRate ? `$${coach.hourlyRate}/hour` : 'Not specified';
                        })()}
                      </TableCell>
                      <TableCell>{formatDate(coach.createdAt)}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <IconButton 
                            color="primary" 
                            onClick={() => handleViewDetails(coach)}
                            title="View Details"
                          >
                            <VisibilityIcon />
                          </IconButton>
                          
                          <IconButton 
                            color="success" 
                            onClick={() => handleApproveCoach(coach._id)}
                            title="Approve"
                            disabled={actionLoading}
                          >
                            <CheckIcon />
                          </IconButton>
                          
                          <IconButton 
                            color="error" 
                            onClick={() => handleOpenRejectDialog(coach)}
                            title="Reject"
                            disabled={actionLoading}
                          >
                            <CloseIcon />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {totalPages > 1 && (
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                <Pagination 
                  count={totalPages} 
                  page={page} 
                  onChange={handlePageChange} 
                  color="primary" 
                />
              </Box>
            )}
          </>
        )}
      </Paper>
      
      {/* Coach Details Dialog */}
      <Dialog 
        open={openDetailsDialog} 
        onClose={handleCloseDetailsDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedCoach ? (
          <>
            <DialogTitle>
              Coach Application Details
              <IconButton
                aria-label="close"
                onClick={handleCloseDetailsDialog}
                sx={{ position: 'absolute', right: 8, top: 8 }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Personal Information
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText 
                        primary="Name" 
                        secondary={selectedCoach.user?.name || 'Not available'}
                      />
                    </ListItem>
                    <Divider component="li" />
                    
                    <ListItem>
                      <ListItemText 
                        primary="Email" 
                        secondary={selectedCoach.user?.email || 'Not available'}
                      />
                    </ListItem>
                    <Divider component="li" />
                    
                    <ListItem>
                      <ListItemText 
                        primary="Experience" 
                        secondary={selectedCoach.experience ? `${selectedCoach.experience} years` : 'Not specified'}
                      />
                    </ListItem>
                    <Divider component="li" />
                    
                    <ListItem>
                      <ListItemText 
                        primary="Hourly Rate" 
                        secondary={selectedCoach.hourlyRate ? `$${selectedCoach.hourlyRate}/hour` : 'Not set'}
                      />
                    </ListItem>
                    <Divider component="li" />
                    
                    <ListItem>
                      <ListItemText 
                        primary="Application Date" 
                        secondary={formatDate(selectedCoach.createdAt)}
                      />
                    </ListItem>
                  </List>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Coaching Details
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Specializations
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedCoach.specializations?.length > 0 ? (
                        selectedCoach.specializations.map((spec, index) => (
                          <Chip 
                            key={`detail-${spec}-${index}`} 
                            label={spec} 
                            color="primary" 
                            variant="outlined"
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No specializations specified
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Bio
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Typography variant="body2">
                        {selectedCoach.bio || 'No bio provided'}
                      </Typography>
                    </Paper>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            
            <DialogActions>
              <Button onClick={handleCloseDetailsDialog} color="primary">
                Close
              </Button>
              
              <Button 
                onClick={() => {
                  if (selectedCoach && selectedCoach._id) {
                    handleCloseDetailsDialog();
                    handleApproveCoach(selectedCoach._id);
                  }
                }} 
                color="success" 
                variant="contained"
                disabled={actionLoading}
              >
                Approve
              </Button>
              
              <Button 
                onClick={() => {
                  handleCloseDetailsDialog();
                  if (selectedCoach) {
                    handleOpenRejectDialog(selectedCoach);
                  }
                }} 
                color="error" 
                variant="contained"
                disabled={actionLoading}
              >
                Reject
              </Button>
            </DialogActions>
          </>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress size={24} sx={{ mb: 2 }} />
            <Typography>Loading coach details...</Typography>
          </Box>
        )}
      </Dialog>
      
      {/* Reject Coach Dialog */}
      <Dialog open={openRejectDialog} onClose={handleCloseRejectDialog}>
        <DialogTitle>Reject Coach Application</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please provide a reason for rejecting the coach application from{' '}
            {selectedCoach?.user?.name || 'this coach'}.
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
            {actionLoading ? 'Rejecting...' : 'Reject Application'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManageCoaches;
