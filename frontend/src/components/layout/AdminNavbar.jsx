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
  Divider
} from '@mui/material';
import {
  Menu as MenuIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSwitcher from '../common/LanguageSwitcher';

const AdminNavbar = ({ onSidebarToggle }) => {
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

        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Admin Dashboard
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <LanguageSwitcher />
          
          <IconButton onClick={handleMenuOpen} color="inherit">
            <Avatar src={user?.profileImage} alt={user?.name}>
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
            <MenuItem onClick={() => navigate('/admin/profile')}>
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

export default AdminNavbar; 