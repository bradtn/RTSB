// src/components/mobile/ical-download/steps/MobileLineSelector.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";

interface MobileLineSelectorProps {
  selectedOperation: string;
  selectedLine: string;
  onSelect: (line: string) => void;
  onBack: () => void;
  isLoading: boolean;
  error: string;
  isCompactView?: boolean;
}

export default function MobileLineSelector({
  selectedOperation,
  selectedLine,
  onSelect,
  onBack,
  isLoading,
  error,
  isCompactView = false
}: MobileLineSelectorProps) {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const [availableLines, setAvailableLines] = useState<string[]>([]);
  const [linesLoading, setLinesLoading] = useState(true);
  const [linesError, setLinesError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [localSelectedLine, setLocalSelectedLine] = useState(selectedLine);

  // Fetch available lines for the selected operation
  useEffect(() => {
    if (!selectedOperation) return;
    
    const fetchLines = async () => {
      setLinesLoading(true);
      setLinesError(null);
      
      try {
        const response = await fetch('/api/schedules');
        const data = await response.json();
        
        if (Array.isArray(data)) {
          // Filter lines by selected operation and extract line numbers
          const filteredLines = data
            .filter((s: any) => s.GROUP === selectedOperation)
            .map((s: any) => s.LINE.toString())
            .filter((line, index, self) => self.indexOf(line) === index) // Remove duplicates
            .sort((a, b) => Number(a) - Number(b)); // Sort numerically
          
          setAvailableLines(filteredLines);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching lines:', err);
        setLinesError('Failed to load lines. Please try again.');
      } finally {
        setLinesLoading(false);
      }
    };
    
    fetchLines();
  }, [selectedOperation]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && localSelectedLine) onSelect(localSelectedLine);
      if (e.key === 'ArrowLeft' && onBack) onBack();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelect, onBack, localSelectedLine]);
  
  // Handle line selection
  const handleLineSelection = useCallback((line: string) => {
    setLocalSelectedLine(line);
    setSearchTerm(line);
  }, []);
  
  // Determine padding and spacing based on compact view
  const headerPadding = isCompactView ? 'p-2' : 'p-3';
  const sectionMargin = isCompactView ? 'mb-1.5' : 'mb-2';
  const contentPadding = isCompactView ? 'pt-1 pb-16' : 'pt-2 pb-20';
  const buttonPadding = isCompactView ? 'py-2' : 'py-3';
  
  // Loading state
  if (linesLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="h-10 w-10 border-4 border-t-blue-500 border-r-blue-500 border-b-blue-200 border-l-blue-200 rounded-full animate-spin mb-4"></div>
        <p className={`text-center ${styles.textPrimary}`}>Loading lines for {selectedOperation}...</p>
      </div>
    );
  }
  
  // Error state
  if (error || linesError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error || linesError}</p>
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
              What's your line number?
            </h3>
            <p className={`text-xs ${theme === 'dark' ? 'text-blue-200' : 'text-blue-600'}`}>
              Enter or select your line number in {selectedOperation}
            </p>
          </div>
          
          {/* Search input */}
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-2 ${sectionMargin}`}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <input
                type="text"
                className={`block w-full pl-10 pr-3 py-2 rounded-lg ${
                  theme === 'dark' 
                    ? 'bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500' 
                    : 'bg-gray-100 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                } text-sm border-none`}
                placeholder="Type or select your line number"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setLocalSelectedLine(e.target.value);
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Middle section - the lines grid */}
        <div className="flex-grow mb-20 overflow-auto">
          <h3 className={`text-sm font-medium ${styles.textSecondary} mb-2`}>
            Select your line:
          </h3>
          
          <div className="grid grid-cols-4 gap-2">
            {availableLines
              // Filter lines based on what the user is typing
              .filter(line => searchTerm ? line.toString().startsWith(searchTerm) : true)
              .map(line => (
                <button
                  key={line}
                  onClick={() => handleLineSelection(line)}
                  className={`${buttonPadding} rounded-lg text-center text-sm transition-all duration-200 
                    ${localSelectedLine === line
                      ? (theme === 'dark' ? "bg-blue-600 text-white shadow" : "bg-blue-500 text-white shadow")
                      : (theme === 'dark' ? "bg-gray-700 text-gray-100 hover:bg-gray-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300")}`}
                >
                  {line}
                </button>
              ))}
          </div>
          
          {/* Warning message */}
          {!localSelectedLine && (
            <div className={`mt-4 p-2 ${theme === 'dark' ? 'bg-yellow-900/20 border-l-2 border-yellow-600 rounded-lg' : 'bg-yellow-50 border-l-2 border-yellow-400 rounded-lg'}`}>
              <p className={`text-xs ${theme === 'dark' ? 'text-yellow-200' : 'text-yellow-800'}`}>
                Enter or select your line number to continue.
              </p>
            </div>
          )}
          
          {/* Line not found message */}
          {localSelectedLine && !availableLines.includes(localSelectedLine) && (
            <div className={`mt-4 p-2 ${theme === 'dark' ? 'bg-yellow-900/20 border-l-2 border-yellow-600 rounded-lg' : 'bg-yellow-50 border-l-2 border-yellow-400 rounded-lg'}`}>
              <p className={`text-xs ${theme === 'dark' ? 'text-yellow-200' : 'text-yellow-800'}`}>
                Line {localSelectedLine} not found in {selectedOperation}. Please select from the list or enter a valid line number.
              </p>
            </div>
          )}
          
          {/* No lines found */}
          {availableLines.length === 0 && (
            <div className={`text-center py-8 ${styles.textMuted}`}>
              No lines found for this operation
            </div>
          )}
        </div>
        
        {/* Bottom navigation */}
        <div className={`flex-none fixed bottom-0 left-0 right-0 p-2 pb-4 ${styles.pageBg}`}>
          <div className="flex gap-2">
            <button
              onClick={onBack}
              disabled={isLoading}
              className={`flex-1 ${theme === 'dark' 
                ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}
                ${buttonPadding} rounded-lg font-medium ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
              Back
            </button>
            <button
              onClick={() => onSelect(localSelectedLine)}
              disabled={!localSelectedLine || !availableLines.includes(localSelectedLine) || isLoading}
              className={`flex-1 ${
                !localSelectedLine || !availableLines.includes(localSelectedLine) || isLoading
                  ? (theme === 'dark' ? "bg-gray-500 text-gray-300" : "bg-gray-300 text-gray-500")
                  : (theme === 'dark' ? "bg-blue-600 text-white" : "bg-blue-500 text-white")
              } ${buttonPadding} rounded-lg font-medium ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Loading...' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}