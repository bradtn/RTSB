// src/components/schedules/detail/utils/holidayUtils.ts
// Holiday-related utilities
import { ScheduleType, HolidayData } from '../types';

// Fetch total holidays info
export async function fetchHolidayData(schedule: ScheduleType): Promise<HolidayData> {
  try {
    const response = await fetch('/api/holidays/total');
    const data = await response.json();
    
    const defaultData: HolidayData = {
      totalHolidays: 0,
      holidaysWorked: [],
      holidaysOn: 0
    };
    
    if (data && typeof data.total === 'number') {
      // Process holiday data from schedule
      const holidaysOn = schedule.holidays_on || schedule.holidaysOn || 0;
      let holidaysWorked = [];
      
      // Try to parse holidays_data if available
      if (schedule.holidays_data || schedule.holidaysData) {
        try {
          const rawData = schedule.holidays_data || schedule.holidaysData;
          const parsedData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
          
          if (Array.isArray(parsedData)) {
            holidaysWorked = parsedData.map(holiday => {
              // Format the date if needed (avoid timezone issues)
              if (!holiday.formattedDate && holiday.date) {
                try {
                  // Parse date manually to avoid timezone conversion
                  const [year, month, day] = holiday.date.split('-');
                  const monthNames = [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                  ];
                  const formattedDate = `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
                  return { ...holiday, formattedDate };
                } catch (e) {
                  return { ...holiday, formattedDate: holiday.date };
                }
              }
              return holiday;
            });
          }
        } catch (error) {
          console.error("Error parsing holiday data:", error);
        }
      }
      
      return {
        totalHolidays: data.total,
        holidaysWorked,
        holidaysOn
      };
    }
    
    return defaultData;
  } catch (error) {
    console.error("Error fetching total holidays:", error);
    return {
      totalHolidays: 0,
      holidaysWorked: [],
      holidaysOn: 0
    };
  }
}

// Check if a date is a holiday
export function isHoliday(date: Date, holidayData: HolidayData): boolean {
  return holidayData.holidaysWorked.some(holiday => {
    try {
      // Parse holiday date manually to avoid timezone issues
      const [year, month, day] = holiday.date.split('-');
      return parseInt(day) === date.getDate() && 
             (parseInt(month) - 1) === date.getMonth() &&
             parseInt(year) === date.getFullYear();
    } catch (e) {
      return false;
    }
  });
}
