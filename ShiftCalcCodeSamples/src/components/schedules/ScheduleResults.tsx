// src/components/schedules/ScheduleResults.tsx

"use client";



import { useState, useEffect } from "react";

import Link from "next/link";



type Schedule = {

  id: number;

  line: string;

  group: string;

  matchScore: number;

  weekendsOn: string;

  saturdaysOn: string;

  sundaysOn: string;

  blocks5day: number;

  blocks4day: number;

  shiftMatch: string;

  explanation: string;

};



type ScheduleResultsProps = {

  schedules: Schedule[];

  isLoading: boolean;

};



export default function ScheduleResults({ schedules, isLoading }: ScheduleResultsProps) {

  const [sortField, setSortField] = useState<keyof Schedule>("matchScore");

  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");



  // Add custom CSS for table styling

  useEffect(() => {

    const styleEl = document.createElement('style');

    styleEl.textContent = `

      .auto-sizing-table {

        width: 100%;

        border-collapse: collapse;

        table-layout: auto;

      }

      

      .auto-sizing-table th,

      .auto-sizing-table td {

        white-space: nowrap;

        border-right: 1px solid #4B5563;

      }

      

      .auto-sizing-table th:last-child,

      .auto-sizing-table td:last-child {

        border-right: none;

      }

      

      .auto-sizing-table tbody tr {

        border-bottom: 1px solid #4B5563;

      }

      

      .auto-sizing-table .line-column {

        width: 1%;

      }

      

      .auto-sizing-table .group-column {

        width: 1%;

      }

      

      .auto-sizing-table .score-column {

        width: 1%;

      }

      

      .auto-sizing-table .weekends-column,

      .auto-sizing-table .saturdays-column,

      .auto-sizing-table .sundays-column,

      .auto-sizing-table .five-day-column,

      .auto-sizing-table .four-day-column {

        width: 1%;

      }

      

      .auto-sizing-table .explanation-column {

        width: auto;

        min-width: 300px;

        white-space: normal;

      }

      

      .auto-sizing-table .actions-column {

        width: 1%;

        white-space: nowrap;

      }

    `;

    document.head.appendChild(styleEl);

    

    return () => {

      document.head.removeChild(styleEl);

    };

  }, []);



  // Helper function to determine color based on score value

  function getScoreColor(score: number): string {

    // Define color ranges - you can adjust these thresholds as needed

    if (score >= 90) return "text-green-400"; // High match: green

    if (score >= 75) return "text-teal-400";  // Good match: teal

    if (score >= 60) return "text-blue-400";  // Decent match: blue

    if (score >= 40) return "text-yellow-400"; // Moderate match: yellow

    return "text-red-400";                     // Poor match: red

  }



  // Natural sort function for handling alphanumeric strings like "1", "1A", "10", etc.

  function naturalSort(a: string, b: string) {

    // Force both values to strings

    const aStr = String(a);

    const bStr = String(b);

    

    // Extract numeric and alpha parts

    const aMatch = aStr.match(/^(\d+)([a-zA-Z]*)$/);

    const bMatch = bStr.match(/^(\d+)([a-zA-Z]*)$/);

    

    if (!aMatch && !bMatch) return aStr.localeCompare(bStr);

    if (!aMatch) return 1;

    if (!bMatch) return -1;

    

    // Compare numeric parts first

    const aNum = parseInt(aMatch[1], 10);

    const bNum = parseInt(bMatch[1], 10);

    

    if (aNum !== bNum) {

      return aNum - bNum;

    }

    

    // If numbers are equal, compare alpha parts

    return (aMatch[2] || '').localeCompare(bMatch[2] || '');

  }



  // Format line numbers to be consistent (uppercase letters)

  function formatLineNumber(line: string): string {

    // Match number part and letter part

    const match = String(line).match(/^(\d+)([a-zA-Z]*)$/);

    if (match && match[2]) {

      // If there's a letter part, uppercase it

      return `${match[1]}${match[2].toUpperCase()}`;

    }

    // Otherwise return as is

    return String(line);

  }



  if (isLoading) {

    return (

      <div className="flex justify-center items-center h-64">

        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>

      </div>

    );

  }



  if (!schedules.length) {

    return (

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 dark:bg-yellow-900/20 dark:border-yellow-600">

        <div className="flex">

          <div className="flex-shrink-0">

            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">

              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />

            </svg>

          </div>

          <div className="ml-3">

            <p className="text-sm text-yellow-700 dark:text-yellow-200">

              No schedules match your current criteria. Try adjusting your filters.

            </p>

          </div>

        </div>

      </div>

    );

  }



  // Format line numbers to ensure consistency

  const formattedSchedules = schedules.map(schedule => ({

    ...schedule,

    // Create a formatted display line while preserving original for sorting

    displayLine: formatLineNumber(schedule.line)

  }));



  // Sort schedules

  const sortedSchedules = [...formattedSchedules].sort((a, b) => {

    const aValue = a[sortField];

    const bValue = b[sortField];

    

    let comparison = 0;

    

    if (sortField === "line") {

      // Use natural sort for line field

      comparison = naturalSort(String(aValue), String(bValue));

    } else if (typeof aValue === "number" && typeof bValue === "number") {

      // Use numeric comparison for number fields

      comparison = aValue - bValue;

    } else {

      // Use string comparison for other fields

      comparison = String(aValue).localeCompare(String(bValue));

    }

    

    return sortDirection === "asc" ? comparison : -comparison;

  });



  const toggleSort = (field: keyof Schedule) => {

    if (field === sortField) {

      setSortDirection(sortDirection === "asc" ? "desc" : "asc");

    } else {

      setSortField(field);

      setSortDirection("desc");

    }

  };



  const getSortIcon = (field: keyof Schedule) => {

    if (field !== sortField) return null;

    

    return sortDirection === "asc" 

      ? "↑" 

      : "↓";

  };



  return (

    <div className="bg-white rounded-lg shadow-md overflow-hidden dark:bg-gray-800 border border-gray-700">

      <div className="overflow-x-auto">

        <table className="auto-sizing-table">

          <thead>

            <tr className="bg-gray-900 text-white border-b border-gray-600">

              <th 

                className="text-left text-xs font-medium uppercase tracking-wider cursor-pointer px-3 py-3 line-column"

                onClick={() => toggleSort("line")}

              >

                LINE {getSortIcon("line")}

              </th>

              <th 

                className="text-left text-xs font-medium uppercase tracking-wider cursor-pointer px-3 py-3 group-column"

                onClick={() => toggleSort("group")}

              >

                GROUP {getSortIcon("group")}

              </th>

              <th 

                className="text-left text-xs font-medium uppercase tracking-wider cursor-pointer px-3 py-3 score-column"

                onClick={() => toggleSort("matchScore")}

              >

                SCORE {getSortIcon("matchScore")}

              </th>

              <th 

                className="text-left text-xs font-medium uppercase tracking-wider cursor-pointer px-3 py-3 weekends-column"

                onClick={() => toggleSort("weekendsOn")}

              >

                WEEKENDS {getSortIcon("weekendsOn")}

              </th>

              <th 

                className="text-left text-xs font-medium uppercase tracking-wider cursor-pointer px-3 py-3 saturdays-column"

                onClick={() => toggleSort("saturdaysOn")}

              >

                SATURDAYS {getSortIcon("saturdaysOn")}

              </th>

              <th 

                className="text-left text-xs font-medium uppercase tracking-wider cursor-pointer px-3 py-3 sundays-column"

                onClick={() => toggleSort("sundaysOn")}

              >

                SUNDAYS {getSortIcon("sundaysOn")}

              </th>

              <th 

                className="text-left text-xs font-medium uppercase tracking-wider cursor-pointer px-3 py-3 five-day-column"

                onClick={() => toggleSort("blocks5day")}

              >

                5-DAY {getSortIcon("blocks5day")}

              </th>

              <th 

                className="text-left text-xs font-medium uppercase tracking-wider cursor-pointer px-3 py-3 four-day-column"

                onClick={() => toggleSort("blocks4day")}

              >

                4-DAY {getSortIcon("blocks4day")}

              </th>

              <th 

                className="text-left text-xs font-medium uppercase tracking-wider cursor-pointer px-3 py-3 explanation-column"

                onClick={() => toggleSort("explanation")}

              >

                EXPLANATION {getSortIcon("explanation")}

              </th>

              <th className="text-left text-xs font-medium uppercase tracking-wider px-3 py-3 actions-column">

                ACTIONS

              </th>

            </tr>

          </thead>

          <tbody>

            {sortedSchedules.map((schedule, index) => (

              <tr 

                key={schedule.id}

                className={`${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700'} hover:bg-gray-600 transition-colors duration-150`}

              >

                <td className="px-3 py-2 text-sm font-medium text-white">

                  {schedule.displayLine}

                </td>

                <td className="px-3 py-2 text-sm text-gray-300">

                  {schedule.group}

                </td>

                <td className="px-3 py-2 text-sm">

                  <div className="flex items-center">

                    <div 

                      className={`w-2 h-2 rounded-full mr-2 ${

                        schedule.matchScore >= 90 ? "bg-green-500" : 

                        schedule.matchScore >= 75 ? "bg-teal-500" : 

                        schedule.matchScore >= 60 ? "bg-blue-500" : 

                        schedule.matchScore >= 40 ? "bg-yellow-500" : 

                        "bg-red-500"

                      }`} 

                    />

                    <span className={`font-medium ${getScoreColor(schedule.matchScore)}`}>

                      {schedule.matchScore.toFixed(2)}

                    </span>

                  </div>

                </td>

                <td className="px-3 py-2 text-sm text-gray-300">

                  {schedule.weekendsOn}

                </td>

                <td className="px-3 py-2 text-sm text-gray-300">

                  {schedule.saturdaysOn}

                </td>

                <td className="px-3 py-2 text-sm text-gray-300">

                  {schedule.sundaysOn}

                </td>

                <td className="px-3 py-2 text-sm text-gray-300">

                  {schedule.blocks5day}

                </td>

                <td className="px-3 py-2 text-sm text-gray-300">

                  {schedule.blocks4day}

                </td>

                <td className="px-3 py-2 text-sm text-gray-300">

                  {schedule.explanation}

                </td>

                <td className="px-3 py-2 text-sm font-medium">

                  <Link 

                    href={`/schedules/${schedule.id}`}

                    className="text-blue-400 hover:text-blue-300 mr-3"

                  >

                    View

                  </Link>

                  <Link 

                    href={`/comparison?schedules=${schedule.id}`}

                    className="text-green-400 hover:text-green-300"

                  >

                    Compare

                  </Link>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

}