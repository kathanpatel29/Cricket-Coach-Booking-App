import React from 'react';
import { Container, Typography, Box, Paper, TextField, Button, Grid } from '@mui/material';

const Contact = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Contact Us
        </Typography>
        <Typography variant="body1" paragraph>
          Have questions about CricCoach? We're here to help!
        </Typography>
        
        <Box component="form" noValidate sx={{ mt: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="name"
                label="Your Name"
                name="name"
                autoComplete="name"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="subject"
                label="Subject"
                name="subject"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="message"
                label="Message"
                name="message"
                multiline
                rows={4}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                sx={{ mt: 2 }}
              >
                Send Message
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default Contact;
