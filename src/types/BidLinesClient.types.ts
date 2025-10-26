export interface BidLinesClientProps {
  locale: string;
  translations: {
    // Header translations
    appTitle: string;
    navHome: string;
    navAdmin: string;
    navLogin: string;
    navLogout: string;
    // Page translations
    navBidLines: string;
    appDescription: string;
    operationsTitle: string;
    commonAll: string;
    bidLineSearch: string;
    showAvailable: string;
    showFavorites: string;
    commonLive: string;
    noData: string;
    // BidLineCard translations
    favoriteRemoved: string;
    favoriteAdded: string;
    changesError: string;
    lineClaimedSuccess: string;
    lineClaimedError: string;
    bidLineNumber: string;
    bidLineClaim: string;
    // Status translations
    bidLineAvailable: string;
    bidLineTaken: string;
    bidLineBlackedOut: string;
    // Days translations
    daysMon: string;
    daysTue: string;
    daysWed: string;
    daysThu: string;
    daysFri: string;
    daysSat: string;
    daysSun: string;
    // Structured translation groups
    bidLine: {
      expandAll: string;
      collapseAll: string;
      searchLines: string;
      searchPlaceholder: string;
      found: string;
      of: string;
      lines: string;
      noMatches: string;
      operations: string;
      total: string;
    };
    scheduleMetrics: {
      title: string;
      weekendsWorking: string;
      saturdays: string;
      sundays: string;
      fiveDayBlocks: string;
      fourDayBlocks: string;
      holidays: string;
      available: string;
      assigned: string;
      blackedOut: string;
      allStatus: string;
      status: string;
      whatThisMeans: string;
      whyItMatters: string;
      completeScheduleSummary: string;
      close: string;
      weekendsDescription: string;
      saturdaysDescription: string;
      sundaysDescription: string;
      fiveDayBlocksDescription: string;
      fourDayBlocksDescription: string;
      holidaysDescription: string;
      weekendsExplanation: string;
      saturdaysExplanation: string;
      sundaysExplanation: string;
      fiveDayBlocksExplanation: string;
      fourDayBlocksExplanation: string;
      holidaysExplanation: string;
      holidaysWorking: string;
      holidaysOff: string;
      workingShift: string;
      dayOff: string;
    };
    common: {
      save: string;
      clear: string;
    };
    dayOffRequests: {
      title: string;
      description: string;
      selectDates: string;
      notes: string;
      notesPlaceholder: string;
      saving: string;
      saved: string;
      cleared: string;
      error: string;
    };
    dayOffMatch: {
      title: string;
      matchWith: string;
      totalRequested: string;
      daysOffMatch: string;
      conflicts: string;
      conflictingDays: string;
      matchingDays: string;
      conflictDescription: string;
      matchDescription: string;
      allPreserved: string;
      infoNote: string;
      close: string;
    };
    // Filter tooltips
    filterTooltips: {
      anyMode: string;
      anyModeFr: string;
      exactMode: string;
      exactModeFr: string;
    };
  };
}

// Additional types used throughout the component
export interface DayOffMatch {
  hasRequests: boolean;
  matchPercentage: number;
  totalRequestedDays: number;
  matchingDays: string[];
  conflictingDays: string[];
  requestedDays: string[];
  analysis: {
    perfectMatch: boolean;
    partialMatch: boolean;
    hasConflicts: boolean;
    allPreserved: boolean;
    preservedDays: string[];
    conflictDetails: Array<{
      date: string;
      reason: string;
      shiftInfo?: {
        code: string;
        time: string;
      };
    }>;
  };
}

export interface MetricSettings {
  showWeekends: boolean;
  showSaturdays: boolean;
  showSundays: boolean;
  show5DayBlocks: boolean;
  show4DayBlocks: boolean;
  show3DayBlocks: boolean;
  show2DayBlocks: boolean;
  show6DayBlocks: boolean;
  showSingleDays: boolean;
  showHolidays: boolean;
  showTotalSaturdays: boolean;
  showTotalSundays: boolean;
  showTotalDays: boolean;
  showTotalMondays: boolean;
  showTotalTuesdays: boolean;
  showTotalWednesdays: boolean;
  showTotalThursdays: boolean;
  showTotalFridays: boolean;
  showLongestStretch: boolean;
  showFridayWeekendBlocks: boolean;
  showWeekdayBlocks: boolean;
  showOffBlocks2day: boolean;
  showOffBlocks3day: boolean;
  showOffBlocks4day: boolean;
  showOffBlocks5day: boolean;
  showOffBlocks6day: boolean;
  showOffBlocks7dayPlus: boolean;
  showLongestOffStretch: boolean;
  showShortestOffStretch: boolean;
}

export type CategoryFilterMode = 'OR' | 'AND';
export type SortByOption = 'default' | 'lineNumber' | 'status' | 'favorite' | 'dayOffMatch';
export type BidLineStatus = 'all' | 'AVAILABLE' | 'TAKEN' | 'BLACKED_OUT';

export interface Operation {
  id: string;
  name: string;
  nameEn: string;
  nameFr: string;
  isActive: boolean;
  _count: {
    users: number;
    bidLines: number;
  };
}

export interface BidLine {
  id: string;
  operationId: string;
  lineNumber: string;
  shiftStart: string | null;
  shiftEnd: string | null;
  daysOfWeek: string[];
  location?: string | null;
  description?: string | null;
  status: 'AVAILABLE' | 'TAKEN' | 'BLACKED_OUT';
  takenBy?: string | null;
  takenAt?: string | null;
  notes?: string | null;
  isFavorited?: boolean;
  favoriteRank?: number;
  favoriteId?: string;
  operation?: Operation;
  bidPeriod?: {
    id: string;
    startDate: string;
    endDate: string;
    numCycles: number;
  };
  schedule?: {
    id: string;
    lineNumber: string;
    bidPeriod?: {
      numCycles: number;
    };
  };
  scheduleMetrics?: {
    weekendsOn: number;
    saturdaysOn: number;
    sundaysOn: number;
    blocks5day: number;
    blocks4day: number;
    blocks3day: number;
    blocks2day: number;
    blocks6day: number;
    singleDays: number;
    holidaysWorking: number;
    holidaysOff: number;
    shiftPattern: string;
    totalSaturdays: number;
    totalSaturdaysInPeriod: number;
    totalSundays: number;
    totalSundaysInPeriod: number;
    totalDaysWorked: number;
    totalDaysInPeriod: number;
    totalMondays: number;
    totalMondaysInPeriod: number;
    totalTuesdays: number;
    totalTuesdaysInPeriod: number;
    totalWednesdays: number;
    totalWednesdaysInPeriod: number;
    totalThursdays: number;
    totalThursdaysInPeriod: number;
    totalFridays: number;
    totalFridaysInPeriod: number;
    longestStretch: number;
    fridayWeekendBlocks: number;
    weekdayBlocks: number;
    offBlocks2day: number;
    offBlocks3day: number;
    offBlocks4day: number;
    offBlocks5day: number;
    offBlocks6day: number;
    offBlocks7dayPlus: number;
    longestOffStretch: number;
    shortestOffStretch: number;
  };
}

export interface StatusCounts {
  AVAILABLE: number;
  TAKEN: number;
  BLACKED_OUT: number;
  total: number;
}

export interface DashboardData {
  bidLines: BidLine[];
  favorites: BidLine[];
  operations: Operation[];
  statusCounts: StatusCounts;
}