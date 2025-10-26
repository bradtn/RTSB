// src/components/mobile/day-off-finder/steps/MobileDayOffResults.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import { format, parseISO } from "date-fns";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import ScheduleComparisonCard from "../ScheduleComparisonCard";

interface MobileDayOffResultsProps {
  userOperation: string;
  userLine: string;
  desiredDaysOff: string[];
  targetOperations: string[];
  onBack: () => void;
  onClose: () => void;
}

interface SearchResult {
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
  schedulePattern?: string[];
}

interface UserSchedule {
  operation: string;
  line: string;
  pattern: string[];
}

export default function MobileDayOffResults({
  userOperation,
  userLine,
  desiredDaysOff,
  targetOperations,
  onBack,
  onClose
}: MobileDayOffResultsProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [userSchedule, setUserSchedule] = useState<UserSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [systemSettings, setSystemSettings] = useState({
    startDate: DEFAULT_SETTINGS.startDate
  });

  // Function to check if user should see debug features
  const shouldShowDebug = () => {
    const isAdmin = session?.user?.email === 'admin@shiftcalc.com' || session?.user?.role === 'admin';
    const isDev = process.env.NODE_ENV === 'development';
    return isAdmin || isDev;
  };

  useEffect(() => {
    fetchSystemSettings();
  }, []);

  useEffect(() => {
    // Always search when system settings are loaded
    searchSchedules();
  }, [systemSettings]);

  const fetchSystemSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      if (response.ok) {
        const data = await response.json();
        setSystemSettings({
          startDate: data.startDate || DEFAULT_SETTINGS.startDate
        });
      }
    } catch (error) {
      console.error("Error fetching system settings:", error);
      // Still search with defaults if settings fetch fails
      searchSchedules();
    }
  };

  const searchSchedules = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/schedules/day-off-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userOperation,
          userLine,
          desiredDaysOff,
          targetOperations,
          startDate: systemSettings.startDate,
          debug: debugMode
        })
      });

      if (!response.ok) {
        throw new Error("Failed to search schedules");
      }

      const data = await response.json();
      setResults(data.results || []);
      setUserSchedule(data.userSchedule || null);
      
      // Store debug info if available
      if (data.debug) {
        setDebugInfo(data.debug);
        console.log('Day-off finder debug info:', data.debug);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to find matching schedules. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (id: string) => {
    router.push(`/schedules/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="h-10 w-10 border-4 border-t-blue-500 border-r-blue-500 border-b-blue-200 border-l-blue-200 rounded-full animate-spin mb-4"></div>
        <p className={`text-center ${styles.textPrimary}`}>Searching for matching schedules...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="mobile-full-height flex flex-col safe-area-inset-bottom">
      <div className="flex flex-col h-full px-2 pt-2 pb-20 relative z-10">
        <div className="flex-none">
          {/* Debug Toggle - Only show to admins */}
          <div className="flex justify-between items-center mb-2">
            <div className={`${theme === "dark" ? "bg-blue-900/80" : "bg-blue-100"} rounded-lg p-3 ${shouldShowDebug() ? 'flex-1 mr-2' : 'flex-1'}`}>
              <h3 className={`text-base font-medium mb-0.5 ${theme === "dark" ? "text-blue-100" : "text-blue-800"}`}>
                Found {results.length} Matching Schedules
              </h3>
              <p className={`text-xs ${theme === "dark" ? "text-blue-200" : "text-blue-600"}`}>
                Sorted by match percentage. 100% = all {desiredDaysOff.length} days off match
              </p>
            </div>
            {shouldShowDebug() && (
              <button
                onClick={() => {
                  setDebugMode(!debugMode);
                  if (!debugMode) {
                    // Re-search with debug enabled
                    searchSchedules();
                  }
                }}
                className={`px-3 py-2 text-xs rounded-lg transition-colors ${
                  debugMode 
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {debugMode ? 'Debug ON' : 'Debug'}
              </button>
            )}
          </div>
          
          {/* Debug Information Panel - Only show to admins */}
          {shouldShowDebug() && debugMode && debugInfo && (
            <div className={`${styles.cardBg} rounded-lg p-3 mb-2 border-2 border-yellow-500`}>
              <h4 className={`text-sm font-bold mb-2 ${styles.textPrimary}`}>Debug Information</h4>
              
              {debugInfo.summary && (
                <div className="mb-2">
                  <p className={`text-xs ${styles.textMuted}`}>{debugInfo.summary.message}</p>
                  {debugInfo.summary.possibleReasons && (
                    <ul className="mt-2 space-y-1">
                      {debugInfo.summary.possibleReasons.map((reason: string, idx: number) => (
                        <li key={idx} className={`text-xs ${styles.textMuted} ml-4`}>• {reason}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              
              <div className="space-y-2 text-xs">
                <div>
                  <span className={`font-semibold ${styles.textPrimary}`}>Processed: </span>
                  <span className={styles.textMuted}>{debugInfo.processedSchedules} schedules</span>
                </div>
                <div>
                  <span className={`font-semibold ${styles.textPrimary}`}>Matches Found: </span>
                  <span className={styles.textMuted}>{debugInfo.matchesFound}</span>
                </div>
                <div>
                  <span className={`font-semibold ${styles.textPrimary}`}>Low Matches: </span>
                  <span className={styles.textMuted}>{debugInfo.lowMatchSchedules?.length || 0} schedules</span>
                </div>
                <div>
                  <span className={`font-semibold ${styles.textPrimary}`}>High Matches: </span>
                  <span className={styles.textMuted}>{debugInfo.highMatchSchedules?.length || 0} schedules</span>
                </div>
                
                {/* Show sample low match schedules */}
                {debugInfo.lowMatchSchedules?.length > 0 && (
                  <details className="mt-2">
                    <summary className={`cursor-pointer ${styles.textPrimary} font-semibold`}>Low Match Schedules (tap to expand)</summary>
                    <div className="mt-1 space-y-1">
                      {debugInfo.lowMatchSchedules.slice(0, 5).map((s: any, idx: number) => (
                        <div key={idx} className={`text-xs ${styles.textMuted} ml-2`}>
                          {s.GROUP} Line {s.LINE}: {s.matchCount}/{s.minRequired} days ({s.matchPercent}%)
                        </div>
                      ))}
                    </div>
                  </details>
                )}
                
                {/* Show sample day analysis */}
                {debugInfo.sampleDayAnalysis?.length > 0 && (
                  <details className="mt-2">
                    <summary className={`cursor-pointer ${styles.textPrimary} font-semibold`}>Day Analysis (tap to expand)</summary>
                    <div className="mt-1 space-y-2">
                      {debugInfo.sampleDayAnalysis.slice(0, 2).map((analysis: any, idx: number) => (
                        <div key={idx} className="border-l-2 border-gray-300 pl-2">
                          <div className={`text-xs font-semibold ${styles.textPrimary}`}>{analysis.schedule}</div>
                          <div className={`text-xs ${styles.textMuted}`}>Matched {analysis.matchCount}/{analysis.totalDesired}</div>
                          {analysis.analysis?.slice(0, 3).map((day: any, didx: number) => (
                            <div key={didx} className={`text-xs ${styles.textMuted} ml-2`}>
                              {day.desiredDay}: {day.scheduleValue} {day.isDayOff ? '✓' : '✗'}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          )}

          <div className={`${styles.cardBg} rounded-lg p-2 mb-2`}>
            <div className="flex flex-wrap gap-1">
              <span className={`text-xs ${styles.textMuted}`}>Your work days:</span>
              {desiredDaysOff.slice(0, 3).map((day, idx) => (
                <span key={idx} className={`text-xs px-2 py-0.5 rounded ${
                  theme === "dark" ? "bg-gray-700 text-gray-200" : "bg-blue-100 text-blue-700"
                }`}>
                  {format(parseISO(day), "MMM d")}
                </span>
              ))}
              {desiredDaysOff.length > 3 && (
                <span className={`text-xs ${styles.textMuted}`}>
                  +{desiredDaysOff.length - 3} more
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex-grow overflow-auto">
          {results.length === 0 ? (
            <div className={`text-center py-8 ${styles.textMuted}`}>
              <p className="mb-2 font-semibold">No schedules found with your selected days off.</p>
              <p className="text-sm mb-3">Try selecting fewer days or different operations.</p>
              
              {shouldShowDebug() && debugMode && debugInfo && (
                <div className={`mt-4 p-3 ${styles.cardBg} rounded-lg text-left mx-4`}>
                  <p className={`text-xs font-semibold mb-2 ${styles.textPrimary}`}>Debug Details:</p>
                  <p className={`text-xs ${styles.textMuted}`}>
                    Searched {debugInfo.processedSchedules} schedules in {targetOperations.join(', ')}
                  </p>
                  <p className={`text-xs ${styles.textMuted} mt-1`}>
                    Required at least {Math.max(1, Math.floor(desiredDaysOff.length * 0.5))} out of {desiredDaysOff.length} days to match
                  </p>
                  {debugInfo.lowMatchSchedules?.length > 0 && (
                    <p className={`text-xs ${styles.textMuted} mt-1`}>
                      Found {debugInfo.lowMatchSchedules.length} schedules with partial matches (below threshold)
                    </p>
                  )}
                  <p className={`text-xs ${styles.textWarning} mt-2 font-semibold`}>
                    Tip: Enable debug mode BEFORE searching to see detailed analysis
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((result, idx) => (
                <ScheduleComparisonCard
                  key={result.id}
                  result={result}
                  userSchedule={userSchedule}
                  desiredDaysOff={desiredDaysOff}
                  startDate={systemSettings.startDate}
                  onViewDetails={handleViewDetails}
                  index={idx}
                />
              ))}
            </div>
          )}
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
              onClick={onClose}
              className={`flex-1 ${theme === "dark" ? "bg-blue-600 text-white" : "bg-blue-500 text-white"} py-3 rounded-lg font-medium`}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}