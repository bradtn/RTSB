// src/components/loaders/utils/pageLoadUtils.js
export const isInitialPageLoad = () => {
  if (typeof window === 'undefined') return true;
  
  // If we've been on the page for less than 2 seconds, consider it initial load
  const pageLoadTime = window._pageLoadTime || 0;
  const now = Date.now();
  if (!window._pageLoadTime) {
    window._pageLoadTime = now;
  }
  
  return now - pageLoadTime < 2000;
};
