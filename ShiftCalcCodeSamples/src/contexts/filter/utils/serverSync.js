// src/contexts/filter/utils/serverSync.js
// LOCAL STORAGE ONLY VERSION - no server sync

import { DEBUG_MODE, MIN_UPDATE_INTERVAL } from "../constants";

// Dummy queue for compatibility
const serverUpdateQueue = [];
let isProcessingQueue = false;

// Maps for compatibility
const lastUpdateMap = new Map();
const pendingDataMap = new Map();

// Dummy processing function that doesn't do anything with the server
async function processServerUpdate() {
  if (isProcessingQueue || serverUpdateQueue.length === 0) return;
  
  isProcessingQueue = true;
  const { section, data, resolve, reject } = serverUpdateQueue.shift();
  
  try {
    if (DEBUG_MODE) console.log(`[LOCAL ONLY] Would process server update for ${section}`);
    
    // Just resolve without making any actual server calls
    if (resolve) resolve();
  } catch (error) {
    console.error(`Error in dummy update for ${section}:`, error);
    if (reject) reject(error);
  } finally {
    isProcessingQueue = false;
    // Process next update in queue for compatibility
    setTimeout(processServerUpdate, 100);
  }
}

// Main export - keep the same function signature but don't actually sync with server
export function queueServerUpdate(section, data) {
  // Log what would have been synced for debugging
  console.log(`[LOCAL ONLY] Not syncing to server: section=${section}`);
  
  // Mimic the behavior of the original function for compatibility
  const now = Date.now();
  const lastUpdate = lastUpdateMap.get(section) || 0;
  
  // Store the data for this section (but we won't use it)
  pendingDataMap.set(section, data);
  
  // If we're within the throttle window, simulate throttling
  if (now - lastUpdate < MIN_UPDATE_INTERVAL) {
    if (DEBUG_MODE) console.log(`[LOCAL ONLY] Would throttle update to ${section}`);
    
    // Only set a timeout if one isn't already pending - for compatibility
    if (!lastUpdateMap.has(`${section}_timeout`)) {
      const timeoutId = setTimeout(() => {
        // Clear the timeout marker
        lastUpdateMap.delete(`${section}_timeout`);
        
        // Get the data but don't do anything with it
        const latestData = pendingDataMap.get(section);
        if (latestData) {
          if (DEBUG_MODE) console.log(`[LOCAL ONLY] Would send delayed update for ${section}`);
          // Update the timestamp
          lastUpdateMap.set(section, Date.now());
          // Clear the pending data
          pendingDataMap.delete(section);
        }
      }, MIN_UPDATE_INTERVAL - (now - lastUpdate));
      
      // Mark that we have a timeout pending
      lastUpdateMap.set(`${section}_timeout`, timeoutId);
    }
    
    return Promise.resolve();
  }
  
  // Update the timestamp
  lastUpdateMap.set(section, now);
  // Clear the pending data
  pendingDataMap.delete(section);
  
  // Just resolve immediately, no actual server sync
  return Promise.resolve();
}

// Clean up function to clear timeouts on page unload - keep for compatibility
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    // Clean up any pending timeouts
    for (const [key, timeoutId] of lastUpdateMap.entries()) {
      if (key.endsWith("_timeout") && typeof timeoutId === "number") {
        clearTimeout(timeoutId);
      }
    }
  });
}