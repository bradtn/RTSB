// src/components/schedules/detail/components/MonthCalendar.tsx
import { isHoliday } from '../utils/holidayUtils';
import { getShiftTypeColor } from '../utils/colorUtils';
import { MonthCalendarProps } from '../types';

export default function MonthCalendar({ month, theme, holidayData }: MonthCalendarProps) {
  return (
    <div className={`
      p-6 rounded-xl shadow-md 
      ${theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}
      print:p-2 print:rounded-none print:shadow-none print:border print:border-gray-300 print:mb-2
    `}>
      <h3 className={`text-center text-lg font-semibold mb-4 font-system-ui ${theme === "dark" ? "text-white" : "text-gray-800"} print:text-black print:mb-2`}>
        {month.name}
      </h3>
      
      {/* Weekday header with tinted backgrounds */}
      <div className="grid grid-cols-7 text-xs font-medium uppercase tracking-wide mb-2 print:mb-1">
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => (
          <div
            key={i}
            className={`
              py-1 text-center
              ${i < 5 
                ? theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100' 
                : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
              }
              ${i >= 5 
                ? (theme === "dark" ? "text-blue-300" : "text-blue-600") 
                : (theme === "dark" ? "text-gray-400" : "text-gray-600")}
              print:py-0.5 print:bg-white print:text-black print:font-bold print:text-[12px]
            `}
          >
            {d}
          </div>
        ))}
      </div>
      
      {/* Days grid with spacing, alternating row colors, and neumorphic inset */}
      <div className="grid grid-cols-7 gap-2 print:gap-0.5">
        {month.days.map((day, i) => {
          if (day.type === 'padding') {
            return <div key={i} className="aspect-square bg-transparent" />;
          }
          
          // Check if this day is a holiday
          const isHolidayDay = day.date ? isHoliday(day.date, holidayData) : false;
          
          // Get which week this day is in for zebra striping
          const weekIndex = Math.floor(i / 7);
          
          // Determine background color based on category and zebra striping
          const getShiftBgClass = () => {
            if (!day.isInSchedule) {
              return (weekIndex % 2 === 0) 
                ? theme === "dark" ? "bg-gray-900" : "bg-gray-50" 
                : theme === "dark" ? "bg-gray-850" : "bg-white";
            }
            
            if (day.isDayOff) {
              return getShiftTypeColor('Days Off', theme);
            }
            
            if (day.isSelected) {
              return getShiftTypeColor('Selected', theme);
            }
            
            return getShiftTypeColor(day.category || '', theme);
          };
          
          return (
            <div
              key={i}
              className={`
                aspect-square relative flex items-center justify-center
                ${getShiftBgClass()}
                ${theme === "dark" ? "border-gray-700" : "border-gray-200"} 
                border 
                ${day.isInSchedule && !day.isDayOff ? "shadow-inner" : ""}
                ${day.isWeekend ? (theme === "dark" ? "ring-1 ring-blue-500" : "ring-1 ring-blue-500") : ""}
                ${isHolidayDay ? (theme === "dark" ? "ring-1 ring-rose-500" : "ring-1 ring-rose-500") : ""}
                ${!day.isInSchedule ? "opacity-50" : ""}
                ${day.isPast ? "after:absolute after:inset-0 after:bg-white after:bg-opacity-40 after:dark:bg-black after:dark:bg-opacity-40 after:pointer-events-none" : ""}
                hover:ring-2 hover:ring-offset-1 hover:ring-blue-400 transition-all
                rounded-lg
                print:aspect-auto print:min-h-[40px] print:border print:border-gray-300 print:rounded-none print:shadow-none print:ring-0 print:hover:ring-0 print:hover:ring-offset-0 print:after:hidden
                ${day.isWeekend ? "print:border-2 print:border-gray-500" : ""}
                ${isHolidayDay ? "print:border-2 print:border-gray-500 print:border-dotted" : ""}
                print:bg-white
              `}
              title={day.isDayOff ? "Day Off" : `${day.shiftCode} (${day.shiftTime})`}
            >
              <span className={`
                absolute top-1 left-1 
                font-light text-[10px]
                ${day.isToday ? "ring-2 ring-blue-400 rounded-full p-0.5 font-bold" : ""}
                ${day.isInSchedule 
                  ? (day.isDayOff ? (theme === "dark" ? "text-white" : "text-gray-700") : "text-white") 
                  : (theme === "dark" ? "text-gray-400" : "text-gray-500")}
                print:text-[12px] print:font-medium print:text-black print:relative print:top-0 print:left-0 print:ring-0 print:p-0
              `}>
                {day.dayOfMonth}
              </span>
              
              {/* Holiday indicator */}
              {isHolidayDay && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 print:hidden"></span>
              )}
              
              {/* Shift code and time */}
              {day.isInSchedule && !day.isDayOff && (
                <div className="flex flex-col items-center justify-center text-center leading-snug print:mt-1">
                  <span className="text-[11px] font-semibold tracking-wide text-white print:text-black print:text-[12px]">
                    {day.shortCode}
                  </span>
                  
                  {day.shiftTime && (
                    <span className="text-[9px] mt-0.5 text-white font-medium print:text-black print:text-[11px]">
                      {day.shiftTime}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
