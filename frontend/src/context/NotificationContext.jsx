import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import api, { userApi, coachApi, adminApi } from '../services/api';
import { clearCacheEntry, getCachedData, setCachedData } from '../utils/cacheUtils';

// Create notification context
export const NotificationContext = createContext();

// Cache key for notifications
const NOTIFICATION_CACHE_KEY = 'notifications';

// Default polling interval (increased to 5 minutes to reduce server load)
const DEFAULT_POLLING_INTERVAL = 5 * 60 * 1000;

// Rate limit protection (increased to prevent excessive API calls)
const MIN_TIME_BETWEEN_CALLS = 30000; // 30 seconds

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  
  // Use refs to track the last fetch time (for rate limiting)
  const lastFetchTimeRef = useRef(0);
  // Use a ref to store the polling interval timer ID
  const pollingTimerRef = useRef(null);
  // Track initialization to prevent excessive calls during startup
  const initializedRef = useRef(false);

  // Get the appropriate API based on user role
  const getNotificationApi = useCallback(() => {
    if (!user) return null;
    
    switch (user.role) {
      case 'admin':
        return adminApi.getAdminNotifications;
      case 'coach':
        return coachApi.getCoachNotifications;
      case 'user':
      default:
        return userApi.getUserNotifications;
    }
  }, [user]);

  // Mark notifications as read based on user role
  const getMarkAsReadApi = useCallback(() => {
    if (!user) return null;
    
    switch (user.role) {
      case 'admin':
        return adminApi.markNotificationsAsRead;
      case 'coach':
        return coachApi.markCoachNotificationsAsRead;
      case 'user':
      default:
        return userApi.markUserNotificationsAsRead;
    }
  }, [user]);

  // Safely check if cached data is usable
  const isCachedDataValid = useCallback((cachedData) => {
    return cachedData && 
           Array.isArray(cachedData.notifications) && 
           typeof cachedData.unreadCount === 'number' &&
           cachedData.timestamp;
  }, []);

  // Debounced fetch to prevent too many API calls
  const debouncedFetch = useCallback(async (forceRefresh = false, showLoading = true) => {
    if (!isAuthenticated || !user) return;
    
    const notificationApi = getNotificationApi();
    if (!notificationApi) return;
    
    // Get current time
    const now = Date.now();
    
    // Rate limiting - check if enough time has passed since last fetch
    if (now - lastFetchTimeRef.current < MIN_TIME_BETWEEN_CALLS && !forceRefresh) {
      console.log('Rate limiting notification fetch, using cached data');
      
      // Try to use cached data if available
      const cachedData = getCachedData(NOTIFICATION_CACHE_KEY);
      if (isCachedDataValid(cachedData)) {
        // Update state with cached data
        setNotifications(cachedData.notifications);
        setUnreadCount(cachedData.unreadCount);
        setLastSyncTime(cachedData.timestamp);
        return cachedData;
      }
      
      // If no cached data and we're rate limited, just return
      return;
    }
    
    // Prevent API call if we've already set loading
    if (loading && !forceRefresh) {
      console.log('Already loading notifications, skipping duplicate request');
      return;
    }
    
    // Update last fetch time
    lastFetchTimeRef.current = now;
    
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      const response = await notificationApi();
      
      // Safely extract notifications with fallbacks
      let fetchedNotifications = [];
      if (response?.data?.data?.notifications) {
        fetchedNotifications = response.data.data.notifications;
      } else if (response?.data?.notifications) {
        fetchedNotifications = response.data.notifications;
      } else if (Array.isArray(response?.data)) {
        fetchedNotifications = response.data;
      }
      
      // Store notifications with sync timestamp
      setNotifications(fetchedNotifications);
      
      // Calculate unread count
      const unread = fetchedNotifications.filter(n => !n.read).length;
      setUnreadCount(unread);
      
      // Update sync time
      setLastSyncTime(new Date().toISOString());
      
      // Store in cache and sessionStorage
      const notificationData = {
        notifications: fetchedNotifications,
        unreadCount: unread,
        timestamp: new Date().toISOString()
      };
      
      // Cache with longer duration (10 minutes)
      setCachedData(NOTIFICATION_CACHE_KEY, notificationData, 10 * 60 * 1000);
      
      // Also store in sessionStorage for cross-tab syncing
      try {
        sessionStorage.setItem(NOTIFICATION_CACHE_KEY, JSON.stringify(notificationData));
      } catch (err) {
        console.warn('Failed to save notification data to sessionStorage:', err);
      }
      
      return notificationData;
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
      
      // If we get a 429 (too many requests), increase the polling interval
      if (err.response && err.response.status === 429) {
        console.warn('Rate limited by server, increasing polling interval');
        // Quadruple the polling interval if we hit rate limits
        restartPolling(DEFAULT_POLLING_INTERVAL * 4);
      }
      
      // Use cached data on error if available
      const cachedData = getCachedData(NOTIFICATION_CACHE_KEY);
      if (isCachedDataValid(cachedData)) {
        console.log('Using cached notification data after fetch error');
        setNotifications(cachedData.notifications);
        setUnreadCount(cachedData.unreadCount);
        setLastSyncTime(cachedData.timestamp);
        return cachedData;
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [isAuthenticated, user, getNotificationApi, isCachedDataValid, loading]);

  // Public fetch notifications function (with rate limiting protection)
  const fetchNotifications = useCallback(async (showLoading = true) => {
    // Skip force refreshes if already loading
    if (loading && showLoading) {
      console.log('Already refreshing notifications, ignoring duplicate request');
      return;
    }
    
    return debouncedFetch(true, showLoading);
  }, [debouncedFetch, loading]);

  // Mark notifications as read
  const markNotificationsAsRead = useCallback(async (notificationIds = []) => {
    if (!isAuthenticated || !user) return;
    
    const markAsReadApi = getMarkAsReadApi();
    if (!markAsReadApi) return;
    
    try {
      // Optimistically update UI first
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.length === 0 || notificationIds.includes(notification.id) 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // Update unread count
      if (notificationIds.length === 0) {
        setUnreadCount(0);
      } else {
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
      }
      
      // Update cache immediately with optimistic update
      const cachedData = getCachedData(NOTIFICATION_CACHE_KEY);
      if (isCachedDataValid(cachedData)) {
        const updatedNotifications = cachedData.notifications.map(notification => 
          notificationIds.length === 0 || notificationIds.includes(notification.id) 
            ? { ...notification, read: true } 
            : notification
        );
        
        const updatedCount = notificationIds.length === 0 ? 0 : 
          Math.max(0, cachedData.unreadCount - notificationIds.length);
          
        const updatedCache = {
          ...cachedData,
          notifications: updatedNotifications,
          unreadCount: updatedCount,
          timestamp: new Date().toISOString()
        };
        
        setCachedData(NOTIFICATION_CACHE_KEY, updatedCache, 10 * 60 * 1000);
        
        try {
          sessionStorage.setItem(NOTIFICATION_CACHE_KEY, JSON.stringify(updatedCache));
        } catch (err) {
          console.warn('Failed to update sessionStorage with optimistic update:', err);
        }
      }
      
      // Make API call
      await markAsReadApi(notificationIds.length > 0 ? { notificationIds } : undefined);
      
      // Silently refresh in background after a delay (no UI loading indicator)
      setTimeout(() => {
        debouncedFetch(true, false);
      }, 1000);
    } catch (err) {
      console.error('Error marking notifications as read:', err);
      // Revert changes on error by refreshing, but don't show loading indicator
      setTimeout(() => {
        debouncedFetch(true, false);
      }, 1000);
    }
  }, [isAuthenticated, user, getMarkAsReadApi, debouncedFetch, isCachedDataValid]);

  // Delete a notification
  const deleteNotification = useCallback(async (notificationId) => {
    if (!isAuthenticated || !user) return;
    
    const deleteApi = user.role === 'admin' 
      ? adminApi.deleteNotification
      : user.role === 'coach'
        ? coachApi.deleteCoachNotification
        : userApi.deleteUserNotification;
    
    try {
      // Find the notification before deleting it
      const deletedNotification = notifications.find(n => n.id === notificationId);
      if (!deletedNotification) return;
      
      const wasUnread = deletedNotification && !deletedNotification.read;
      
      // Optimistically update UI
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      // Update cache with optimistic update
      const cachedData = getCachedData(NOTIFICATION_CACHE_KEY);
      if (isCachedDataValid(cachedData)) {
        const updatedNotifications = cachedData.notifications.filter(n => n.id !== notificationId);
        const updatedCount = wasUnread 
          ? Math.max(0, cachedData.unreadCount - 1) 
          : cachedData.unreadCount;
          
        const updatedCache = {
          ...cachedData,
          notifications: updatedNotifications,
          unreadCount: updatedCount,
          timestamp: new Date().toISOString()
        };
        
        setCachedData(NOTIFICATION_CACHE_KEY, updatedCache, 10 * 60 * 1000);
        
        try {
          sessionStorage.setItem(NOTIFICATION_CACHE_KEY, JSON.stringify(updatedCache));
        } catch (err) {
          console.warn('Failed to update sessionStorage with notification delete:', err);
        }
      }
      
      // Make API call
      await deleteApi(notificationId);
    } catch (err) {
      console.error('Error deleting notification:', err);
      // Silently refresh in background to restore state
      setTimeout(() => {
        debouncedFetch(true, false);
      }, 1000);
    }
  }, [isAuthenticated, user, notifications, debouncedFetch, isCachedDataValid]);

  // Start polling with configurable interval
  const startPolling = useCallback((interval = DEFAULT_POLLING_INTERVAL) => {
    // Clear any existing polling
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    
    setIsPolling(true);
    
    // Start new polling with the specified interval
    pollingTimerRef.current = setInterval(() => {
      // Use the debounced fetch without showing loading indicator
      debouncedFetch(false, false);
    }, interval);
    
    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
      setIsPolling(false);
    };
  }, [debouncedFetch]);
  
  // Restart polling with a new interval
  const restartPolling = useCallback((newInterval = DEFAULT_POLLING_INTERVAL) => {
    const stopPolling = startPolling(newInterval);
    return stopPolling;
  }, [startPolling]);

  // Initial load from cache and sessionStorage
  useEffect(() => {
    // Try to get from cache first (it's faster)
    const cachedData = getCachedData(NOTIFICATION_CACHE_KEY);
    
    if (isCachedDataValid(cachedData)) {
      setNotifications(cachedData.notifications);
      setUnreadCount(cachedData.unreadCount);
      setLastSyncTime(cachedData.timestamp);
      
      // We've loaded from cache, mark as initialized
      initializedRef.current = true;
      return;
    }
    
    // If not in cache, try from sessionStorage
    try {
      const sessionData = sessionStorage.getItem(NOTIFICATION_CACHE_KEY);
      
      if (sessionData) {
        const parsedData = JSON.parse(sessionData);
        if (isCachedDataValid(parsedData)) {
          setNotifications(parsedData.notifications);
          setUnreadCount(parsedData.unreadCount);
          setLastSyncTime(parsedData.timestamp);
          
          // We've loaded from sessionStorage, mark as initialized
          initializedRef.current = true;
        }
      }
    } catch (err) {
      console.error('Error parsing cached notifications from session storage:', err);
    }
  }, [isCachedDataValid]);

  // Fetch notifications when auth state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      // Initial fetch only if not already initialized from cache
      if (!initializedRef.current) {
        debouncedFetch(true, false);
        initializedRef.current = true;
      }
      
      // Start polling with a delay to prevent immediate double-fetch
      const pollDelay = initializedRef.current ? DEFAULT_POLLING_INTERVAL : 2000;
      const pollTimer = setTimeout(() => {
        const stopPolling = startPolling(DEFAULT_POLLING_INTERVAL);
        return () => {
          if (stopPolling) stopPolling();
        };
      }, pollDelay);
      
      return () => {
        clearTimeout(pollTimer);
      };
    }
  }, [isAuthenticated, user, debouncedFetch, startPolling]);

  // Handle storage events from other tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === NOTIFICATION_CACHE_KEY && e.newValue) {
        try {
          const parsedData = JSON.parse(e.newValue);
          if (isCachedDataValid(parsedData)) {
            setNotifications(parsedData.notifications);
            setUnreadCount(parsedData.unreadCount);
            setLastSyncTime(parsedData.timestamp);
          }
        } catch (err) {
          console.error('Error processing notification sync from other tab:', err);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isCachedDataValid]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, []);

  // Values to expose through context
  const contextValue = {
    notifications,
    unreadCount,
    loading,
    error,
    lastSyncTime,
    fetchNotifications,
    markNotificationsAsRead,
    deleteNotification,
    startPolling,
    restartPolling
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook for using notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
}; 