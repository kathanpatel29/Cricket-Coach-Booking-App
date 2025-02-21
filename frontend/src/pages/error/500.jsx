import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Error as ErrorIcon } from '@mui/icons-material';

const ServerError = () => {
  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 4, textAlign: 'center', mt: 8 }}>
        <ErrorIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          500: Server Error
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Something went wrong on our end. Please try again later or contact support if the problem persists.
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
            sx={{ mr: 2 }}
          >
            Retry
          </Button>
          <Button
            variant="outlined"
            component={RouterLink}
            to="/contact"
          >
            Contact Support
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ServerError; 