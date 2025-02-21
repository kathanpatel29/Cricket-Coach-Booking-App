import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  useTheme,
  useMediaQuery,
  CircularProgress
} from '@mui/material';
import {
  Menu as MenuIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSwitcher from '../common/LanguageSwitcher';

const Navbar = ({ onSidebarToggle }) => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    handleMenuClose();
    navigate('/login');
  };

  const handleDashboard = () => {
    handleMenuClose();
    const dashboardPath = user?.role === 'admin' 
      ? '/admin/dashboard' 
      : user?.role === 'coach' 
        ? '/coach/dashboard' 
        : '/user/dashboard';
    navigate(dashboardPath);
  };

  if (loading) {
    return (
      <AppBar position="fixed" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Cricket Coach
          </Typography>
          <CircularProgress size={24} />
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <AppBar position="fixed" color="default" elevation={1}>
      <Toolbar>
        {isMobile && onSidebarToggle && (
          <IconButton
            color="inherit"
            edge="start"
            onClick={onSidebarToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          Cricket Coach
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <LanguageSwitcher />
          
          {user ? (
            <>
              {!isMobile && (
                <Typography variant="body2" sx={{ mr: 2 }}>
                  Welcome, {user.name}
                </Typography>
              )}
              <IconButton onClick={handleMenuOpen} color="inherit">
                <Avatar
                  src={user.profileImage}
                  alt={user.name}
                  sx={{ width: 32, height: 32 }}
                >
                  {user.name[0]}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem onClick={handleDashboard}>
                  <DashboardIcon sx={{ mr: 1 }} /> Dashboard
                </MenuItem>
                <MenuItem onClick={() => {
                  handleMenuClose();
                  navigate(`/${user.role}/profile`);
                }}>
                  <PersonIcon sx={{ mr: 1 }} /> Profile
                </MenuItem>
                <MenuItem onClick={() => {
                  handleMenuClose();
                  navigate(`/${user.role}/settings`);
                }}>
                  <SettingsIcon sx={{ mr: 1 }} /> Settings
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon sx={{ mr: 1 }} /> Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            !location.pathname.includes('login') && (
              <>
                <Button
                  color="inherit"
                  component={Link}
                  to="/login"
                >
                  Login
                </Button>
                <Button
                  color="inherit"
                  component={Link}
                  to="/register"
                  variant="outlined"
                  sx={{ ml: 1 }}
                >
                  Register
                </Button>
              </>
            )
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 