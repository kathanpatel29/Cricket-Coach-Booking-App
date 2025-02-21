import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Box, Alert, Typography } from '@mui/material';

const withApprovalCheck = (WrappedComponent) => {
  return function WithApprovalCheck(props) {
    const { user } = useAuth();

    if (user.role === 'coach' && !user.isApproved) {
      return (
        <Box p={3}>
          <Alert severity="warning">
            This feature is only available after your coach profile is approved.
          </Alert>
          <Typography sx={{ mt: 2 }}>
            Please wait for admin approval to access this feature.
          </Typography>
        </Box>
      );
    }

    return <WrappedComponent {...props} />;
  };
};

export default withApprovalCheck; 