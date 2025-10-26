// src/utils/formatScheduleDate.ts
import { format, parseISO } from 'date-fns';

/**
 * Formats a date string from a schedule for display, adjusting for timezone issues
 * This ensures consistent date display across the application
 * 
 * @param dateString The ISO date string to format
 * @param formatStr The date-fns format string to use (default: 'MMMM d' for desktop)
 * @returns Formatted date string
 */
export function formatScheduleDate(dateString: string, formatStr: string = 'MMMM d'): string {
  if (!dateString) return '';
  
  try {
    // Parse the ISO string
    const date = parseISO(dateString);
    
    // Format with the provided format string without adjustment
    // The date is already correct (2025-04-24)
    return format(date, formatStr);
  } catch (e) {
    console.error("Error formatting date:", e);
    return dateString; // Return original if parsing fails
  }
}

export default formatScheduleDate;