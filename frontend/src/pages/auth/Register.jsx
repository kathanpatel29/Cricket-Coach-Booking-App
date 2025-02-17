import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  OutlinedInput
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const SPECIALIZATIONS = ['batting', 'bowling', 'fielding', 'wicket-keeping'];

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'client',
    adminSecretKey: '',
    specializations: [],
    experience: '',
    hourlyRate: '',
    bio: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdminKey, setShowAdminKey] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'role') {
      setShowAdminKey(value === 'admin');
    }
  };

  const handleSpecializationChange = (event) => {
    const { value } = event.target;
    setFormData(prev => ({
      ...prev,
      specializations: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate admin registration
      if (formData.role === 'admin') {
        if (!formData.adminSecretKey) {
          setError('Admin secret key is required');
          setLoading(false);
          return;
        }

        // Only send necessary admin data
        const adminData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'admin',
          adminSecretKey: formData.adminSecretKey
        };

        const response = await register(adminData);
        if (response.data.status === 'success') {
          navigate('/admin-dashboard');
          return;
        }
      }

      // Handle coach registration
      if (formData.role === 'coach') {
        if (formData.specializations.length === 0) {
          setError('Please select at least one specialization');
          setLoading(false);
          return;
        }

        if (formData.bio.length < 10) {
          setError('Bio must be at least 10 characters long');
          setLoading(false);
          return;
        }

        const coachData = {
          ...formData,
          experience: Number(formData.experience),
          hourlyRate: Number(formData.hourlyRate)
        };

        const response = await register(coachData);
        if (response.data.status === 'success') {
          navigate('/coach-dashboard');
          return;
        }
      }

      // Handle client registration
      if (formData.role === 'client') {
        const clientData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'client'
        };

        const response = await register(clientData);
        if (response.data.status === 'success') {
          navigate('/client-dashboard');
          return;
        }
      }

    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          {formData.role === 'admin' ? 'Admin Registration' : 'Register'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              name="role"
              value={formData.role}
              onChange={handleChange}
              label="Role"
            >
              <MenuItem value="client">Client</MenuItem>
              <MenuItem value="coach">Coach</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>

          {showAdminKey && (
            <TextField
              fullWidth
              label="Admin Secret Key"
              name="adminSecretKey"
              type="password"
              value={formData.adminSecretKey}
              onChange={handleChange}
              margin="normal"
              required
              error={formData.role === 'admin' && !formData.adminSecretKey}
              helperText={
                formData.role === 'admin' && 
                !formData.adminSecretKey && 
                'Admin secret key is required'
              }
            />
          )}

          {formData.role === 'coach' && (
            <>
              <FormControl fullWidth margin="normal">
                <InputLabel>Specializations</InputLabel>
                <Select
                  multiple
                  value={formData.specializations}
                  onChange={handleSpecializationChange}
                  input={<OutlinedInput label="Specializations" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} />
                      ))}
                    </Box>
                  )}
                  required
                >
                  {SPECIALIZATIONS.map((spec) => (
                    <MenuItem key={spec} value={spec}>
                      {spec}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Experience (years)"
                name="experience"
                type="number"
                value={formData.experience}
                onChange={handleChange}
                margin="normal"
                required
                inputProps={{ min: 0 }}
              />

              <TextField
                fullWidth
                label="Hourly Rate ($)"
                name="hourlyRate"
                type="number"
                value={formData.hourlyRate}
                onChange={handleChange}
                margin="normal"
                required
                inputProps={{ min: 0 }}
              />

              <TextField
                fullWidth
                label="Bio"
                name="bio"
                multiline
                rows={4}
                value={formData.bio}
                onChange={handleChange}
                margin="normal"
                required
                helperText="Minimum 10 characters"
                inputProps={{ minLength: 10 }}
              />

              <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
                Note: Your coach profile will need admin approval before you can access all coaching features. 
                Until then, you will have limited access to the platform.
              </Alert>
            </>
          )}

          {formData.role === 'admin' && (
            <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
              Admin registration requires a valid admin secret key.
              Please contact the system administrator if you don't have one.
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{ mt: 3 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Register'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default Register;