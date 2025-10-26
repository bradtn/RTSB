// src/contexts/filter/constants.js
// Default values extracted from FilterContext

// Debug toggle - set to false to disable verbose logging
export const DEBUG_MODE = false;

// Default values
export const DEFAULT_CRITERIA = {
  selectedGroups: [],
  dayOffDates: [],
  selectedShiftCodes: [],
  selectedShiftCategories: [],
  selectedShiftLengths: [],
  shiftCategoryIntent: 'any', // 'any' = flexible (show lines with ANY selected categories), 'mix' = variety (show lines with MIX of selected categories)
  province: null, // Added for holiday support
  weights: {
    groupWeight: 1,
    daysWeight: 1,
    shiftWeight: 1,
    blocks5dayWeight: 0,
    blocks4dayWeight: 0,
    weekendWeight: 1,
    saturdayWeight: 1,
    sundayWeight: 1
  }
};

export const DEFAULT_SUB_MODES = {
  groupSelector: { viewMode: "selection" },
  dateSelector: { showWeightView: false },
  shiftSelector: { 
    mode: "main", 
    filterChoice: "",
    screen: "main",
    selectedTab: ""
  },
  workStretchSelector: { activeTab: "5day" },
  weekendPreferences: { activeTab: "all" }
};

// Default subsections for direct navigation
export const DEFAULT_SUBSECTIONS = {
  groups: "selection",
  dates: "calendar",
  shifts: "main",
  stretches: "5day",
  weekends: "all"
};

// Default active view state
export const DEFAULT_ACTIVE_VIEW = { screen: "filter", step: 1 };

// Server sync constants
export const MIN_UPDATE_INTERVAL = 2000; // 2 seconds between updates to the same section