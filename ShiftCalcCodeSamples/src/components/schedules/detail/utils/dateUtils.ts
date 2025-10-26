// src/components/schedules/detail/utils/dateUtils.ts
// Date-related utility functions

// Helper to check if a date is today
export function isToday(date: Date): boolean {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

// Helper to check if a date is in the past
export function isPastDay(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time part to midnight
  return date < today;
}
