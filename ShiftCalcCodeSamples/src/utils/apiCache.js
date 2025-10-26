// src/utils/apiCache.js
const cache = {};
const inFlightRequests = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function cachedFetch(url, options = {}) {
  const cacheKey = url;
  
  // Check if there's a valid cached response
  if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp < CACHE_DURATION)) {
    console.log(`[Cache Hit] Using cached data for: ${url}`);
    return { ...cache[cacheKey].data };
  }
  
  // Check if there's already an in-flight request for this URL
  if (inFlightRequests[cacheKey]) {
    console.log(`[Request Dedupe] Reusing in-flight request for: ${url}`);
    return inFlightRequests[cacheKey];
  }
  
  // Make a new request and cache the promise
  console.log(`[Cache Miss] Fetching fresh data for: ${url}`);
  
  const fetchPromise = new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache the successful response
      cache[cacheKey] = {
        data,
        timestamp: Date.now()
      };
      
      resolve({ ...data });
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      reject(error);
    } finally {
      // Clean up the in-flight request regardless of success/failure
      delete inFlightRequests[cacheKey];
    }
  });
  
  // Store the promise for this request
  inFlightRequests[cacheKey] = fetchPromise;
  
  return fetchPromise;
}

// Manually clear the cache for testing
export function clearCache() {
  Object.keys(cache).forEach(key => delete cache[key]);
  console.log("API cache cleared");
}