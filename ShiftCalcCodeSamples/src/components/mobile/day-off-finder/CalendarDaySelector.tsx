// src/components/mobile/day-off-finder/CalendarDaySelector.tsx
"use client";

import React, { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, addMonths, subMonths } from "date-fns";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";

interface CalendarDaySelectorProps {
  userSchedule: any;
  selectedDays: string[];
  onDaysChange: (days: string[]) => void;
  onClose: () => void;
}

export default function CalendarDaySelector({
  userSchedule,
  selectedDays,
  onDaysChange,
  onClose
}: CalendarDaySelectorProps) {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [internalSelectedDays, setInternalSelectedDays] = useState<string[]>(selectedDays);
  const [systemSettings, setSystemSettings] = useState<{startDate: string} | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  useEffect(() => {
    fetchSystemSettings();
  }, []);

  const fetchSystemSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      if (response.ok) {
        const data = await response.json();
        if (data.error) {
          setSettingsError(data.error);
        } else {
          setSystemSettings({
            startDate: data.startDate
          });
        }
      } else {
        const errorData = await response.json();
        setSettingsError(errorData.error || "Failed to load admin settings");
      }
    } catch (error) {
      console.error("Error fetching system settings:", error);
      setSettingsError("Network error loading admin settings");
    }
  };

  // Show error if settings failed to load
  if (settingsError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className={`${styles.cardBg} rounded-xl p-6 max-w-sm w-full text-center`}>
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className={`text-lg font-semibold ${styles.textPrimary} mb-2`}>Configuration Error</h3>
          <p className={`text-sm ${styles.textMuted} mb-4`}>{settingsError}</p>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Show loading if settings haven't loaded yet
  if (!systemSettings) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className={`${styles.cardBg} rounded-xl p-6 max-w-sm w-full text-center`}>
          <div className="h-10 w-10 border-4 border-t-blue-500 border-r-blue-500 border-b-blue-200 border-l-blue-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`${styles.textPrimary}`}>Loading schedule settings...</p>
        </div>
      </div>
    );
  }

  const startDate = parseISO(systemSettings.startDate);
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate which days are work days based on the 56-day cycle
  const isWorkDay = (date: Date) => {
    const daysSinceStart = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // If date is before schedule start date, it's not a work day
    if (daysSinceStart < 0) {
      return false;
    }
    
    const dayIndex = daysSinceStart % 56;
    const dayKey = `DAY_${(dayIndex + 1).toString().padStart(3, '0')}`;
    return userSchedule?.[dayKey] !== "----";
  };

  const toggleDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    if (!isWorkDay(date)) return; // Only allow selecting work days

    setInternalSelectedDays(prev => {
      if (prev.includes(dateStr)) {
        return prev.filter(d => d !== dateStr);
      } else {
        return [...prev, dateStr];
      }
    });
  };

  const handleApply = () => {
    onDaysChange(internalSelectedDays);
    onClose();
  };

  const getDayClassName = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const isWork = isWorkDay(date);
    const isSelected = internalSelectedDays.includes(dateStr);
    const isCurrentMonth = isSameMonth(date, currentMonth);
    
    if (!isCurrentMonth) {
      return `${theme === "dark" ? "text-gray-600" : "text-gray-400"}`;
    }
    
    if (!isWork) {
      // Days off - not selectable
      return `${theme === "dark" ? "bg-gray-800 text-gray-500" : "bg-gray-100 text-gray-400"} cursor-not-allowed`;
    }
    
    if (isSelected) {
      return "bg-green-500 text-white hover:bg-green-600";
    }
    
    // Work days - selectable
    return `${theme === "dark" ? "bg-blue-900 text-blue-200 hover:bg-blue-800" : "bg-blue-50 text-blue-700 hover:bg-blue-100"} cursor-pointer`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`${styles.cardBg} rounded-xl p-4 max-w-sm w-full max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${styles.textPrimary}`}>Select Work Days to Trade</h3>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={`mb-4 p-3 rounded-lg ${theme === "dark" ? "bg-blue-900/50" : "bg-blue-50"}`}>
          <p className={`text-sm ${theme === "dark" ? "text-blue-200" : "text-blue-700"}`}>
            Select your work days (blue) where you need coverage. We'll find officers who have those days off. Gray days are your scheduled days off.
          </p>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className={`p-2 rounded-lg ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h4 className={`text-base font-medium ${styles.textPrimary}`}>
            {format(currentMonth, "MMMM yyyy")}
          </h4>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className={`p-2 rounded-lg ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => (
            <div key={day} className={`text-center text-xs font-medium py-1 ${styles.textMuted}`}>
              {day}
            </div>
          ))}
          
          {/* Empty cells for alignment */}
          {Array.from({ length: days[0].getDay() }, (_, i) => (
            <div key={`empty-${i}`} />
          ))}
          
          {/* Calendar days */}
          {days.map(date => {
            const dateStr = format(date, "yyyy-MM-dd");
            const isWork = isWorkDay(date);
            const isSelected = internalSelectedDays.includes(dateStr);
            
            return (
              <button
                key={dateStr}
                onClick={() => toggleDay(date)}
                disabled={!isWork}
                className={`
                  relative h-10 rounded-lg transition-colors flex items-center justify-center
                  ${getDayClassName(date)}
                `}
              >
                <span className="text-sm font-medium">{format(date, "d")}</span>
                {isWork && isSelected && (
                  <div className="absolute top-0.5 right-0.5">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected days summary */}
        {internalSelectedDays.length > 0 && (
          <div className={`mb-4 p-3 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"}`}>
            <p className={`text-sm font-medium ${styles.textPrimary} mb-2`}>
              Selected: {internalSelectedDays.length} day{internalSelectedDays.length > 1 ? "s" : ""}
            </p>
            <div className="flex flex-wrap gap-1">
              {internalSelectedDays.sort().slice(0, 5).map(day => (
                <span
                  key={day}
                  className={`text-xs px-2 py-0.5 rounded ${
                    theme === "dark" ? "bg-gray-700 text-gray-200" : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {format(parseISO(day), "MMM d")}
                </span>
              ))}
              {internalSelectedDays.length > 5 && (
                <span className={`text-xs ${styles.textMuted}`}>
                  +{internalSelectedDays.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setInternalSelectedDays([])}
            className={`flex-1 py-2.5 rounded-lg font-medium ${
              theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"
            }`}
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            disabled={internalSelectedDays.length === 0}
            className={`flex-1 py-2.5 rounded-lg font-medium ${
              internalSelectedDays.length === 0
                ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            Apply ({internalSelectedDays.length})
          </button>
        </div>
      </div>
    </div>
  );
}