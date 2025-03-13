import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper,
  Alert,
  CircularProgress,
  Divider,
  Grid
} from '@mui/material';

const Login = () => {
  const { login, error: authError, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the return path from location state, or default to dashboard
  const from = location.state?.from || '/dashboard';
  
  const [credentials, setCredentials] = useState({ 
    email: "", 
    password: "",
    adminSecretKey: "" 
  });
  const [error, setError] = useState("");
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  
  // Check if user is already logged in and redirect if they are
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);
  
  // Try to restore email from localStorage if available
  useEffect(() => {
    const savedEmail = localStorage.getItem('lastUsedEmail');
    if (savedEmail) {
      setCredentials(prev => ({
        ...prev,
        email: savedEmail
      }));
    }
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value
    });
    
    // Clear errors when user types
    if (error) setError("");
  };

  const toggleAdminLogin = () => {
    setIsAdminLogin(!isAdminLogin);
    // Clear admin secret key when toggling off
    if (isAdminLogin) {
      setCredentials({
        ...credentials,
        adminSecretKey: ""
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    try {
      const { email, password, adminSecretKey } = credentials;
      
      // Save email for future convenience (don't save password!)
      localStorage.setItem('lastUsedEmail', email);
      
      // Only include adminSecretKey if admin login is toggled on
      const loginData = isAdminLogin 
        ? { email, password, adminSecretKey }
        : { email, password };
        
      await login(loginData);
      
      // Navigation will happen in the useEffect when isAuthenticated changes
      console.log(`Login successful, will navigate to: ${from}`);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || "Login failed. Please check your credentials.");
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
            Sign in to your account
          </Typography>
          
          {(error || authError) && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error || authError}
            </Alert>
          )}
          
          {from !== '/dashboard' && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Please log in to access the requested page
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={credentials.email}
              onChange={handleChange}
              disabled={loading}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={credentials.password}
              onChange={handleChange}
              disabled={loading}
            />
            
            {isAdminLogin && (
              <TextField
                margin="normal"
                required
                fullWidth
                name="adminSecretKey"
                label="Admin Secret Key"
                type="password"
                id="adminSecretKey"
                value={credentials.adminSecretKey}
                onChange={handleChange}
                disabled={loading}
              />
            )}
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 1, py: 1.5 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
            
            <Button
              type="button"
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
              onClick={toggleAdminLogin}
              disabled={loading}
            >
              {isAdminLogin ? 'Cancel Admin Login' : 'Login as Admin'}
            </Button>
            
            <Divider sx={{ my: 2 }}>Or</Divider>
            
            <Grid container>
              <Grid item xs>
                <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
                  <Button variant="text" color="primary" size="small" disabled={loading}>
                    Forgot Password?
                  </Button>
                </Link>
              </Grid>
              <Grid item>
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  <Button variant="text" color="primary" size="small" disabled={loading}>
                    Don't have an account? Sign Up
                  </Button>
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
