import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Stack,
  Avatar,
  Divider
} from '@mui/material';
import {
  School as ExpertiseIcon,
  EmojiEvents as AchievementsIcon,
  Groups as CommunityIcon,
  Verified as QualityIcon
} from '@mui/icons-material';

const features = [
  {
    icon: <ExpertiseIcon sx={{ fontSize: 40 }} />,
    title: "Expert Coaching",
    description: "Our platform connects you with certified cricket coaches who have professional playing experience and proven coaching expertise."
  },
  {
    icon: <AchievementsIcon sx={{ fontSize: 40 }} />,
    title: "Proven Results",
    description: "Our coaches have helped players at all levels improve their game, from beginners to professional athletes."
  },
  {
    icon: <CommunityIcon sx={{ fontSize: 40 }} />,
    title: "Supportive Community",
    description: "Join a community of cricket enthusiasts and learn from both coaches and fellow players."
  },
  {
    icon: <QualityIcon sx={{ fontSize: 40 }} />,
    title: "Quality Assurance",
    description: "All our coaches go through a rigorous verification process to ensure the highest quality of instruction."
  }
];

const teamMembers = [
  {
    name: "Rajesh Kumar",
    role: "Founder & Head Coach",
    image: "/team/rajesh.jpg",
    bio: "Former national player with 15 years of coaching experience"
  },
  {
    name: "Sarah Thompson",
    role: "Technical Director",
    image: "/team/sarah.jpg",
    bio: "ECB certified coach specializing in youth development"
  },
  {
    name: "Michael Chen",
    role: "Operations Manager",
    image: "/team/michael.jpg",
    bio: "10+ years experience in sports management"
  }
];

const About = () => {
  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          py: 8,
          mb: 6
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h2" gutterBottom>
            About Cricket Coach
          </Typography>
          <Typography variant="h5">
            Transforming cricket coaching through personalized instruction and technology
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Mission Statement */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h4" gutterBottom>
            Our Mission
          </Typography>
          <Typography variant="body1" paragraph>
            At Cricket Coach, we're dedicated to making high-quality cricket coaching accessible to everyone. 
            We believe that personalized instruction, combined with modern technology, can help players 
            of all skill levels achieve their full potential.
          </Typography>
        </Box>

        {/* Features Section */}
        <Grid container spacing={4} sx={{ mb: 8 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper sx={{ p: 3, height: '100%', textAlign: 'center' }}>
                <Box sx={{ color: 'primary.main', mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography variant="h6" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 8 }} />

        {/* Team Section */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h4" gutterBottom>
            Our Team
          </Typography>
          <Grid container spacing={4}>
            {teamMembers.map((member, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Paper sx={{ p: 3 }}>
                  <Stack alignItems="center" spacing={2}>
                    <Avatar
                      src={member.image}
                      alt={member.name}
                      sx={{ width: 120, height: 120 }}
                    />
                    <Typography variant="h6">
                      {member.name}
                    </Typography>
                    <Typography variant="subtitle1" color="primary">
                      {member.role}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center">
                      {member.bio}
                    </Typography>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Values Section */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h4" gutterBottom>
            Our Values
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom color="primary">
                Excellence
              </Typography>
              <Typography variant="body1">
                We strive for excellence in everything we do, from coach selection to 
                platform development.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom color="primary">
                Innovation
              </Typography>
              <Typography variant="body1">
                We embrace technology and innovative teaching methods to enhance the 
                learning experience.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom color="primary">
                Inclusivity
              </Typography>
              <Typography variant="body1">
                We believe cricket coaching should be accessible to everyone, regardless 
                of their background or skill level.
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default About; 