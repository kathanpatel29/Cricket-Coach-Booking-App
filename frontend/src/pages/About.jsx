import React from 'react';
import { Container, Typography, Box, Paper, Grid } from '@mui/material';

const About = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          About CricCoach
        </Typography>
        <Typography variant="body1" paragraph>
          CricCoach is Toronto's premier cricket coaching platform, connecting passionate players with expert coaches.
        </Typography>
        <Typography variant="body1" paragraph>
          Our mission is to make high-quality cricket coaching accessible to everyone, from beginners to advanced players.
        </Typography>
      </Paper>
    </Container>
  );
};

export default About;
