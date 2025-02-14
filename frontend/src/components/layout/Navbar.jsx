import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Button, 
  Box, 
  IconButton, 
  Menu, 
  MenuItem, 
  Avatar,
  Typography,
  Container,
  Fade,
  Divider,
  ListItemIcon,
  useTheme,
  useMediaQuery
} from '../shared/MuiComponents';
import { 
  PersonIcon,
  SettingsIcon,
  LogoutIcon,
  MenuIcon,
  DashboardIcon,
  EventIcon,
  ScheduleIcon,
  MoneyIcon
} from '../shared/MuiComponents';
import { useAuth } from '../../contexts/AuthContext';
import { getNavLinks, getBreadcrumbs } from '../../utils/navigation';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenu = (event) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    handleMobileMenuClose();
    navigate('/');
  };

  const navLinks = getNavLinks(user?.role);
  const breadcrumbs = getBreadcrumbs(location.pathname);

  // Coach navigation items
  const coachNavItems = [
    { to: '/coach/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { to: '/coach/sessions', label: 'Sessions', icon: <EventIcon /> },
    { to: '/coach/availability', label: 'Availability', icon: <ScheduleIcon /> },
    { to: '/coach/earnings', label: 'Earnings', icon: <MoneyIcon /> }
  ];

  return (
    <AppBar 
      position="sticky" 
      color="default" 
      elevation={0}
      sx={{ 
        borderBottom: '1px solid',
        borderColor: 'divider',
        backdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)'
      }}
    >
      <Container maxWidth="xl">
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: '64px', md: '72px' } }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
              <Typography
                variant="h6"
                noWrap
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  fontFamily: 'Poppins',
                  fontWeight: 600,
                  color: 'primary.main',
                  textDecoration: 'none',
                }}
              >
                CricCoach
              </Typography>
            </Link>
          </Box>

          {isMobile ? (
            <>
              <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={handleMobileMenu}
                sx={{ ml: 2 }}
              >
                <MenuIcon />
              </IconButton>
              <Menu
                anchorEl={mobileMenuAnchor}
                open={Boolean(mobileMenuAnchor)}
                onClose={handleMobileMenuClose}
                TransitionComponent={Fade}
                PaperProps={{
                  elevation: 1,
                  sx: { width: '200px', mt: 1.5 }
                }}
              >
                {navLinks.map((link) => (
                  <MenuItem
                    key={link.to}
                    onClick={() => {
                      handleMobileMenuClose();
                      navigate(link.to);
                    }}
                    sx={{
                      py: 1,
                      px: 2,
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                  >
                    {link.label}
                  </MenuItem>
                ))}
                {!user && (
                  <>
                    <Divider />
                    <MenuItem onClick={() => navigate('/login')}>
                      <ListItemIcon>
                        <PersonIcon fontSize="small" />
                      </ListItemIcon>
                      Login
                    </MenuItem>
                    <MenuItem onClick={() => navigate('/register')}>
                      <ListItemIcon>
                        <PersonIcon fontSize="small" />
                      </ListItemIcon>
                      Register
                    </MenuItem>
                  </>
                )}
              </Menu>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {navLinks.map((link) => (
                <Button
                  key={link.to}
                  component={Link}
                  to={link.to}
                  color="inherit"
                  sx={{
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    textTransform: 'none',
                    px: 2,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                    ...(location.pathname === link.to && {
                      color: 'primary.main',
                      fontWeight: 600,
                    }),
                  }}
                >
                  {link.label}
                </Button>
              ))}
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {user ? (
              <>
                <IconButton
                  onClick={handleMenu}
                  size="small"
                  sx={{ padding: 0.5 }}
                  aria-label="account menu"
                >
                  <Avatar
                    src={user.profileImage}
                    alt={user.name}
                    sx={{
                      width: 40,
                      height: 40,
                      border: '2px solid',
                      borderColor: 'primary.main'
                    }}
                  >
                    {user.name?.charAt(0)}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  onClick={handleClose}
                >
                  <MenuItem component={Link} to="/profile">
                    <ListItemIcon>
                      <PersonIcon fontSize="small" />
                    </ListItemIcon>
                    Profile
                  </MenuItem>
                  <MenuItem component={Link} to="/settings">
                    <ListItemIcon>
                      <SettingsIcon fontSize="small" />
                    </ListItemIcon>
                    Settings
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
                <Button
                  component={Link}
                  to="/login"
                  color="inherit"
                  sx={{
                    fontWeight: 500,
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                >
                  Login
                </Button>
                <Button
                  component={Link}
                  to="/register"
                  variant="contained"
                  color="primary"
                  sx={{
                    fontWeight: 600,
                    boxShadow: 'none',
                    '&:hover': { boxShadow: 'none' }
                  }}
                >
                  Register
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;