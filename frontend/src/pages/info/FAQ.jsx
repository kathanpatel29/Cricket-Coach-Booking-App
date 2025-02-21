import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  TextField,
  InputAdornment,
  Stack,
  Chip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon
} from '@mui/icons-material';

const faqCategories = [
  'General',
  'Booking',
  'Payments',
  'Coaching',
  'Technical'
];

const faqs = [
  {
    category: 'General',
    question: 'What is Cricket Coach?',
    answer: 'Cricket Coach is a platform that connects cricket enthusiasts with professional coaches for personalized training sessions. Our platform makes it easy to find, book, and attend cricket coaching sessions.'
  },
  {
    category: 'General',
    question: 'Who are your coaches?',
    answer: 'Our coaches are certified professionals with extensive playing and coaching experience. Each coach goes through a rigorous verification process to ensure they meet our high standards.'
  },
  {
    category: 'Booking',
    question: 'How do I book a session?',
    answer: 'Booking a session is easy! Simply browse our coaches, select your preferred coach, choose an available time slot, and complete the booking process. You can pay securely through our platform.'
  },
  {
    category: 'Booking',
    question: 'Can I reschedule my session?',
    answer: 'Yes, you can reschedule your session up to 24 hours before the scheduled time. Go to "My Bookings" in your dashboard and select the reschedule option.'
  },
  {
    category: 'Payments',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards and Interac e-Transfer. All payments are processed securely through our platform.'
  },
  {
    category: 'Payments',
    question: 'What is your refund policy?',
    answer: 'We offer full refunds for cancellations made at least 24 hours before the scheduled session. Cancellations within 24 hours may be subject to a cancellation fee.'
  },
  {
    category: 'Coaching',
    question: 'What should I bring to my session?',
    answer: 'Please bring your cricket gear (bat, pads, gloves, etc.). If you don\'t have equipment, please let your coach know in advance as some coaches can provide basic equipment.'
  },
  {
    category: 'Coaching',
    question: 'How long is each session?',
    answer: 'Standard sessions are 60 minutes long, but you can book longer sessions of 90 or 120 minutes depending on your needs and the coach\'s availability.'
  },
  {
    category: 'Technical',
    question: 'What happens if there are technical issues?',
    answer: 'If you experience any technical issues with our platform, please contact our support team immediately. We\'re here to help resolve any problems quickly.'
  }
];

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expanded, setExpanded] = useState(false);

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = 
      selectedCategory === 'All' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
            Frequently Asked Questions
          </Typography>
          <Typography variant="h5">
            Find answers to common questions about Cricket Coach
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Search and Filter */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Filter by Category:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                <Chip
                  label="All"
                  onClick={() => setSelectedCategory('All')}
                  color={selectedCategory === 'All' ? 'primary' : 'default'}
                  variant={selectedCategory === 'All' ? 'filled' : 'outlined'}
                />
                {faqCategories.map((category) => (
                  <Chip
                    key={category}
                    label={category}
                    onClick={() => setSelectedCategory(category)}
                    color={selectedCategory === category ? 'primary' : 'default'}
                    variant={selectedCategory === category ? 'filled' : 'outlined'}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </Paper>

        {/* FAQ Accordions */}
        <Box sx={{ mb: 6 }}>
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => (
              <Accordion
                key={index}
                expanded={expanded === `panel${index}`}
                onChange={handleAccordionChange(`panel${index}`)}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls={`panel${index}bh-content`}
                  id={`panel${index}bh-header`}
                >
                  <Box>
                    <Typography variant="subtitle1">
                      {faq.question}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Category: {faq.category}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography>
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No FAQs found matching your search criteria
              </Typography>
            </Paper>
          )}
        </Box>

        {/* Contact Section */}
        <Paper sx={{ p: 4, textAlign: 'center', mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Didn't find what you're looking for?
          </Typography>
          <Typography variant="body1" paragraph>
            Contact our support team and we'll be happy to help.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            component={Link}
            to="/contact"
          >
            Contact Support
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default FAQ; 