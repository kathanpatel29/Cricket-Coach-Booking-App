import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

// Export the hook separately
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export the provider as default
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    
    // Listen for force refresh events
    const handleStorageChange = (e) => {
      if (e.key === 'forceRefresh' && e.newValue === 'true' ||
          e.key === 'coachApprovalUpdate') {
        refreshUser();
        if (e.key === 'forceRefresh') {
          localStorage.removeItem('forceRefresh');
        }
      }
    };

    // Listen for coach approval events
    const handleCoachApproval = () => {
      refreshUser();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('coachApproved', handleCoachApproval);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('coachApproved', handleCoachApproval);
    };
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await authService.getProfile();
        console.log('Auth check response:', response.data);
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authService.getProfile();
      console.log('Refresh user response:', response.data);
      setUser(response.data.user);
      
      // If the user is a coach and is now approved, trigger a page reload
      if (response.data.user.role === 'coach' && response.data.user.isApproved) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      const { token, user } = response.data.data;
      localStorage.setItem('token', token);
      setUser(user);
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}