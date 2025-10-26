// src/components/schedules/detail/utils/shiftUtils.ts
// Shift-related utility functions
import { ShiftInfo, ScheduleType } from '../types';

export const DAY_OFF_CODE = "----";

// Updated categorizeShift function that uses the same data as MobileShiftSelector
export function categorizeShift(shiftCode: string, shiftCodes?: ShiftInfo[], schedule?: ScheduleType): string {
  if (!shiftCode || shiftCode === DAY_OFF_CODE) {
    return "OFF";
  }
  
  // 1. First, try to find in the passed shiftCodes array (same as MobileShiftSelector)
  if (shiftCodes && Array.isArray(shiftCodes) && shiftCodes.length > 0) {
    const shiftInfo = shiftCodes.find(s => s.code === shiftCode);
    if (shiftInfo && shiftInfo.category) {
      return shiftInfo.category;
    }
  }
  
  // 2. Then try schedule.shiftCodes if available
  if (schedule?.shiftCodes && Array.isArray(schedule.shiftCodes)) {
    const shiftInfo = schedule.shiftCodes.find(s => s.code === shiftCode);
    if (shiftInfo && shiftInfo.category) {
      return shiftInfo.category;
    }
  }
  
  // 3. Fallback to inference logic
  const code = shiftCode.toUpperCase();
  
  // Extract numerical prefix if present (like "08" from "08FZ")
  const hourPrefix = code.match(/^(\d{2})/);
  const startHour = hourPrefix ? parseInt(hourPrefix[1]) : null;
  
  // Check for explicit indicators in the code
  if (code.includes('DAY') || (code === 'D') || (code === 'DAY')) {
    return "Days";
  } else if (code.includes('AFT') || code.includes('PM') || (code === 'AFTERNOON')) {
    return "Afternoons";
  } else if (code.includes('MID') && !code.includes('NIGHT')) {
    return "Mid Days";
  } else if (code.includes('LATE') || code.includes('LD')) {
    return "Late Days";
  } else if (code.includes('NIGHT') || code.includes('NT') || (code === 'NIGHT')) {
    return "Midnights";
  }
  
  // Try to categorize based on the hour prefix
  if (startHour !== null) {
    if (startHour >= 5 && startHour < 12) {
      return "Days";
    } else if (startHour >= 12 && startHour < 15) {
      return "Mid Days";
    } else if (startHour >= 15 && startHour < 17) {
      return "Late Days";
    } else if (startHour >= 17 && startHour < 22) {
      return "Afternoons";
    } else {
      return "Midnights";
    }
  }
  
  // Check for letter codes as a fallback
  if (code.startsWith('D') || code.includes('DY')) {
    return "Days";
  } else if (code.startsWith('A') || code.includes('AF') || code.includes('AQ')) {
    return "Afternoons";
  } else if (code.startsWith('MD') || code.includes('MD')) {
    return "Mid Days";
  } else if (code.startsWith('L') || code.includes('LD')) {
    return "Late Days";
  } else if (code.startsWith('N') || code.includes('NT')) {
    return "Midnights";
  }
  
  // Default fallback 
  console.log(`Uncategorized shift code: ${shiftCode}`);
  return "Other";
}

// Helper function to extract just the code part (e.g., "14AV" from any format)
export function getShortCode(fullCode: string): string {
  if (!fullCode || fullCode === DAY_OFF_CODE) return "";
  
  // Extract just the alphanumeric part at the beginning of the code
  const match = fullCode.match(/^(\d{1,2}[A-Z]{1,3})/i);
  if (match) return match[1];
  
  return fullCode;
}

// Extract shift time information from the schedule data or code
export function extractShiftTimeFromCode(shiftCode: string, shiftCodes?: ShiftInfo[], schedule?: ScheduleType): string {
  if (!shiftCode || shiftCode === DAY_OFF_CODE) return "";
  
  // 1. Try to get time from shiftCodes array first (same as MobileShiftSelector)
  if (shiftCodes && Array.isArray(shiftCodes)) {
    const shiftInfo = shiftCodes.find(s => s.code === shiftCode);
    if (shiftInfo) {
      if (shiftInfo.startTime && shiftInfo.endTime) {
        return `${shiftInfo.startTime}-${shiftInfo.endTime}`;
      }
      
      // Check for time in display field if available
      if (shiftInfo.display) {
        const displayTimePattern = shiftInfo.display.match(/\((.+?)\)/);
        if (displayTimePattern) {
          return displayTimePattern[1];
        }
      }
    }
  }
  
  // 2. Try to extract time from the code if it contains parentheses
  const timePattern = shiftCode.match(/\((.+?)\)/);
  if (timePattern) {
    return timePattern[1];
  }
  
  // 3. Check if the schedule has shift definitions with this code
  if (schedule?.shiftCodes && Array.isArray(schedule.shiftCodes)) {
    const shiftInfo = schedule.shiftCodes.find(s => 
      s.code === shiftCode || s.code === getShortCode(shiftCode)
    );
    
    if (shiftInfo) {
      if (shiftInfo.startTime && shiftInfo.endTime) {
        return `${shiftInfo.startTime}-${shiftInfo.endTime}`;
      }
      
      // Check for time in display field if available
      if (shiftInfo.display) {
        const displayTimePattern = shiftInfo.display.match(/\((.+?)\)/);
        if (displayTimePattern) {
          return displayTimePattern[1];
        }
      }
    }
  }
  
  // 4. If code starts with numbers that might represent the start time
  const shortCode = getShortCode(shiftCode);
  const startHourMatch = shortCode.match(/^(\d{2})/);
  
  if (startHourMatch) {
    const startHour = parseInt(startHourMatch[1]);
    
    // If it's a 24-hour format start time
    if (startHour >= 0 && startHour <= 23) {
      // Format the time with proper padding
      const formattedStartHour = startHour.toString().padStart(2, '0');
      
      // Basic heuristic: if starts with 14 (like 14AV), it might be 1430-0100
      if (startHour === 14) {
        return "1430-0100";
      }
      
      // Add 30 minutes to most afternoon/evening shifts
      if (startHour >= 12 && startHour < 22) {
        const endHour = (startHour + 8) % 24;
        const formattedEndHour = endHour.toString().padStart(2, '0');
        return `${formattedStartHour}30-${formattedEndHour}30`;
      } else {
        // For morning/overnight shifts
        const endHour = (startHour + 8) % 24;
        const formattedEndHour = endHour.toString().padStart(2, '0');
        return `${formattedStartHour}00-${formattedEndHour}00`;
      }
    }
  }
  
  // Fall back to generic times based on category as last resort
  const category = categorizeShift(shiftCode, shiftCodes, schedule);
  switch(category) {
    case "Days":
      return "0700-1500";
    case "Afternoons":
      return "1500-2300";
    case "Mid Days":
      return "1000-1800";
    case "Late Days":
      return "1300-2100";
    case "Midnights":
      return "2300-0700";
    default:
      return "";
  }
}
