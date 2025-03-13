import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemText, 
  Box, 
  Divider,
  Avatar,
  Menu,
  MenuItem,
  Container
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import NotificationDropdown from './Notification/NotificationDropdown';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/');
    handleMenuClose();
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleNavigation = (path) => {
    navigate(path);
    setDrawerOpen(false);
    handleMenuClose();
  };
  
  // Links based on authentication status
  const authLinks = [
    { text: 'Dashboard', path: '/dashboard' },
  ];
  
  // Role-specific links
  const userLinks = [
    ...authLinks,
    { text: 'Find Coaches', path: '/coaches' },
    { text: 'My Bookings', path: '/user/bookings' },
    { text: 'Pending Payments', path: '/user/bookings/pending-payment' },
  ];
  
  const coachLinks = [
    ...authLinks,
    { text: 'Set Availability', path: '/coach/availability' },
    { text: 'Manage Time Slots', path: '/coach/time-slots' },
    { text: 'Bookings', path: '/coach/bookings' },
    { text: 'Booking Requests', path: '/coach/booking-requests' },
  ];
  
  const adminLinks = [
    ...authLinks,
    { text: 'Manage Users', path: '/admin/users' },
    { text: 'Manage Coaches', path: '/admin/coaches' }
  ];
  
  // Guest links
  const guestLinks = [
    { text: 'About', path: '/about' },
    { text: 'Contact', path: '/contact' },
    { text: 'FAQ', path: '/faq' },
  ];
  
  // Use translated text for navigation links
  const navLinks = [
    { text: t('app.name'), path: '/' },
    { text: t('coach.title'), path: '/coaches' },
    { text: user ? t('booking.title') : null, path: '/bookings' },
    { text: user?.role === 'admin' ? t('admin.dashboard') : null, path: '/admin' },
  ].filter(link => link.text !== null);

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Container maxWidth="lg">
        <Toolbar>
          {/* Mobile menu button */}
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2, display: { md: 'none' } }}
            onClick={toggleDrawer}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
            <svg className="w-8 h-8 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}>
              {t('app.name')}
            </Typography>
          </Link>
          
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Desktop Navigation Links */}
          <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
            {navLinks.map((item, index) => (
              <Button 
                key={index}
                color="inherit" 
                component={Link} 
                to={item.path}
                sx={{ mx: 0.5 }}
              >
                {item.text}
              </Button>
            ))}
          </Box>
          
          {/* Language Switcher */}
          <LanguageSwitcher />
          
          {/* Authentication Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {user ? (
              <>
                {/* Notifications */}
                <NotificationDropdown />
                
                {/* User Menu */}
                <IconButton
                  onClick={handleMenuOpen}
                  aria-controls="user-menu"
                  aria-haspopup="true"
                  color="inherit"
                >
                  {user.profileImage ? (
                    <Avatar 
                      src={user.profileImage} 
                      alt={user.name} 
                      sx={{ width: 32, height: 32 }} 
                    />
                  ) : (
                    <AccountCircleIcon />
                  )}
                </IconButton>
                <Menu
                  id="user-menu"
                  anchorEl={anchorEl}
                  keepMounted
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem onClick={() => handleNavigation('/dashboard')}>Dashboard</MenuItem>
                  <MenuItem onClick={() => handleNavigation('/profile')}>Profile</MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button color="inherit" component={Link} to="/login">
                  Login
                </Button>
                <Button 
                  variant="contained" 
                  color="primary" 
                  component={Link} 
                  to="/register"
                  sx={{ ml: 1 }}
                >
                  Sign Up
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
      
      {/* Mobile drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight="bold">CricCoach</Typography>
          </Box>
          <Divider />
          <List>
            {navLinks.map((link) => (
              <ListItem 
                button 
                key={link.path} 
                onClick={() => handleNavigation(link.path)}
                selected={location.pathname === link.path}
              >
                <ListItemText primary={link.text} />
              </ListItem>
            ))}
          </List>
          
          <Divider />
          
          {!user ? (
            <List>
              <ListItem button onClick={() => handleNavigation('/login')}>
                <ListItemText primary="Login" />
              </ListItem>
              <ListItem button onClick={() => handleNavigation('/register')}>
                <ListItemText primary="Register" />
              </ListItem>
            </List>
          ) : (
            <List>
              <ListItem>
                <Typography variant="body2" color="textSecondary">
                  Signed in as <strong>{user.name}</strong>
                </Typography>
              </ListItem>
              <ListItem button onClick={() => handleNavigation('/profile')}>
                <ListItemText primary="Profile" />
              </ListItem>
              <ListItem button onClick={handleLogout}>
                <ListItemText primary="Logout" />
              </ListItem>
            </List>
          )}
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default Navbar;
