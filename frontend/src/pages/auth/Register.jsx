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
import { authService } from '../../services/api';

const SPECIALIZATIONS = ['batting', 'bowling', 'fielding', 'wicket-keeping'];

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'client',
    specializations: [],
    experience: '',
    hourlyRate: '',
    bio: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      const response = await authService.register(formData);
      if (formData.role === 'coach') {
        navigate('/dashboard', {
          state: {
            message: 'Registration successful! Your coach profile is pending admin approval. You will have limited access until approved.'
          }
        });
      } else {
        navigate('/dashboard', {
          state: { message: 'Registration successful!' }
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Register
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
              required
            >
              <MenuItem value="client">Client</MenuItem>
              <MenuItem value="coach">Coach</MenuItem>
            </Select>
          </FormControl>

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