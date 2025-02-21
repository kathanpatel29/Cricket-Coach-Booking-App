import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { SentimentVeryDissatisfied as SadIcon } from '@mui/icons-material';

const NotFound = () => {
  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 4, textAlign: 'center', mt: 8 }}>
        <SadIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          404: Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          The page you're looking for doesn't exist or has been moved.
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            component={RouterLink}
            to="/"
            sx={{ mr: 2 }}
          >
            Go Home
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

export default NotFound; 