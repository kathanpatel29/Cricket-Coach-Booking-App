import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

const Privacy = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Privacy Policy
        </Typography>
        <Typography variant="body1" paragraph>
          At CricCoach, we take your privacy seriously. This policy describes how we collect, use, and protect your personal information.
        </Typography>
        
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          1. Information We Collect
        </Typography>
        <Typography variant="body1" paragraph>
          We collect information you provide when you create an account, book a session, or communicate with coaches. This includes your name, email, and payment information.
        </Typography>
        
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          2. How We Use Your Information
        </Typography>
        <Typography variant="body1" paragraph>
          We use your information to provide our services, process payments, and improve your experience. We may also use it to communicate with you about bookings and updates.
        </Typography>
        
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          3. Data Security
        </Typography>
        <Typography variant="body1" paragraph>
          We implement appropriate security measures to protect your personal information from unauthorized access, alteration, or disclosure.
        </Typography>
      </Paper>
    </Container>
  );
};

export default Privacy; 