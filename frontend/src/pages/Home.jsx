import { Link } from "react-router-dom";
import { 
  Box, 
  Button, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia,
  Stack,
  Paper
} from '@mui/material';
import SportsCricketIcon from '@mui/icons-material/SportsCricket';
import PeopleIcon from '@mui/icons-material/People';
import StarIcon from '@mui/icons-material/Star';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const Home = () => {
  const features = [
    {
      icon: <SportsCricketIcon fontSize="large" color="primary" />,
      title: "Expert Coaches",
      description: "Learn from certified coaches with years of experience in professional cricket."
    },
    {
      icon: <AccessTimeIcon fontSize="large" color="primary" />,
      title: "Flexible Scheduling",
      description: "Book sessions that fit your schedule, with options for weekdays and weekends."
    },
    {
      icon: <PeopleIcon fontSize="large" color="primary" />,
      title: "Personalized Training",
      description: "Get customized coaching plans tailored to your skill level and goals."
    },
    {
      icon: <StarIcon fontSize="large" color="primary" />,
      title: "Quality Assurance",
      description: "All coaches are vetted and reviewed to ensure high-quality instruction."
    }
  ];

  const testimonials = [
    {
      name: "Michael P.",
      role: "Amateur Player",
      quote: "After just 5 sessions with my coach, my batting technique improved dramatically. Highly recommend!",
      avatar: "https://randomuser.me/api/portraits/men/41.jpg"
    },
    {
      name: "Priya S.",
      role: "College Athlete",
      quote: "Found an amazing coach who helped me prepare for university trials. Now I'm playing at the collegiate level!",
      avatar: "https://randomuser.me/api/portraits/women/63.jpg"
    },
    {
      name: "David L.",
      role: "Recreational Player",
      quote: "As someone who took up cricket late in life, I found the perfect coach to help me learn the basics.",
      avatar: "https://randomuser.me/api/portraits/men/37.jpg"
    }
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box 
        sx={{ 
          bgcolor: 'primary.main', 
          color: 'white', 
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom>
                Find Your Perfect Cricket Coach
              </Typography>
              <Typography variant="h6" paragraph sx={{ mb: 4, opacity: 0.9 }}>
                Connect with top cricket coaches in Toronto for personalized training sessions and improve your game.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button 
                  variant="contained" 
                  color="secondary"
                  size="large" 
                  component={Link} 
                  to="/register"
                  sx={{ px: 4, py: 1.5 }}
                >
        Get Started
                </Button>
                <Button 
                  variant="outlined" 
                  color="inherit"
                  size="large" 
                  component={Link} 
                  to="/about"
                  sx={{ px: 4, py: 1.5 }}
                >
                  Learn More
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box sx={{ position: 'relative', height: '400px' }}>
                {/* Placeholder for hero image */}
                <Box 
                  sx={{ 
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <SportsCricketIcon sx={{ fontSize: 120, opacity: 0.8 }} />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box textAlign="center" mb={6}>
          <Typography variant="h3" component="h2" gutterBottom>
            Why Choose CricCoach?
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ maxWidth: '700px', mx: 'auto' }}>
            We make it easy to find and book sessions with qualified cricket coaches in your area.
          </Typography>
        </Box>
        
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" component="h3" gutterBottom>
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

      {/* How It Works Section */}
      <Box sx={{ bgcolor: 'grey.100', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" textAlign="center" gutterBottom>
            How It Works
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" textAlign="center" mb={6} sx={{ maxWidth: '700px', mx: 'auto' }}>
            Getting started with CricCoach is simple and straightforward.
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 4, textAlign: 'center', height: '100%' }}>
                <Box sx={{ bgcolor: 'primary.main', color: 'white', width: 50, height: 50, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                  <Typography variant="h5">1</Typography>
                </Box>
                <Typography variant="h5" component="h3" gutterBottom>
                  Create an Account
                </Typography>
                <Typography variant="body1">
                  Sign up and fill in your profile with your cricket experience and goals.
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 4, textAlign: 'center', height: '100%' }}>
                <Box sx={{ bgcolor: 'primary.main', color: 'white', width: 50, height: 50, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                  <Typography variant="h5">2</Typography>
                </Box>
                <Typography variant="h5" component="h3" gutterBottom>
                  Find a Coach
                </Typography>
                <Typography variant="body1">
                  Browse coaches based on specialization, experience, and reviews.
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 4, textAlign: 'center', height: '100%' }}>
                <Box sx={{ bgcolor: 'primary.main', color: 'white', width: 50, height: 50, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                  <Typography variant="h5">3</Typography>
                </Box>
                <Typography variant="h5" component="h3" gutterBottom>
                  Book and Play
                </Typography>
                <Typography variant="body1">
                  Schedule a session, make a payment, and get ready to improve your cricket skills.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          
          <Box textAlign="center" mt={6}>
            <Button 
              variant="contained" 
              color="primary"
              size="large" 
              component={Link} 
              to="/register"
              sx={{ px: 4, py: 1.5 }}
            >
              Start Now
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" textAlign="center" gutterBottom>
          What Our Users Say
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" textAlign="center" mb={6} sx={{ maxWidth: '700px', mx: 'auto' }}>
          Don't just take our word for it. Here's what players have to say about their experience.
        </Typography>
        
        <Grid container spacing={4}>
          {testimonials.map((testimonial, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card elevation={2} sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Box
                      component="img"
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      sx={{ width: 60, height: 60, borderRadius: '50%', mr: 2 }}
                    />
                    <Box>
                      <Typography variant="h6" component="h3">
                        {testimonial.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {testimonial.role}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body1" paragraph>
                    "{testimonial.quote}"
                  </Typography>
                  <Box>
                    <StarIcon color="warning" />
                    <StarIcon color="warning" />
                    <StarIcon color="warning" />
                    <StarIcon color="warning" />
                    <StarIcon color="warning" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 8 }}>
        <Container maxWidth="md">
          <Box textAlign="center">
            <Typography variant="h3" component="h2" gutterBottom>
              Ready to Improve Your Cricket Skills?
            </Typography>
            <Typography variant="h6" paragraph sx={{ mb: 4, opacity: 0.9 }}>
              Join thousands of players who have taken their game to the next level with CricCoach.
            </Typography>
            <Button 
              variant="contained" 
              color="secondary"
              size="large" 
              component={Link} 
              to="/register"
              sx={{ px: 6, py: 1.5 }}
            >
              Get Started Today
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
