// src/app/comparison/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ProtectedLayout from "@/components/layout/ProtectedLayout";
import ComparisonTable from "@/components/comparison/ComparisonTable";

export default function ComparisonPage() {
  const searchParams = useSearchParams();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchSchedules = async () => {
      setLoading(true);
      setError(null);
      
      // Get schedule IDs from URL
      const schedulesParam = searchParams?.get("schedules") || "";
      const scheduleIds = schedulesParam.split(",").filter(id => id.trim());
      
      if (scheduleIds.length === 0) {
        setSchedules([]);
        setLoading(false);
        return;
      }
      
      try {
        // Get stored criteria from localStorage
        let criteria = null;
        try {
          const storedCriteria = localStorage.getItem('scheduleCriteria');
          if (storedCriteria) {
            criteria = JSON.parse(storedCriteria);
          }
        } catch (e) {
          console.error("Error parsing stored criteria:", e);
        }
        
        // Construct API URL with IDs
        const apiUrl = `/api/schedules/details?ids=${scheduleIds.join(',')}`;
        
        // Add criteria to request if available
        const options = criteria ? {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ criteria })
        } : {};
        
        const response = await fetch(apiUrl, options.method ? options : undefined);
        
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
          throw new Error("API did not return an array of schedules");
        }
        
        // Process the schedules to ensure consistent format
        const processedData = data.map(schedule => ({
          id: schedule.id,
          line: schedule.line || String(schedule.id),
          group: schedule.group || "Unknown",
          matchScore: typeof schedule.matchScore === 'number' ? schedule.matchScore : 0,
          weekendsOn: schedule.weekendsOn || "0 of 0",
          saturdaysOn: schedule.saturdaysOn || "0 of 0",
          sundaysOn: schedule.sundaysOn || "0 of 0",
          blocks5day: typeof schedule.blocks5day === 'number' ? schedule.blocks5day : 0,
          blocks4day: typeof schedule.blocks4day === 'number' ? schedule.blocks4day : 0,
          explanation: schedule.explanation || `No explanation available`
        }));
        
        setSchedules(processedData);
      } catch (error) {
        console.error("Error fetching schedules:", error);
        setError(error.message || "Failed to load schedules");
        
        // Use fallback data
        const fallbackData = scheduleIds.map(id => ({
          id: parseInt(id, 10),
          line: id,
          group: "Group A",
          matchScore: 75,
          weekendsOn: "2 of 8",
          saturdaysOn: "1 of 5",
          sundaysOn: "1 of 4",
          blocks5day: 4,
          blocks4day: 3,
          explanation: `This is schedule line ${id}`
        }));
        
        setSchedules(fallbackData);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSchedules();
  }, [searchParams]);
  
  return (
    <ProtectedLayout>
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">
        Schedule Comparison
      </h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 dark:bg-red-900/20 dark:border-red-600">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-200">
                  {error}
                </p>
                <div className="mt-2">
                  <Link 
                    href="/schedules" 
                    className="inline-flex items-center text-sm font-medium text-red-700 dark:text-red-200 hover:text-red-600 dark:hover:text-red-100"
                  >
                    Return to Schedule Finder
                    <svg className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : schedules.length > 0 ? (
          <ComparisonTable schedules={schedules} />
        ) : (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 dark:bg-yellow-900/20 dark:border-yellow-600">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 dark:text-yellow-200">
                  No schedules selected for comparison. Please select schedules from the schedule finder.
                </p>
                <div className="mt-2">
                  <Link 
                    href="/schedules" 
                    className="inline-flex items-center text-sm font-medium text-yellow-700 dark:text-yellow-200 hover:text-yellow-600 dark:hover:text-yellow-100"
                  >
                    Go to Schedule Finder
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}