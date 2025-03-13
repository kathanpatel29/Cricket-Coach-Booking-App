import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

const Terms = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Terms of Service
        </Typography>
        <Typography variant="body1" paragraph>
          Welcome to CricCoach. By using our services, you agree to these terms.
        </Typography>
        
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          1. User Accounts
        </Typography>
        <Typography variant="body1" paragraph>
          You must create an account to use certain features of our service. You are responsible for maintaining the confidentiality of your account information.
        </Typography>
        
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          2. Booking and Payments
        </Typography>
        <Typography variant="body1" paragraph>
          All payments are processed securely through our platform. Coaches set their own rates, and CricCoach charges a service fee for each booking.
        </Typography>
        
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          3. Cancellation Policy
        </Typography>
        <Typography variant="body1" paragraph>
          Cancellations made at least 24 hours before the scheduled session are eligible for a full refund. Late cancellations may be subject to fees.
        </Typography>
      </Paper>
    </Container>
  );
};

export default Terms; 