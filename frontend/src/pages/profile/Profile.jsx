import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Avatar,
  CircularProgress,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/api';
import { toast } from 'react-hot-toast';
import { authService } from '../../services/api';


const SPECIALIZATIONS = ['batting', 'bowling', 'fielding', 'wicket-keeping'];

const Profile = () => {
  const { user, getProfile, updateUserProfile, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    // Coach-specific fields
    ...(user?.role === 'coach' && {
      bio: '',
      specializations: [],
      experience: '',
      hourlyRate: '',
      avatar: null
    })
  });
  const [editDialog, setEditDialog] = useState({
    open: false,
    field: '',
    value: '',
    newValue: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [criticalUpdateDialog, setCriticalUpdateDialog] = useState({
    open: false,
    field: '',
    data: {
      name: '',
      email: '',
      password: ''
    }
  });

  useEffect(() => {
    if (!profileData.name) { // Fetch only if profile data is missing
        fetchProfile();
    }
}, [profileData]);


  const fetchProfile = async () => {
    try {
      console.log('Fetching profile...');
      const response = await authService.getProfile();
      console.log('API Response:', response.data);

      const userData = response.data.data || response.data;
      console.log('User Data:', userData);
      
      setProfileData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || ''
      });
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError(err.response?.data?.message || 'Error fetching profile');
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (field) => {
    if (field === 'name' || field === 'email') {
      setCriticalUpdateDialog({
        open: true,
        field,
        data: {
          name: profileData.name,
          email: profileData.email,
          password: ''
        }
      });
    } else {
      setEditDialog({
        open: true,
        field,
        value: profileData[field],
        newValue: profileData[field]
      });
    }
  };

  const handleDialogChange = (e) => {
    setEditDialog(prev => ({
      ...prev,
      newValue: e.target.value
    }));
  };

  const handleConfirmChange = async () => {
    const { field, newValue } = editDialog;
    if (newValue.trim() === '') {
      toast.error(`${field.charAt(0).toUpperCase() + field.slice(1)} cannot be empty`);
      return;
    }

    try {
      setSaving(true);
      await userService.updateProfile({
        ...profileData,
        [field]: newValue
      });
      setProfileData(prev => ({
        ...prev,
        [field]: newValue
      }));
      toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully`);
      setEditDialog({ open: false, field: '', value: '', newValue: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to update ${field}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelChange = () => {
    setEditDialog({ open: false, field: '', value: '', newValue: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    try {
      const response = await userService.updateProfile(profileData);
      if (response.data.status === 'success') {
        updateUserProfile(response.data.data);
        toast.success('Profile updated successfully');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating profile');
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
  
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
  
    setSaving(true);
    try {
      const response = await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
  
      if (response.data.status === 'success') {
        toast.success('Password updated successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating password');
    } finally {
      setSaving(false);
    }
  };
  

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileData(prev => ({
        ...prev,
        avatar: file
      }));
    }
  };

  const handleCriticalUpdateChange = (e) => {
    const { name, value } = e.target;
    setCriticalUpdateDialog(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [name]: value
      }
    }));
  };

  const handleCriticalUpdateSubmit = async () => {
    const { data } = criticalUpdateDialog;
    if (!data.name || !data.email || !data.password) {
      toast.error('All fields are required for this update');
      return;
    }

    try {
      setSaving(true);
      await userService.updateCriticalInfo(data);
      setProfileData(prev => ({
        ...prev,
        name: data.name,
        email: data.email
      }));
      toast.success('Profile updated successfully. Please log in again.');
      setCriticalUpdateDialog({ open: false, field: '', data: { name: '', email: '', password: '' } });
      // Force re-login after critical update
      logout();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Profile Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Profile Information</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Stack spacing={3}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                borderBottom: '1px solid #eee',
                pb: 2
              }}>
                <Box>
                  <Typography color="text.secondary" variant="subtitle2">Name</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{profileData.name}</Typography>
                </Box>
                <Button 
                  onClick={() => handleEditClick('name')}
                  color="primary"
                  size="small"
                >
                  Edit Name
                </Button>
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                borderBottom: '1px solid #eee',
                pb: 2
              }}>
                <Box>
                  <Typography color="text.secondary" variant="subtitle2">Email</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{profileData.email}</Typography>
                </Box>
                <Button 
                  onClick={() => handleEditClick('email')}
                  color="primary"
                  size="small"
                >
                  Edit Email
                </Button>
              </Box>

              <Box>
                <Typography color="text.secondary" variant="subtitle2" gutterBottom>Phone</Typography>
                <TextField
                  fullWidth
                  placeholder="Enter phone number"
                  name="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Password Change */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <form onSubmit={handlePasswordSubmit}>
              <Stack spacing={3}>
                <Typography variant="h6">Change Password</Typography>

                <TextField
                  fullWidth
                  label="Current Password"
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />

                <TextField
                  fullWidth
                  label="New Password"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                />

                <TextField
                  fullWidth
                  label="Confirm New Password"
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                />

                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving}
                  fullWidth
                >
                  {saving ? <CircularProgress size={24} /> : 'Update Password'}
                </Button>
              </Stack>
            </form>
          </Paper>
        </Grid>
      </Grid>

      {/* Critical Update Dialog */}
      <Dialog 
        open={criticalUpdateDialog.open} 
        onClose={() => setCriticalUpdateDialog(prev => ({ ...prev, open: false }))}
      >
        <DialogTitle>Update Profile Information</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Changing your {criticalUpdateDialog.field} requires verification. Please fill in all fields:
          </DialogContentText>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={criticalUpdateDialog.data.name}
              onChange={handleCriticalUpdateChange}
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={criticalUpdateDialog.data.email}
              onChange={handleCriticalUpdateChange}
            />
            <TextField
              fullWidth
              label="Current Password"
              name="password"
              type="password"
              value={criticalUpdateDialog.data.password}
              onChange={handleCriticalUpdateChange}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCriticalUpdateDialog(prev => ({ ...prev, open: false }))}>
            Cancel
          </Button>
          <Button onClick={handleCriticalUpdateSubmit} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={24} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onClose={handleCancelChange}>
        <DialogTitle>Edit {editDialog.field?.charAt(0).toUpperCase() + editDialog.field?.slice(1)}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Current {editDialog.field}: {editDialog.value}
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label={`New ${editDialog.field}`}
            type={editDialog.field === 'email' ? 'email' : 'text'}
            fullWidth
            value={editDialog.newValue}
            onChange={handleDialogChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelChange}>Cancel</Button>
          <Button onClick={handleConfirmChange} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile; 