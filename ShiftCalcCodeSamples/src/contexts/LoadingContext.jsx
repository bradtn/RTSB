"use client"

// src/contexts/LoadingContext.jsx
import React, { createContext, useState, useContext } from "react";

// Create the context with default values
const LoadingContext = createContext({
  shouldShowLoading: false,
  showLoading: () => {},
  hideLoading: () => {}
});

// Provider component
export function LoadingProvider({ children }) {
  const [shouldShowLoading, setShouldShowLoading] = useState(false);
  
  const showLoading = () => {
    console.log("ShowLoading called - setting to true");
    setShouldShowLoading(true);
  };
  
  const hideLoading = () => {
    console.log("HideLoading called - setting to false");
    setShouldShowLoading(false);
  };

  return (
    <LoadingContext.Provider value={{ shouldShowLoading, showLoading, hideLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

// Custom hook for using the loading context
export function useLoading() {
  return useContext(LoadingContext);
}