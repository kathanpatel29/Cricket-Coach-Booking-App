import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Button, TextField, Typography, Paper, Container } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/api';
import Alert from '../../components/common/Alert';
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
    // Check if email contains 'admin' and show admin key field
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
    
    // Clear errors when user types
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
          // Show admin key field if it's an admin email
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

    if (!formData.email || !formData.password) {
      setError("Please provide both email and password");
      return;
    }

    try {
      // Only send email and password in the login request
      const loginData = {
        email: formData.email,
        password: formData.password
      };

      // If it's an admin login, include the admin key
      if (showAdminKey) {
        loginData.adminSecretKey = formData.adminSecretKey;
      }

      // Use the login function from AuthContext
      const user = await login(loginData);
      
      // Handle redirections based on role
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
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>

        {error && <Alert type="error" message={error} />}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className={`appearance-none rounded-md relative block w-full px-3 py-2 border ${
                  emailError ? 'border-red-500' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
                value={formData.email}
                onChange={handleChange}
                onBlur={handleEmailBlur}
              />
              {emailError && (
                <p className="mt-1 text-sm text-red-600">
                  {emailError}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            {showAdminKey && (
              <div>
                <label htmlFor="adminSecretKey" className="block text-sm font-medium text-gray-700">
                  Admin Secret Key
                </label>
                <input
                  id="adminSecretKey"
                  name="adminSecretKey"
                  type="password"
                  required={showAdminKey}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  value={formData.adminSecretKey}
                  onChange={handleChange}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Required for admin login. Contact system administrator if you don't have it.
                </p>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login; 