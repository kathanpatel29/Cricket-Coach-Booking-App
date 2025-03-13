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
import { useTranslation } from 'react-i18next';

const Home = () => {
  const { t } = useTranslation();
  
  const features = [
    {
      icon: <SportsCricketIcon fontSize="large" color="primary" />,
      title: t('home.features.expertCoaches.title'),
      description: t('home.features.expertCoaches.description')
    },
    {
      icon: <AccessTimeIcon fontSize="large" color="primary" />,
      title: t('home.features.flexibleScheduling.title'),
      description: t('home.features.flexibleScheduling.description')
    },
    {
      icon: <PeopleIcon fontSize="large" color="primary" />,
      title: t('home.features.personalizedTraining.title'),
      description: t('home.features.personalizedTraining.description')
    },
    {
      icon: <StarIcon fontSize="large" color="primary" />,
      title: t('home.features.qualityAssurance.title'),
      description: t('home.features.qualityAssurance.description')
    }
  ];

  const testimonials = [
    {
      name: t('home.testimonials.user1.name'),
      role: t('home.testimonials.user1.role'),
      quote: t('home.testimonials.user1.quote'),
      avatar: "https://randomuser.me/api/portraits/men/41.jpg"
    },
    {
      name: t('home.testimonials.user2.name'),
      role: t('home.testimonials.user2.role'),
      quote: t('home.testimonials.user2.quote'),
      avatar: "https://randomuser.me/api/portraits/women/63.jpg"
    },
    {
      name: t('home.testimonials.user3.name'),
      role: t('home.testimonials.user3.role'),
      quote: t('home.testimonials.user3.quote'),
      avatar: "https://randomuser.me/api/portraits/men/37.jpg"
    }
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box 
        sx={{ 
          backgroundColor: 'primary.main',
          color: 'white',
          py: 8,
          textAlign: 'center'
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
            {t('home.hero.title')}
          </Typography>
          <Typography variant="h5" paragraph sx={{ mb: 4 }}>
            {t('home.hero.subtitle')}
          </Typography>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            justifyContent="center"
          >
            <Button 
              variant="contained" 
              color="secondary" 
              size="large" 
              component={Link} 
              to="/coaches"
            >
              {t('coach.findCoach')}
            </Button>
            <Button 
              variant="outlined" 
              color="inherit" 
              size="large" 
              component={Link} 
              to="/register"
            >
              {t('coach.becomeCoach')}
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" align="center" gutterBottom>
          {t('home.whyChooseUs')}
        </Typography>
        <Grid container spacing={4} sx={{ mt: 4 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  textAlign: 'center',
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography gutterBottom variant="h5" component="h3">
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
            {t('home.howItWorks.title')}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" textAlign="center" mb={6} sx={{ maxWidth: '700px', mx: 'auto' }}>
            {t('home.howItWorks.subtitle')}
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 4, textAlign: 'center', height: '100%' }}>
                <Box sx={{ bgcolor: 'primary.main', color: 'white', width: 50, height: 50, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                  <Typography variant="h5">1</Typography>
                </Box>
                <Typography variant="h5" component="h3" gutterBottom>
                  {t('home.howItWorks.step1.title')}
                </Typography>
                <Typography variant="body1">
                  {t('home.howItWorks.step1.description')}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 4, textAlign: 'center', height: '100%' }}>
                <Box sx={{ bgcolor: 'primary.main', color: 'white', width: 50, height: 50, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                  <Typography variant="h5">2</Typography>
                </Box>
                <Typography variant="h5" component="h3" gutterBottom>
                  {t('home.howItWorks.step2.title')}
                </Typography>
                <Typography variant="body1">
                  {t('home.howItWorks.step2.description')}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 4, textAlign: 'center', height: '100%' }}>
                <Box sx={{ bgcolor: 'primary.main', color: 'white', width: 50, height: 50, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                  <Typography variant="h5">3</Typography>
                </Box>
                <Typography variant="h5" component="h3" gutterBottom>
                  {t('home.howItWorks.step3.title')}
                </Typography>
                <Typography variant="body1">
                  {t('home.howItWorks.step3.description')}
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
              {t('home.howItWorks.startNowButton')}
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" textAlign="center" gutterBottom>
          {t('home.testimonials.title')}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" textAlign="center" mb={6} sx={{ maxWidth: '700px', mx: 'auto' }}>
          {t('home.testimonials.subtitle')}
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
                    <StarIcon color="warning" sx={{ fontSize: 20 }} />
                    <StarIcon color="warning" sx={{ fontSize: 20 }} />
                    <StarIcon color="warning" sx={{ fontSize: 20 }} />
                    <StarIcon color="warning" sx={{ fontSize: 20 }} />
                    <StarIcon color="warning" sx={{ fontSize: 20 }} />
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
              {t('home.cta.title')}
            </Typography>
            <Typography variant="h6" paragraph sx={{ mb: 4, opacity: 0.9 }}>
              {t('home.cta.subtitle')}
            </Typography>
            <Button 
              variant="contained" 
              color="secondary"
              size="large" 
              component={Link} 
              to="/register"
              sx={{ px: 6, py: 1.5 }}
            >
              {t('home.cta.buttonText')}
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
