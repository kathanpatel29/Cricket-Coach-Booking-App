import React from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Rating,
  Grid,
  useTheme
} from '@mui/material';
import { FormatQuote as QuoteIcon } from '@mui/icons-material';

const testimonials = [
  {
    id: 1,
    name: "Arjun Patel",
    role: "Amateur Player",
    avatar: "/avatars/testimonial1.jpg",
    rating: 5,
    quote: "The coaching has transformed my game completely. My batting technique has improved significantly.",
    location: "Mississauga, ON"
  },
  {
    id: 2,
    name: "Sarah Thompson",
    role: "Junior Player",
    avatar: "/avatars/testimonial2.jpg",
    rating: 5,
    quote: "The personalized attention and structured training program helped me make it to my school team.",
    location: "Toronto, ON"
  },
  {
    id: 3,
    name: "Raj Singh",
    role: "Club Player",
    avatar: "/avatars/testimonial3.jpg",
    rating: 4.5,
    quote: "Expert guidance on bowling techniques. My pace and accuracy have improved tremendously.",
    location: "Brampton, ON"
  }
];

const Testimonials = () => {
  const theme = useTheme();

  return (
    <Box 
      sx={{ 
        py: 8,
        backgroundColor: theme.palette.grey[50]
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="h3"
          align="center"
          gutterBottom
          sx={{ mb: 6 }}
        >
          What Our Students Say
        </Typography>

        <Grid container spacing={4}>
          {testimonials.map((testimonial) => (
            <Grid item xs={12} md={4} key={testimonial.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}
              >
                <QuoteIcon 
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    color: theme.palette.primary.light,
                    opacity: 0.2,
                    fontSize: 40
                  }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box 
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 2
                    }}
                  >
                    <Avatar
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      sx={{ width: 56, height: 56, mr: 2 }}
                    />
                    <Box>
                      <Typography variant="h6">
                        {testimonial.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {testimonial.role}
                      </Typography>
                      <Rating 
                        value={testimonial.rating} 
                        readOnly 
                        precision={0.5}
                        size="small"
                      />
                    </Box>
                  </Box>
                  <Typography 
                    variant="body1" 
                    paragraph
                    sx={{ 
                      fontStyle: 'italic',
                      minHeight: 80
                    }}
                  >
                    "{testimonial.quote}"
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ mt: 'auto' }}
                  >
                    {testimonial.location}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Testimonials; 