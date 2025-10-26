// src/components/schedules/detail/components/HolidayDetails.tsx
import { HolidayDetailsProps } from '../types';
import { useState } from 'react';

export default function HolidayDetails({ theme, holidayData }: HolidayDetailsProps) {
  const [showAll, setShowAll] = useState(false);
  
  // Show max 3 holidays initially, or all if 3 or less
  const displayLimit = 3;
  const holidays = holidayData.holidaysWorked || [];
  const holidayCount = holidays.length;
  const hasMany = holidayCount > displayLimit;
  const holidaysToShow = showAll || !hasMany 
    ? holidays 
    : holidays.slice(0, displayLimit);
  const remainingCount = holidayCount - displayLimit;

  return (
    <div className={`
      p-6 rounded-xl shadow-md
      ${theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}
      print:p-2 print:rounded-none print:shadow-none print:border print:border-gray-300 print:mb-2
    `}>
      <h3 className={`text-lg font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-800"} print:text-black print:mb-2`}>
        Holiday Schedule
      </h3>
      
      <div className="mb-4 print:mb-2">
        <div className={`flex items-center justify-between p-4 rounded-lg shadow-inner ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"} print:p-2 print:shadow-none print:bg-white print:border print:border-gray-300`}>
          <span className={`font-medium ${theme === "dark" ? "text-gray-200" : "text-gray-700"} print:text-black`}>
            Holidays Worked
          </span>
          <span className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"} print:text-black`}>
            {holidayData.holidaysOn} of {holidayData.totalHolidays}
          </span>
        </div>
      </div>
      
      {holidayData.holidaysOn > 0 && (
        <div>
          {/* Compact grid layout for holidays */}
          <div className={`grid grid-cols-1 gap-2 mb-3`}>
            {holidaysToShow.length > 0 ? (
              holidaysToShow.map((holiday, index) => (
                <div key={index} className={`
                  p-3 rounded-lg flex items-center justify-between
                  ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"}
                  print:p-2 print:bg-white print:border print:border-gray-300
                `}>
                  <div className="flex-1 min-w-0 pr-2">
                    <div className={`font-medium text-sm truncate ${theme === "dark" ? "text-gray-200" : "text-gray-800"} print:text-black print:text-[12px]`}>
                      {holiday.name}
                    </div>
                    <div className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"} print:text-black print:text-[11px]`}>
                      {holiday.formattedDate || holiday.date}
                    </div>
                  </div>
                  <div className={`
                    flex-shrink-0 px-2 py-1 rounded text-xs font-medium
                    ${theme === "dark" ? "bg-rose-600/20 text-rose-300" : "bg-rose-100 text-rose-700"}
                    print:bg-white print:text-black print:border print:border-gray-300
                  `}>
                    {holiday.shiftCode}
                  </div>
                </div>
              ))
            ) : (
              <div className={`p-4 text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"} print:p-2 print:text-black print:text-[12px]`}>
                This schedule includes {holidayData.holidaysOn} statutory holidays (detailed data not available).
              </div>
            )}
          </div>
          
          {/* Show more/less button */}
          {hasMany && (
            <button
              onClick={() => setShowAll(!showAll)}
              className={`
                w-full py-2 text-sm font-medium rounded-lg transition-colors
                ${theme === "dark" 
                  ? "bg-gray-800 hover:bg-gray-700 text-gray-300" 
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"}
                print:hidden
              `}
            >
              {showAll ? (
                <span>Show Less</span>
              ) : (
                <span>Show {remainingCount} More Holiday{remainingCount !== 1 ? 's' : ''}</span>
              )}
            </button>
          )}
        </div>
      )}
      
      {holidayData.holidaysOn === 0 && (
        <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"} print:p-2 print:bg-white print:border print:border-gray-300`}>
          <p className={`text-center text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"} print:text-black print:text-[12px]`}>
            No holidays scheduled
          </p>
        </div>
      )}
    </div>
  );
}
