// src/components/schedules/detail/components/ShiftLegend.tsx
import { getShiftTypeColor } from '../utils/colorUtils';
import { ShiftLegendProps } from '../types';

export default function ShiftLegend({ theme, calculatedStats, shiftStats }: ShiftLegendProps) {
  // All possible shift types to show in the legend
  const shiftTypes = [
    { name: 'Days', value: calculatedStats.daysShifts },
    { name: 'Afternoons', value: calculatedStats.afternoonsShifts },
    { name: 'Mid Days', value: calculatedStats.midDaysShifts },
    { name: 'Late Days', value: calculatedStats.lateDaysShifts },
    { name: 'Midnights', value: calculatedStats.midnightsShifts },
    { name: 'Days Off', value: shiftStats.totalDaysOff },
    { name: 'Selected', displayName: 'Selected Shifts', value: 0 }, // Always show this one
    { name: 'Holidays', value: 0 } // Will be populated later
  ].filter(item => item.value > 0 || item.name === 'Selected');

  return (
    <div className={`
      p-6 rounded-xl shadow-md
      ${theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}
      print:p-2 print:rounded-none print:shadow-none print:border print:border-gray-300 print:mb-2
    `}>
      <h3 className={`text-lg font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-800"} print:text-black print:mb-2`}>Color Legend</h3>
      
      {/* Screen version */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:hidden">
        {shiftTypes.map((type, index) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div 
              className={`w-6 h-6 rounded-lg shadow-inner ${getShiftTypeColor(type.name, theme)}`}
            />
            <span className={`text-sm font-medium ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
              {type.displayName || type.name}
            </span>
          </div>
        ))}
      </div>
      
      {/* Print version */}
      <div className="hidden print:grid print:grid-cols-2 print:gap-1">
        {shiftTypes.map((type, index) => (
          <div key={`print-legend-${index}`} className="flex items-center gap-1">
            <div className={`w-4 h-4 border border-gray-300 print:bg-white`}>
              {type.name !== 'Days Off' && (
                <div className="w-full h-full flex items-center justify-center font-bold text-[8px]">
                  X
                </div>
              )}
            </div>
            <span className="text-[12px] font-medium text-black">
              {type.displayName || type.name}
            </span>
          </div>
        ))}
      </div>
      
      {/* Screen version extras */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-4 rounded-lg ${theme === "dark" ? "border-gray-700" : "border-gray-200"} ring-1 ring-blue-500`} />
          <span className={`text-sm font-medium ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
            Weekend Days
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-4 rounded-lg ${theme === "dark" ? "border-gray-700" : "border-gray-200"} ring-1 ring-rose-500`} />
          <span className={`text-sm font-medium ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
            Statutory Holidays
          </span>
        </div>
      </div>
      
      {/* Print version extras */}
      <div className="hidden print:grid print:grid-cols-2 print:gap-1 print:mt-2">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 border-2 border-gray-500 print:bg-white"></div>
          <span className="text-[12px] font-medium text-black">
            Weekend Days
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 border-2 border-gray-500 border-dotted print:bg-white"></div>
          <span className="text-[12px] font-medium text-black">
            Statutory Holidays
          </span>
        </div>
      </div>
      
      {/* Screen version indicators */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <div className="relative w-6 h-6 rounded-lg border border-gray-300 dark:border-gray-700">
            <span className="absolute text-[10px] font-bold top-1 left-1 ring-2 ring-blue-400 rounded-full p-0.5 text-gray-700 dark:text-gray-300">1</span>
          </div>
          <span className={`text-sm font-medium ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
            Today's Date
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-6 h-6 rounded-lg border border-gray-300 dark:border-gray-700 after:absolute after:inset-0 after:bg-white after:bg-opacity-40 after:dark:bg-black after:dark:bg-opacity-40"></div>
          <span className={`text-sm font-medium ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
            Past Days
          </span>
        </div>
      </div>
    </div>
  );
}
