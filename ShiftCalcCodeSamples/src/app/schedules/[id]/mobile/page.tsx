// src/app/schedules/[id]/mobile/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MobileScheduleDetail() {
  const params = useParams();
  const router = useRouter();
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/schedules/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch schedule');
        }
        const data = await response.json();
        setSchedule(data);
      } catch (err) {
        console.error('Error fetching schedule:', err);
        setError('Could not load schedule details');
      } finally {
        setLoading(false);
      }
    };
    
    if (params.id) {
      fetchSchedule();
    }
  }, [params.id]);
  
  const getScoreColor = (score) => {
    if (score >= 80) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (score >= 65) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    if (score >= 50) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error || !schedule) {
    return (
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-3">Error</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-5">{error || 'Schedule not found'}</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen pb-6">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm mb-4">
        <div className="px-4 py-4 flex items-center">
          <button 
            onClick={() => router.back()}
            className="mr-3 text-gray-600 dark:text-gray-300"
          >
            ←
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Schedule Details</h1>
        </div>
      </header>
      
      <div className="container mx-auto px-4">
        {/* Schedule header card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-4">
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Line {schedule.line}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Group {schedule.group}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(schedule.matchScore)}`}>
                {typeof schedule.matchScore === 'number' ? `${schedule.matchScore.toFixed(1)}%` : 'N/A'}
              </div>
            </div>
            
            <Link
              href={`/comparison?schedules=${schedule.id}`}
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-lg font-medium mt-4"
            >
              Compare This Schedule
            </Link>
          </div>
        </div>
        
        {/* Schedule metrics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            Schedule Metrics
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded">
              <p className="text-xs text-gray-500 dark:text-gray-400">Weekends Working</p>
              <p className="font-medium text-gray-900 dark:text-white">{schedule.weekendsOn}</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded">
              <p className="text-xs text-gray-500 dark:text-gray-400">Saturdays</p>
              <p className="font-medium text-gray-900 dark:text-white">{schedule.saturdaysOn}</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded">
              <p className="text-xs text-gray-500 dark:text-gray-400">Sundays</p>
              <p className="font-medium text-gray-900 dark:text-white">{schedule.sundaysOn}</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded">
              <p className="text-xs text-gray-500 dark:text-gray-400">5-Day Blocks</p>
              <p className="font-medium text-gray-900 dark:text-white">{schedule.blocks5day}</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded">
              <p className="text-xs text-gray-500 dark:text-gray-400">4-Day Blocks</p>
              <p className="font-medium text-gray-900 dark:text-white">{schedule.blocks4day}</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded">
              <p className="text-xs text-gray-500 dark:text-gray-400">Shift Pattern</p>
              <p className="font-medium text-gray-900 dark:text-white">{schedule.shiftMatch || "Varied"}</p>
            </div>
          </div>
        </div>
        
        {/* Score explanation */}
        {schedule.explanation && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Score Explanation
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              {schedule.explanation}
            </p>
          </div>
        )}
        
        {/* Calendar view would go here */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            Schedule Calendar
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Showing the next 28 days:
          </p>
          
          {/* Simplified calendar view for mobile */}
          <div className="space-y-2">
            {/* This would be generated from actual schedule data */}
            {[...Array(28)].map((_, i) => {
              const date = new Date();
              date.setDate(date.getDate() + i);
              const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
              const dayName = dayNames[date.getDay()];
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              const isWorking = Math.random() > 0.4; // Simulated
              const shiftCode = isWorking ? ["AM8", "PM8", "MID8"][Math.floor(Math.random() * 3)] : "OFF";
              
              return (
                <div 
                  key={i}
                  className={`flex items-center p-2 rounded ${
                    isWeekend 
                      ? isWorking ? 'bg-orange-100 dark:bg-orange-900/20' : 'bg-green-100 dark:bg-green-900/20'
                      : isWorking ? 'bg-gray-100 dark:bg-gray-700' : 'bg-green-100 dark:bg-green-900/20'
                  }`}
                >
                  <div className="w-10 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{dayName}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{date.getDate()}</p>
                  </div>
                  <div className="flex-1 ml-3">
                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                      {isWorking ? shiftCode : 'OFF'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isWorking ? '08:00 - 16:00' : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}