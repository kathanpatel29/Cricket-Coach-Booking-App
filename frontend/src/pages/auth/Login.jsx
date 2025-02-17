import React, { useState, useContext, useEffect } from "react"; // Add useEffect here
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import Alert from "../../components/common/Alert";
import { authService } from "../../services/api.js";
import { Box, Button, TextField, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    adminSecretKey: "",
  });
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [emailError, setEmailError] = useState("");

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

    try {
      // Validate admin login
      if (formData.email.toLowerCase().includes('admin')) {
        if (!formData.adminSecretKey) {
          setError('Admin secret key is required for admin login');
          return;
        }
      }

      const response = await login(formData);

      if (response.data.status === 'success') {
        const { role } = response.data.data.user;
        
        // Redirect based on user role
        switch (role) {
          case 'admin':
            navigate('/dashboard');
            break;
          case 'coach':
            navigate('/coach/dashboard');
            break;
          default:
            navigate('/dashboard');
        }
        
        toast.success('Login successful!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      toast.error(err.response?.data?.message || 'Login failed');
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