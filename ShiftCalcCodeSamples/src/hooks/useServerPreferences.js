// src/hooks/useServerPreferences.js - REVISED
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import useLocalStorage from '@/utils/useLocalStorage';

// Queue for coordinating server updates
const serverUpdateQueue = [];
let isProcessingQueue = false;

// Process server updates sequentially in the background
async function processServerQueue() {
  if (isProcessingQueue || serverUpdateQueue.length === 0) return;
  
  isProcessingQueue = true;
  const { section, data, resolve, reject } = serverUpdateQueue.shift();
  
  try {
    console.log(`Processing server update for ${section}`);
    const response = await fetch(`/api/user/preferences?section=${section}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    
    resolve();
  } catch (error) {
    console.error(`Error updating ${section}:`, error);
    reject(error);
  } finally {
    isProcessingQueue = false;
    // Process next update after a small delay
    setTimeout(processServerQueue, 50);
  }
}

// Queue an update to be sent to server
function queueServerUpdate(section, data) {
  return new Promise((resolve, reject) => {
    serverUpdateQueue.push({ section, data, resolve, reject });
    if (!isProcessingQueue) {
      processServerQueue();
    }
  });
}

export function useServerPreferences(section, defaultValue) {
  const { data: session, status } = useSession();
  const [localValue, setLocalValue] = useLocalStorage(`mobileFilter.${section}`, defaultValue);
  const [isSyncing, setIsSyncing] = useState(false);
  const initialSyncDone = useRef(false);
  
  // Load from server once on mount
  useEffect(() => {
    if (initialSyncDone.current || status !== "authenticated") return;
    
    const loadFromServer = async () => {
      setIsSyncing(true);
      
      try {
        // Only do a GET once on initial load
        const response = await fetch('/api/user/preferences');
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data[section] !== undefined) {
          // Only update local if server has data
          setLocalValue(data[section]);
        } else if (JSON.stringify(localValue) !== JSON.stringify(defaultValue)) {
          // Upload local data to server if it's not default
          queueServerUpdate(section, localValue);
        }
      } catch (error) {
        console.error(`Error loading ${section} from server:`, error);
      } finally {
        setIsSyncing(false);
        initialSyncDone.current = true;
      }
    };
    
    loadFromServer();
  }, [status, section, defaultValue, localValue, setLocalValue]);
  
  // Save changes to local storage immediately, queue server updates
  const setValue = useCallback((newValueOrFn) => {
    // Calculate the new value
    const newValue = typeof newValueOrFn === 'function' 
      ? newValueOrFn(localValue) 
      : newValueOrFn;
    
    // Only update if actually changed
    if (JSON.stringify(localValue) !== JSON.stringify(newValue)) {
      // Update local storage immediately
      setLocalValue(newValue);
      
      // Queue server update in background
      if (status === "authenticated") {
        setIsSyncing(true);
        
        queueServerUpdate(section, newValue)
          .then(() => {
            console.log(`${section} synced to server`);
          })
          .catch(err => {
            console.error(`Failed to sync ${section}:`, err);
          })
          .finally(() => {
            setIsSyncing(false);
          });
      }
    }
  }, [status, section, localValue, setLocalValue]);
  
  // Function to force sync with server if needed
  const syncWithServer = useCallback(async () => {
    if (status !== "authenticated") return;
    
    setIsSyncing(true);
    
    try {
      const response = await fetch('/api/user/preferences');
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data[section] !== undefined) {
        setLocalValue(data[section]);
      }
    } catch (error) {
      console.error(`Error syncing ${section} from server:`, error);
    } finally {
      setIsSyncing(false);
    }
  }, [status, section, setLocalValue]);
  
  return {
    value: localValue,
    setValue,
    isSyncing,
    syncWithServer
  };
}

// Export the queue functions for direct use
export const syncToServer = queueServerUpdate;
export const flushServerUpdates = () => {
  // Process all queued updates before moving on
  return Promise.allSettled(
    serverUpdateQueue.map(update => 
      queueServerUpdate(update.section, update.data)
    )
  );
};