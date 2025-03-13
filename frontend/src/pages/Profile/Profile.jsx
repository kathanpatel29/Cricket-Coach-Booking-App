import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Button, 
  Grid, 
  Avatar, 
  Divider, 
  Chip, 
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Card,
  CardContent
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import DateRangeIcon from '@mui/icons-material/DateRange';
import SportsCricketIcon from '@mui/icons-material/SportsCricket';
import PaymentIcon from '@mui/icons-material/Payment';
import WorkIcon from '@mui/icons-material/Work';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useAuth } from '../../hooks/useAuth';
import { userApi, coachApi, adminApi } from '../../services/api';
import { format } from 'date-fns';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);
  
  const isCoach = user?.role === 'coach';
  
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Initialize profile with data from auth context
        let profile = {
          name: user.name || '',
          email: user.email || '',
          phone: '',
          role: user.role || 'user',
          joinedDate: user.createdAt || new Date(),
        };
        
        // If user is a coach, fetch coach profile which includes user data
        if (isCoach) {
          try {
            console.log('Fetching coach profile from backend...');
            const coachResponse = await coachApi.getCoachProfile();
            console.log('Coach API response:', coachResponse);
            
            // Extract coach data
            const coachData = coachResponse.data?.data?.coach || 
                            coachResponse.data?.coach || 
                            coachResponse.data?.data || 
                            {};
            
            console.log('Extracted coach data:', coachData);
            
            if (coachData) {
              // Add coach-specific fields
              profile = {
                ...profile,
                isCoach: true,
                
                // Handle numeric fields (convert to numbers or use empty string)
                experience: coachData.experience !== undefined ? 
                  (typeof coachData.experience === 'number' ? coachData.experience : 
                  Number(coachData.experience) || 0) : 0,
                  
                hourlyRate: coachData.hourlyRate !== undefined ? 
                  (typeof coachData.hourlyRate === 'number' ? coachData.hourlyRate : 
                  Number(coachData.hourlyRate) || 0) : 0,
                
                // Text fields
                bio: coachData.bio || '',
                certifications: coachData.certifications || '',
                
                // Handle specializations array
                specializations: Array.isArray(coachData.specializations) ? 
                  coachData.specializations : 
                  (coachData.specializations ? [coachData.specializations] : []),
                
                // Get user data from the coach object if available
                name: coachData.user?.name || profile.name,
                email: coachData.user?.email || profile.email,
                phone: coachData.user?.phone || profile.phone,
              };
            }
          } catch (coachError) {
            console.error('Error fetching coach data:', coachError);
            setError('Could not fetch coach profile data. Some information may be missing.');
            
            // Add default coach fields
            profile = {
              ...profile,
              isCoach: true,
              experience: 0,
              hourlyRate: 0,
              bio: '',
              specializations: [],
              certifications: '',
            };
          }
        }
        // For regular users (non-coaches), fetch user profile
        else {
          try {
            console.log(`Fetching ${user.role} profile from backend...`);
            
            // Use appropriate API based on role for basic user data
            const userResponse = user.role === 'admin' ? 
              await adminApi.getUserProfile() : 
              await userApi.getUserProfile();
            
            console.log('User API response:', userResponse);
            
            // Extract basic user data
            const userData = userResponse.data?.data || {};
            
            if (userData) {
              profile = {
                ...profile,
                name: userData.name || profile.name,
                phone: userData.phone || '',
                joinedDate: userData.createdAt || profile.joinedDate,
              };
            }
          } catch (userError) {
            console.error(`Error fetching ${user.role} basic data:`, userError);
            // We'll continue with what we have from auth context
          }
        }
        
        console.log('Final profile data:', profile);
        setProfileData(profile);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [user, isCoach]);
  
  const handleEditProfile = () => {
    navigate('/profile/edit');
  };
  
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  if (!profileData) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          Could not load profile data. Please try again later.
        </Alert>
      </Container>
    );
  }
  
  // Format the joined date
  const formattedJoinedDate = profileData.joinedDate ? 
    format(new Date(profileData.joinedDate), 'MMMM dd, yyyy') : 
    'Not available';
  
  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  // Get role display name
  const getRoleDisplayName = (role) => {
    const roles = {
      user: 'User',
      coach: 'Coach',
      admin: 'Administrator'
    };
    return roles[role] || 'User';
  };
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            My Profile
          </Typography>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
            onClick={handleEditProfile}
          >
            Edit Profile
          </Button>
        </Box>
        
        <Grid container spacing={4}>
          {/* Basic User Information Section */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Avatar
                sx={{ 
                  width: 100, 
                  height: 100, 
                  fontSize: '2rem',
                  bgcolor: profileData.isCoach ? 'success.main' : 'primary.main',
                  mb: 2
                }}
              >
                {getInitials(profileData.name)}
              </Avatar>
              
              <Typography variant="h5" component="h2" align="center" gutterBottom>
                {profileData.name || 'User'}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <Chip 
                  icon={<VerifiedIcon />} 
                  label={getRoleDisplayName(profileData.role)} 
                  color={profileData.isCoach ? "success" : "primary"} 
                  variant="outlined" 
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary" align="center">
                Member since {formattedJoinedDate}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <List>
              <ListItem>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText primary="Full Name" secondary={profileData.name || 'Not provided'} />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText primary="Email" secondary={profileData.email || 'Not provided'} />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon />
                </ListItemIcon>
                <ListItemText primary="Phone" secondary={profileData.phone || 'Not provided'} />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <DateRangeIcon />
                </ListItemIcon>
                <ListItemText primary="Joined Date" secondary={formattedJoinedDate} />
              </ListItem>
            </List>
          </Grid>
          
          {/* Coach-specific Information Section */}
          {profileData.isCoach && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>
                  <Chip label="Coach Information" color="success" />
                </Divider>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" component="h2" gutterBottom>
                      Experience & Rate
                    </Typography>
                    
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <WorkIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Experience" 
                          secondary={`${profileData.experience} ${profileData.experience === 1 ? 'year' : 'years'}`} 
                        />
                      </ListItem>
                      
                      <ListItem>
                        <ListItemIcon>
                          <PaymentIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Hourly Rate" 
                          secondary={`$${profileData.hourlyRate}/hour`} 
                        />
                      </ListItem>
                      
                      {profileData.certifications && (
                        <ListItem>
                          <ListItemIcon>
                            <VerifiedIcon />
                          </ListItemIcon>
                          <ListItemText primary="Certifications" secondary={profileData.certifications} />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" component="h2" gutterBottom>
                      Specializations
                    </Typography>
                    
                    {profileData.specializations && profileData.specializations.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {profileData.specializations.map((specialization, index) => (
                          <Chip 
                            key={index} 
                            icon={<SportsCricketIcon />} 
                            label={specialization} 
                            variant="outlined" 
                            color="success" 
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No specializations added yet
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" component="h2" gutterBottom>
                      Biography
                    </Typography>
                    
                    {profileData.bio ? (
                      <Typography variant="body1" paragraph>
                        {profileData.bio}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No biography provided
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>
    </Container>
  );
};

export default Profile; 