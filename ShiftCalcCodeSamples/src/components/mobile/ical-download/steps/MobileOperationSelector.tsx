// src/components/mobile/ical-download/steps/MobileOperationSelector.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";

interface MobileOperationSelectorProps {
  selectedOperation: string;
  onSelect: (operation: string) => void;
  onCancel: () => void;
  isCompactView?: boolean;
}

export default function MobileOperationSelector({
  selectedOperation,
  onSelect,
  onCancel,
  isCompactView = false
}: MobileOperationSelectorProps) {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const [operations, setOperations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOperations();
  }, []);

  const fetchOperations = async () => {
    try {
      const response = await fetch("/api/groups");
      if (response.ok) {
        const data = await response.json();
        setOperations(data || []);
      } else {
        setError("Failed to load operations");
      }
    } catch (error) {
      console.error("Error fetching operations:", error);
      setError("Error loading operations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && selectedOperation) onSelect(selectedOperation);
      if (e.key === 'Escape') onCancel();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOperation, onSelect, onCancel]);

  // Determine padding and spacing based on compact view
  const headerPadding = isCompactView ? 'p-2' : 'p-3';
  const sectionMargin = isCompactView ? 'mb-1.5' : 'mb-2';
  const contentPadding = isCompactView ? 'pt-1 pb-16' : 'pt-2 pb-20';
  const buttonPadding = isCompactView ? 'py-2' : 'py-3';

  // Loading state
  if (isLoading) {
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
              Which operation do you work in?
            </h3>
            <p className={`text-xs ${theme === 'dark' ? 'text-blue-200' : 'text-blue-600'}`}>
              Select your primary work operation
            </p>
          </div>

          {/* Explanation box */}
          <div className={`${theme === 'dark' ? 'bg-gray-800/60' : 'bg-gray-100'} p-2 rounded-lg ${sectionMargin}`}>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Choose your operation to download your iCal schedule.
            </p>
          </div>
        </div>

        {/* Middle section - the operations grid */}
        <div className="flex-grow mb-20">
          {/* Operations grid */}
          <div className="grid grid-cols-2 gap-2 mb-3 mt-1">
            {operations.map(operation => (
              <button
                key={operation}
                onClick={() => onSelect(operation)}
                className={`${buttonPadding} rounded-lg text-center text-sm transition-all duration-200 
                  ${selectedOperation === operation
                    ? (theme === 'dark' ? "bg-blue-600 text-white shadow" : "bg-blue-500 text-white shadow")
                    : (theme === 'dark' ? "bg-gray-700 text-gray-100 hover:bg-gray-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300")}`}
              >
                {operation}
              </button>
            ))}
          </div>
          
          {/* Warning message */}
          {!selectedOperation && operations.length > 0 && (
            <div className={`mt-2 mb-4 p-2 ${theme === 'dark' ? 'bg-yellow-900/20 border-l-2 border-yellow-600 rounded-lg' : 'bg-yellow-50 border-l-2 border-yellow-400 rounded-lg'}`}>
              <p className={`text-xs ${theme === 'dark' ? 'text-yellow-200' : 'text-yellow-800'}`}>
                Select your operation to continue.
              </p>
            </div>
          )}
        </div>

        {/* Bottom navigation */}
        <div className={`flex-none fixed bottom-0 left-0 right-0 p-2 pb-4 ${styles.pageBg}`}>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className={`flex-1 ${theme === 'dark' 
                ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}
                ${buttonPadding} rounded-lg font-medium`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}