import { Link } from 'react-router-dom';
import { Box, Container, Grid, Typography, Divider, IconButton, Stack } from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: 'Company',
      links: [
        { name: 'About Us', path: '/about' },
        { name: 'Contact Us', path: '/contact' },
        { name: 'Careers', path: '/careers' },
        { name: 'FAQ', path: '/faq' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { name: 'Terms of Service', path: '/terms' },
        { name: 'Privacy Policy', path: '/privacy' },
        { name: 'Cookie Policy', path: '/cookies' },
      ],
    },
    {
      title: 'For Coaches',
      links: [
        { name: 'Become a Coach', path: '/register' },
        { name: 'Coach Guidelines', path: '/coach-guidelines' },
        { name: 'Resources', path: '/resources' },
      ],
    },
  ];

  const socialMedia = [
    { icon: <FacebookIcon />, url: 'https://facebook.com' },
    { icon: <TwitterIcon />, url: 'https://twitter.com' },
    { icon: <InstagramIcon />, url: 'https://instagram.com' },
    { icon: <LinkedInIcon />, url: 'https://linkedin.com' },
  ];

  return (
    <Box component="footer" sx={{ bgcolor: 'primary.main', color: 'white', py: 6, mt: 'auto' }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Logo and brief description */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <svg className="w-8 h-8 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              <Typography variant="h6" component="div" fontWeight="bold">
                CricCoach
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Toronto's premier cricket coaching platform, connecting passionate players with expert coaches.
            </Typography>
            <Stack direction="row" spacing={1}>
              {socialMedia.map((social, index) => (
                <IconButton 
                  key={index} 
                  component="a" 
                  href={social.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  sx={{ color: 'white' }}
                >
                  {social.icon}
                </IconButton>
              ))}
            </Stack>
          </Grid>

          {/* Footer links */}
          {footerLinks.map((section, index) => (
            <Grid item xs={6} sm={4} md={2} key={index}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {section.title}
              </Typography>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex} style={{ marginBottom: '0.5rem' }}>
                    <Link to={link.path} style={{ textDecoration: 'none', color: 'white' }}>
                      <Typography variant="body2" component="span">
                        {link.name}
                      </Typography>
                    </Link>
                  </li>
                ))}
              </ul>
            </Grid>
          ))}
        </Grid>
        <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.2)' }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ mb: { xs: 2, md: 0 } }}>
            &copy; {currentYear} CricCoach. All rights reserved.
          </Typography>
          <Typography variant="body2">
            Made with ❤️ in Toronto
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
