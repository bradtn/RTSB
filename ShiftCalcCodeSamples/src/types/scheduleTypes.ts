// src/types/scheduleTypes.ts

// Shift code information with category and time details
export interface ShiftCodeInfo {
  id: number;
  code: string;
  begin: string;
  end: string;
  display: string;
  category: string;
  length: string;
}

// Basic schedule type with dynamic day fields
export interface Schedule {
  id: number;
  LINE: string;
  GROUP: string;
  BLACKOUT?: string;
  holidays_on?: number;
  holidays_data?: string;
  [key: string]: any; // For DAY_001, DAY_002, etc.
}

// Mirrored line comparison entry
export interface MirrorComparison {
  day: number;
  date?: string;  // Adding actual date field
  userShift: string;
  otherShift: string;
  isDifferent: boolean;
  userTime?: string;
  otherTime?: string;
}

// Mirror score for a matched line
export interface MirrorScore {
  line: Schedule;
  patternScore: number;
  userShiftPatternScore?: number; // Pattern score based on user's total shifts
  shiftDiffScore: number;
  totalScore: number;
  shiftComparison: MirrorComparison[];
  sameCategoryCount: number;
  differentCategoryCount: number;
  sameTimeCount: number;
  differentTimeCount: number;
  // Additional fields that may be present in the API response
  significantDifferenceCount?: number;
  workDayMismatchCount?: number;
  averageTimeDifferenceScore?: number;
  meaningfulTradeScore?: number;
  totalUserWorkDays?: number; // Total number of days where user is working
}

// Response from mirrored line finder
export interface MirroredLinesResponse {
  mirrorScores: MirrorScore[];
  userLine: Schedule | null;
}

// Filtered schedule with match score and details
export interface FilteredSchedule {
  id: number;
  line: string;
  group: string;
  matchScore: number;
  weekendsOn: string;
  saturdaysOn: string;
  sundaysOn: string;
  blocks5day: number;
  blocks4day: number;
  holidays_on?: number;
  holidays_data?: any;
  explanation: string;
}