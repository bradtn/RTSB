// src/utils/useLocalStorage.js

import { useState, useEffect } from 'react';

export default function useLocalStorage(key, initialValue) {
  // Get stored value
  const readValue = () => {
    // Check if running in browser
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  };
  
  // State to store value
  const [storedValue, setStoredValue] = useState(readValue);
  
  // Update localStorage when state changes
  const setValue = (value) => {
    try {
      // Allow value to be a function
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Only update state and localStorage if the value has actually changed
      // Use JSON.stringify for deep comparison of objects
      if (JSON.stringify(storedValue) !== JSON.stringify(valueToStore)) {
        // Save state
        setStoredValue(valueToStore);
        
        // Save to localStorage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };
  
  return [storedValue, setValue];
}