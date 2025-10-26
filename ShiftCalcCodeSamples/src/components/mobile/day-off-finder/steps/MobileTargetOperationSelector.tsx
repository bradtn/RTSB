// src/components/mobile/day-off-finder/steps/MobileTargetOperationSelector.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";

interface MobileTargetOperationSelectorProps {
  selectedOperations: string[];
  userOperation: string;
  onSelect: (operations: string[]) => void;
  onBack: () => void;
}

export default function MobileTargetOperationSelector({
  selectedOperations,
  userOperation,
  onSelect,
  onBack
}: MobileTargetOperationSelectorProps) {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const [operations, setOperations] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>(selectedOperations);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOperations();
  }, []);

  const fetchOperations = async () => {
    try {
      const response = await fetch("/api/groups");
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched operations:", data);
        // API returns array directly, not object with groups property
        setOperations(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching operations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleOperation = (operation: string) => {
    setSelected(prev => {
      if (prev.includes(operation)) {
        return prev.filter(op => op !== operation);
      } else {
        return [...prev, operation];
      }
    });
  };

  const toggleAll = () => {
    if (selected.length === operations.length) {
      setSelected([]);
    } else {
      setSelected([...operations]);
    }
  };

  const handleContinue = () => {
    if (selected.length > 0) {
      onSelect(selected);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="h-10 w-10 border-4 border-t-blue-500 border-r-blue-500 border-b-blue-200 border-l-blue-200 rounded-full animate-spin mb-4"></div>
        <p className={`text-center ${styles.textPrimary}`}>Loading operations...</p>
      </div>
    );
  }

  return (
    <div className="mobile-full-height flex flex-col safe-area-inset-bottom">
      <div className="flex flex-col h-full px-2 pt-2 pb-20 relative z-10">
        <div className="flex-none">
          <div className={`${theme === "dark" ? "bg-blue-900/80" : "bg-blue-100"} rounded-lg p-3 mb-2`}>
            <h3 className={`text-base font-medium mb-0.5 ${theme === "dark" ? "text-blue-100" : "text-blue-800"}`}>
              Select Target Operations
            </h3>
            <p className={`text-xs ${theme === "dark" ? "text-blue-200" : "text-blue-600"}`}>
              Choose which operations to search for matching schedules
            </p>
          </div>

          <div className={`${styles.cardBg} rounded-lg p-3 mb-2`}>
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-sm font-medium ${styles.textPrimary}`}>Selected: </span>
                <span className={`text-lg font-bold ${selected.length > 0 ? "text-blue-500" : styles.textMuted}`}>
                  {selected.length} operations
                </span>
              </div>
              <button
                onClick={toggleAll}
                className={`text-xs px-3 py-1 rounded ${
                  theme === "dark" 
                    ? "bg-blue-900 text-blue-300" 
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {selected.length === operations.length ? "Clear all" : "Select all"}
              </button>
            </div>
          </div>

          {userOperation && (
            <div className={`${theme === "dark" ? "bg-green-900/20" : "bg-green-50"} rounded-lg p-2 mb-2 border-l-2 ${
              theme === "dark" ? "border-green-600" : "border-green-400"
            }`}>
              <p className={`text-xs ${theme === "dark" ? "text-green-200" : "text-green-800"}`}>
                💡 Tip: Schedules from {userOperation} will be ranked higher for shift time compatibility
              </p>
            </div>
          )}
        </div>

        <div className="flex-grow overflow-auto">
          <div className="space-y-2">
            {operations.map(operation => (
              <button
                key={operation}
                onClick={() => toggleOperation(operation)}
                className={`w-full p-4 rounded-lg text-left transition-all ${
                  selected.includes(operation)
                    ? theme === "dark"
                      ? "bg-blue-600 text-white ring-2 ring-blue-400"
                      : "bg-blue-500 text-white ring-2 ring-blue-300"
                    : theme === "dark"
                    ? "bg-gray-700 text-gray-100 hover:bg-gray-600"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`font-medium ${selected.includes(operation) ? "text-white" : ""}`}>
                      {operation}
                    </div>
                    {operation === userOperation && (
                      <div className={`text-xs mt-1 ${
                        selected.includes(operation) 
                          ? "text-blue-100" 
                          : theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}>
                        Your current operation
                      </div>
                    )}
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    selected.includes(operation)
                      ? "bg-white border-white"
                      : theme === "dark"
                      ? "border-gray-500"
                      : "border-gray-400"
                  }`}>
                    {selected.includes(operation) && (
                      <svg className="w-full h-full text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className={`flex-none fixed bottom-0 left-0 right-0 p-2 pb-4 ${styles.pageBg}`}>
          <div className="flex gap-2">
            <button
              onClick={onBack}
              className={`flex-1 ${theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"} py-3 rounded-lg font-medium`}
            >
              Back
            </button>
            <button
              onClick={handleContinue}
              disabled={selected.length === 0}
              className={`flex-1 ${
                selected.length === 0
                  ? theme === "dark"
                    ? "bg-gray-500 text-gray-300"
                    : "bg-gray-300 text-gray-500"
                  : theme === "dark"
                  ? "bg-blue-600 text-white"
                  : "bg-blue-500 text-white"
              } py-3 rounded-lg font-medium`}
            >
              Find Schedules
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}