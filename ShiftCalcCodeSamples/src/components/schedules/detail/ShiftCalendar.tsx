"use client";
import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  MonthCalendar,
  ShiftLegend,
  HolidayDetails,
  PrintShiftTable,
  PrintHeader,
  StatCards
} from './components';
import {
  processScheduleData,
  fetchHolidayData,
  getChartColor
} from './utils';
import type {
  ShiftCalendarProps,
  CalendarData,
  CalculatedStats,
  HolidayData
} from './types';

export default function ShiftCalendar({ schedule, selectedShiftCodes = [], shiftCodes = [] }: ShiftCalendarProps) {
  const { theme } = useTheme();
  
  // State variables
  const [calendarData, setCalendarData] = useState<CalendarData>({
    months: [],
    shiftStats: {
      shiftCounts: {},
      totalShifts: 0,
      totalDaysOff: 0
    }
  });
 
  const [calculatedStats, setCalculatedStats] = useState<CalculatedStats>({
    weekendsOn: 0,
    totalWeekends: 0,
    saturdaysOnly: 0,
    sundaysOnly: 0,
    saturdaysOn: 0,
    sundaysOn: 0,
    blocks5day: 0,
    blocks4day: 0,
    daysShifts: 0,
    afternoonsShifts: 0,
    midDaysShifts: 0,
    lateDaysShifts: 0,
    midnightsShifts: 0
  });

  // State for holiday information
  const [holidayData, setHolidayData] = useState<HolidayData>({
    totalHolidays: 0,
    holidaysWorked: [],
    holidaysOn: 0
  });

  useEffect(() => {
    // Process and organize schedule data
    const { calendarData, calculatedStats } = processScheduleData(schedule, selectedShiftCodes, shiftCodes);
    setCalendarData(calendarData);
    setCalculatedStats(calculatedStats);
    
    // Fetch holiday data
    const getHolidayData = async () => {
      const data = await fetchHolidayData(schedule);
      setHolidayData(data);
    };
    
    getHolidayData();
  }, [schedule, selectedShiftCodes, shiftCodes]);

  // Filtered shift type data (remove zero counts)
  const filteredShiftTypeData = [
    { name: 'Days', value: calculatedStats.daysShifts },
    { name: 'Afternoons', value: calculatedStats.afternoonsShifts },
    { name: 'Mid Days', value: calculatedStats.midDaysShifts },
    { name: 'Late Days', value: calculatedStats.lateDaysShifts },
    { name: 'Midnights', value: calculatedStats.midnightsShifts },
    { name: 'Days Off', value: calendarData.shiftStats.totalDaysOff },
  ].filter(item => item.value > 0); // Only include non-zero values

  return (
    <div className={`
      print:font-sans print:text-black print:bg-white font-system-ui 
      ${theme === "dark" ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" : "bg-gradient-to-br from-white via-gray-50 to-white"}
      print:bg-none
    `}>
      {/* Print-specific header */}
      <PrintHeader scheduleLine={schedule.LINE || "Unknown"} />
      
      {/* Header Section */}
      <div className="mb-8 print:mb-2">
        <div className={`
          p-6 rounded-xl shadow-md 
          ${theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}
          print:p-2 print:rounded-none print:shadow-none print:border print:border-gray-300
        `}>
          <div className="flex justify-between items-center">
            <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} print:text-black`}>
              Schedule Report: Line {schedule.LINE || "Unknown"}
            </h2>
            <div className="flex items-center">
              <span className={`mr-3 font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} print:text-black`}>
                Match Score:
              </span>
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-md
                ${schedule.matchScore >= 85 ? 'bg-emerald-500' :
                  schedule.matchScore >= 70 ? 'bg-green-500' :
                  schedule.matchScore >= 60 ? 'bg-blue-500' :
                  schedule.matchScore >= 50 ? 'bg-yellow-500' :
                  'bg-red-500'}
                print:w-10 print:h-10 print:rounded-none print:bg-white print:text-black print:shadow-none print:border print:border-gray-800
              `}>
                {Math.round(schedule.matchScore || 0)}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Summary Cards */}
      <StatCards 
        theme={theme}
        totalDays={calendarData.shiftStats.totalShifts + calendarData.shiftStats.totalDaysOff}
        workDays={calendarData.shiftStats.totalShifts}
        daysOff={calendarData.shiftStats.totalDaysOff}
        holidaysOn={holidayData.holidaysOn}
      />
      
      {/* Color Legend */}
      <div className="mb-8 print:mb-4">
        <ShiftLegend 
          theme={theme} 
          calculatedStats={calculatedStats} 
          shiftStats={calendarData.shiftStats} 
        />
      </div>
      
      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 print:grid-cols-1 print:gap-2 print:mb-4">
        {/* Pie Chart (screen only) */}
        <div className={`
          p-6 rounded-xl shadow-md
          ${theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}
          print:hidden
        `}>
          <h3 className={`text-lg font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
            Shift Distribution
          </h3>
          <div className="mb-4">
            <table className="w-full">
              <thead>
                <tr>
                  <th className={`text-left font-bold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                    Type
                  </th>
                  <th className={`text-right font-bold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                    Count
                  </th>
                </tr>
              </thead>
              <tbody>
                {calculatedStats.daysShifts > 0 && (
                  <tr>
                    <td className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      Days
                    </td>
                    <td className={`text-right font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {calculatedStats.daysShifts}
                    </td>
                  </tr>
                )}
                {calculatedStats.afternoonsShifts > 0 && (
                  <tr>
                    <td className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      Afternoons
                    </td>
                    <td className={`text-right font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {calculatedStats.afternoonsShifts}
                    </td>
                  </tr>
                )}
                {calculatedStats.midDaysShifts > 0 && (
                  <tr>
                    <td className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      Mid Days
                    </td>
                    <td className={`text-right font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {calculatedStats.midDaysShifts}
                    </td>
                  </tr>
                )}
                {calculatedStats.lateDaysShifts > 0 && (
                  <tr>
                    <td className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      Late Days
                    </td>
                    <td className={`text-right font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {calculatedStats.lateDaysShifts}
                    </td>
                  </tr>
                )}
                {calculatedStats.midnightsShifts > 0 && (
                  <tr>
                    <td className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      Midnights
                    </td>
                    <td className={`text-right font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {calculatedStats.midnightsShifts}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    Days Off
                  </td>
                  <td className={`text-right font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    {calendarData.shiftStats.totalDaysOff}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={filteredShiftTypeData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
                stroke={theme === 'dark' ? '#374151' : '#f3f4f6'}
                strokeWidth={1}
              >
                {filteredShiftTypeData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getChartColor(entry.name, theme)}
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [value, 'Count']} 
                contentStyle={{ 
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                  color: theme === 'dark' ? '#f3f4f6' : '#111827',
                  fontWeight: 'bold',
                  padding: '8px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}
                labelStyle={{
                  fontWeight: 'bold',
                  color: theme === 'dark' ? '#f3f4f6' : '#111827'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Print-friendly Shift Distribution Table */}
        <PrintShiftTable 
          shiftTypeData={filteredShiftTypeData}
          totalShifts={calendarData.shiftStats.totalShifts}
          totalDaysOff={calendarData.shiftStats.totalDaysOff}
        />
        
        {/* Holiday Details Section */}
        <HolidayDetails theme={theme} holidayData={holidayData} />
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 print:grid-cols-1 print:gap-2 print:mb-4">
        {/* Weekend Stats */}
        <div className={`
          p-6 rounded-xl shadow-md
          ${theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}
          print:p-2 print:rounded-none print:shadow-none print:border print:border-gray-300
        `}>
          <h4 className={`text-base font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-800"} print:text-black print:mb-2`}>
            Weekend Patterns
          </h4>
          <div className="space-y-3 print:space-y-1">
            <div className="flex justify-between items-center p-2 rounded shadow-inner print:shadow-none print:p-1 print:border print:border-gray-300">
              <span className={`font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"} print:text-black`}>
                Full Weekends:
              </span>
              <span className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"} print:text-black`}>
                {calculatedStats.weekendsOn} / {calculatedStats.totalWeekends}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 rounded shadow-inner print:shadow-none print:p-1 print:border print:border-gray-300">
              <span className={`font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"} print:text-black`}>
                Only Saturdays:
              </span>
              <span className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"} print:text-black`}>
                {calculatedStats.saturdaysOnly}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 rounded shadow-inner print:shadow-none print:p-1 print:border print:border-gray-300">
              <span className={`font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"} print:text-black`}>
                Only Sundays:
              </span>
              <span className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"} print:text-black`}>
                {calculatedStats.sundaysOnly}
              </span>
            </div>
          </div>
        </div>
        {/* Work Blocks */}
        <div className={`
          p-6 rounded-xl shadow-md
          ${theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}
          print:p-2 print:rounded-none print:shadow-none print:border print:border-gray-300
        `}>
          <h4 className={`text-base font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-800"} print:text-black print:mb-2`}>
            Work Blocks
          </h4>
          <div className="space-y-3 print:space-y-1">
            <div className="flex justify-between items-center p-2 rounded shadow-inner print:shadow-none print:p-1 print:border print:border-gray-300">
              <span className={`font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"} print:text-black`}>
                5-Day Blocks:
              </span>
              <span className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"} print:text-black`}>
                {calculatedStats.blocks5day}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 rounded shadow-inner print:shadow-none print:p-1 print:border print:border-gray-300">
              <span className={`font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"} print:text-black`}>
                4-Day Blocks:
              </span>
              <span className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"} print:text-black`}>
                {calculatedStats.blocks4day}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 rounded shadow-inner print:shadow-none print:p-1 print:border print:border-gray-300">
              <span className={`font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"} print:text-black`}>
                Avg Block:
              </span>
              <span className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"} print:text-black`}>
                {((calculatedStats.blocks5day * 5 + calculatedStats.blocks4day * 4) /
                 (calculatedStats.blocks5day + calculatedStats.blocks4day) || 0).toFixed(1)} days
              </span>
            </div>
          </div>
        </div>
        {/* Shift Compliance */}
        <div className={`
          p-6 rounded-xl shadow-md
          ${theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}
          print:p-2 print:rounded-none print:shadow-none print:border print:border-gray-300
        `}>
          <h4 className={`text-base font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-800"} print:text-black print:mb-2`}>
            Shift Compliance
          </h4>
          <div className="space-y-4 print:space-y-2">
            <div>
              <div className="flex justify-between mb-2 print:mb-1">
                <span className={`font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"} print:text-black`}>
                  Selected Shifts
                </span>
                <span className={`font-bold ${theme === "dark" ? "text-white" : "text-gray-900"} print:text-black`}>
                  {Object.keys(calendarData.shiftStats.shiftCounts).length > 0
                    ? ((selectedShiftCodes.filter(code => 
                        Object.keys(calendarData.shiftStats.shiftCounts).includes(code)
                      ).length / Object.keys(calendarData.shiftStats.shiftCounts).length) * 100).toFixed(0)
                    : 0}%
                </span>
              </div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner print:h-4 print:bg-gray-200 print:shadow-none print:rounded-none">
                <div
                  className="h-4 bg-green-500 rounded-full print:bg-gray-600"
                  style={{
                    width: `${Object.keys(calendarData.shiftStats.shiftCounts).length > 0
                      ? (selectedShiftCodes.filter(code => 
                          Object.keys(calendarData.shiftStats.shiftCounts).includes(code)
                        ).length / Object.keys(calendarData.shiftStats.shiftCounts).length) * 100
                      : 0}%`
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2 print:mb-1">
                <span className={`font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"} print:text-black`}>
                  Weekends Off
                </span>
                <span className={`font-bold ${theme === "dark" ? "text-white" : "text-gray-900"} print:text-black`}>
                  {calculatedStats.totalWeekends > 0
                    ? ((calculatedStats.totalWeekends - calculatedStats.weekendsOn) / calculatedStats.totalWeekends * 100).toFixed(0)
                    : 0}%
                </span>
              </div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner print:h-4 print:bg-gray-200 print:shadow-none print:rounded-none">
                <div
                  className="h-4 bg-blue-500 rounded-full print:bg-gray-600"
                  style={{
                    width: `${calculatedStats.totalWeekends > 0
                      ? ((calculatedStats.totalWeekends - calculatedStats.weekendsOn) / calculatedStats.totalWeekends * 100)
                      : 0}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Calendar Section */}
      <div className="mb-8 print:mb-4">
        <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'} print:text-black print:mb-2`}>
          Monthly Calendar
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-2 print:grid-cols-1 print:gap-4">
          {calendarData.months.map((month, i) => (
            <MonthCalendar 
              key={`month-${i}`} 
              month={month} 
              theme={theme} 
              holidayData={holidayData} 
            />
          ))}
        </div>
      </div>
      
      {/* Print button - hidden in print */}
      <div className="mt-6 text-right print:hidden">
        <button
          onClick={() => window.print()}
          className={`px-6 py-3 rounded-lg text-sm font-medium transition-all shadow-md ${
            theme === 'dark'
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          Print Report
        </button>
      </div>
    </div>
  );
}
