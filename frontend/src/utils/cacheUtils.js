/**
 * Cache utility to prevent redundant API calls during quick navigation
 */

// In-memory cache for API responses
const apiCache = new Map();
// Cache expiration times (in milliseconds)
const cacheExpirations = new Map();
// Default cache duration (5 minutes)
const DEFAULT_CACHE_DURATION = 5 * 60 * 1000;

/**
 * Get a cached response if available and not expired
 * @param {string} cacheKey - Unique key for the cached data
 * @returns {Object|null} - Cached data or null if not found/expired
 */
export const getCachedData = (cacheKey) => {
  // If the cache key doesn't exist or has expired, return null
  if (!apiCache.has(cacheKey) || Date.now() > cacheExpirations.get(cacheKey)) {
    return null;
  }
  
  // Return the cached data
  return apiCache.get(cacheKey);
};

/**
 * Cache API response data
 * @param {string} cacheKey - Unique key for the cached data
 * @param {Object} data - Data to cache
 * @param {number} duration - Cache duration in milliseconds (default: 5 minutes)
 */
export const setCachedData = (cacheKey, data, duration = DEFAULT_CACHE_DURATION) => {
  apiCache.set(cacheKey, data);
  cacheExpirations.set(cacheKey, Date.now() + duration);
};

/**
 * Clear a specific cache entry
 * @param {string} cacheKey - Unique key for the cached data
 */
export const clearCacheEntry = (cacheKey) => {
  apiCache.delete(cacheKey);
  cacheExpirations.delete(cacheKey);
};

/**
 * Clear all cache entries or entries that match a prefix
 * @param {string} prefix - Optional prefix to match cache keys against
 */
export const clearCache = (prefix = '') => {
  if (!prefix) {
    apiCache.clear();
    cacheExpirations.clear();
    return;
  }
  
  // Clear entries that match the prefix
  for (const key of apiCache.keys()) {
    if (key.startsWith(prefix)) {
      apiCache.delete(key);
      cacheExpirations.delete(key);
    }
  }
};

/**
 * Generate a cache key from an API endpoint and parameters
 * @param {string} endpoint - API endpoint
 * @param {Object} params - API parameters
 * @returns {string} - Generated cache key
 */
export const generateCacheKey = (endpoint, params = {}) => {
  const paramString = params ? JSON.stringify(params) : '';
  return `${endpoint}${paramString ? ':' + paramString : ''}`;
};

/**
 * Cache-aware fetch wrapper for API calls
 * @param {Function} apiFn - API function to call
 * @param {string} cacheKey - Cache key to use
 * @param {Object} options - Options including force and duration
 * @returns {Promise<Object>} - API response
 */
export const cachedFetch = async (apiFn, cacheKey, options = {}) => {
  const { force = false, duration = DEFAULT_CACHE_DURATION } = options;
  
  // Check cache unless forced refresh
  if (!force) {
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }
  
  // Make the API call
  const response = await apiFn();
  // Cache the response
  setCachedData(cacheKey, response, duration);
  
  return response;
}; 