import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Pagination,
  Tooltip,
  Snackbar,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import { format } from 'date-fns';

const ManageUsers = () => {
  // State for users and pagination
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for delete dialog
  const [selectedUser, setSelectedUser] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [forceDeleteCoach, setForceDeleteCoach] = useState(false);
  
  // State for success notification
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        limit: 10,
        search: searchTerm
      };
      
      const response = await adminApi.getAllUsers(params);
      console.log('Fetched users:', response.data);
      
      setUsers(response.data.data.users || []);
      setTotalPages(response.data.data.pagination?.pages || 1);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Initial load and when page/search changes
  useEffect(() => {
    fetchUsers();
  }, [page, searchTerm]);
  
  // Handle search input
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(1); // Reset to first page on new search
  };
  
  // Handle search submission
  const handleSearchSubmit = (event) => {
    event.preventDefault();
    fetchUsers();
  };
  
  // Handle page change
  const handlePageChange = (event, value) => {
    setPage(value);
  };
  
  // Open delete confirmation dialog
  const handleOpenDeleteDialog = (user) => {
    setSelectedUser(user);
    setForceDeleteCoach(false); // Reset force delete option
    setOpenDeleteDialog(true);
  };
  
  // Close delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedUser(null);
    setForceDeleteCoach(false);
  };
  
  // Delete user
  const handleDeleteUser = async () => {
    try {
      setDeleteLoading(true);
      
      // If it's a coach and force delete is enabled, use the special endpoint
      if (selectedUser.role === 'coach' && forceDeleteCoach) {
        await adminApi.deleteUser(selectedUser._id, { forceDelete: true });
      } else {
        await adminApi.deleteUser(selectedUser._id);
      }
      
      setNotification({
        open: true,
        message: `User "${selectedUser.name}" has been deleted successfully.`,
        severity: 'success'
      });
      
      handleCloseDeleteDialog();
      fetchUsers(); // Refresh the user list
    } catch (err) {
      console.error('Error deleting user:', err);
      
      // Special handling for coach-related errors
      if (err.response?.status === 400 && err.response?.data?.message?.includes('coach')) {
        setNotification({
          open: true,
          message: `Cannot delete coach. This coach has associated data (bookings, reviews, etc). Please check the "Force Delete" option to remove all related data.`,
          severity: 'error'
        });
      } else {
        setNotification({
          open: true,
          message: `Failed to delete user: ${err.response?.data?.message || 'Unknown error'}`,
          severity: 'error'
        });
      }
    } finally {
      setDeleteLoading(false);
    }
  };
  
  // Handle force delete checkbox
  const handleForceDeleteChange = (event) => {
    setForceDeleteCoach(event.target.checked);
  };
  
  // Close notification
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM d, yyyy');
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Manage Users
      </Typography>
      
      {/* Search and filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <form onSubmit={handleSearchSubmit}>
          <TextField
            fullWidth
            label="Search users by name or email"
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Button 
                    variant="contained" 
                    type="submit"
                    disabled={loading}
                  >
                    Search
                  </Button>
                </InputAdornment>
              )
            }}
          />
        </form>
      </Paper>
      
      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Users table */}
      <Paper sx={{ width: '100%', mb: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : users.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No users found.
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Joined</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip 
                          label={user.role} 
                          color={
                            user.role === 'admin' ? 'secondary' :
                            user.role === 'coach' ? 'primary' :
                            'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={user.isActive ? 'Active' : 'Inactive'} 
                          color={user.isActive ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton 
                            color="primary"
                            size="small"
                            // onClick={() => handleViewUserDetails(user)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Edit User">
                          <IconButton 
                            color="info"
                            size="small"
                            // onClick={() => handleEditUser(user)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title={user.role === 'admin' ? 'Cannot delete admin users' : 'Delete User'}>
                          <span>
                            <IconButton 
                              color="error"
                              size="small"
                              onClick={() => handleOpenDeleteDialog(user)}
                              disabled={user.role === 'admin'} // Prevent deleting admins
                            >
                              <DeleteIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Pagination */}
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
              <Pagination 
                count={totalPages} 
                page={page} 
                onChange={handlePageChange} 
                color="primary" 
              />
            </Box>
          </>
        )}
      </Paper>
      
      {/* Delete User Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Confirm User Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the user <strong>"{selectedUser?.name}"</strong> with email <strong>{selectedUser?.email}</strong>?
            <br /><br />
            <Alert severity="warning">
              This action is permanent and cannot be undone. All data associated with this user will be permanently removed from the system.
            </Alert>
            
            {/* Special warning for coach deletion */}
            {selectedUser?.role === 'coach' && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Warning: Deleting a Coach Account</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  This user is a coach. Deleting this account may affect:
                </Typography>
                <ul>
                  <li>Existing bookings with this coach</li>
                  <li>Reviews for this coach</li>
                  <li>Payment records associated with their sessions</li>
                </ul>
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={forceDeleteCoach}
                      onChange={handleForceDeleteChange}
                      color="error"
                    />
                  }
                  label="I understand the risks and want to delete all associated data"
                />
              </Alert>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseDeleteDialog} 
            color="primary"
            disabled={deleteLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteUser} 
            color="error" 
            variant="contained"
            disabled={deleteLoading || (selectedUser?.role === 'coach' && !forceDeleteCoach)}
            startIcon={deleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success/Error Notification */}
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
    </Container>
  );
};

export default ManageUsers;
