import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Alert, 
  AlertTitle, 
  Divider, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  CircularProgress,
  Button
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SportsIcon from '@mui/icons-material/Sports';
import { Link } from 'react-router-dom';

const PendingApprovalPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [applicationDate, setApplicationDate] = useState(null);

  useEffect(() => {
    // Simulate fetching application details
    const fetchData = async () => {
      try {
        setLoading(true);
        // In a real app, we would fetch the coach application details here
        
        // Mock data for now - set application date to a week ago
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        setApplicationDate(oneWeekAgo);
      } catch (error) {
        console.error('Error fetching application details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" textAlign="center">
        Your Coach Application
      </Typography>
      
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Alert severity="info" sx={{ mb: 4 }}>
          <AlertTitle>Application Pending</AlertTitle>
          Your coach application is currently under review by our administrators. You will have limited access to coach features until your application is approved.
        </Alert>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Application Status
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AccessTimeIcon sx={{ color: 'warning.main', mr: 1 }} />
            <Typography variant="body1">
              <strong>Status:</strong> Pending Review
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <InfoIcon sx={{ color: 'info.main', mr: 1 }} />
            <Typography variant="body1">
              <strong>Submitted on:</strong> {applicationDate ? applicationDate.toLocaleDateString() : 'Unknown'}
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>
          What to expect next:
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <AccessTimeIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Review Process" 
              secondary="Our admin team will review your credentials and experience. This process typically takes 2-3 business days."
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircleOutlineIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Approval Notification" 
              secondary="You'll receive an email when your application is approved or if we need additional information."
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <SportsIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Full Access" 
              secondary="Once approved, you'll gain full access to all coaching features including setting your availability and receiving bookings."
            />
          </ListItem>
        </List>
        
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body1" gutterBottom>
            Have questions about your application?
          </Typography>
          <Button 
            component={Link} 
            to="/contact" 
            variant="contained" 
            color="primary"
            sx={{ mt: 1 }}
          >
            Contact Support
          </Button>
        </Box>
      </Paper>
      
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          While your application is being reviewed, you can still browse available coaches and book sessions as a regular user.
        </Typography>
        <Button 
          component={Link} 
          to="/" 
          variant="outlined" 
          sx={{ mt: 2 }}
        >
          Return to Home
        </Button>
      </Box>
    </Container>
  );
};

export default PendingApprovalPage; 