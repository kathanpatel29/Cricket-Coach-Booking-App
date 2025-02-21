import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Box, Alert, Typography, Button } from '@mui/material';
import { authService } from '../../services/api';

const withApprovalCheck = (WrappedComponent) => {
  return function WithApprovalCheck(props) {
    const { user, refreshUser } = useAuth();

    useEffect(() => {
      const checkApprovalStatus = async () => {
        try {
          if (!user) return; // Don't check if no user
          const response = await authService.getProfile();
          if (response?.data?.user?.isApproved !== user?.isApproved) {
            await refreshUser();
          }
        } catch (err) {
          console.error('Error checking approval status:', err);
        }
      };

      if (user?.role === 'coach') {
        checkApprovalStatus();
      }
    }, [user?.role]);

    // Don't show approval warning if not a coach or no user
    if (!user || user.role !== 'coach') {
      return <WrappedComponent {...props} />;
    }

    // Show approval warning only for unapproved coaches
    if (!user.isApproved) {
      return (
        <Box p={3}>
          <Alert severity="warning">
            This feature is only available after your coach profile is approved.
          </Alert>
          <Typography sx={{ mt: 2 }}>
            Please wait for admin approval to access this feature.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={refreshUser}
            sx={{ mt: 2 }}
          >
            Check Approval Status
          </Button>
        </Box>
      );
    }

    return <WrappedComponent {...props} />;
  };
};

export default withApprovalCheck; 