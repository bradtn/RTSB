// src/utils/recoveryHandlers.js

// Single storage key for criteria backup
const BACKUP_KEY = 'shiftbid.criteria_backup';
const BACKUP_COUNTER = 'shiftbid.backup_counter';

// Minimum time between backups (5 minutes = 300000ms)
const MIN_BACKUP_INTERVAL = 300000; 

// Calculate how many filters are active in the criteria
export function getFilterCount(criteria) {
  if (!criteria) return 0;
  
  let count = 0;
  // Selection-based filters
  if (criteria.selectedGroups?.length) count++;
  if (criteria.selectedShiftCategories?.length) count++;
  if (criteria.selectedShiftLengths?.length) count++;
  if (criteria.selectedShiftCodes?.length) count++;
  if (criteria.dayOffDates?.length) count++;
  
  // Weight-based filters (non-default values)
  if (criteria.weights) {
    if ((criteria.weights.weekendWeight > 1) || (criteria.weights.weekendWeight === 0)) count++;
    if ((criteria.weights.saturdayWeight > 1) || (criteria.weights.saturdayWeight === 0)) count++;
    if ((criteria.weights.sundayWeight > 1) || (criteria.weights.sundayWeight === 0)) count++;
    if ((criteria.weights.blocks5dayWeight > 1) || (criteria.weights.blocks5dayWeight === 0)) count++;
    if ((criteria.weights.blocks4dayWeight > 1) || (criteria.weights.blocks4dayWeight === 0)) count++;
    if ((criteria.weights.groupWeight > 1) || (criteria.weights.groupWeight === 0)) count++;
    if ((criteria.weights.daysWeight > 1) || (criteria.weights.daysWeight === 0)) count++;
  }
  
  return count;
}

// Check if criteria appears to be defaulted
export function isCriteriaReset(criteria) {
  if (!criteria) return true;
  
  // Check for basic structure
  if (!criteria.weights) return true;
  
  // Check for arrays (should exist but can be empty)
  const hasArrays = criteria.hasOwnProperty('selectedGroups') && 
                    criteria.hasOwnProperty('selectedShiftCategories') &&
                    criteria.hasOwnProperty('selectedShiftLengths');
  if (!hasArrays) return true;
  
  // Check weights (default pattern is blocks*=0, all others=1)
  const hasDefaultWeights = 
    criteria.weights.blocks5dayWeight === 0 && 
    criteria.weights.blocks4dayWeight === 0 &&
    criteria.weights.weekendWeight === 1 &&
    criteria.weights.saturdayWeight === 1 &&
    criteria.weights.sundayWeight === 1 &&
    criteria.weights.groupWeight === 1 &&
    criteria.weights.daysWeight === 1;
  
  // If it has few selections and default weights, it's likely defaulted
  return (getFilterCount(criteria) <= 2) && hasDefaultWeights;
}

// Save backup of criteria with optimized storage
export function backupCriteria(criteria) {
  if (!criteria) return false;
  
  try {
    const filterCount = getFilterCount(criteria);
    
    // Only backup if it has actual filters
    if (filterCount <= 2) return false;
    
    // Check if we need to backup by comparing with existing
    const existingBackup = localStorage.getItem(BACKUP_KEY);
    if (existingBackup) {
      try {
        const parsed = JSON.parse(existingBackup);
        
        // Don't backup if identical to existing and recent
        if (parsed.timestamp > Date.now() - MIN_BACKUP_INTERVAL) {
          if (JSON.stringify(parsed.criteria) === JSON.stringify(criteria)) {
            return false; // Skip if identical to recent backup
          }
        }
      } catch (e) {
        // Continue with backup if existing is invalid
      }
    }
    
    // Create backup object
    const backup = {
      criteria: JSON.parse(JSON.stringify(criteria)),
      filterCount,
      timestamp: Date.now()
    };
    
    // Store as single item
    localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
    
    // Simple counter for logs
    const currentCount = parseInt(localStorage.getItem(BACKUP_COUNTER) || '0');
    const newCount = currentCount > 999 ? 1 : currentCount + 1;
    localStorage.setItem(BACKUP_COUNTER, String(newCount));
    
    // Log only occasionally
    if (newCount % 10 === 0) {
      console.log(`Backed up criteria with ${filterCount} filters (backup #${newCount})`);
    }
    
    return true;
  } catch (e) {
    console.error('Error backing up criteria:', e);
    return false;
  }
}

// Restore criteria from backup
export function restoreFromBackup() {
  try {
    const backup = localStorage.getItem(BACKUP_KEY);
    if (!backup) return null;
    
    const parsed = JSON.parse(backup);
    
    // Verify the backup has more than just default filters
    if (!parsed.criteria || parsed.filterCount <= 2) {
      return null;
    }
    
    console.log(`Restoring backup with ${parsed.filterCount} filters`);
    return parsed.criteria;
  } catch (e) {
    console.error('Error restoring from backup:', e);
    return null;
  }
}

// Compare two criteria objects to determine if a reset occurred
export function wasReset(oldCriteria, newCriteria) {
  if (!oldCriteria || !newCriteria) return false;
  
  const oldCount = getFilterCount(oldCriteria);
  const newCount = getFilterCount(newCriteria);
  
  // Significant drop in filter count is usually a reset
  if (oldCount > 3 && newCount <= 2) {
    return true;
  }
  
  return isCriteriaReset(newCriteria);
}

// ORIGINAL NAVIGATION RECOVERY FUNCTIONS
export function setupNavigationRecovery() {
  // Listen for when user is stuck
  let lastHashChange = Date.now();
  let lastInteraction = Date.now();
  
  // Track hash changes
  window.addEventListener('hashchange', () => {
    lastHashChange = Date.now();
  });
  
  // Track user interactions
  document.addEventListener('click', () => {
    lastInteraction = Date.now();
  });
  
  document.addEventListener('touchstart', () => {
    lastInteraction = Date.now();
  });
  
  // Check for stalled navigation
  const recoveryInterval = setInterval(() => {
    const stuckThreshold = 5000; // 5 seconds
    const now = Date.now();
    
    // If user has interacted but the hash hasn't changed in a while
    if (now - lastInteraction < 1000 && now - lastHashChange > stuckThreshold) {
      console.log("Possible stuck navigation detected, attempting recovery");
      
      // Force re-enable all disabled buttons
      document.querySelectorAll('button[disabled]').forEach(button => {
        button.disabled = false;
      });
      
      // Remove any loading or saving indicators
      document.querySelectorAll('.loading-indicator, .saving-indicator').forEach(el => {
        el.style.display = 'none';
      });
      
      // Unlock any navigation locks in the application
      if (window._navigationLockRefs) {
        Object.values(window._navigationLockRefs).forEach(ref => {
          if (ref.current) {
            console.log("Forcing navigation lock release");
            ref.current = false;
          }
        });
      }
    }
  }, 2000);
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(recoveryInterval);
  });
  
  // Expose a global helper to register navigation locks
  window._navigationLockRefs = window._navigationLockRefs || {};
  
  return {
    registerNavigationLock: (id, ref) => {
      window._navigationLockRefs[id] = ref;
      return () => {
        delete window._navigationLockRefs[id];
      };
    }
  };
}

// Helper to force recovery of a stuck UI
export function forceNavigationRecovery() {
  console.log("Force recovery triggered");
  
  // Enable all disabled buttons
  document.querySelectorAll('button[disabled]').forEach(button => {
    button.disabled = false;
  });
  
  // Reset navigation locks
  if (window._navigationLockRefs) {
    Object.values(window._navigationLockRefs).forEach(ref => {
      ref.current = false;
    });
  }
  
  return true;
}