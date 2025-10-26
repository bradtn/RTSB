// src/components/mobile/day-off-finder/ScheduleComparisonCard.tsx
"use client";

import React, { useState } from "react";
import { format, parseISO, addDays, isSameDay } from "date-fns";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";

interface ScheduleComparisonCardProps {
  result: {
    id: string;
    operation: string;
    line: string;
    matchedDays: string[];
    matchPercentage: number;
    matchCount: number;
    totalDesiredDays: number;
    shiftCompatibility: number;
    isFromSameOperation: boolean;
    shiftTimes: Array<{ code: string; begin: string; end: string }>;
    totalWorkDays: number;
    schedulePattern?: string[]; // 56-day pattern
  };
  userSchedule?: {
    operation: string;
    line: string;
    pattern: string[]; // 56-day pattern
  };
  desiredDaysOff: string[];
  startDate: string;
  onViewDetails: (id: string) => void;
  index: number;
}

export default function ScheduleComparisonCard({
  result,
  userSchedule,
  desiredDaysOff,
  startDate,
  onViewDetails,
  index
}: ScheduleComparisonCardProps) {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const [showComparison, setShowComparison] = useState(false);

  const formatShiftTime = (time: string) => {
    if (!time) return "";
    try {
      const [hours, minutes] = time.split(":");
      const hour = parseInt(hours);
      const paddedHour = hour.toString().padStart(2, '0');
      return `${paddedHour}:${minutes}`;
    } catch {
      return time;
    }
  };

  const getCompatibilityBadge = (score: number, isFromSameOp: boolean) => {
    if (isFromSameOp) {
      return { text: "Same Operation", color: "bg-green-500", textColor: "text-white" };
    } else if (score >= 10) {
      return { text: "High Match", color: "bg-blue-500", textColor: "text-white" };
    } else if (score >= 5) {
      return { text: "Good Match", color: "bg-blue-400", textColor: "text-white" };
    } else {
      return { text: "Match", color: "bg-gray-400", textColor: "text-white" };
    }
  };

  const renderComparisonView = () => {
    if (!result.schedulePattern || !userSchedule) return null;

    const start = parseISO(startDate);
    const weeksToShow = 2; // Show 2 weeks of comparison
    const daysToShow = weeksToShow * 7;

    // Find the first desired day off to center the view around
    const firstDesiredDay = parseISO(desiredDaysOff[0]);
    const daysSinceStart = Math.floor((firstDesiredDay.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const startOffset = Math.max(0, daysSinceStart - 3); // Start 3 days before first desired day

    return (
      <div className={`mt-3 ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"} rounded-lg p-3`}>
        <div className="flex items-center justify-between mb-2">
          <h5 className={`text-sm font-medium ${styles.textPrimary}`}>Schedule Comparison</h5>
          <button
            onClick={() => setShowComparison(false)}
            className={`text-xs ${styles.textMuted} hover:${styles.textPrimary}`}
          >
            Hide
          </button>
        </div>

        <div className="space-y-3">
          {/* Legend */}
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className={styles.textMuted}>Matching Day Off</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-3 h-3 ${theme === "dark" ? "bg-gray-700" : "bg-gray-300"} rounded`}></div>
              <span className={styles.textMuted}>Day Off</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-3 h-3 ${theme === "dark" ? "bg-blue-600" : "bg-blue-500"} rounded`}></div>
              <span className={styles.textMuted}>Work Day</span>
            </div>
          </div>

          {/* Calendar comparison */}
          <div className="overflow-x-auto">
            <div className="min-w-max">
              {/* Date headers */}
              <div className="flex gap-1 mb-1">
                <div className="w-20 flex-shrink-0"></div>
                {Array.from({ length: daysToShow }, (_, i) => {
                  const date = addDays(start, startOffset + i);
                  const isDesiredDay = desiredDaysOff.some(d => isSameDay(parseISO(d), date));
                  return (
                    <div
                      key={i}
                      className={`w-8 text-center text-xs ${
                        isDesiredDay ? "font-bold text-green-500" : styles.textMuted
                      }`}
                    >
                      <div>{format(date, "d")}</div>
                      <div className="text-xs">{format(date, "EEE")}</div>
                    </div>
                  );
                })}
              </div>

              {/* Your schedule */}
              <div className="flex gap-1 mb-1">
                <div className={`w-20 flex-shrink-0 text-xs ${styles.textMuted} py-1`}>
                  Your Line {userSchedule.line}
                </div>
                {Array.from({ length: daysToShow }, (_, i) => {
                  const dayIndex = (startOffset + i) % 56;
                  const shift = userSchedule.pattern[dayIndex];
                  const date = addDays(start, startOffset + i);
                  const isDesiredDay = desiredDaysOff.some(d => isSameDay(parseISO(d), date));
                  const isDayOff = shift === "----";

                  return (
                    <div
                      key={i}
                      className={`w-8 h-8 flex items-center justify-center text-xs font-medium rounded ${
                        isDayOff
                          ? isDesiredDay
                            ? "bg-green-500 text-white"
                            : theme === "dark"
                            ? "bg-gray-700 text-gray-400"
                            : "bg-gray-200 text-gray-600"
                          : theme === "dark"
                          ? "bg-blue-600 text-white"
                          : "bg-blue-500 text-white"
                      }`}
                    >
                      {isDayOff ? "-" : shift}
                    </div>
                  );
                })}
              </div>

              {/* Target schedule */}
              <div className="flex gap-1">
                <div className={`w-20 flex-shrink-0 text-xs ${styles.textMuted} py-1`}>
                  Line {result.line}
                </div>
                {Array.from({ length: daysToShow }, (_, i) => {
                  const dayIndex = (startOffset + i) % 56;
                  const shift = result.schedulePattern[dayIndex];
                  const date = addDays(start, startOffset + i);
                  const isDesiredDay = desiredDaysOff.some(d => isSameDay(parseISO(d), date));
                  const isDayOff = shift === "----";

                  return (
                    <div
                      key={i}
                      className={`w-8 h-8 flex items-center justify-center text-xs font-medium rounded ${
                        isDayOff
                          ? isDesiredDay
                            ? "bg-green-500 text-white"
                            : theme === "dark"
                            ? "bg-gray-700 text-gray-400"
                            : "bg-gray-200 text-gray-600"
                          : theme === "dark"
                          ? "bg-blue-600 text-white"
                          : "bg-blue-500 text-white"
                      }`}
                    >
                      {isDayOff ? "-" : shift}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Summary stats */}
          <div className={`grid grid-cols-2 gap-2 pt-2 border-t ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
            <div className={`text-xs ${styles.textMuted}`}>
              <span className="font-medium">Work Days:</span> {result.totalWorkDays} per cycle
            </div>
            <div className={`text-xs ${styles.textMuted}`}>
              <span className="font-medium">Days Off:</span> {56 - result.totalWorkDays} per cycle
            </div>
          </div>
        </div>
      </div>
    );
  };

  const badge = getCompatibilityBadge(result.shiftCompatibility, result.isFromSameOperation);

  return (
    <div className={`${styles.cardBg} rounded-lg p-4 transition-all hover:shadow-md`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={`font-semibold ${styles.textPrimary}`}>
              Line {result.line} - {result.operation}
            </h4>
            <span className={`text-xs px-2 py-0.5 rounded ${badge.color} ${badge.textColor}`}>
              {badge.text}
            </span>
          </div>
          <p className={`text-xs ${styles.textMuted} mt-1`}>
            {result.totalWorkDays} work days per cycle
          </p>
        </div>
        <div className="text-right ml-2">
          <div className={`text-2xl font-bold ${
            result.matchPercentage === 100 ? "text-green-500" : 
            result.matchPercentage >= 75 ? "text-blue-500" : 
            result.matchPercentage >= 50 ? "text-yellow-500" : "text-orange-500"
          }`}>
            {result.matchPercentage}%
          </div>
          <div className={`text-xs ${styles.textMuted}`}>
            {result.matchCount}/{result.totalDesiredDays} days
          </div>
        </div>
      </div>

      {/* Shift times */}
      {result.shiftTimes.length > 0 && (
        <div className={`${theme === "dark" ? "bg-gray-800" : "bg-gray-50"} rounded p-2 mb-2`}>
          <p className={`text-xs font-medium ${styles.textSecondary} mb-1`}>
            Common shifts:
          </p>
          <div className="flex flex-wrap gap-2">
            {result.shiftTimes.map((shift, i) => (
              <div key={i} className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                <span className="font-medium">{shift.code}:</span>{" "}
                {formatShiftTime(shift.begin)}-{formatShiftTime(shift.end)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => setShowComparison(!showComparison)}
          className={`w-full px-3 py-2 text-xs font-medium rounded ${
            theme === "dark"
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-blue-500 text-white hover:bg-blue-600"
          } transition-colors`}
        >
          {showComparison ? "Hide" : "Show"} Comparison
        </button>
      </div>

      {/* Comparison view */}
      {showComparison && renderComparisonView()}
    </div>
  );
}