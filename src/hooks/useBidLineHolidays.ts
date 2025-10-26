import { useState, useEffect } from 'react';
import { getHolidaysForPeriod, HolidayFilters } from '@/utils/holidays';

interface BidPeriod {
  id: string;
  name: string;
  numCycles: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ScheduleShift {
  dayNumber: number;
  shiftCode?: {
    code: string;
    beginTime: string;
    endTime: string;
    category: string;
    hoursLength: number;
  };
}

interface HolidayData {
  holidaysWorking: number;
  holidaysOff: number;
  totalHolidays: number;
}

/**
 * Custom hook for calculating holiday metrics for a bid line
 */
export const useBidLineHolidays = (
  bidPeriod?: BidPeriod,
  scheduleShifts?: ScheduleShift[]
) => {
  const [holidayData, setHolidayData] = useState<HolidayData>({ 
    holidaysWorking: 0, 
    holidaysOff: 0,
    totalHolidays: 0 
  });
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchHolidays = async () => {
      if (!bidPeriod?.startDate || !bidPeriod?.endDate) return;

      setIsLoading(true);
      try {
        const start = new Date(bidPeriod.startDate);
        const end = new Date(bidPeriod.endDate);
        const holidays = await getHolidaysForPeriod(start, end, HolidayFilters.NO_OBSCURE);
        
        let holidaysWorking = 0;
        
        if (scheduleShifts && scheduleShifts.length > 0) {
          // Use actual schedule data
          const numCycles = bidPeriod?.numCycles || 1;
          const cycleDays = 56; // Standard cycle length
          
          holidays.forEach(holiday => {
            // Calculate which day in the overall schedule this holiday falls on
            const daysSinceStart = Math.floor((holiday.date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            
            // Find which cycle we're in (0-indexed)
            const cycleNumber = Math.floor(daysSinceStart / cycleDays);
            
            // Find day within the current cycle (1-56)
            const dayInCycle = (daysSinceStart % cycleDays) + 1;
            
            // Look for the shift on this day of the cycle
            const shift = scheduleShifts.find(s => s.dayNumber === dayInCycle);
            if (shift?.shiftCode) {
              holidaysWorking++;
            }
          });
        } else {
          // Fallback estimation for schedules without detailed shift data
          holidays.forEach(holiday => {
            const dayOfWeek = holiday.date.getDay();
            // Assume working on weekdays only
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
              holidaysWorking++;
            }
          });
          // Apply conservative estimation factor
          holidaysWorking = Math.floor(holidaysWorking * 0.6);
        }
        
        const totalHolidays = holidays.length;
        setHolidayData({
          holidaysWorking,
          holidaysOff: totalHolidays - holidaysWorking,
          totalHolidays
        });
      } catch (error) {
        console.error('Failed to fetch holidays:', error);
        setHolidayData({ holidaysWorking: 0, holidaysOff: 0, totalHolidays: 0 });
      } finally {
        setIsLoading(false);
      }
    };

    fetchHolidays();
  }, [bidPeriod?.startDate, bidPeriod?.endDate, scheduleShifts]);

  return {
    holidayData,
    isLoading,
  };
};