// src/components/mirrored-lines/MirroredLineResults.tsx
"use client";

import { useState } from "react";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import { MirrorScore, Schedule } from "@/types/scheduleTypes";
import useIsMobile from "@/utils/useIsMobile";
import { format, parseISO } from 'date-fns';

import formatScheduleDate from "@/utils/formatScheduleDate";

// Wrapper for formatScheduleDate with desktop format
function formatDateForSchedule(dateString: string): string {
  return formatScheduleDate(dateString, 'MMMM d');
}

interface MirroredLineResultsProps {
  userLine: Schedule | null;
  mirrorResults: MirrorScore[];
  isLoading: boolean;
  error: string | null;
}

type FilterType = "all" | "different" | "workoff" | "identical";

export default function MirroredLineResults({
  userLine,
  mirrorResults,
  isLoading,
  error
}: MirroredLineResultsProps) {
  const styles = useThemeStyles();
  const isMobile = useIsMobile();
  const [selectedMirror, setSelectedMirror] = useState<MirrorScore | null>(null);
  const [sortField, setSortField] = useState<string>("userShiftPatternScore");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [filterType, setFilterType] = useState<FilterType>("all");
  
  // If loading, show a spinner
  if (isLoading) {
    return (
      <div className={`${styles.cardBg} rounded-lg p-6 shadow-md`}>
        <div className="flex justify-center py-4">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
        </div>
        <p className="text-center text-gray-500 dark:text-gray-400">Analyzing schedule patterns...</p>
      </div>
    );
  }
  
  // If error, show error message with more details
  if (error) {
    // Determine error type
    const isDatabaseIssue = error.includes("database") || error.includes("column") || error.includes("day_") || error.includes("schema");
    const isAuthIssue = error.includes("Unauthorized") || error.includes("Authentication") || error.includes("401");
    const isDataIssue = error.includes("No valid schedules") || error.includes("not found") || error.includes("no day columns");
    
    return (
      <div className="bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded">
        <p className="font-bold">Error finding mirrored lines</p>
        <p className="mb-2">{error}</p>
        
        {/* Debug information */}
        <div className="mt-3 bg-gray-100 dark:bg-gray-800 p-2 rounded text-gray-700 dark:text-gray-300 text-xs font-mono">
          <p className="font-semibold">Debug Info (for administrators):</p>
          <p>Line ID: {userLine?.id || 'Not set'}</p>
          <p>Error type: {isDatabaseIssue ? 'Database' : isAuthIssue ? 'Authentication' : isDataIssue ? 'Data' : 'Unknown'}</p>
          <p>Timestamp: {new Date().toISOString()}</p>
        </div>
        
        {isDatabaseIssue && (
          <div className="mt-3 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md text-yellow-800 dark:text-yellow-200 text-sm">
            <p className="font-semibold">Database Schema Issue</p>
            <p>There might be an issue with the database schema or day column formats:</p>
            <ul className="list-disc list-inside mt-1 ml-2">
              <li>The schedule might be missing required day columns (DAY_001, etc.)</li>
              <li>Column naming might be inconsistent (case sensitivity)</li>
              <li>Try selecting a line from a different group that has a complete schedule</li>
            </ul>
          </div>
        )}
        
        {isAuthIssue && (
          <div className="mt-3 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md text-yellow-800 dark:text-yellow-200 text-sm">
            <p className="font-semibold">Authentication Issue</p>
            <p>Your session may have expired. Please try logging in again.</p>
          </div>
        )}
        
        {isDataIssue && (
          <div className="mt-3 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md text-yellow-800 dark:text-yellow-200 text-sm">
            <p className="font-semibold">Data Issue</p>
            <p>There appears to be an issue with the selected line's data:</p>
            <ul className="list-disc list-inside mt-1 ml-2">
              <li>The selected line may not have the required day pattern data</li>
              <li>Try selecting a different line with a complete schedule</li>
              <li>Recommended: choose a line with ID 172, 186, or 200 (known working lines)</li>
            </ul>
          </div>
        )}
        
        <div className="mt-4">
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
  
  // If user line not loaded, show a message
  if (!userLine) {
    return (
      <div className={`${styles.cardBg} rounded-lg p-6 shadow-md`}>
        <p className="text-center text-gray-500 dark:text-gray-400">
          Select a schedule line to find potential mirrors.
        </p>
      </div>
    );
  }
  
  // If no mirror results, show a message
  if (mirrorResults.length === 0) {
    return (
      <div className={`${styles.cardBg} rounded-lg p-6 shadow-md`}>
        <p className="text-center text-gray-500 dark:text-gray-400">
          No mirrored schedules found for Line {userLine.LINE}. Consider selecting a different line.
        </p>
      </div>
    );
  }
  
  // Format percentage for display
  const formatPercent = (value: number) => {
    return `${Math.round(value)}%`;
  };
  
  // Handle column sorting
  const handleSort = (field: string) => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default direction
      setSortField(field);
      setSortDirection("desc");
    }
  };
  
  // Debug ALL mirror results fields for the first result
  console.log("=== DEBUG MIRROR RESULTS DATA (FIRST RESULT) ===");
  if (mirrorResults.length > 0) {
    const firstResult = mirrorResults[0];
    console.log("KEYS AVAILABLE:", Object.keys(firstResult));
    console.log("RAW RESULT:", firstResult);
    console.log("CALCULATED TOTALS:", {
      patternScore: firstResult.patternScore,
      userShiftPatternScore: firstResult.userShiftPatternScore,
      totalUserWorkDays: firstResult.totalUserWorkDays,
      sameCategoryCount: firstResult.sameCategoryCount,
      differentCategoryCount: firstResult.differentCategoryCount,
      workDayMismatchCount: firstResult.workDayMismatchCount,
      totalDays: firstResult.sameCategoryCount + firstResult.differentCategoryCount + (firstResult.workDayMismatchCount || 0),
      calculatedUserMatches: Math.round((firstResult.userShiftPatternScore || 0)/100 * (firstResult.totalUserWorkDays || 0)),
      calculatedPatternMatches: Math.round((firstResult.patternScore/100) * (firstResult.sameCategoryCount + firstResult.differentCategoryCount + (firstResult.workDayMismatchCount || 0)))
    });
  } else {
    console.log("NO RESULTS AVAILABLE");
  }

  // Sort mirror results - now primarily by pattern score
  const sortedResults = [...mirrorResults].sort((a, b) => {
    let valueA: number, valueB: number;
    
    switch (sortField) {
      case "patternScore":
        valueA = a.patternScore;
        valueB = b.patternScore;
        break;
      case "userShiftPatternScore":
        valueA = a.userShiftPatternScore || 0;
        valueB = b.userShiftPatternScore || 0;
        break;
      case "shiftDiffScore":
        valueA = a.shiftDiffScore;
        valueB = b.shiftDiffScore;
        break;
      case "differentCategoryCount":
        valueA = a.differentCategoryCount;
        valueB = b.differentCategoryCount;
        break;
      case "workDayMismatchCount":
        valueA = a.workDayMismatchCount || 0;
        valueB = b.workDayMismatchCount || 0;
        break;
      case "totalScore":
      default:
        // Default to pattern score if no other field is selected
        valueA = a.patternScore;
        valueB = b.patternScore;
        break;
    }
    
    return sortDirection === "asc" 
      ? valueA - valueB 
      : valueB - valueA;
  });
  
  return (
    <div className="space-y-6">
      {/* Summary section */}
      <div className={`${styles.cardBg} rounded-lg p-6 shadow-md`}>
        <h2 className={`text-lg font-semibold ${styles.textPrimary} mb-4`}>
          ✅✅✅ UPDATED MIRROR RESULTS ✅✅✅ for Line {userLine.LINE} ({userLine.GROUP})
        </h2>
        
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <p className={`${styles.textSecondary}`}>
              Found {mirrorResults.length} potential mirror {mirrorResults.length === 1 ? 'match' : 'matches'} with similar work patterns.
            </p>
            {selectedMirror && (
              <span className="text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full font-medium">
                Viewing match {sortedResults.findIndex(item => item.line.id === selectedMirror.line.id) + 1} of {sortedResults.length}
              </span>
            )}
          </div>
          <p className={`${styles.textSecondary} mb-2`}>
            Select a result below to view detailed comparison.
          </p>
          <p className={`${styles.textSecondary} text-xs`}>
            <strong>User Pattern Score:</strong> Shows what percentage of <em>your</em> work days (ON shifts) match with the other line. Higher percentages mean more of your work days are preserved in the other schedule.
            <br />
            <strong>Overall Pattern:</strong> Shows how well both work and off days match across the entire schedule (traditional mirror score).
          </p>
        </div>
        
        {/* User line stats */}
        <div className="mb-4">
          <h3 className={`text-md font-medium ${styles.textSecondary} mb-2`}>Your Schedule Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
              <div className="text-sm text-gray-500 dark:text-gray-400">Line</div>
              <div className="font-medium">{userLine.LINE}</div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
              <div className="text-sm text-gray-500 dark:text-gray-400">Group</div>
              <div className="font-medium">{userLine.GROUP}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mirror results list */}
      <div className={`${styles.cardBg} rounded-lg overflow-hidden shadow-md`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className={`text-md font-medium ${styles.textPrimary}`}>
            Potential Mirror Matches
          </h3>
          <p className={`text-sm ${styles.textSecondary}`}>
            Schedules are ranked by meaningful trade score (considers time differences between shifts)
          </p>
        </div>
        
        <div className={`${isMobile ? 'max-h-[300px]' : 'max-h-[400px]'} overflow-y-auto`}>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Line
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Group
                </th>
                <th 
                  scope="col" 
                  onClick={() => handleSort("differentCategoryCount")}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center" title="Number of different shifts - higher is better for trades">
                    Different
                    {sortField === "differentCategoryCount" && (
                      <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  onClick={() => handleSort("significantDifferenceCount")}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center" title="Number of shifts with significant time differences">
                    Sig. Diff
                    {sortField === "significantDifferenceCount" && (
                      <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  onClick={() => handleSort("shiftDiffScore")}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center" title="Percentage of shifts that are different - higher is better for trades">
                    Diff %
                    {sortField === "shiftDiffScore" && (
                      <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  onClick={() => handleSort("userShiftPatternScore")}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center" title="How well the work days match based on user's shifts - higher is better">
                    User Pattern Score
                    {sortField === "userShiftPatternScore" && (
                      <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  onClick={() => handleSort("patternScore")}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center" title="How well the work/off days match overall - higher is better">
                    Overall Pattern
                    {sortField === "patternScore" && (
                      <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {sortedResults.map((result, index) => (
                <tr 
                  key={result.line.id}
                  onClick={() => setSelectedMirror(result)}
                  className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    selectedMirror?.line.id === result.line.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <span className="mr-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                        {index + 1}/{sortedResults.length}
                      </span>
                      {result.line.LINE}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {result.line.GROUP}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center">
                      <div className="font-bold text-purple-600 dark:text-purple-300">
                        {result.differentCategoryCount}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center">
                      <div className="font-bold text-purple-600 dark:text-purple-300">
                        {result.significantDifferenceCount || 0}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center">
                      <div className="font-bold text-blue-600 dark:text-blue-300">
                        {formatPercent(result.shiftDiffScore)}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col">
                      <div className="text-blue-700 dark:text-blue-300 font-bold">
                        {(() => {
                          // Get total ON days by examining the shift comparison
                          const percent = result.userShiftPatternScore || 0;
                          
                          // Calculate total shifts by counting ON days
                          // Each entry in shiftComparison where userShift is not the OFF code ('----') is a work day
                          const totalOnDays = result.shiftComparison ? 
                            result.shiftComparison.filter(day => day.userShift !== '----').length : 
                            (result.sameCategoryCount + result.differentCategoryCount + (result.workDayMismatchCount || 0));
                          
                          // Fixed hardcoded display - no conditionals, no API-dependent fields
                          return (
                            <>
                              <div className="flex flex-col items-center">
                                <div className="font-bold text-blue-600 dark:text-blue-300">
                                  {formatPercent(percent)}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {Math.round(percent * totalOnDays / 100)} of {totalOnDays}
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col">
                      <div className="text-green-700 dark:text-green-300 font-bold">
                        {(() => {
                          // Simple calculation based on pattern score
                          const percent = result.patternScore;
                          const totalDays = result.sameCategoryCount + result.differentCategoryCount + (result.workDayMismatchCount || 0);
                          
                          // Fixed hardcoded display
                          return (
                            <>
                              <div className="flex flex-col items-center">
                                <div className="font-bold text-green-600 dark:text-green-300">
                                  {formatPercent(percent)}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {Math.round(percent * totalDays / 100)} of {totalDays}
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Detailed comparison of selected mirror */}
      {selectedMirror && (
        <div className={`${styles.cardBg} rounded-lg p-6 shadow-md`}>
          <h3 className={`text-lg font-semibold ${styles.textPrimary} mb-4`}>
            Detailed Comparison
            {selectedMirror && (
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                Match {sortedResults.findIndex(item => item.line.id === selectedMirror.line.id) + 1} of {sortedResults.length}
              </span>
            )}
          </h3>
          
          <div className="mb-6 grid grid-cols-2 gap-6">
            <div>
              <h4 className={`text-md font-medium ${styles.textSecondary} mb-2`}>Your Line</h4>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                <div><span className="font-medium">Line:</span> {userLine.LINE}</div>
                <div><span className="font-medium">Group:</span> {userLine.GROUP}</div>
              </div>
            </div>
            
            <div>
              <h4 className={`text-md font-medium ${styles.textSecondary} mb-2`}>Mirror Line</h4>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                <div><span className="font-medium">Line:</span> {selectedMirror.line.LINE}</div>
                <div><span className="font-medium">Group:</span> {selectedMirror.line.GROUP}</div>
              </div>
            </div>
          </div>
          
          {/* Stats cards - simplified */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg shadow-sm">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">User Pattern Match</p>
              <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                {(() => {
                  // Count actual ON days in the user's schedule
                  const percent = selectedMirror.userShiftPatternScore || 0;
                  
                  // Count actual work days by filtering shift comparison data
                  const totalOnDays = selectedMirror.shiftComparison ? 
                    selectedMirror.shiftComparison.filter(day => day.userShift !== '----').length : 
                    (selectedMirror.sameCategoryCount + selectedMirror.differentCategoryCount + (selectedMirror.workDayMismatchCount || 0));
                  
                  const matchDays = Math.round(percent * totalOnDays / 100);
                  
                  return (
                    <>
                      <div className="flex flex-col">
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-300">
                          {formatPercent(percent)}
                        </div>
                        <div className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                          {matchDays} of {totalOnDays} days match
                        </div>
                      </div>
                    </>
                  );
                })()}
              </p>
              <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                Based on your work days
              </p>
            </div>
            <div className="bg-emerald-100 dark:bg-emerald-900 p-4 rounded-lg shadow-sm">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Overall Pattern</p>
              <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                {(() => {
                  // Direct calculation like the other cards
                  const percent = selectedMirror.patternScore;
                  const totalDays = selectedMirror.sameCategoryCount + selectedMirror.differentCategoryCount + (selectedMirror.workDayMismatchCount || 0);
                  const matchDays = Math.round(percent * totalDays / 100);
                  
                  return (
                    <>
                      <span className="bg-green-100 dark:bg-green-800 font-bold text-green-800 dark:text-green-100 px-3 py-1 rounded-md">
                        {formatPercent(percent)}
                        {' '}
                        <span className="font-normal">
                          {matchDays} of {totalDays}
                        </span>
                      </span>
                    </>
                  );
                })()}
              </p>
              <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                All days matched
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg shadow-sm">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Shift Differences</p>
              <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                {(() => {
                  // Direct calculation
                  const percent = selectedMirror.shiftDiffScore;
                  const diffCount = selectedMirror.differentCategoryCount;
                  const totalCount = selectedMirror.differentCategoryCount + selectedMirror.sameCategoryCount;
                  
                  return (
                    <>
                      <span className="bg-blue-100 dark:bg-blue-800 font-bold text-blue-800 dark:text-blue-100 px-3 py-1 rounded-md">
                        {formatPercent(percent)}
                        {' '}
                        <span className="font-normal">
                          {diffCount} of {totalCount}
                        </span>
                      </span>
                    </>
                  );
                })()}
              </p>
              <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                Different shift types
              </p>
            </div>
            <div className="bg-amber-100 dark:bg-amber-900 p-4 rounded-lg shadow-sm">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Different Shifts</p>
              <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                {selectedMirror.differentCategoryCount}
              </p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900 p-4 rounded-lg shadow-sm">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Significant Diffs</p>
              <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                {selectedMirror.significantDifferenceCount || 0}/{selectedMirror.sameCategoryCount + selectedMirror.differentCategoryCount}
              </p>
            </div>
          </div>
          
          {/* Day-by-day comparison */}
          <div className="flex items-center justify-between mb-4">
            <h4 className={`text-md font-medium ${styles.textSecondary}`}>
              Day by Day Comparison
            </h4>
            
            {/* Filter buttons */}
            <div className="flex space-x-2">
              <button 
                onClick={() => setFilterType("all")}
                className={`px-3 py-1 text-xs rounded-md ${
                  filterType === "all" 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                All Days
              </button>
              <button 
                onClick={() => setFilterType("different")}
                className={`px-3 py-1 text-xs rounded-md ${
                  filterType === "different" 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Different
              </button>
              <button 
                onClick={() => setFilterType("workoff")}
                className={`px-3 py-1 text-xs rounded-md ${
                  filterType === "workoff" 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Work/Off
              </button>
              <button 
                onClick={() => setFilterType("identical")}
                className={`px-3 py-1 text-xs rounded-md ${
                  filterType === "identical" 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Identical
              </button>
            </div>
          </div>
          
          <div className={`${isMobile ? 'max-h-[300px]' : 'max-h-[400px]'} overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg`}>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Your Shift
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Mirror Shift
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Difference
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {selectedMirror.shiftComparison
                  .filter(comparison => {
                    if (filterType === "all") return true;
                    if (filterType === "different") return comparison.isDifferent && !comparison.isWorkDayMismatch;
                    if (filterType === "workoff") return comparison.isWorkDayMismatch;
                    if (filterType === "identical") return !comparison.isDifferent && !comparison.isWorkDayMismatch;
                    return true;
                  })
                  .map((comparison) => (
                    <tr key={comparison.day} className={
                      comparison.isDifferent ? 'bg-yellow-200 dark:bg-yellow-800/30' : 
                      comparison.isWorkDayMismatch ? 'bg-blue-200 dark:bg-blue-800/30' : ''
                    }>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {comparison.date ? formatDateForSchedule(comparison.date) : `Day ${comparison.day}`}
                      </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      <div>
                        <span className="font-mono font-bold text-gray-900 dark:text-gray-300">{comparison.userShift}</span>
                        {comparison.userTime && (
                          <span className="ml-2 text-xs text-gray-700 dark:text-gray-400">
                            {comparison.userTime}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      <div>
                        <span className="font-mono font-bold text-gray-900 dark:text-gray-300">{comparison.otherShift}</span>
                        {comparison.otherTime && (
                          <span className="ml-2 text-xs text-gray-700 dark:text-gray-400">
                            {comparison.otherTime}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {comparison.isWorkDayMismatch ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-md bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200 shadow-sm">
                          Work/Off Mismatch
                        </span>
                      ) : comparison.isDifferent ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-md bg-yellow-200 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 shadow-sm">
                          Different Shifts
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-md bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200 shadow-sm">
                          Same Shift
                        </span>
                      )}
                      {comparison.startTimeDiffMinutes !== undefined && comparison.endTimeDiffMinutes !== undefined && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                          <span 
                            title="Start time difference in minutes" 
                            className={comparison.startTimeDiffMinutes >= 45 ? 'text-green-700 dark:text-green-400 font-medium' : 'font-medium'}
                          >
                            Start: {comparison.startTimeDiffMinutes}m
                          </span>
                          {' / '}
                          <span 
                            title="End time difference in minutes"
                            className={comparison.endTimeDiffMinutes >= 60 ? 'text-green-700 dark:text-green-400 font-medium' : 'font-medium'}
                          >
                            End: {comparison.endTimeDiffMinutes}m
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Trade summary - simplified */}
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className={`text-md font-medium ${styles.textSecondary} mb-2`}>
              Schedule Summary
            </h4>
            <p className="text-gray-700 dark:text-gray-300 mb-2 text-lg">
              <strong>Work Day Match:</strong> 
              {(() => {
                // Count actual work days in the schedule
                const percent = selectedMirror.userShiftPatternScore || 0;
                
                // Count work days by examining shift comparison
                const totalOnDays = selectedMirror.shiftComparison ? 
                  selectedMirror.shiftComparison.filter(day => day.userShift !== '----').length : 
                  (selectedMirror.sameCategoryCount + selectedMirror.differentCategoryCount + (selectedMirror.workDayMismatchCount || 0));
                
                const matchDays = Math.round(percent * totalOnDays / 100);
                
                return (
                  <span className="ml-2">
                    <span className="font-bold text-blue-600 dark:text-blue-300">
                      {formatPercent(percent)}
                    </span>
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                      ({matchDays} of {totalOnDays})
                    </span>
                  </span>
                );
              })()}
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-2 text-lg">
              <strong>Overall Pattern:</strong> 
              {(() => {
                const percent = selectedMirror.patternScore;
                const totalDays = selectedMirror.sameCategoryCount + selectedMirror.differentCategoryCount + (selectedMirror.workDayMismatchCount || 0);
                const matchDays = Math.round(percent * totalDays / 100);
                
                return (
                  <span className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 px-3 py-1 ml-1 rounded-md font-bold">
                    {formatPercent(percent)} <span className="font-normal">{matchDays} of {totalDays}</span>
                  </span>
                );
              })()}
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-2 text-lg">
              <strong>Shift Differences:</strong> 
              {(() => {
                const percent = selectedMirror.shiftDiffScore;
                const diffCount = selectedMirror.differentCategoryCount;
                const totalCount = selectedMirror.differentCategoryCount + selectedMirror.sameCategoryCount;
                
                return (
                  <span className="bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-100 px-3 py-1 ml-1 rounded-md font-bold">
                    {formatPercent(percent)} <span className="font-normal">{diffCount} of {totalCount}</span>
                  </span>
                );
              })()}
            </p>
            <p className="text-gray-700 dark:text-gray-300 text-lg">
              <strong>Work/Off Mismatches:</strong> 
              <span className="bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-100 px-3 py-1 ml-1 rounded-md font-bold">
                {selectedMirror.workDayMismatchCount || 0} days
              </span>
            </p>
            
            {/* Navigation buttons */}
            <div className="flex justify-between mt-4 pt-3 border-t border-blue-200 dark:border-blue-800">
              <button
                onClick={() => {
                  const currentIndex = sortedResults.findIndex(item => item.line.id === selectedMirror.line.id);
                  const prevIndex = currentIndex > 0 ? currentIndex - 1 : sortedResults.length - 1;
                  setSelectedMirror(sortedResults[prevIndex]);
                }}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded flex items-center text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous Match
              </button>
              <span className="text-xs self-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded">
                {sortedResults.findIndex(item => item.line.id === selectedMirror.line.id) + 1} of {sortedResults.length}
              </span>
              <button
                onClick={() => {
                  const currentIndex = sortedResults.findIndex(item => item.line.id === selectedMirror.line.id);
                  const nextIndex = currentIndex < sortedResults.length - 1 ? currentIndex + 1 : 0;
                  setSelectedMirror(sortedResults[nextIndex]);
                }}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded flex items-center text-sm"
              >
                Next Match
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}