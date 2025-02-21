import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  WhatsApp as WhatsAppIcon
} from '@mui/icons-material';
import { LOCATION } from '../../utils/constants';
import { publicService } from '../../services/api';
import { toast } from 'react-hot-toast';

const contactInfo = [
  {
    icon: <EmailIcon sx={{ fontSize: 40 }} />,
    title: "Email",
    value: "info@cricketcoach.ca",
    link: "mailto:info@cricketcoach.ca"
  },
  {
    icon: <PhoneIcon sx={{ fontSize: 40 }} />,
    title: "Phone",
    value: "+1 (416) 555-0123",
    link: "tel:+14165550123"
  },
  {
    icon: <WhatsAppIcon sx={{ fontSize: 40 }} />,
    title: "WhatsApp",
    value: "+1 (416) 555-0124",
    link: "https://wa.me/14165550124"
  },
  {
    icon: <LocationIcon sx={{ fontSize: 40 }} />,
    title: "Location",
    value: `${LOCATION.region}, ${LOCATION.country}`,
    link: "https://maps.google.com"
  }
];

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await publicService.contact(formData);
      if (response?.data?.status === 'success') {
        setSuccess(true);
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
        toast.success('Message sent successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message');
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

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
            Contact Us
          </Typography>
          <Typography variant="h5">
            Get in touch with our team
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Contact Info Cards */}
        <Grid container spacing={4} sx={{ mb: 8 }}>
          {contactInfo.map((info, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper sx={{ p: 3, height: '100%', textAlign: 'center' }}>
                <Stack spacing={2} alignItems="center">
                  <Box sx={{ color: 'primary.main' }}>
                    {info.icon}
                  </Box>
                  <Typography variant="h6">
                    {info.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    component="a"
                    href={info.link}
                    sx={{
                      color: 'text.primary',
                      textDecoration: 'none',
                      '&:hover': {
                        color: 'primary.main',
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    {info.value}
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Contact Form */}
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="h4" gutterBottom>
              Send us a Message
            </Typography>
            <Typography variant="body1" paragraph>
              Have a question or feedback? Fill out the form below and we'll get back to you as soon as possible.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Your message has been sent successfully. We'll get back to you soon!
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <TextField
                  fullWidth
                  label="Subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />
                <TextField
                  fullWidth
                  label="Message"
                  name="message"
                  multiline
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  required
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Send Message'}
                </Button>
              </Stack>
            </form>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h4" gutterBottom>
              Office Location
            </Typography>
            <Paper sx={{ height: '400px', width: '100%', mb: 2 }}>
              {/* Google Maps iframe would go here */}
              <Box
                component="iframe"
                src="https://www.google.com/maps/embed?pb=..."
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
              />
            </Paper>
            <Typography variant="body2" color="text.secondary">
              Note: Please make an appointment before visiting our office.
            </Typography>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Contact; 