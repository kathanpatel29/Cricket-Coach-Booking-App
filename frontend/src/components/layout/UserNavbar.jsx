import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Badge,
  Button
} from '@mui/material';
import {
  Menu as MenuIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Notifications as NotificationsIcon,
  BookOnline as BookIcon
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSwitcher from '../common/LanguageSwitcher';

const UserNavbar = ({ onSidebarToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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

  return (
    <AppBar position="fixed" color="default" elevation={1}>
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onSidebarToggle}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

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
          <Button
            variant="contained"
            color="primary"
            startIcon={<BookIcon />}
            component={Link}
            to="/user/book"
          >
            Book Session
          </Button>

          <LanguageSwitcher />
          
          <IconButton color="inherit">
            <Badge badgeContent={2} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <IconButton onClick={handleMenuOpen} color="inherit">
            <Avatar 
              src={user?.profileImage} 
              alt={user?.name}
              sx={{ width: 32, height: 32 }}
            >
              {user?.name?.[0]}
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
            <MenuItem onClick={() => {
              handleMenuClose();
              navigate('/user/profile');
            }}>
              <PersonIcon sx={{ mr: 1 }} /> Profile
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} /> Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default UserNavbar; 