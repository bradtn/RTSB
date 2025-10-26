// src/components/mirrored-lines/MirroredLineSelector.tsx
"use client";

import { useState, useEffect } from "react";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import { Schedule } from "@/types/scheduleTypes";
import useIsMobile from "@/utils/useIsMobile";

interface MirroredLineSelectorProps {
  schedules: Schedule[];
  selectedLineId: number | null;
  onLineSelect: (lineId: number | null) => void;
  isLoading: boolean;
  error: string | null;
}

export default function MirroredLineSelector({
  schedules,
  selectedLineId,
  onLineSelect,
  isLoading,
  error
}: MirroredLineSelectorProps) {
  const styles = useThemeStyles();
  const isMobile = useIsMobile();
  
  // Group schedules by group for better organization
  const [groupedSchedules, setGroupedSchedules] = useState<Record<string, Schedule[]>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  
  // Group schedules when they change
  useEffect(() => {
    // Group schedules by their GROUP property
    const grouped: Record<string, Schedule[]> = {};
    
    for (const schedule of schedules) {
      const group = schedule.GROUP || "Other";
      
      if (!grouped[group]) {
        grouped[group] = [];
      }
      
      grouped[group].push(schedule);
    }
    
    setGroupedSchedules(grouped);
  }, [schedules]);
  
  // Filter schedules based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSchedules([]);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    
    const filtered = schedules.filter(schedule => {
      const line = String(schedule.LINE).toLowerCase();
      const group = String(schedule.GROUP).toLowerCase();
      
      return line.includes(term) || group.includes(term);
    });
    
    setFilteredSchedules(filtered);
  }, [searchTerm, schedules]);
  
  // Handle schedule selection
  const handleSelectSchedule = (scheduleId: number) => {
    onLineSelect(scheduleId);
  };
  
  // If loading, show a spinner
  if (isLoading) {
    return (
      <div className={`${styles.cardBg} rounded-lg p-6 shadow-md`}>
        <div className="flex justify-center py-4">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
        </div>
        <p className="text-center text-gray-500 dark:text-gray-400">Loading available schedules...</p>
      </div>
    );
  }
  
  // If error, show error message with more details and retry button
  if (error) {
    const isDatabaseIssue = error.includes("database") || error.includes("column") || error.includes("day_");
    const isAuthIssue = error.includes("Unauthorized") || error.includes("Authentication") || error.includes("401");
    
    return (
      <div className="bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded">
        <p className="font-bold">Error loading schedules</p>
        <p className="mb-2">{error}</p>
        
        {isDatabaseIssue && (
          <div className="mt-3 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md text-yellow-800 dark:text-yellow-200 text-sm">
            <p className="font-semibold">Possible Database Issue</p>
            <p>It appears there might be an issue with the schedule data in the database:</p>
            <ul className="list-disc list-inside mt-1 ml-2">
              <li>The schedule columns might be missing or have incorrect names</li>
              <li>Day columns (DAY_001, DAY_002, etc.) may not be present</li>
              <li>The selected line might not have the required schedule data</li>
            </ul>
            <p className="mt-2">Please try selecting a different line or contact an administrator if the issue persists.</p>
          </div>
        )}
        
        {isAuthIssue && (
          <div className="mt-3 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md text-yellow-800 dark:text-yellow-200 text-sm">
            <p className="font-semibold">Authentication Issue</p>
            <p>Your session may have expired. Please try the following:</p>
            <ul className="list-disc list-inside mt-1 ml-2">
              <li>Click the button below to reload the page</li>
              <li>If the problem persists, try logging out and logging back in</li>
              <li>Clear your browser cache and cookies if needed</li>
            </ul>
          </div>
        )}
        
        <div className="mt-4 flex gap-2">
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Reload Page
          </button>
          
          <button 
            onClick={() => window.location.href = "/login?callbackUrl=/mirrored-lines"}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Log In Again
          </button>
        </div>
      </div>
    );
  }
  
  // If no schedules, show a message
  if (schedules.length === 0) {
    return (
      <div className={`${styles.cardBg} rounded-lg p-6 shadow-md`}>
        <p className="text-center text-gray-500 dark:text-gray-400">
          No schedules available. Please upload schedules first.
        </p>
      </div>
    );
  }
  
  return (
    <div className={`${styles.cardBg} rounded-lg shadow-md overflow-hidden`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className={`text-lg font-semibold ${styles.textPrimary} mb-4`}>
          Select Your Schedule Line
        </h2>
        
        {/* Search input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <input
            type="search"
            className="block w-full p-2.5 pl-10 text-sm rounded-lg border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search by line number or group..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              onClick={() => setSearchTerm("")}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className={`${isMobile ? 'max-h-[300px]' : 'max-h-[400px]'} overflow-y-auto`}>
        {/* Show filtered results if searching */}
        {searchTerm ? (
          <div className="p-4">
            <h3 className={`text-sm font-medium ${styles.textSecondary} mb-2`}>
              Search Results ({filteredSchedules.length})
            </h3>
            
            {filteredSchedules.length === 0 ? (
              <p className="text-center py-2 text-gray-500 dark:text-gray-400">
                No schedules match your search
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {filteredSchedules.map(schedule => (
                  <button
                    key={schedule.id}
                    onClick={() => handleSelectSchedule(schedule.id)}
                    className={`text-left p-3 rounded-md transition-colors ${
                      selectedLineId === schedule.id
                        ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 border'
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border-transparent border'
                    }`}
                  >
                    <div className="font-medium">Line {schedule.LINE}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Group: {schedule.GROUP}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Show grouped schedules if not searching
          <div>
            {Object.entries(groupedSchedules).map(([group, groupSchedules]) => (
              <div key={group} className="mb-2">
                <div className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <h3 className={`font-medium ${styles.textSecondary}`}>{group}</h3>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {groupSchedules.map(schedule => (
                    <button
                      key={schedule.id}
                      onClick={() => handleSelectSchedule(schedule.id)}
                      className={`text-left p-3 rounded-md transition-colors ${
                        selectedLineId === schedule.id
                          ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 border'
                          : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border-transparent border'
                      }`}
                    >
                      <div className="font-medium">Line {schedule.LINE}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Group: {schedule.GROUP}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}