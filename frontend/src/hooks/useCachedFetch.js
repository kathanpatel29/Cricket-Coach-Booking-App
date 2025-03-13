import { useState, useEffect, useCallback } from 'react';
import { 
  cachedFetch, 
  generateCacheKey, 
  clearCacheEntry 
} from '../utils/cacheUtils';
import api from '../services/api';

/**
 * Custom hook for fetching data with caching to prevent redundant API calls
 * during quick navigation between pages.
 * 
 * @param {string} url - The API endpoint to fetch data from
 * @param {Object} options - Options for the fetch operation
 * @returns {Object} - { data, loading, error, refetch }
 */
export const useCachedFetch = (url, options = {}) => {
  const {
    cacheKey = url,
    cacheDuration,
    immediate = true,
    dependencies = [],
    params = {},
    skipCache = false
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  // Generate a deterministic cache key if one wasn't provided
  const actualCacheKey = cacheKey || generateCacheKey(url, params);
  
  const fetchData = useCallback(async (fetchParams = {}, fetchOptions = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // Combine params from hook initialization and this specific fetch call
      const combinedParams = { ...params, ...fetchParams };
      
      // Function to make the actual API call
      const apiFn = () => api.get(url, { params: combinedParams });
      
      // If skipCache is true, bypass cache, otherwise use caching
      const response = skipCache 
        ? await apiFn()
        : await cachedFetch(
            apiFn,
            actualCacheKey,
            { 
              force: fetchOptions.force || false,
              duration: cacheDuration
            }
          );
      
      setData(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'An error occurred while fetching data';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url, params, actualCacheKey, cacheDuration, skipCache]);

  // Clear the cache for this endpoint
  const invalidateCache = useCallback(() => {
    clearCacheEntry(actualCacheKey);
  }, [actualCacheKey]);

  // Fetch data on component mount or dependencies change
  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [immediate, fetchData, ...dependencies]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    invalidateCache
  };
};

/**
 * Custom hook for sending data to API with state handling
 * 
 * @param {string} url - The API endpoint
 * @param {Object} options - Additional options
 * @returns {Object} - { sendData, loading, error }
 */
export const useSendData = (url, options = {}) => {
  const { method = 'post', invalidateUrls = [] } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const sendData = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    
    try {
      // Choose the appropriate method
      let response;
      if (method === 'post') {
        response = await api.post(url, data);
      } else if (method === 'put') {
        response = await api.put(url, data);
      } else if (method === 'patch') {
        response = await api.patch(url, data);
      } else if (method === 'delete') {
        response = await api.delete(url, { data });
      } else {
        throw new Error(`Unsupported method: ${method}`);
      }
      
      // Invalidate related cached data
      invalidateUrls.forEach((urlToInvalidate) => {
        clearCacheEntry(urlToInvalidate);
      });
      
      return response.data;
    } catch (err) {
      console.error('API error:', err);
      const errorMessage = err.response?.data?.message || `An error occurred while ${method === 'post' ? 'creating' : method === 'put' ? 'updating' : method === 'delete' ? 'deleting' : 'sending'} data`;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url, method, invalidateUrls]);
  
  return {
    sendData,
    loading,
    error
  };
}; 