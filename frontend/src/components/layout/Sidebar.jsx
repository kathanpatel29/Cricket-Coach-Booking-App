import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Box,
  useTheme,
  useMediaQuery,
  Divider,
  Typography
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  EventNote as EventIcon,
  Payment as PaymentIcon,
  Star as StarIcon,
  Settings as SettingsIcon,
  CalendarMonth as CalendarIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getNavLinks } from '../../utils/navigation';

const DRAWER_WIDTH = 240;

const Sidebar = ({ open, onClose, type = 'user' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const navLinks = getNavLinks(type);

  const getIcon = (label) => {
    switch (label.toLowerCase()) {
      case 'dashboard':
        return <DashboardIcon />;
      case 'users':
        return <PeopleIcon />;
      case 'bookings':
      case 'sessions':
        return <EventIcon />;
      case 'payments':
      case 'earnings':
        return <PaymentIcon />;
      case 'reviews':
        return <StarIcon />;
      case 'settings':
        return <SettingsIcon />;
      case 'availability':
        return <CalendarIcon />;
      case 'analytics':
        return <AnalyticsIcon />;
      default:
        return <DashboardIcon />;
    }
  };

  const drawer = (
    <Box sx={{ overflow: 'auto' }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {user?.role?.toUpperCase()} DASHBOARD
        </Typography>
      </Box>
      <Divider />
      <List>
        {navLinks.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) onClose();
              }}
            >
              <ListItemIcon>
                {getIcon(item.label)}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
    >
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={open}
          onClose={onClose}
          ModalProps={{
            keepMounted: true // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH
            }
          }}
        >
          {drawer}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: `1px solid ${theme.palette.divider}`
            }
          }}
          open
        >
          {drawer}
        </Drawer>
      )}
    </Box>
  );
};

export default Sidebar; 