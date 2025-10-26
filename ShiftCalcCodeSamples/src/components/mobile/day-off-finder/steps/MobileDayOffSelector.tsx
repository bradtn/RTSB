// src/components/mobile/day-off-finder/steps/MobileDayOffSelector.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import { format, parseISO } from "date-fns";
import CalendarDaySelector from "../CalendarDaySelector";

interface MobileDayOffSelectorProps {
  userOperation: string;
  userLine: string;
  selectedDays: string[];
  onSelect: (days: string[]) => void;
  onBack: () => void;
}

export default function MobileDayOffSelector({
  userOperation,
  userLine,
  selectedDays,
  onSelect,
  onBack
}: MobileDayOffSelectorProps) {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const [selected, setSelected] = useState<string[]>(selectedDays);
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    fetchScheduleData();
  }, [userOperation, userLine]);

  const fetchScheduleData = async () => {
    try {
      const response = await fetch("/api/schedules");
      if (response.ok) {
        const schedules = await response.json();
        const userSchedule = schedules.find(
          (s: any) => s.GROUP === userOperation && s.LINE.toString() === userLine.toString()
        );
        if (userSchedule) {
          setScheduleData(userSchedule);
        }
      }
    } catch (error) {
      console.error("Error fetching schedule:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDaysChange = (days: string[]) => {
    setSelected(days);
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
        <p className={`text-center ${styles.textPrimary}`}>Loading your schedule...</p>
      </div>
    );
  }

  return (
    <div className="mobile-full-height flex flex-col safe-area-inset-bottom">
      <div className="flex flex-col h-full px-2 pt-2 pb-20 relative z-10">
        <div className="flex-none">
          <div className={`${theme === "dark" ? "bg-blue-900/80" : "bg-blue-100"} rounded-lg p-3 mb-2`}>
            <h3 className={`text-base font-medium mb-0.5 ${theme === "dark" ? "text-blue-100" : "text-blue-800"}`}>
              Select Work Days to Trade
            </h3>
            <p className={`text-xs ${theme === "dark" ? "text-blue-200" : "text-blue-600"}`}>
              Select your work days where you need coverage - we'll find who has those days off
            </p>
          </div>
        </div>

        <div className="flex-grow flex flex-col items-center justify-center p-4">
          <div className={`${styles.cardBg} rounded-lg p-6 w-full max-w-sm text-center`}>
            <div className="mb-6">
              <svg className="w-16 h-16 mx-auto text-blue-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h4 className={`text-lg font-semibold ${styles.textPrimary} mb-2`}>
                Select Your Work Days
              </h4>
              <p className={`text-sm ${styles.textMuted} mb-4`}>
                Select your scheduled work days where you need coverage. We'll find officers who are off on those days.
              </p>
            </div>

            {selected.length > 0 && (
              <div className={`mb-4 p-3 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"}`}>
                <p className={`text-sm font-medium ${styles.textPrimary} mb-2`}>
                  Selected: {selected.length} day{selected.length > 1 ? "s" : ""}
                </p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {selected.sort().slice(0, 3).map(day => (
                    <span
                      key={day}
                      className={`text-xs px-2 py-0.5 rounded ${
                        theme === "dark" ? "bg-gray-700 text-gray-200" : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {format(parseISO(day), "MMM d")}
                    </span>
                  ))}
                  {selected.length > 3 && (
                    <span className={`text-xs ${styles.textMuted}`}>
                      +{selected.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowCalendar(true)}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                theme === "dark"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              {selected.length > 0 ? "Change Selection" : "Select Days"}
            </button>
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
              Next ({selected.length} selected)
            </button>
          </div>
        </div>
      </div>

      {showCalendar && (
        <CalendarDaySelector
          userSchedule={scheduleData}
          selectedDays={selected}
          onDaysChange={handleDaysChange}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </div>
  );
}