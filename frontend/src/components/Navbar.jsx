import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
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
    { text: t('dashboard.title'), path: '/dashboard' },
  ];
  
  // Role-specific links
  const userLinks = [
    ...authLinks,
    { text: t('coach.findCoach'), path: '/coaches' },
    { text: t('booking.title'), path: '/user/bookings' },
    { text: t('payment.pendingPayments'), path: '/user/bookings/pending-payment' },
  ];
  
  const coachLinks = [
    ...authLinks,
    { text: t('coach.setAvailability'), path: '/coach/availability' },
    { text: t('coach.manageTimeSlots'), path: '/coach/time-slots' },
    { text: t('booking.title'), path: '/coach/bookings' },
    { text: t('booking.requests'), path: '/coach/booking-requests' },
  ];
  
  const adminLinks = [
    ...authLinks,
    { text: t('admin.manageUsers'), path: '/admin/users' },
    { text: t('admin.manageCoaches'), path: '/admin/coaches' }
  ];
  
  // Guest links
  const guestLinks = [
    { text: t('footer.about'), path: '/about' },
    { text: t('footer.contact'), path: '/contact' },
    { text: t('footer.faq'), path: '/faq' },
  ];
  
  // Determine which links to show based on user role
  const navLinks = user 
    ? user.role === 'admin'
      ? adminLinks
      : user.role === 'coach'
        ? coachLinks
        : userLinks
    : guestLinks;

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
            <svg className="w-8 h-8 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ width: '24px', height: '24px', marginRight: '8px' }}>
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
          
          {/* Authentication Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Language Switcher */}
            <LanguageSwitcher />
            
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
                  <MenuItem onClick={() => handleNavigation('/dashboard')}>{t('dashboard.title')}</MenuItem>
                  <MenuItem onClick={() => handleNavigation('/profile')}>{t('profile.title')}</MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout}>{t('auth.logout')}</MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button color="inherit" component={Link} to="/login">
                  {t('auth.login')}
                </Button>
                <Button 
                  variant="contained" 
                  color="primary" 
                  component={Link} 
                  to="/register"
                  sx={{ ml: 1 }}
                >
                  {t('auth.signUp')}
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
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ width: '20px', height: '20px', marginRight: '8px' }}>
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            <Typography variant="h6" fontWeight="bold">{t('app.name')}</Typography>
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
                <ListItemText primary={t('auth.login')} />
              </ListItem>
              <ListItem button onClick={() => handleNavigation('/register')}>
                <ListItemText primary={t('auth.register')} />
              </ListItem>
            </List>
          ) : (
            <List>
              <ListItem>
                <Typography variant="body2" color="textSecondary">
                  {t('profile.signedInAs')} <strong>{user.name}</strong>
                </Typography>
              </ListItem>
              <ListItem button onClick={() => handleNavigation('/profile')}>
                <ListItemText primary={t('profile.title')} />
              </ListItem>
              <ListItem button onClick={handleLogout}>
                <ListItemText primary={t('auth.logout')} />
              </ListItem>
            </List>
          )}
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default Navbar;
