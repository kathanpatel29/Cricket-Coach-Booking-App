import React, { useState } from 'react';
import { Box } from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/layout/AdminNavbar';
import CoachNavbar from '../components/layout/CoachNavbar';
import UserNavbar from '../components/layout/UserNavbar';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import { useAuth } from '../contexts/AuthContext';

const DashboardLayout = ({ type }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Determine the correct layout type based on user role if not explicitly provided
  const layoutType = type || user?.role || 'user';

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const NavbarComponent = {
    admin: AdminNavbar,
    coach: CoachNavbar,
    user: UserNavbar
  }[layoutType] || UserNavbar; // Default to UserNavbar if type is invalid

  // Redirect if user doesn't have access to this dashboard type
  React.useEffect(() => {
    if (user && type && user.role !== type) {
      navigate(`/${user.role}/dashboard`);
    }
  }, [user, type, navigate]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <NavbarComponent onSidebarToggle={handleDrawerToggle} />
      <Sidebar 
        open={mobileOpen} 
        onClose={handleDrawerToggle}
        type={layoutType}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          width: { sm: `calc(100% - 240px)` }
        }}
      >
        <Outlet />
        <Footer />
      </Box>
    </Box>
  );
};

export default DashboardLayout; 