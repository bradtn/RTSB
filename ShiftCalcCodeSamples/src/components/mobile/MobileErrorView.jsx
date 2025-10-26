// src/components/mobile/MobileErrorView.jsx
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useFilter } from '@/contexts/FilterContext';

export default function MobileErrorView({ 
  error, 
  title = "An error occurred", 
  message = "Something went wrong while processing your request.",
  onReset = null,
  onRetry = null
}) {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const { resetFilters, navigateToSection } = useFilter();
  
  // Default handlers using the context if none provided
  const handleReset = onReset || (() => {
    resetFilters();
    navigateToSection('groups');
  });
  
  const handleRetry = onRetry || (() => {
    navigateToSection('groups');
  });
  
  return (
    <div className="p-4 flex flex-col items-center justify-center h-full">
      <div className="text-red-400 mb-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-900/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h3 className="text-xl font-medium mb-2">{title}</h3>
        <p className="text-sm mt-2">{message}</p>
        {error && (
          <p className="text-xs mt-3 p-2 bg-gray-800 rounded text-gray-300 font-mono">
            {typeof error === 'string' ? error : error.message || 'Unknown error'}
          </p>
        )}
      </div>
      
      <div className="flex flex-col space-y-3">
        {onRetry && (
          <button 
            onClick={handleRetry} 
            className="bg-blue-600 text-white py-2 px-6 rounded-lg text-sm"
          >
            Try Again
          </button>
        )}
        
        {onReset && (
          <button 
            onClick={handleReset} 
            className="bg-red-600 text-white py-2 px-6 rounded-lg text-sm"
          >
            Reset All Filters
          </button>
        )}
      </div>
    </div>
  );
}