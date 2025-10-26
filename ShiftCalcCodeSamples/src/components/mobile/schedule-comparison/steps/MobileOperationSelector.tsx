// src/components/mobile/schedule-comparison/steps/MobileOperationSelector.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";

interface MobileOperationSelectorProps {
  selectedOperation: string;
  onSelect: (operation: string) => void;
  onCancel?: () => void;
  onBack?: () => void;
  title?: string;
  excludeSchedule?: any;
}

export default function MobileOperationSelector({
  selectedOperation,
  onSelect,
  onCancel,
  onBack,
  title = "Select Operation",
  excludeSchedule
}: MobileOperationSelectorProps) {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const [operations, setOperations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchOperations();
  }, []);

  const fetchOperations = async () => {
    try {
      const response = await fetch('/api/groups');
      if (!response.ok) {
        throw new Error("Failed to fetch operations");
      }
      const data = await response.json();
      setOperations(data);
    } catch (error) {
      console.error("Error fetching operations:", error);
      setError("Failed to load operations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={fetchOperations}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className={`text-xl font-bold ${styles.textPrimary} mb-4`}>
        {title}
      </h2>
      
      {excludeSchedule && (
        <div className={`mb-4 p-3 rounded-lg ${styles.cardBg} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <p className={`text-sm ${styles.textSecondary}`}>
            First Schedule: <span className="font-semibold">{excludeSchedule.GROUP} - Line {excludeSchedule.LINE}</span>
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-2">
        {operations.map((operation) => {
          const isExcluded = false; // Allow selecting the same operation
          
          return (
            <button
              key={operation}
              onClick={() => onSelect(operation)}
              disabled={isExcluded}
              className={`
                w-full p-3 rounded-lg text-center transition-all
                ${selectedOperation === operation
                  ? `${theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'} shadow-lg`
                  : isExcluded
                    ? `${theme === 'dark' ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-400'} cursor-not-allowed`
                    : `${styles.cardBg} ${styles.textPrimary} hover:shadow-md`
                }
                ${!isExcluded && 'active:scale-98'}
              `}
            >
              <span className="font-medium">{operation}</span>
            </button>
          );
        })}
      </div>
      
      <div className="mt-6 flex gap-2">
        {(onBack || onCancel) && (
          <button
            onClick={onBack || onCancel}
            className={`flex-1 py-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'} font-medium`}
          >
            {onBack ? 'Back' : 'Cancel'}
          </button>
        )}
      </div>
    </div>
  );
}