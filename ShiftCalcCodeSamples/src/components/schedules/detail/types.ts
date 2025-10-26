// src/components/schedules/detail/types.ts
// Common types used across shift calendar components

export type ShiftInfo = {
  code: string;
  category?: string;
  length?: string;
  startTime?: string;
  endTime?: string;
  display?: string;
};

export type ScheduleType = {
  id: string;
  LINE?: string;
  GROUP?: string;
  holidays_on?: number;
  holidaysOn?: number;
  holidays_data?: any;
  holidaysData?: any;
  matchScore?: number;
  shiftCodes?: ShiftInfo[];
  [key: string]: any; // For DAY_* properties and others
};

export type DayInfo = {
  type: 'day' | 'padding';
  date?: Date;
  dayOfMonth?: number;
  dayOfWeek?: number;
  isWeekend?: boolean;
  shiftCode?: string;
  shortCode?: string;
  shiftTime?: string;
  isSelected?: boolean;
  isDayOff?: boolean;
  isInSchedule?: boolean;
  category?: string;
  isPast?: boolean;
  isToday?: boolean;
};

export type MonthInfo = {
  name: string;
  days: DayInfo[];
};

export type ShiftStats = {
  shiftCounts: Record<string, number>;
  totalShifts: number;
  totalDaysOff: number;
};

export type CalendarData = {
  months: MonthInfo[];
  shiftStats: ShiftStats;
};

export type CalculatedStats = {
  weekendsOn: number;
  totalWeekends: number;
  saturdaysOnly: number;
  sundaysOnly: number;
  saturdaysOn: number;
  sundaysOn: number;
  blocks5day: number;
  blocks4day: number;
  daysShifts: number;
  afternoonsShifts: number;
  midDaysShifts: number;
  lateDaysShifts: number;
  midnightsShifts: number;
};

export type HolidayData = {
  totalHolidays: number;
  holidaysWorked: Array<{
    name: string;
    date: string;
    formattedDate?: string;
    shiftCode?: string;
  }>;
  holidaysOn: number;
};

export type ShiftCalendarProps = {
  schedule: ScheduleType;
  selectedShiftCodes: string[];
  shiftCodes?: ShiftInfo[];
};

export type MonthCalendarProps = {
  month: MonthInfo;
  theme: string;
  holidayData: HolidayData;
};

export type ShiftLegendProps = {
  theme: string;
  calculatedStats: CalculatedStats;
  shiftStats: ShiftStats;
};

export type HolidayDetailsProps = {
  theme: string;
  holidayData: HolidayData;
};

export type PrintShiftTableProps = {
  shiftTypeData: Array<{name: string, value: number}>;
  totalShifts: number;
  totalDaysOff: number;
};

export type PrintHeaderProps = {
  scheduleLine: string;
};

export type StatCardsProps = {
  theme: string;
  totalDays: number;
  workDays: number;
  daysOff: number;
  holidaysOn: number;
};
