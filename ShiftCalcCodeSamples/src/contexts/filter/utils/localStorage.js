// src/contexts/filter/utils/localStorage.js
// Local storage helper functions

// Helper for local storage operations
export const getLocalStorageItem = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key);
    if (item) {
      return JSON.parse(item);
    }
  } catch (e) {
    console.error("Error parsing localStorage item", e);
  }
  return defaultValue;
};

// Helper to save to local storage
export const saveToLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error("Error saving to localStorage", e);
    return false;
  }
};

// Clear multiple filter-related items
export const clearFilterStorage = () => {
  // Clear specific localStorage values
  localStorage.removeItem("shiftbid.criteria");
  localStorage.removeItem("shiftbid.step");
  localStorage.removeItem("shiftbid.showingResults");
  localStorage.removeItem("shiftbid.subModes");
  localStorage.removeItem("shiftbid.activeView");
  localStorage.removeItem("shiftbid.currentSubsections");
  
  // Clear any other shiftbid items
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith("shiftbid.")) {
      localStorage.removeItem(key);
    }
  });
};
