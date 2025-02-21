import React from 'react';
import {
  Alert as MuiAlert,
  Snackbar,
  IconButton
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const Alert = ({ 
  open, 
  message, 
  severity = 'info', 
  duration = 6000,
  onClose 
}) => {
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <MuiAlert
        elevation={6}
        variant="filled"
        severity={severity}
        action={
          <IconButton
            size="small"
            color="inherit"
            onClick={handleClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        {message}
      </MuiAlert>
    </Snackbar>
  );
};

export default Alert; 