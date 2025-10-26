// src/components/mobile/steps/mirrored-lines/MobileTargetSelector.tsx
import React, { useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useMirroredLines } from '@/contexts/MirroredLinesContext';

interface MobileTargetSelectorProps {
  onNext?: () => void;
  onBack?: () => void;
  isCompactView?: boolean;
}

export default function MobileTargetSelector({
  onNext,
  onBack,
  isCompactView = false
}: MobileTargetSelectorProps) {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const {
    operations,
    selectedOperation,
    targetOperations,
    setTargetOperations,
    loading,
    error
  } = useMirroredLines();
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && onNext && targetOperations.length > 0) onNext();
      if (e.key === 'ArrowLeft' && onBack) onBack();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onBack, targetOperations]);
  
  // Handle operation selection
  const handleOperationSelection = (operation: string) => {
    setTargetOperations(prevOperations => {
      if (operation === "ALL") {
        // If "ALL" is clicked, select all operations
        return [...operations];
      } else if (prevOperations.includes(operation)) {
        // Remove if already selected
        return prevOperations.filter(op => op !== operation);
      } else {
        // Add if not selected
        return [...prevOperations, operation];
      }
    });
  };
  
  // Handle "All Operations" selection
  const handleSelectAll = () => {
    setTargetOperations([...operations]);
  };
  
  // Handle "Deselect All" operation
  const handleDeselectAll = () => {
    setTargetOperations([]);
  };
  
  // Determine padding and spacing based on compact view
  const headerPadding = isCompactView ? 'p-2' : 'p-3';
  const sectionMargin = isCompactView ? 'mb-1.5' : 'mb-2';
  const contentPadding = isCompactView ? 'pt-1 pb-2' : 'pt-2 pb-2';
  const buttonPadding = isCompactView ? 'py-2' : 'py-3';
  
  // Loading state
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="h-10 w-10 border-4 border-t-blue-500 border-r-blue-500 border-b-blue-200 border-l-blue-200 rounded-full animate-spin mb-4"></div>
        <p className={`text-center ${styles.textPrimary}`}>Loading operations...</p>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Reload
        </button>
      </div>
    );
  }
  
  return (
    <div className="mobile-full-height flex flex-col safe-area-inset-bottom">
      {/* Content container */}
      <div className={`flex flex-col h-full px-2 ${contentPadding} relative z-10`}>
        {/* Top section */}
        <div className="flex-none">
          {/* Fixed blue header */}
          <div className={`${theme === 'dark' ? 'bg-blue-900/80' : 'bg-blue-100'} rounded-lg ${headerPadding} ${sectionMargin}`}>
            <h3 className={`text-base font-medium mb-0.5 ${theme === 'dark' ? 'text-blue-100' : 'text-blue-800'}`}>
              Which operations would you consider?
            </h3>
            <p className={`text-xs ${theme === 'dark' ? 'text-blue-200' : 'text-blue-600'}`}>
              Select operations to find mirror matches in
            </p>
          </div>
          
          {/* Explanation box */}
          <div className={`${theme === 'dark' ? 'bg-gray-800/60' : 'bg-gray-100'} p-2 rounded-lg ${sectionMargin}`}>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              We'll search for mirror matches in the operations you select. Selecting more operations gives you more potential matches.
            </p>
          </div>
          
          {/* Select/Deselect All buttons */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              onClick={handleSelectAll}
              className={`${buttonPadding} rounded-lg text-center text-sm font-medium
                ${theme === 'dark' ? "bg-blue-600 text-white" : "bg-blue-500 text-white"}`}
            >
              Select All
            </button>
            <button
              onClick={handleDeselectAll}
              className={`${buttonPadding} rounded-lg text-center text-sm font-medium
                ${theme === 'dark' ? "bg-red-600 text-white" : "bg-red-500 text-white"}`}
              disabled={targetOperations.length === 0}
            >
              Deselect All
            </button>
          </div>
        </div>
        
        {/* Middle section - the operations grid */}
        <div className="flex-grow">
          <div className="grid grid-cols-2 gap-2 mb-3">
            {operations
              .map(operation => (
                <button
                  key={operation}
                  onClick={() => handleOperationSelection(operation)}
                  className={`${buttonPadding} rounded-lg text-center text-sm transition-all duration-200 
                    ${targetOperations.includes(operation)
                      ? (theme === 'dark' ? "bg-blue-600 text-white shadow" : "bg-blue-500 text-white shadow")
                      : (operation === selectedOperation 
                        ? (theme === 'dark' ? "bg-purple-700 text-white border border-purple-500" : "bg-purple-100 text-purple-700 border border-purple-300") 
                        : (theme === 'dark' ? "bg-gray-700 text-gray-100 hover:bg-gray-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300"))
                    }`}
                >
                  {operation === selectedOperation ? `${operation} (yours)` : operation}
                </button>
              ))}
          </div>
          
          {/* Selected operations display */}
          {targetOperations.length > 0 && (
            <div className={`${theme === 'dark' ? 'bg-gray-800/80' : 'bg-gray-100'} p-2.5 rounded-lg mb-2`}>
              <p className={`${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'} font-medium mb-1.5 text-sm`}>
                Selected operations:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {targetOperations.map(operation => (
                  <span 
                    key={operation} 
                    className={`${theme === 'dark' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-blue-500 text-white'} 
                      px-2.5 py-1 rounded-full text-xs font-medium`}
                  >
                    {operation}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Warning message */}
          {targetOperations.length === 0 && (
            <div className={`mt-2 mb-4 p-2 ${theme === 'dark' ? 'bg-yellow-900/20 border-l-2 border-yellow-600 rounded-lg' : 'bg-yellow-50 border-l-2 border-yellow-400 rounded-lg'}`}>
              <p className={`text-xs ${theme === 'dark' ? 'text-yellow-200' : 'text-yellow-800'}`}>
                Select at least one operation to continue.
              </p>
            </div>
          )}
        </div>
        
        {/* Bottom navigation */}
        <div className={`flex-none mt-4 p-2 ${styles.pageBg}`}>
          <div className="flex gap-2">
            <button
              onClick={onBack}
              className={`flex-1 ${theme === 'dark' 
                ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}
                ${buttonPadding} rounded-lg font-medium`}
            >
              Back
            </button>
            <button
              onClick={onNext}
              disabled={targetOperations.length === 0}
              className={`flex-1 ${
                targetOperations.length === 0
                  ? (theme === 'dark' ? "bg-gray-500 text-gray-300" : "bg-gray-300 text-gray-500")
                  : (theme === 'dark' ? "bg-blue-600 text-white" : "bg-blue-500 text-white")
              } ${buttonPadding} rounded-lg font-medium`}
            >
              Find Matches
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}