import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  CircularProgress,
  Alert
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/api';
import { toast } from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    adminSecretKey: "",
  });
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.email) {
      setFormData(prev => ({
        ...prev,
        email: location.state.email
      }));
    }
  }, [location.state]);

  useEffect(() => {
    if (formData.email.toLowerCase().includes('admin')) {
      setShowAdminKey(true);
    } else {
      setShowAdminKey(false);
      setFormData(prev => ({ ...prev, adminSecretKey: '' }));
    }
  }, [formData.email]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setEmailError('');
  };

  const handleEmailBlur = async (e) => {
    const email = e.target.value;
    if (email) {
      try {
        const response = await authService.checkEmail(email);
        if (!response.data.exists) {
          setEmailError("No account found with this email");
        } else {
          setEmailError("");
          if (email.toLowerCase().includes('admin')) {
            setShowAdminKey(true);
          }
        }
      } catch (error) {
        console.error('Email check error:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.email || !formData.password) {
      setError("Please provide both email and password");
      setLoading(false);
      return;
    }

    try {
      const loginData = {
        email: formData.email,
        password: formData.password
      };

      if (showAdminKey) {
        loginData.adminSecretKey = formData.adminSecretKey;
      }

      const user = await login(loginData);
      
      if (user.role === 'coach') {
        if (!user.isApproved) {
          toast.success('Your coach profile is pending approval. Access will be limited until approved.');
        }
        navigate('/coach/dashboard');
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'Invalid email or password';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom align="center">
          Sign in to your account
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email address"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            onBlur={handleEmailBlur}
            error={!!emailError}
            helperText={emailError}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            margin="normal"
          />

          {showAdminKey && (
            <TextField
              fullWidth
              label="Admin Secret Key"
              name="adminSecretKey"
              type="password"
              required={showAdminKey}
              value={formData.adminSecretKey}
              onChange={handleChange}
              margin="normal"
              helperText="Required for admin login. Contact system administrator if you don't have it."
            />
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{ mt: 3 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign in'}
          </Button>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              Don't have an account?{' '}
              <Button
                color="primary"
                onClick={() => navigate('/register')}
                sx={{ textTransform: 'none' }}
              >
                Sign up
              </Button>
            </Typography>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default Login; 