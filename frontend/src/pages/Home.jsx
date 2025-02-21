import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Stack,
  useTheme
} from '@mui/material';
import {
  SportsCricket as CricketIcon,
  Group as GroupIcon,
  EmojiEvents as TrophyIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import Testimonials from '../components/home/Testimonials';
import { LOCATION } from '../utils/constants';

const features = [
  {
    icon: <CricketIcon sx={{ fontSize: 40 }} />,
    title: "Expert Coaching",
    description: "Learn from certified coaches with professional playing experience"
  },
  {
    icon: <GroupIcon sx={{ fontSize: 40 }} />,
    title: "All Skill Levels",
    description: "Programs for beginners to advanced players of all ages"
  },
  {
    icon: <TrophyIcon sx={{ fontSize: 40 }} />,
    title: "Proven Results",
    description: "Track record of developing successful players at all levels"
  },
  {
    icon: <LocationIcon sx={{ fontSize: 40 }} />,
    title: "Convenient Locations",
    description: `Multiple training facilities across the ${LOCATION.region}`
  }
];

const Home = () => {
  const theme = useTheme();

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          py: 12,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" gutterBottom>
                Master Cricket with Professional Coaching
              </Typography>
              <Typography variant="h5" paragraph>
                Transform your game with personalized training in the {LOCATION.region}
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  component={RouterLink}
                  to="/coaches"
                >
                  Find a Coach
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  size="large"
                  component={RouterLink}
                  to="/about"
                >
                  Learn More
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src="/images/hero-image.jpg"
                alt="Cricket Coaching"
                sx={{
                  width: '100%',
                  borderRadius: 2,
                  boxShadow: 3
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                sx={{ 
                  height: '100%',
                  textAlign: 'center',
                  transition: '0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 3
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Testimonials Section */}
      <Testimonials />

      {/* CTA Section */}
      <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', py: 8 }}>
        <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Ready to Improve Your Game?
          </Typography>
          <Typography variant="subtitle1" paragraph>
            Join our cricket coaching program today and take your skills to the next level.
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            component={RouterLink}
            to="/register"
          >
            Get Started Now
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default Home; 