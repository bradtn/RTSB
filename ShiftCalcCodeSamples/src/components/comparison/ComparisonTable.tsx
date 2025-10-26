// src/components/comparison/ComparisonTable.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ComparisonTable({ schedules = [] }) {
  const router = useRouter();
  const [availableSchedules, setAvailableSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [processedSchedules, setProcessedSchedules] = useState([]);

  // Process and fix any invalid data
  useEffect(() => {
    // Add safety check for schedules
    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      setProcessedSchedules([]);
      return;
    }

    try {
      const fixedSchedules = schedules.map(schedule => {
        // Make sure schedule is an object before operating on it
        if (!schedule || typeof schedule !== 'object') {
          return {};
        }

        const result = { ...schedule };
        
        // Fix invalid match scores (like -1200%)
        if (result.matchScore < 0 || result.matchScore > 100) {
          result.matchScore = 0;
        }
        
        // Fix weekends/saturdays/sundays that use line number as count
        const fixDayCount = (field, maxCount) => {
          if (result[field] && typeof result[field] === 'string') {
            try {
              const parts = result[field].split(" of ");
              if (parts.length === 2) {
                const count = parseInt(parts[0]);
                const total = parseInt(parts[1]);
                // Check if count is unrealistically large or matches line number
                if (count > maxCount || count.toString() === result.line) {
                  result[field] = `0 of ${total}`;
                }
              }
            } catch (e) {
              // In case of any error, just leave the field as is
              console.error(`Error processing ${field}:`, e);
            }
          }
        };
        
        fixDayCount('weekendsOn', 24);
        fixDayCount('saturdaysOn', 12);
        fixDayCount('sundaysOn', 12);
        
        // Fix block counts that are unrealistically large
        if (result.blocks5day > 52 || (result.line && result.blocks5day?.toString() === result.line)) {
          result.blocks5day = 0;
        }
        
        if (result.blocks4day > 52 || (result.line && result.blocks4day?.toString() === result.line)) {
          result.blocks4day = 0;
        }
        
        return result;
      });
      
      setProcessedSchedules(fixedSchedules);
    } catch (error) {
      console.error("Error processing schedules:", error);
      setProcessedSchedules([]);
    }
  }, [schedules]);

  // Fetch available schedules for comparison
  useEffect(() => {
    const fetchAvailableSchedules = async () => {
      try {
        const response = await fetch('/api/schedules');
        if (!response.ok) throw new Error('Failed to fetch schedules');
        const data = await response.json();
        
        // Filter out already selected schedules
        const currentIds = Array.isArray(schedules) ? schedules.map(s => s.id) : [];
        const filtered = data.filter(s => !currentIds.includes(s.id));
        setAvailableSchedules(filtered);
      } catch (error) {
        console.error('Error fetching available schedules:', error);
        setAvailableSchedules([]);
      }
    };

    fetchAvailableSchedules();
  }, [schedules]);

  // Add selected schedule to comparison
  const addToComparison = async () => {
    if (!selectedSchedule) return;
    setIsLoading(true);
    
    try {
      // Get current IDs from existing schedules and add the new one
      const currentIds = Array.isArray(schedules) ? schedules.map(s => s.id) : [];
      const newIds = [...currentIds, selectedSchedule.id];
      
      // Navigate to updated URL with all schedule IDs
      router.push(`/comparison?schedules=${newIds.join(',')}`);
    } catch (error) {
      console.error("Error adding schedule to comparison:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Remove a schedule from comparison
  const removeSchedule = (id) => {
    if (!Array.isArray(schedules)) return;
    
    const updatedSchedules = schedules.filter(s => s.id !== id);
    const updatedIds = updatedSchedules.map(s => s.id).join(',');
    
    if (updatedIds) {
      router.push(`/comparison?schedules=${updatedIds}`);
    } else {
      router.push('/schedules');
    }
  };

  // Get color based on score
  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 65) return "text-blue-600 dark:text-blue-400";
    if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="space-y-8">
      {/* Add another schedule dropdown */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded px-3 py-2 border border-gray-300 dark:border-gray-600"
          value={selectedSchedule?.id || ""}
          onChange={(e) => {
            const id = e.target.value;
            if (!id) {
              setSelectedSchedule(null);
              return;
            }
            
            const schedule = availableSchedules.find(s => 
              s.id === parseInt(id) || s.id === id
            );
            setSelectedSchedule(schedule || null);
          }}
        >
          <option value="">Select schedule to compare...</option>
          {availableSchedules.map(schedule => (
            <option key={schedule.id} value={schedule.id}>
              Line {schedule.LINE || schedule.line} - Group {schedule.GROUP || schedule.group || "Unknown"}
            </option>
          ))}
        </select>
        
        <button
          onClick={addToComparison}
          disabled={!selectedSchedule || isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {isLoading ? 'Adding...' : 'Add to Comparison'}
        </button>
      </div>
      
      {/* Selected Schedules Pills */}
      {processedSchedules.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
            Selected:
          </div>
          {processedSchedules.map(schedule => (
            <div 
              key={`pill-${schedule.id}`} 
              className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full flex items-center text-sm"
            >
              Line {schedule.line} ({schedule.group})
              <button
                onClick={() => removeSchedule(schedule.id)}
                className="ml-2 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Metrics table */}
      {processedSchedules.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Metric</th>
                {processedSchedules.map(schedule => (
                  <th key={schedule.id} className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Line {schedule.line} ({schedule.group})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {/* Match Score */}
              <tr>
                <td className="px-6 py-3 font-medium">Match Score</td>
                {processedSchedules.map(schedule => (
                  <td key={`score-${schedule.id}`} className={`px-6 py-3 ${getScoreColor(schedule.matchScore)}`}>
                    {typeof schedule.matchScore === 'number' ? `${schedule.matchScore.toFixed(1)}%` : 'N/A'}
                  </td>
                ))}
              </tr>
              
              {/* Weekends On */}
              <tr className="bg-gray-50 dark:bg-gray-700">
                <td className="px-6 py-3 font-medium">Weekends On</td>
                {processedSchedules.map(schedule => (
                  <td key={`weekends-${schedule.id}`} className="px-6 py-3">
                    {schedule.weekendsOn || 'N/A'}
                  </td>
                ))}
              </tr>
              
              {/* Saturdays On */}
              <tr>
                <td className="px-6 py-3 font-medium">Saturdays On</td>
                {processedSchedules.map(schedule => (
                  <td key={`saturdays-${schedule.id}`} className="px-6 py-3">
                    {schedule.saturdaysOn || 'N/A'}
                  </td>
                ))}
              </tr>
              
              {/* Sundays On */}
              <tr className="bg-gray-50 dark:bg-gray-700">
                <td className="px-6 py-3 font-medium">Sundays On</td>
                {processedSchedules.map(schedule => (
                  <td key={`sundays-${schedule.id}`} className="px-6 py-3">
                    {schedule.sundaysOn || 'N/A'}
                  </td>
                ))}
              </tr>
              
              {/* 5-Day Blocks */}
              <tr>
                <td className="px-6 py-3 font-medium">5-Day Blocks</td>
                {processedSchedules.map(schedule => (
                  <td key={`blocks5-${schedule.id}`} className="px-6 py-3">
                    {schedule.blocks5day !== undefined ? schedule.blocks5day : 'N/A'}
                  </td>
                ))}
              </tr>
              
              {/* 4-Day Blocks */}
              <tr className="bg-gray-50 dark:bg-gray-700">
                <td className="px-6 py-3 font-medium">4-Day Blocks</td>
                {processedSchedules.map(schedule => (
                  <td key={`blocks4-${schedule.id}`} className="px-6 py-3">
                    {schedule.blocks4day !== undefined ? schedule.blocks4day : 'N/A'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 text-yellow-800 dark:text-yellow-200">
          No schedules selected for comparison. Please select at least one schedule.
        </div>
      )}
      
      {/* Explanations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {processedSchedules.map(schedule => schedule.explanation && (
          <div key={`explain-${schedule.id}`} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">
              Line {schedule.line} Score Explanation
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              {schedule.explanation}
            </p>
            <div className="mt-4">
              <Link
                href={`/schedules/${schedule.id}`}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                View Full Details →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}