import React from 'react';
import { Container, Typography, Box, Paper, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const FAQ = () => {
  const faqs = [
    {
      question: "How do I book a cricket coach?",
      answer: "You can browse our list of coaches, view their profiles, and book a session directly through our platform. Simply select a coach, choose an available time slot, and complete the booking process."
    },
    {
      question: "What if I need to cancel my booking?",
      answer: "You can cancel your booking up to 24 hours before the scheduled session for a full refund. Cancellations made less than 24 hours in advance may be subject to a cancellation fee."
    },
    {
      question: "How do I become a coach on CricCoach?",
      answer: "To become a coach, you need to register an account, select 'Coach' as your role, and complete your profile with your cricket experience and coaching qualifications. Our team will review your application and approve it if you meet our criteria."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, debit cards, and digital payment methods. All payments are processed securely through our platform."
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Frequently Asked Questions
        </Typography>
        <Typography variant="body1" paragraph>
          Find answers to common questions about CricCoach.
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          {faqs.map((faq, index) => (
            <Accordion key={index}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`panel${index}-content`}
                id={`panel${index}-header`}
              >
                <Typography variant="h6">{faq.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1">{faq.answer}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Paper>
    </Container>
  );
};

export default FAQ; 