import React, { useRef, useEffect, useState } from 'react';
import { Badge, Box, Tooltip, CircularProgress } from '@mui/material';
import { useNotifications } from '../../context/NotificationContext';

/**
 * A notification badge that displays the number of unread notifications
 * and shows a syncing indicator when refreshing.
 * 
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - The element to wrap with the badge
 * @param {Object} props.badgeProps - Props to pass to the MUI Badge component
 * @param {boolean} props.showZero - Whether to show the badge when count is zero
 * @returns {JSX.Element} The badge component
 */
const NotificationBadge = ({ 
  children, 
  badgeProps = {}, 
  showZero = false,
  ...props 
}) => {
  const { unreadCount, loading, fetchNotifications } = useNotifications();
  
  // Track last refresh timestamp to prevent excessive API calls
  const lastClickTimeRef = useRef(0);
  // Track errors to provide feedback
  const [errorMessage, setErrorMessage] = useState('');
  // Track if button is disabled due to rate limiting
  const [isDisabled, setIsDisabled] = useState(false);

  // Clear error message after 5 seconds
  useEffect(() => {
    let timer;
    if (errorMessage) {
      timer = setTimeout(() => {
        setErrorMessage('');
      }, 5000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [errorMessage]);

  // Force refresh notifications when clicked (if not already loading, with rate limiting)
  const handleBadgeClick = async (e) => {
    e.stopPropagation();
    
    // Rate limit clicks to one every 30 seconds
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTimeRef.current;
    const RATE_LIMIT = 30000; // 30 seconds
    
    if (loading) {
      setErrorMessage('Already syncing notifications...');
      return;
    }
    
    if (timeSinceLastClick < RATE_LIMIT) {
      const secondsToWait = Math.ceil((RATE_LIMIT - timeSinceLastClick) / 1000);
      setErrorMessage(`Please wait ${secondsToWait} seconds before refreshing again`);
      
      // Temporarily disable the badge
      setIsDisabled(true);
      setTimeout(() => {
        setIsDisabled(false);
      }, RATE_LIMIT - timeSinceLastClick);
      
      return;
    }
    
    try {
      lastClickTimeRef.current = now;
      await fetchNotifications(true);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
      setErrorMessage('Failed to refresh notifications');
    }
  };

  // Determine tooltip content based on state
  const getTooltipContent = () => {
    if (errorMessage) {
      return errorMessage;
    }
    
    if (loading) {
      return "Syncing notifications...";
    }
    
    return `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`;
  };

  return (
    <Badge
      badgeContent={
        <Box 
          component="span" 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            width: '100%',
            pointerEvents: isDisabled ? 'none' : 'auto',
            opacity: isDisabled ? 0.6 : 1
          }}
          onClick={handleBadgeClick}
        >
          {loading ? (
            <CircularProgress size={12} thickness={2} color="inherit" />
          ) : (
            unreadCount
          )}
        </Box>
      }
      color={errorMessage ? "warning" : "error"}
      overlap="circular"
      invisible={!showZero && unreadCount === 0}
      {...badgeProps}
      {...props}
    >
      <Tooltip 
        title={getTooltipContent()}
        arrow
        placement="top"
      >
        <Box sx={{ cursor: isDisabled ? 'default' : 'pointer' }}>
          {children}
        </Box>
      </Tooltip>
    </Badge>
  );
};

export default NotificationBadge; 