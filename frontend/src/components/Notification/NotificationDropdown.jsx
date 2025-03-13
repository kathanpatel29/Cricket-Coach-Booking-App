import React, { useState, useRef, useEffect } from 'react';
import {
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Typography,
  Box,
  Button,
  Divider,
  Tooltip,
  CircularProgress,
  useTheme,
  Snackbar,
  Alert,
  alpha
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import { format, isToday, isYesterday, formatDistanceToNow, parseISO } from 'date-fns';
import { useNotifications } from '../../context/NotificationContext';
import NotificationBadge from './NotificationBadge';

// Get appropriate icon based on notification type
const getNotificationIcon = (type) => {
  // This would be expanded with different icons based on notification types
  // For now, just use a default avatar
  return <Avatar>{type.charAt(0).toUpperCase()}</Avatar>;
};

// Format notification date for display
const formatNotificationDate = (dateString) => {
  try {
    // Ensure we're working with a Date object by parsing if it's a string
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    
    if (isToday(date)) {
      return `Today, ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday, ${format(date, 'h:mm a')}`;
    } else {
      // If within the last week, show relative time
      if (Date.now() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
        return formatDistanceToNow(date, { addSuffix: true });
      }
      // Otherwise show actual date
      return format(date, 'MMM d, yyyy');
    }
  } catch (err) {
    console.error('Error formatting date:', err, dateString);
    return 'Unknown date';
  }
};

const NotificationDropdown = () => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const { 
    notifications, 
    unreadCount, 
    loading, 
    fetchNotifications,
    markNotificationsAsRead,
    deleteNotification,
    lastSyncTime 
  } = useNotifications();
  
  // Track refresh timestamps to prevent excessive API calls
  const lastManualRefreshRef = useRef(0);
  
  // Track error state for feedback
  const [refreshError, setRefreshError] = useState(null);
  const [isRefreshDisabled, setIsRefreshDisabled] = useState(false);
  
  // Scroll to the first unread notification
  const firstUnreadRef = useRef(null);
  const [scrolledToUnread, setScrolledToUnread] = useState(false);
  
  // Ref to check if mounted (prevents state updates on unmounted component)
  const isMountedRef = useRef(true);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Reset scroll state when dropdown closes
  useEffect(() => {
    if (!anchorEl) {
      setScrolledToUnread(false);
    }
  }, [anchorEl]);
  
  // Scroll to first unread when notifications load
  useEffect(() => {
    if (anchorEl && !loading && unreadCount > 0 && !scrolledToUnread && firstUnreadRef.current) {
      firstUnreadRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setScrolledToUnread(true);
    }
  }, [anchorEl, loading, unreadCount, scrolledToUnread]);
  
  // Handle click to open notification menu
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    
    // Only fetch if the dropdown wasn't recently refreshed (in the last 2 minutes)
    const now = Date.now();
    if (now - lastManualRefreshRef.current > 120000) { // 2 minutes
      // Fetch fresh notifications when opening the dropdown, but don't show loading indicator
      try {
        fetchNotifications(false);
        lastManualRefreshRef.current = now;
      } catch (error) {
        console.error('Error fetching notifications:', error);
        // Don't show error when opening to avoid disrupting UX
      }
    }
  };
  
  // Handle close of notification menu
  const handleClose = () => {
    setAnchorEl(null);
    // Clear any error when closing
    setRefreshError(null);
  };
  
  // Mark notification as read when clicked
  const handleNotificationClick = (notificationId) => {
    try {
      markNotificationsAsRead([notificationId]);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Handle clicking the "Mark all as read" button
  const handleMarkAllAsRead = (e) => {
    e.stopPropagation();
    try {
      markNotificationsAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      setRefreshError('Failed to mark notifications as read');
    }
  };
  
  // Handle manual refresh button click
  const handleManualRefresh = async (e) => {
    e.stopPropagation();
    const now = Date.now();
    
    // Rate-limit manual refreshes to prevent excessive API calls (30 seconds)
    const REFRESH_RATE_LIMIT = 30000;
    if (now - lastManualRefreshRef.current < REFRESH_RATE_LIMIT) {
      const secondsRemaining = Math.ceil((REFRESH_RATE_LIMIT - (now - lastManualRefreshRef.current)) / 1000);
      setRefreshError(`Please wait ${secondsRemaining} seconds before refreshing again`);
      
      // Disable refresh button temporarily
      setIsRefreshDisabled(true);
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          setIsRefreshDisabled(false);
        }
      }, REFRESH_RATE_LIMIT - (now - lastManualRefreshRef.current));
      
      return;
    }
    
    // Reset error state
    setRefreshError(null);
    
    try {
      // Update timestamp before fetch to prevent double-clicks
      lastManualRefreshRef.current = now;
      await fetchNotifications(true);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
      if (isMountedRef.current) {
        setRefreshError('Failed to refresh notifications. Please try again later.');
      }
    }
  };
  
  // Handle notification deletion
  const handleDelete = async (e, notification) => {
    e.stopPropagation();
    try {
      await deleteNotification(notification._id || notification.id);
    } catch (error) {
      console.error('Error deleting notification:', error);
      setRefreshError('Failed to delete notification');
    }
  };
  
  // Handle clearing error message
  const handleErrorClose = () => {
    setRefreshError(null);
  };
  
  // Control popover open state
  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;
  
  // Determine if a recent sync has occurred
  const isRecentSync = lastSyncTime && 
    (new Date().getTime() - new Date(lastSyncTime).getTime() < 2 * 60000); // Within the last 2 minutes
  
  // Near the beginning of your component
  useEffect(() => {
    if (notifications.length > 0) {
      console.log('Notification example:', notifications[0]);
    }
  }, [notifications]);
  
  return (
    <>
      <NotificationBadge badgeProps={{ max: 99 }}>
        <IconButton 
          color="inherit" 
          aria-label="notifications"
          aria-describedby={id} 
          onClick={handleClick}
        >
          <NotificationsIcon />
        </IconButton>
      </NotificationBadge>
      
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { 
            width: { xs: '100%', sm: 350 }, 
            maxWidth: { xs: '100%', sm: 350 },
            maxHeight: '70vh',
          }
        }}
      >
        <Box 
          sx={{ 
            p: 2, 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          <Typography variant="h6">Notifications</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {unreadCount > 0 && (
              <Button 
                size="small" 
                onClick={handleMarkAllAsRead}
                startIcon={<CheckCircleIcon />}
                disabled={loading}
              >
                Mark all read
              </Button>
            )}
          </Box>
        </Box>
        
        {loading && (
          <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={24} />
          </Box>
        )}
        
        {!loading && notifications.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="textSecondary">No notifications yet</Typography>
          </Box>
        )}
        
        {!loading && notifications.length > 0 && (
          <>
            <List sx={{ pt: 0, pb: 0, maxHeight: '50vh', overflow: 'auto' }}>
              {notifications.map((notification, index) => {
                // Add this debug line
                console.log('Notification data:', notification);
                
                // Check if this is the first unread notification
                const isFirstUnread = !notification.read && 
                  notifications.findIndex(n => !n.read) === index;
                
                return (
                  <React.Fragment key={notification.id || index}>
                    {index > 0 && <Divider component="li" />}
                    <ListItem 
                      alignItems="flex-start"
                      onClick={() => handleNotificationClick(notification.id)}
                      sx={{
                        cursor: 'pointer',
                        bgcolor: notification.read ? 'transparent' : alpha(theme.palette.primary.light, 0.1),
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.light, 0.05),
                        },
                        transition: 'background-color 0.2s',
                        position: 'relative',
                        px: 2,
                        py: 1.5,
                      }}
                      ref={isFirstUnread ? firstUnreadRef : null}
                    >
                      <ListItemAvatar>
                        {getNotificationIcon(notification.type || 'default')}
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography
                            variant="subtitle2"
                            sx={{ 
                              fontWeight: notification.read ? 'normal' : 'bold',
                              color: notification.read 
                                ? 'text.primary' 
                                : 'primary.main'
                            }}
                          >
                            {notification.title || 'Notification'}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography
                              variant="body2"
                              color="text.primary"
                              component="span"
                              sx={{ 
                                display: 'inline',
                                fontWeight: notification.read ? 'normal' : 'medium',
                              }}
                            >
                              {notification.message || 'No message content'}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              component="div"
                              sx={{ mt: 0.5 }}
                            >
                              {formatNotificationDate(notification.createdAt || notification.timestamp || new Date())}
                            </Typography>
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Delete notification">
                          <IconButton 
                            edge="end" 
                            aria-label="delete"
                            onClick={(e) => handleDelete(e, notification)}
                            size="small"
                            disabled={loading}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </React.Fragment>
                );
              })}
            </List>
            
            <Box 
              sx={{ 
                p: 1, 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: `1px solid ${theme.palette.divider}`,
                fontSize: '0.75rem',
                color: 'text.secondary'
              }}
            >
              <Typography variant="caption">
                {lastSyncTime ? 
                  `Last updated: ${formatDistanceToNow(new Date(lastSyncTime), { addSuffix: true })}` : 
                  'Not synced yet'}
              </Typography>
              
              <Button 
                size="small" 
                disabled={loading || isRefreshDisabled}
                onClick={handleManualRefresh}
                startIcon={<RefreshIcon fontSize="small" />}
                variant="text"
                color="primary"
                sx={{ minWidth: 'auto', fontSize: '0.75rem' }}
              >
                Refresh
              </Button>
            </Box>
          </>
        )}
      </Popover>
      
      {/* Error Snackbar */}
      <Snackbar 
        open={!!refreshError} 
        autoHideDuration={5000} 
        onClose={handleErrorClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleErrorClose} 
          severity="warning" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {refreshError}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NotificationDropdown; 