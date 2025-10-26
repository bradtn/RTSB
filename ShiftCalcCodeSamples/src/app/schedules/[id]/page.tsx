"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ProtectedLayout from "@/components/layout/ProtectedLayout";
import ShiftCalendar from "@/components/schedules/detail/ShiftCalendar";
import { useTheme } from "@/contexts/ThemeContext";

export default function ScheduleDetailPage() {
  const { id } = useParams();
  const { theme } = useTheme();
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedShiftCodes, setSelectedShiftCodes] = useState([]);
  const [shiftCodes, setShiftCodes] = useState([]);

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/schedules/${id}`);
        if (!response.ok) throw new Error("Failed to fetch schedule");
        
        const data = await response.json();
        setSchedule(data);
      } catch (error) {
        console.error("Error fetching schedule:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchSchedule();
  }, [id]);

  useEffect(() => {
    const fetchShiftCodes = async () => {
      try {
        const response = await fetch('/api/shift-codes');
        if (!response.ok) throw new Error("Failed to fetch shift codes");
        
        const data = await response.json();
        setShiftCodes(data);
      } catch (error) {
        console.error("Error fetching shift codes:", error);
      }
    };
    
    fetchShiftCodes();
  }, []);

  return (
    <ProtectedLayout>
      <div className="transition-colors duration-200">
        <h1 className={`text-3xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
          Schedule Detail
        </h1>
        
        <div className={`p-6 rounded-lg shadow-md ${theme === 'dark' ? 'bg-gray-800/90' : 'bg-white'}`}>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${theme === 'dark' ? 'border-blue-400' : 'border-blue-500'}`}></div>
            </div>
          ) : schedule ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    Line {schedule.LINE}
                  </h2>
                  <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    Group: {schedule.GROUP || "Unknown"}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button className={`px-4 py-2 rounded-md transition-colors ${
                    theme === 'dark'
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}>
                    Add to Comparison
                  </button>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  Shift Pattern
                </h3>
                <ShiftCalendar 
                  schedule={schedule} 
                  selectedShiftCodes={selectedShiftCodes} 
                  shiftCodes={shiftCodes}
                />
              </div>
            </div>
          ) : (
            <div className={`p-4 rounded-lg ${
              theme === 'dark'
                ? 'bg-yellow-900/20 border-l-4 border-yellow-600'
                : 'bg-yellow-50 border-l-4 border-yellow-400'
            }`}>
              <p className={theme === 'dark' ? 'text-yellow-200' : 'text-yellow-800'}>
                Schedule not found
              </p>
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}