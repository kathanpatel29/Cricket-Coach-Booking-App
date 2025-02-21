import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  IconButton,
  Stack,
  Divider
} from '@mui/material';
import {
  Facebook,
  Twitter,
  Instagram,
  YouTube,
  Email,
  Phone,
  LocationOn
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { LOCATION } from '../../utils/constants';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        py: 6,
        mt: 'auto'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              Cricket Coach
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Professional cricket coaching in the {LOCATION.region}
            </Typography>
            <Stack direction="row" spacing={1}>
              <IconButton color="inherit" aria-label="Facebook">
                <Facebook />
              </IconButton>
              <IconButton color="inherit" aria-label="Twitter">
                <Twitter />
              </IconButton>
              <IconButton color="inherit" aria-label="Instagram">
                <Instagram />
              </IconButton>
              <IconButton color="inherit" aria-label="YouTube">
                <YouTube />
              </IconButton>
            </Stack>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              Quick Links
            </Typography>
            <Stack>
              <Link component={RouterLink} to="/about" color="inherit">
                About Us
              </Link>
              <Link component={RouterLink} to="/coaches" color="inherit">
                Find a Coach
              </Link>
              <Link component={RouterLink} to="/contact" color="inherit">
                Contact Us
              </Link>
              <Link component={RouterLink} to="/faq" color="inherit">
                FAQ
              </Link>
            </Stack>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              Legal
            </Typography>
            <Stack>
              <Link component={RouterLink} to="/privacy-policy" color="inherit">
                Privacy Policy
              </Link>
              <Link component={RouterLink} to="/terms" color="inherit">
                Terms of Service
              </Link>
              <Link component={RouterLink} to="/refund-policy" color="inherit">
                Refund Policy
              </Link>
            </Stack>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              Contact Us
            </Typography>
            <Stack spacing={1}>
              <Box display="flex" alignItems="center">
                <LocationOn sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {LOCATION.region}, {LOCATION.country}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center">
                <Email sx={{ mr: 1 }} />
                <Link href="mailto:info@cricketcoach.ca" color="inherit">
                  info@cricketcoach.ca
                </Link>
              </Box>
              <Box display="flex" alignItems="center">
                <Phone sx={{ mr: 1 }} />
                <Link href="tel:+1-416-555-0123" color="inherit">
                  +1 (416) 555-0123
                </Link>
              </Box>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: 'primary.light' }} />

        <Typography variant="body2" align="center">
          © {currentYear} Cricket Coach. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer; 