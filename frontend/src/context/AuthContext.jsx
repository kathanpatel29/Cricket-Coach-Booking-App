import { createContext, useState, useEffect, useCallback } from 'react';
import api, { authApi } from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Function to get user profile data
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await authApi.getProfile();
      return response.data.data.user;
    } catch (err) {
      console.error('Error fetching user profile:', err);
      throw err;
    }
  }, []);

  // Check if user is already logged in (via token in localStorage)
  useEffect(() => {
    const checkAuthStatus = async () => {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (token) {
        try {
          // Set the token in the API headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Fetch current user data
          const userData = await fetchUserProfile();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (err) {
          console.warn('Token validation failed, attempting refresh...', err);
          
          // Try to refresh the token
          if (refreshToken) {
            try {
              const refreshResponse = await authApi.refreshToken(refreshToken);
              const { token: newToken, refreshToken: newRefreshToken } = refreshResponse.data.data;
              
              // Save tokens
              localStorage.setItem('token', newToken);
              localStorage.setItem('refreshToken', newRefreshToken);
              api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
              
              // Retry fetching user profile
              try {
                const userData = await fetchUserProfile();
                setUser(userData);
                setIsAuthenticated(true);
              } catch (profileErr) {
                console.error('Failed to fetch user profile after token refresh:', profileErr);
                handleLogout();
              }
            } catch (refreshErr) {
              console.error('Token refresh failed:', refreshErr);
              handleLogout();
            }
          } else {
            console.warn('No refresh token available');
            handleLogout();
          }
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
      
      setLoading(false);
      setInitialCheckDone(true);
    };

    checkAuthStatus();
    
    // Add event listener for storage changes (for multi-tab support)
    const handleStorageChange = (e) => {
      if (e.key === 'token' && !e.newValue) {
        // Token was removed in another tab
        setUser(null);
        setIsAuthenticated(false);
      } else if (e.key === 'token' && e.newValue && !isAuthenticated) {
        // Token was added in another tab
        checkAuthStatus();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchUserProfile]);
  
  // Handle offline/online status
  useEffect(() => {
    const handleOnline = () => {
      console.log('App is back online, checking authentication status');
      if (localStorage.getItem('token') && user) {
        // Verify token is still valid when coming back online
        fetchUserProfile()
          .catch(err => {
            console.error('Error validating session after reconnect:', err);
            // Don't log out automatically - the API interceptor will 
            // handle token refresh if needed
          });
      }
    };
    
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [fetchUserProfile, user]);

  // Login function
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authApi.login(credentials);
      const { token, refreshToken, user } = response.data.data;
      
      // Save tokens to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Set token in API headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Update state
      setUser(user);
      setIsAuthenticated(true);
      return user;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      setIsAuthenticated(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authApi.register(userData);
      const { token, refreshToken, user } = response.data.data;
      
      // Save tokens to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Set token in API headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Update state
      setUser(user);
      setIsAuthenticated(true);
      return user;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const handleLogout = useCallback(() => {
    // Remove tokens from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    
    // Remove token from API headers
    api.defaults.headers.common['Authorization'] = '';
    
    // Update state
    setUser(null);
    setError(null); // Reset error state
    setIsAuthenticated(false);
  }, []);
  
  // Logout with API call
  const logout = async () => {
    try {
      // Call logout API if available to invalidate token on server
      // await authApi.logout();
    } catch (err) {
      console.error('Error during logout:', err);
    } finally {
      // Always perform client-side logout
      handleLogout();
    }
  };

  // Update user profile
  const updateProfile = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authApi.updateProfile(userData);
      const updatedUser = response.data.data.user;
      setUser(prevUser => ({...prevUser, ...updatedUser}));
      return updatedUser;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Profile update failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated,
    initialCheckDone,
    login,
    register,
    logout,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
