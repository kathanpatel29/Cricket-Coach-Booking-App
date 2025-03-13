import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  FormControlLabel, 
  Checkbox, 
  Grid, 
  Paper, 
  Alert, 
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Chip,
  OutlinedInput
} from '@mui/material';

// Cricket specializations options
const specializationOptions = [
  'Batting',
  'Bowling',
  'Fielding',
  'Wicket Keeping'
];

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    adminSecretKey: '',
    specializations: [],
    experience: '',
    hourlyRate: '',
    bio: '',
    agreeToTerms: false
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    const newValue = name === 'agreeToTerms' ? checked : value;
    
    setFormData({
      ...formData,
      [name]: newValue,
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  // Special handler for multi-select
  const handleSpecializationsChange = (event) => {
    const { value } = event.target;
    // Convert specializations to lowercase to match backend expectations
    const formattedSpecializations = typeof value === 'string' 
      ? value.split(',').map(item => item.toLowerCase().replace('wicket keeping', 'wicket-keeping')) 
      : value.map(item => item.toLowerCase().replace('wicket keeping', 'wicket-keeping'));
    
    setFormData({
      ...formData,
      specializations: formattedSpecializations,
    });
    
    // Clear error when user selects
    if (errors.specializations) {
      setErrors({
        ...errors,
        specializations: '',
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Role-specific validations
    if (formData.role === 'admin' && !formData.adminSecretKey) {
      newErrors.adminSecretKey = 'Admin secret key is required';
    }
    
    if (formData.role === 'coach') {
      if (!formData.specializations || formData.specializations.length === 0) {
        newErrors.specializations = 'At least one specialization is required';
      }
      if (!formData.experience) {
        newErrors.experience = 'Experience is required';
      } else if (isNaN(formData.experience) || Number(formData.experience) < 0) {
        newErrors.experience = 'Experience must be a positive number';
      }
      if (!formData.hourlyRate) {
        newErrors.hourlyRate = 'Hourly rate is required';
      } else if (isNaN(formData.hourlyRate) || Number(formData.hourlyRate) <= 0) {
        newErrors.hourlyRate = 'Hourly rate must be a positive number';
      }
      if (!formData.bio) {
        newErrors.bio = 'Bio is required';
      }
    }
    
    // Terms agreement validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the Terms of Service and Privacy Policy';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Remove confirmPassword and agreeToTerms before sending to API
      const { confirmPassword, agreeToTerms, ...registerData } = formData;
      
      // Convert numeric strings to numbers for coach data
      if (registerData.role === 'coach') {
        registerData.experience = Number(registerData.experience);
        registerData.hourlyRate = Number(registerData.hourlyRate);
        
        // Make sure specializations is properly formatted
        if (Array.isArray(registerData.specializations)) {
          // Map each specialization to lowercase and handle "Wicket Keeping" to "wicket-keeping"
          registerData.specializations = registerData.specializations.map(spec => 
            spec.toLowerCase().replace('wicket keeping', 'wicket-keeping')
          );
          
          // Ensure the array isn't empty
          if (registerData.specializations.length === 0) {
            throw new Error('At least one specialization is required');
          }
        } else {
          // If it's somehow not an array, provide a helpful error
          throw new Error('Specializations must be selected from the dropdown');
        }
      }
      
      console.log('Sending registration data:', registerData);
      const user = await register(registerData);
      console.log('Registration successful:', user);
      
      // Navigate based on role
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      
      // Handle specific error cases
      if (err.response?.status === 409 || 
          (err.response?.data?.message && err.response?.data?.message.includes('exist'))) {
        // Email already exists error
        setErrors({
          ...errors,
          email: 'An account with this email already exists',
          general: 'Registration failed. This email is already registered.'
        });
      } else if (err.response?.status === 400) {
        // Bad request - likely validation error
        setErrors({
          ...errors,
          general: err.response?.data?.message || 'Please check your information and try again.'
        });
      } else {
        // General error
        setErrors({
          ...errors,
          general: err.response?.data?.message || 'Registration failed. Please try again later.'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          marginBottom: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
            <svg className="w-10 h-10 mr-2 text-blue-600" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            <Typography component="h1" variant="h4" fontWeight="bold">
              CricCoach
            </Typography>
          </Box>
          
          <Typography component="h2" variant="h5" align="center" gutterBottom>
            Create your account
          </Typography>
          
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Join Toronto's premier cricket coaching platform
          </Typography>

          {errors.general && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errors.general}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Full Name"
              name="name"
              autoComplete="name"
              autoFocus
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              disabled={isSubmitting}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              disabled={isSubmitting}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              disabled={isSubmitting}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              disabled={isSubmitting}
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel id="role-label">I want to register as</InputLabel>
              <Select
                labelId="role-label"
                id="role"
                name="role"
                value={formData.role}
                label="I want to register as"
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <MenuItem value="user">User (Find a coach)</MenuItem>
                <MenuItem value="coach">Coach (Offer coaching services)</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            
            {/* Admin-specific fields */}
            {formData.role === 'admin' && (
              <TextField
                margin="normal"
                required
                fullWidth
                name="adminSecretKey"
                label="Admin Secret Key"
                type="password"
                id="adminSecretKey"
                value={formData.adminSecretKey}
                onChange={handleChange}
                error={!!errors.adminSecretKey}
                helperText={errors.adminSecretKey}
                disabled={isSubmitting}
              />
            )}
            
            {/* Coach-specific fields */}
            {formData.role === 'coach' && (
              <>
                <FormControl 
                  fullWidth 
                  margin="normal" 
                  error={!!errors.specializations}
                  required
                >
                  <InputLabel id="specializations-label">Specializations</InputLabel>
                  <Select
                    labelId="specializations-label"
                    id="specializations"
                    multiple
                    value={formData.specializations}
                    onChange={handleSpecializationsChange}
                    input={<OutlinedInput id="select-multiple-chip" label="Specializations" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} />
                        ))}
                      </Box>
                    )}
                    disabled={isSubmitting}
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
                  {errors.specializations && (
                    <Typography variant="caption" color="error">
                      {errors.specializations}
                    </Typography>
                  )}
                </FormControl>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="experience"
                  label="Years of Experience"
                  id="experience"
                  type="number"
                  inputProps={{ min: 0 }}
                  value={formData.experience}
                  onChange={handleChange}
                  error={!!errors.experience}
                  helperText={errors.experience}
                  disabled={isSubmitting}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="hourlyRate"
                  label="Hourly Rate ($)"
                  id="hourlyRate"
                  type="number"
                  inputProps={{ min: 0 }}
                  value={formData.hourlyRate}
                  onChange={handleChange}
                  error={!!errors.hourlyRate}
                  helperText={errors.hourlyRate}
                  disabled={isSubmitting}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="bio"
                  label="Bio"
                  id="bio"
                  multiline
                  rows={4}
                  placeholder="Tell us about your coaching experience and philosophy..."
                  value={formData.bio}
                  onChange={handleChange}
                  error={!!errors.bio}
                  helperText={errors.bio}
                  disabled={isSubmitting}
                />
              </>
            )}
            
            <Box sx={{ mt: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="agreeToTerms"
                    color="primary"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                }
                label={
                  <Typography variant="body2">
                    I agree to the{' '}
                    <Link to="/terms" style={{ textDecoration: 'none' }}>
                      <Typography component="span" variant="body2" color="primary">
                        Terms of Service
                      </Typography>
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" style={{ textDecoration: 'none' }}>
                      <Typography component="span" variant="body2" color="primary">
                        Privacy Policy
                      </Typography>
                    </Link>
                  </Typography>
                }
              />
              {errors.agreeToTerms && (
                <Typography variant="caption" color="error">
                  {errors.agreeToTerms}
                </Typography>
              )}
            </Box>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? <CircularProgress size={24} /> : 'Create Account'}
            </Button>
            
            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>
            
            <Grid container justifyContent="center">
              <Grid item>
                <Typography variant="body2">
                  Already have an account?{' '}
                  <Link to="/login" style={{ textDecoration: 'none' }}>
                    <Typography component="span" variant="body2" color="primary" fontWeight="medium">
                      Sign in
                    </Typography>
                  </Link>
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register; 