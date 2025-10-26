// src/components/mobile/schedule-comparison/steps/MobileLineSelector.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";

interface MobileLineSelectorProps {
  selectedOperation: string;
  selectedLine: string;
  onSelect: (line: string) => void;
  onBack: () => void;
  isLoading: boolean;
  error: string;
  title?: string;
}

export default function MobileLineSelector({
  selectedOperation,
  selectedLine,
  onSelect,
  onBack,
  isLoading,
  error,
  title = "Select Line"
}: MobileLineSelectorProps) {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const [lines, setLines] = useState<string[]>([]);
  const [isLoadingLines, setIsLoadingLines] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (selectedOperation) {
      fetchLines();
    }
  }, [selectedOperation]);

  const fetchLines = async () => {
    setIsLoadingLines(true);
    try {
      const response = await fetch('/api/schedules');
      if (!response.ok) {
        throw new Error("Failed to fetch schedules");
      }
      const schedules = await response.json();
      
      // Filter schedules by operation and extract unique line numbers
      const operationLines = schedules
        .filter((s: any) => s.GROUP === selectedOperation)
        .map((s: any) => s.LINE.toString())
        .filter((line: string, index: number, self: string[]) => self.indexOf(line) === index)
        .sort((a: string, b: string) => {
          const numA = parseInt(a);
          const numB = parseInt(b);
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
          }
          return a.localeCompare(b);
        });
      
      setLines(operationLines);
    } catch (error) {
      console.error("Error fetching lines:", error);
    } finally {
      setIsLoadingLines(false);
    }
  };

  // Filter lines based on search query
  const filteredLines = lines.filter(line => 
    line.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoadingLines) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className={`text-xl font-bold ${styles.textPrimary} mb-2`}>
        {title}
      </h2>
      <p className={`text-sm ${styles.textSecondary} mb-4`}>
        Operation: <span className="font-semibold">{selectedOperation}</span>
      </p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}
      
      {/* Search input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search line numbers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full px-3 py-2 rounded-lg ${
            theme === 'dark' 
              ? 'bg-gray-700 text-white border border-gray-600 placeholder-gray-400' 
              : 'bg-white text-gray-900 border border-gray-300 placeholder-gray-500'
          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
      </div>
      
      {filteredLines.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 mb-6">
          {filteredLines.map((line) => (
            <button
              key={line}
              onClick={() => onSelect(line)}
              disabled={isLoading}
              className={`
                p-4 rounded-lg font-medium transition-all
                ${selectedLine === line
                  ? `${theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'} shadow-lg`
                  : `${styles.cardBg} ${styles.textPrimary} hover:shadow-md`
                }
                ${!isLoading && 'active:scale-95'}
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {line}
            </button>
          ))}
        </div>
      ) : (
        <div className={`text-center py-8 ${styles.textSecondary}`}>
          <p>No lines found matching "{searchQuery}"</p>
        </div>
      )}
      
      <button
        onClick={onBack}
        className={`w-full py-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'} font-medium`}
      >
        Back
      </button>
    </div>
  );
}