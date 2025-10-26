// src/app/schedules/page.tsx
// Updated layout with optimized space for schedules display

"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedLayout from "@/components/layout/ProtectedLayout";
import FilterPanel from "@/components/schedules/FilterPanel";
import ScheduleResults from "@/components/schedules/ScheduleResults";
import { calculateScheduleScore } from "@/lib/scheduler/scoring";

export default function SchedulesPage() {
  const [shiftCodes, setShiftCodes] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterVisible, setFilterVisible] = useState(true);
  const [filterCriteria, setFilterCriteria] = useState({
    selectedGroups: [],
    dayOffDates: [],
    selectedShiftCodes: [],
    selectedShiftCategories: [],
    selectedShiftLengths: [],
    shiftCategoryIntent: 'any', // Default to 'any'
    weights: {
      groupWeight: 1.0,
      daysWeight: 1.0,
      shiftWeight: 1.0,
      blocks5dayWeight: 1.0,
      blocks4dayWeight: 1.0,
      weekendWeight: 1.0,
      saturdayWeight: 1.0,
      sundayWeight: 1.0
    }
  });

  // Natural sort function for line numbers
  const naturalSort = (a, b) => {
    // Convert both to strings to be safe
    a = String(a);
    b = String(b);
    
    // Extract the numeric prefix and any alphabetic suffix
    const aMatch = a.match(/^(\d+)([a-zA-Z]*)$/);
    const bMatch = b.match(/^(\d+)([a-zA-Z]*)$/);
    
    if (!aMatch || !bMatch) {
      // If either doesn't match our expected pattern, fall back to string comparison
      return a.localeCompare(b);
    }
    
    // Compare the numeric parts first
    const aNum = parseInt(aMatch[1], 10);
    const bNum = parseInt(bMatch[1], 10);
    
    if (aNum !== bNum) {
      return aNum - bNum;
    }
    
    // If numbers are equal, compare the alphabetic suffixes
    return (aMatch[2] || '').localeCompare(bMatch[2] || '');
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch shift codes
        const codesRes = await fetch("/api/shift-codes");
        const codes = await codesRes.json();
        setShiftCodes(codes);

        // Fetch schedules
        const schedulesRes = await fetch("/api/schedules");
        const rawSchedules = await schedulesRes.json();
        setSchedules(rawSchedules);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!schedules.length) return;
  
    // Map and filter schedules
    const processed = schedules
      .map(schedule => {
        const result = calculateScheduleScore(schedule, filterCriteria);
        return {
          id: schedule.id,
          line: String(schedule.LINE), // Force string conversion
          group: schedule.GROUP || "Unknown",
          matchScore: result.score,
          weekendsOn: result.weekendsOn,
          saturdaysOn: result.saturdaysOn,
          sundaysOn: result.sundaysOn,
          blocks5day: result.blocks5day,
          blocks4day: result.blocks4day,
          shiftMatch: result.score > 60 ? "High match" : "Low match",
          explanation: result.explanation
        };
      })
      .filter(schedule => schedule.matchScore > 0);
  
    // Sort by score first, then by line within each score group
    const sortedSchedules = [...processed].sort((a, b) => {
      // First sort by score (descending)
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      
      // Then sort by line using natural sort
      return naturalSort(a.line, b.line);
    });
  
    setFilteredSchedules(sortedSchedules);
  }, [schedules, filterCriteria]);

  const handleFilterChange = useCallback((criteria) => {
    setFilterCriteria(criteria);
  }, []);

  // Toggle filter visibility
  const toggleFilter = () => {
    setFilterVisible(!filterVisible);
  };

  return (
    <ProtectedLayout>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Schedule Finder</h1>
        <button 
          onClick={toggleFilter}
          className="bg-blue-600 text-white py-1 px-3 rounded-md text-sm font-medium hover:bg-blue-700"
        >
          {filterVisible ? "Hide Filters" : "Show Filters"}
        </button>
      </div>
      
      <div className="grid grid-cols-12 gap-4">
        {/* Filter Panel - Adjustable width */}
        {filterVisible && (
          <div className="col-span-12 lg:col-span-3 xl:col-span-2">
            <FilterPanel 
              shiftCodes={shiftCodes}
              onFilterChange={handleFilterChange} 
            />
          </div>
        )}
        
        {/* Results Panel - Expands when filter is hidden */}
        <div className={`col-span-12 ${filterVisible ? 'lg:col-span-9 xl:col-span-10' : 'col-span-12'}`}>
          <div className="bg-white p-4 rounded-lg shadow-md dark:bg-gray-800">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Matching Shift Schedules
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                ({filteredSchedules.length} results)
              </span>
            </h2>
            
            <div className="overflow-x-auto">
              <ScheduleResults 
                schedules={filteredSchedules}
                isLoading={loading}
              />
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}