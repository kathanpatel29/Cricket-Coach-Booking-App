import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  TextField, 
  Button, 
  Grid, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  OutlinedInput
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { useAuth } from '../../hooks/useAuth';
import { userApi, coachApi, adminApi } from '../../services/api';
import { useCachedFetch, useSendData } from '../../hooks/useCachedFetch';
import { setCachedData, generateCacheKey } from '../../utils/cacheUtils';

// Cricket specializations options - same as in Register.jsx
const specializationOptions = [
  'Batting',
  'Bowling',
  'Fielding',
  'Wicket Keeping'
];

const EditProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Track whether fields have been modified
  const [dirtyFields, setDirtyFields] = useState({});
  
  // Form data state with initial values from sessionStorage if available
  const [formData, setFormData] = useState(() => {
    // Try to get cached form data for this component from session storage
    const cachedFormData = sessionStorage.getItem('editProfileFormData');
    if (cachedFormData) {
      try {
        return JSON.parse(cachedFormData);
      } catch (e) {
        console.error("Failed to parse cached form data", e);
      }
    }
    
    // Default initial state
    return {
      // Basic user fields
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      
      // Coach-specific fields
      experience: '',
      hourlyRate: '',
      bio: '',
      specializations: [],
      certifications: '',
    };
  });
  
  const isCoach = user?.role === 'coach';
  
  // Cache keys for API endpoints
  const userProfileCacheKey = 'user_profile';
  const coachProfileCacheKey = 'coach_profile';
  
  // Use our cached fetch hook for basic user profile
  const {
    data: userData,
    loading: userLoading,
    error: userError
  } = useCachedFetch(
    '/user/profile', 
    { 
      cacheKey: userProfileCacheKey,
      immediate: !!user,
      dependencies: [user?.id],
      cacheDuration: 2 * 60 * 1000 // 2 minutes
    }
  );
  
  // Use our cached fetch hook for coach profile (only if user is a coach)
  const {
    data: coachData,
    loading: coachLoading,
    error: coachError
  } = useCachedFetch(
    '/coach/profile',
    {
      cacheKey: coachProfileCacheKey,
      immediate: !!user && isCoach,
      dependencies: [user?.id, isCoach],
      cacheDuration: 2 * 60 * 1000 // 2 minutes
    }
  );
  
  // Use our hook for updating user profile
  const {
    sendData: updateUserProfile,
    loading: updatingUser,
    error: updateUserError
  } = useSendData('/user/profile', { 
    method: 'put', 
    invalidateUrls: [userProfileCacheKey]
  });
  
  // Use our hook for updating coach profile
  const {
    sendData: updateCoachProfile,
    loading: updatingCoach,
    error: updateCoachError
  } = useSendData('/coach/profile', { 
    method: 'put', 
    invalidateUrls: [coachProfileCacheKey]
  });
  
  // Handle form data initialization from fetched data
  useEffect(() => {
    if (!userLoading && userData) {
      const basicUserData = userData.data?.user || userData.data || {};
      
      setFormData(prev => ({
        ...prev,
        name: basicUserData.name || user?.name || '',
        email: basicUserData.email || user?.email || '',
        phone: basicUserData.phone || ''
      }));
    }
  }, [userLoading, userData, user]);
  
  // Handle coach data initialization
  useEffect(() => {
    if (isCoach && !coachLoading && coachData) {
      const coach = coachData.data?.coach || coachData.coach || coachData.data || {};
      
      setFormData(prev => ({
        ...prev,
        // Handle numeric fields
        experience: coach.experience !== undefined ? 
          (typeof coach.experience === 'number' ? coach.experience : 
          Number(coach.experience) || '') : '',
          
        hourlyRate: coach.hourlyRate !== undefined ? 
          (typeof coach.hourlyRate === 'number' ? coach.hourlyRate : 
          Number(coach.hourlyRate) || '') : '',
        
        // Text fields
        bio: coach.bio || '',
        certifications: coach.certifications || '',
        
        // Handle specializations array
        specializations: Array.isArray(coach.specializations) ? 
          coach.specializations : 
          (coach.specializations ? [coach.specializations] : []),
      }));
    }
  }, [isCoach, coachLoading, coachData]);
  
  // Update loading state
  useEffect(() => {
    setLoading(userLoading || (isCoach && coachLoading));
  }, [userLoading, coachLoading, isCoach]);
  
  // Save form data to sessionStorage when it changes
  useEffect(() => {
    // Only save if we have actual data (not the initial empty state)
    if (formData.name || formData.phone || formData.email) {
      sessionStorage.setItem('editProfileFormData', JSON.stringify(formData));
    }
  }, [formData]);
  
  // Clean up session storage on unmount
  useEffect(() => {
    return () => {
      // Only clean up if successful submit
      if (success) {
        sessionStorage.removeItem('editProfileFormData');
      }
    };
  }, [success]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Mark field as dirty (changed)
    setDirtyFields({ ...dirtyFields, [name]: true });
    
    // Handle numeric fields
    if (name === 'experience' || name === 'hourlyRate') {
      // Allow empty string or convert to number
      const numValue = value === '' ? '' : Number(value);
      setFormData({ ...formData, [name]: numValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  
  // Special handler for specializations multi-select (same as in Register.jsx)
  const handleSpecializationsChange = (event) => {
    const { value } = event.target;
    // Convert specializations to lowercase to match backend expectations
    const formattedSpecializations = typeof value === 'string' 
      ? value.split(',').map(item => item.toLowerCase().replace('wicket keeping', 'wicket-keeping')) 
      : value.map(item => item.toLowerCase().replace('Wicket Keeping', 'wicket-keeping'));
    
    // Mark specializations as dirty
    setDirtyFields({ ...dirtyFields, specializations: true });
    
    setFormData({
      ...formData,
      specializations: formattedSpecializations,
    });
  };
  
  // Handle removing a specialization
  const handleDeleteSpecialization = (specializationToDelete) => {
    const newSpecializations = formData.specializations.filter(
      specialization => specialization !== specializationToDelete
    );
    
    // Mark specializations as dirty
    setDirtyFields({ ...dirtyFields, specializations: true });
    
    setFormData({
      ...formData,
      specializations: newSpecializations,
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      // For coaches, we need to update both User and Coach models
      if (isCoach) {
        // 1. Prepare data for the User model (name, phone)
        const userUpdateData = {
          name: dirtyFields.name ? formData.name : undefined,
          phone: dirtyFields.phone ? formData.phone : undefined,
        };
        
        // Filter out undefined fields (not changed)
        const filteredUserData = Object.fromEntries(
          Object.entries(userUpdateData).filter(([_, value]) => value !== undefined)
        );
        
        // 2. Prepare data for the Coach model
        const coachUpdateData = {
          experience: dirtyFields.experience ? formData.experience : undefined,
          hourlyRate: dirtyFields.hourlyRate ? formData.hourlyRate : undefined,
          bio: dirtyFields.bio ? formData.bio : undefined,
          specializations: dirtyFields.specializations ? formData.specializations : undefined,
          certifications: dirtyFields.certifications ? formData.certifications : undefined,
        };
        
        // For experience and hourlyRate, ensure they're numbers or null
        if (coachUpdateData.experience === '') coachUpdateData.experience = null;
        if (coachUpdateData.hourlyRate === '') coachUpdateData.hourlyRate = null;
        
        // Filter out undefined fields (not changed)
        const filteredCoachData = Object.fromEntries(
          Object.entries(coachUpdateData).filter(([_, value]) => value !== undefined)
        );
        
        // 3. Only make API calls if there are fields to update
        const updatePromises = [];
        
        if (Object.keys(filteredUserData).length > 0) {
          console.log('Updating user data:', filteredUserData);
          updatePromises.push(updateUserProfile(filteredUserData));
        }
        
        if (Object.keys(filteredCoachData).length > 0) {
          console.log('Updating coach data:', filteredCoachData);
          updatePromises.push(updateCoachProfile(filteredCoachData));
        }
        
        // 4. Wait for all updates to complete
        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);
          console.log('Profile updated successfully');
        } else {
          console.log('No changes to update');
        }
      } 
      // For regular users and admins
      else {
        // Prepare data update
        const updateData = {
          name: dirtyFields.name ? formData.name : undefined,
          phone: dirtyFields.phone ? formData.phone : undefined,
        };
        
        // Filter out undefined fields
        const filteredData = Object.fromEntries(
          Object.entries(updateData).filter(([_, value]) => value !== undefined)
        );
        
        if (Object.keys(filteredData).length > 0) {
          console.log('Updating user data:', filteredData);
          await updateUserProfile(filteredData);
          console.log('Profile updated successfully');
        } else {
          console.log('No changes to update');
        }
      }
      
      // Clear form data from session storage on successful update
      sessionStorage.removeItem('editProfileFormData');
      
      setSuccess(true);
      
      // Navigate back to profile after successful update
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (err) {
      console.error('Error updating profile:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(`Failed to update profile: ${err.response.data.message}`);
      } else {
        setError('Failed to update profile. Please try again.');
      }
      setSuccess(false);
    } finally {
      setSaving(false);
    }
  };
  
  // Combine API errors
  useEffect(() => {
    const apiError = userError || coachError || updateUserError || updateCoachError;
    if (apiError) {
      setError(apiError);
    }
  }, [userError, coachError, updateUserError, updateCoachError]);
  
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Edit Profile
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Update your personal information
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Profile updated successfully!
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                disabled // Email is read-only
                helperText="Email cannot be changed to maintain account integrity"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g., +1 (123) 456-7890"
              />
            </Grid>
            
            {/* Coach-specific fields */}
            {isCoach && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }}>
                    <Chip label="Coach Information" />
                  </Divider>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Experience (years)"
                    name="experience"
                    type="number"
                    value={formData.experience}
                    onChange={handleChange}
                    inputProps={{ min: 0, step: 1 }}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Hourly Rate ($)"
                    name="hourlyRate"
                    type="number"
                    value={formData.hourlyRate}
                    onChange={handleChange}
                    inputProps={{ min: 0, step: 5 }}
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl 
                    fullWidth 
                    margin="normal"
                    required
                  >
                    <InputLabel id="specializations-label">Specializations</InputLabel>
                    <Select
                      labelId="specializations-label"
                      id="specializations"
                      name="specializations"
                      multiple
                      value={formData.specializations}
                      onChange={handleSpecializationsChange}
                      input={<OutlinedInput id="select-multiple-chip" label="Specializations" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip 
                              key={value} 
                              label={value} 
                              onDelete={() => handleDeleteSpecialization(value)}
                              onMouseDown={(event) => {
                                event.stopPropagation();
                              }}
                            />
                          ))}
                        </Box>
                      )}
                    >
                      {specializationOptions.map((specialization) => (
                        <MenuItem
                          key={specialization}
                          value={specialization}
                        >
                          {specialization}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Biography"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    multiline
                    rows={4}
                    helperText="Describe your coaching experience, qualifications, and approach"
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Certifications"
                    name="certifications"
                    value={formData.certifications}
                    onChange={handleChange}
                    multiline
                    rows={2}
                    helperText="List your relevant certifications (optional)"
                  />
                </Grid>
              </>
            )}
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<CancelIcon />}
                  onClick={() => navigate('/profile')}
                  disabled={saving}
                >
                  Cancel
                </Button>
                
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={saving ? <CircularProgress size={24} /> : <SaveIcon />}
                  disabled={saving || Object.keys(dirtyFields).length === 0}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default EditProfile; 