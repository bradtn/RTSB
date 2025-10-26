// src/components/schedules/FilterPanel.tsx
// Updated with improved date selection using react-datepicker
"use client";

import { useState, useEffect, useMemo } from "react";
import { addDays, format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type ShiftCode = {
  id: number;
  code: string;
  begin: string | null;
  end: string | null;
  display: string;
  category: string;
  length: string;
};

type FilterProps = {
  shiftCodes: ShiftCode[];
  onFilterChange: (criteria: FilterCriteria) => void;
};

export type FilterCriteria = {
  selectedGroups: string[];
  dayOffDates: Date[];
  selectedShiftCodes: string[];
  selectedShiftCategories: string[];
  selectedShiftLengths: string[];
  shiftCategoryIntent?: string; // 'any' or 'mix'
  weights: {
    groupWeight: number;
    daysWeight: number;
    shiftWeight: number;
    blocks5dayWeight: number;
    blocks4dayWeight: number;
    weekendWeight: number;
    saturdayWeight: number;
    sundayWeight: number;
  };
};

export default function FilterPanel({ shiftCodes, onFilterChange }: FilterProps) {
  const [groups, setGroups] = useState<string[]>([]);
  const [dayOffDates, setDayOffDates] = useState<Date[]>([]);
  
  // Date picker states
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [dateRange, setDateRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: new Date(),
    endDate: addDays(new Date(), 7),
  });
  
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedShiftCodes, setSelectedShiftCodes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLengths, setSelectedLengths] = useState<string[]>([]);
  const [shiftCategoryIntent, setShiftCategoryIntent] = useState<string>('any'); // 'any' or 'mix'

  // Weights
  const [groupWeight, setGroupWeight] = useState(1.0);
  const [daysWeight, setDaysWeight] = useState(1.0);
  const [shiftWeight, setShiftWeight] = useState(1.0);
  const [blocks5dayWeight, setBlocks5dayWeight] = useState(1.0);
  const [blocks4dayWeight, setBlocks4dayWeight] = useState(1.0);
  const [weekendWeight, setWeekendWeight] = useState(1.0);
  const [saturdayWeight, setSaturdayWeight] = useState(1.0);
  const [sundayWeight, setSundayWeight] = useState(1.0);

  // Custom select styling with chevron icon
  const selectStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 0.75rem center",
    backgroundSize: "1.5em 1.5em", 
    paddingRight: "2.5rem",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    fontWeight: "400"
  };

  // Custom option styling 
  const optionStyle = {
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    backgroundColor: "#374151", // dark gray background
    color: "white"
  };

  useEffect(() => {
    // Inject global styles for select options and datepicker
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      option {
        font-family: Inter, system-ui, -apple-system, sans-serif;
        padding: 8px;
        background-color: #374151;
        color: white;
      }
      select option:checked {
        background-color: #1E40AF;
      }
      select option:hover {
        background-color: #2563EB;
      }
      
      /* Custom slider styles */
      input[type="range"] {
        -webkit-appearance: none;
        margin: 10px 0;
        height: 6px;
        border-radius: 5px;
      }
      
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        height: 16px;
        width: 16px;
        border-radius: 50%;
        background: white;
        box-shadow: 0 0 2px rgba(0,0,0,0.5);
        cursor: pointer;
        margin-top: -5px;
      }
      
      input[type="range"]::-moz-range-thumb {
        height: 16px;
        width: 16px;
        border-radius: 50%;
        background: white;
        box-shadow: 0 0 2px rgba(0,0,0,0.5);
        cursor: pointer;
      }
      
      input[type="range"]:focus {
        outline: none;
      }
      
      .slider-value {
        position: absolute;
        left: 50%;
        transform: translateX(-50%) translateY(-28px);
        background-color: #3b82f6;
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 500;
        white-space: nowrap;
        display: inline-block;
        opacity: 0;
        transition: opacity 0.2s ease;
        pointer-events: none;
      }
      
      input[type="range"]:hover + .slider-value, .slider-value:hover {
        opacity: 1;
      }
      
      .slider-value::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        margin-left: -5px;
        border-width: 5px;
        border-style: solid;
        border-color: #3b82f6 transparent transparent transparent;
      }
      
      /* DatePicker customizations */
      .react-datepicker {
        font-family: Inter, system-ui, -apple-system, sans-serif;
        background-color: #1F2937;
        border: 1px solid #374151;
        border-radius: 0.5rem;
        color: white;
      }
      
      .react-datepicker__header {
        background-color: #111827;
        border-bottom: 1px solid #374151;
      }
      
      .react-datepicker__current-month, 
      .react-datepicker__day-name {
        color: white;
      }
      
      .react-datepicker__day {
        color: #D1D5DB;
      }
      
      .react-datepicker__day:hover {
        background-color: #3B82F6;
        color: white;
        border-radius: 0.3rem;
      }
      
      .react-datepicker__day--selected,
      .react-datepicker__day--in-range,
      .react-datepicker__day--in-selecting-range {
        background-color: #3B82F6;
        color: white;
      }
      
      .react-datepicker__day--keyboard-selected {
        background-color: #2563EB;
        color: white;
      }
      
      .react-datepicker__day--in-selecting-range:not(.react-datepicker__day--in-range) {
        background-color: rgba(59, 130, 246, 0.5);
      }
      
      .react-datepicker__day--disabled {
        color: #6B7280;
      }
      
      .react-datepicker__navigation {
        top: 8px;
      }
      
      .react-datepicker__navigation-icon::before {
        border-color: white;
      }
      
      .react-datepicker__input-container input {
        background-color: #374151;
        border: none;
        color: white;
        padding: 0.75rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        width: 100%;
        font-family: Inter, system-ui, -apple-system, sans-serif;
      }
      
      .react-datepicker__input-container input:focus {
        outline: none;
        box-shadow: 0 0 0 2px #3B82F6;
      }
    `;
    document.head.appendChild(styleEl);
    
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  useEffect(() => {
    // Fetch groups from schedules
    fetch("/api/groups")
      .then(res => res.json())
      .then(data => setGroups(data))
      .catch(err => console.error("Failed to load groups:", err));
  }, []);

  // Calculate expanded shift codes based on categories and lengths
  const expandedShiftCodes = useMemo(() => {
    if (!selectedCategories.length && !selectedLengths.length) return [];
    
    return shiftCodes
      .filter(code => 
        (selectedCategories.length === 0 || selectedCategories.includes(code.category)) &&
        (selectedLengths.length === 0 || selectedLengths.includes(code.length))
      )
      .map(code => code.code);
  }, [selectedCategories, selectedLengths, shiftCodes]);
  
  useEffect(() => {
    // Update filter criteria when any filter value changes
    onFilterChange({
      selectedGroups,
      dayOffDates,
      selectedShiftCodes: [...selectedShiftCodes, ...expandedShiftCodes],
      selectedShiftCategories: selectedCategories,
      selectedShiftLengths: selectedLengths,
      shiftCategoryIntent,
      weights: {
        groupWeight,
        daysWeight,
        shiftWeight,
        blocks5dayWeight,
        blocks4dayWeight,
        weekendWeight,
        saturdayWeight,
        sundayWeight
      }
    });
  }, [
    onFilterChange,
    selectedGroups, 
    dayOffDates, 
    selectedShiftCodes, 
    expandedShiftCodes,
    selectedCategories, 
    selectedLengths, 
    shiftCategoryIntent,
    groupWeight, 
    daysWeight, 
    shiftWeight, 
    blocks5dayWeight, 
    blocks4dayWeight, 
    weekendWeight, 
    saturdayWeight, 
    sundayWeight
  ]);

  // Add a single day off
  const addSingleDayOff = () => {
    if (selectedDate && !dayOffDates.some(date => date.getTime() === selectedDate.getTime())) {
      setDayOffDates([...dayOffDates, selectedDate]);
      // Reset the date picker after adding
      setSelectedDate(null);
    }
  };

  // Add a range of dates
  const addDateRange = () => {
    const { startDate, endDate } = dateRange;
    
    if (!startDate || !endDate || endDate < startDate) return;
    
    const newDates: Date[] = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      newDates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Filter out duplicates
    const uniqueDates = newDates.filter(
      newDate => !dayOffDates.some(
        existingDate => existingDate.getTime() === newDate.getTime()
      )
    );
    
    setDayOffDates([...dayOffDates, ...uniqueDates]);
    
    // Reset the date range picker after adding
    setDateRange({ startDate: null, endDate: null });
  };

  // Remove a specific date
  const removeDayOff = (dateToRemove: Date) => {
    setDayOffDates(dayOffDates.filter(
      date => date.getTime() !== dateToRemove.getTime()
    ));
  };

  // Clear all dates
  const clearAllDates = () => {
    setDayOffDates([]);
  };

  // Get unique categories from shift codes
  const categories = [...new Set(shiftCodes.map(code => code.category))]
    .filter(c => c !== "Unknown")
    .sort();

  // Get unique lengths from shift codes
  const lengths = [...new Set(shiftCodes.map(code => code.length))]
    .filter(l => l !== "Unknown")
    .sort((a, b) => {
      const aHours = parseInt(a.split(" ")[0]) || 0;
      const bHours = parseInt(b.split(" ")[0]) || 0;
      return aHours - bHours;
    });

  return (
    <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800 font-sans">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Filtering Criteria
      </h2>
      
      {/* Group selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Work Group(s)
        </label>
        
        <div className="relative">
          {/* Selected groups as pills/tags */}
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedGroups.map(group => (
              <div 
                key={group}
                className="bg-blue-500 text-white px-2 py-1 rounded-md flex items-center font-medium"
              >
                {group}
                <button
                  onClick={() => setSelectedGroups(selectedGroups.filter(g => g !== group))}
                  className="ml-2 text-white hover:text-gray-200"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          
          {/* Dropdown for selecting new groups - with modern styling */}
          <div className="relative">
            <select
              className="w-full bg-gray-700 border-0 text-white rounded-md p-3 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              value=""
              onChange={(e) => {
                if (e.target.value && !selectedGroups.includes(e.target.value)) {
                  setSelectedGroups([...selectedGroups, e.target.value]);
                }
                e.target.value = "";
              }}
              style={selectStyle}
            >
              <option value="" style={optionStyle}>Select a group...</option>
              {groups
                .filter(group => !selectedGroups.includes(group))
                .map(group => (
                  <option key={group} value={group} style={optionStyle}>{group}</option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Day Off Dates */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
          Day Off Dates
        </h3>
        
        {/* Combined date picker section */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Days Off
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
            {/* Single date picker */}
            <div className="space-y-1">
              <label className="block text-xs text-gray-500 dark:text-gray-400 font-medium">
                Single Date
              </label>
              <div className="flex gap-2">
                <div className="flex-grow">
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    className="w-full bg-gray-700 border-0 text-white rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm"
                    placeholderText="Select a day off"
                    dateFormat="MMM dd, yyyy"
                    isClearable
                  />
                </div>
                <button
                  onClick={addSingleDayOff}
                  disabled={!selectedDate}
                  className={`px-4 rounded-md font-medium text-sm ${selectedDate 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'}`}
                >
                  Add
                </button>
              </div>
            </div>
            
            {/* Date range picker */}
            <div className="space-y-1">
              <label className="block text-xs text-gray-500 dark:text-gray-400 font-medium">
                Date Range
              </label>
              <div className="flex gap-2">
                <div className="flex-grow">
                  <DatePicker
                    selectsRange={true}
                    startDate={dateRange.startDate}
                    endDate={dateRange.endDate}
                    onChange={(update: [Date | null, Date | null]) => {
                      setDateRange({ startDate: update[0], endDate: update[1] });
                    }}
                    className="w-full bg-gray-700 border-0 text-white rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm"
                    placeholderText="Select date range"
                    dateFormat="MMM dd, yyyy"
                    isClearable
                  />
                </div>
                <button
                  onClick={addDateRange}
                  disabled={!dateRange.startDate || !dateRange.endDate}
                  className={`px-4 rounded-md font-medium text-sm ${(dateRange.startDate && dateRange.endDate) 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'}`}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Selected dates display */}
        {dayOffDates.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Current Day Off Dates ({dayOffDates.length})
              </h4>
              <button
                onClick={clearAllDates}
                className="text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-gray-600 dark:bg-gray-700 rounded-md">
              {dayOffDates.sort((a, b) => a.getTime() - b.getTime()).map((date, index) => (
                <div 
                  key={index} 
                  className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-medium dark:bg-blue-900 dark:text-blue-200 flex items-center"
                >
                  {format(date, "MMM dd, yyyy")}
                  <button
                    onClick={() => removeDayOff(date)}
                    className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Shift Criteria */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
          Shift Criteria
        </h3>
        
        {/* Shift categories (time of day) */}
        {categories.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select time of day
            </label>
            
            {/* Selected categories as pills/tags */}
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedCategories.map(category => (
                <div 
                  key={category}
                  className="bg-blue-500 text-white px-2 py-1 rounded-md flex items-center font-medium"
                >
                  {category}
                  <button
                    onClick={() => setSelectedCategories(selectedCategories.filter(c => c !== category))}
                    className="ml-2 text-white hover:text-gray-200"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            
            {/* Dropdown for selecting new categories - with modern styling */}
            <select
              className="w-full bg-gray-700 border-0 text-white rounded-md p-3 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              value=""
              onChange={(e) => {
                if (e.target.value && !selectedCategories.includes(e.target.value)) {
                  setSelectedCategories([...selectedCategories, e.target.value]);
                }
                e.target.value = "";
              }}
              style={selectStyle}
            >
              <option value="" style={optionStyle}>Select time of day...</option>
              {categories
                .filter(category => !selectedCategories.includes(category))
                .map(category => (
                  <option key={category} value={category} style={optionStyle}>{category}</option>
                ))}
            </select>
          </div>
        )}
        
        {/* Shift category intent (only show when categories are selected) */}
        {selectedCategories.length > 1 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Shift variety preference
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setShiftCategoryIntent('any')}
                className={`px-3 py-2 rounded-md text-sm font-medium flex-1 ${
                  shiftCategoryIntent === 'any' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                Any Mix
              </button>
              <button
                onClick={() => setShiftCategoryIntent('mix')}
                className={`px-3 py-2 rounded-md text-sm font-medium flex-1 ${
                  shiftCategoryIntent === 'mix' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                Variety Only
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {shiftCategoryIntent === 'any' 
                ? 'Show schedules with any of the selected shift types' 
                : 'Show only schedules that mix different shift types'
              }
            </p>
          </div>
        )}
        
        {/* Shift lengths (duration) */}
        {lengths.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select shift duration
            </label>
            
            {/* Selected lengths as pills/tags */}
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedLengths.map(length => (
                <div 
                  key={length}
                  className="bg-blue-500 text-white px-2 py-1 rounded-md flex items-center font-medium"
                >
                  {length}
                  <button
                    onClick={() => setSelectedLengths(selectedLengths.filter(l => l !== length))}
                    className="ml-2 text-white hover:text-gray-200"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            
            {/* Dropdown for selecting new lengths - with modern styling */}
            <select
              className="w-full bg-gray-700 border-0 text-white rounded-md p-3 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              value=""
              onChange={(e) => {
                if (e.target.value && !selectedLengths.includes(e.target.value)) {
                  setSelectedLengths([...selectedLengths, e.target.value]);
                }
                e.target.value = "";
              }}
              style={selectStyle}
            >
              <option value="" style={optionStyle}>Select shift duration...</option>
              {lengths
                .filter(length => !selectedLengths.includes(length))
                .map(length => (
                  <option key={length} value={length} style={optionStyle}>{length}</option>
                ))}
            </select>
          </div>
        )}
        
        {/* Specific shift codes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Specific Shift Code(s)
          </label>
          
          {/* Selected shift codes as pills */}
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedShiftCodes.map(code => {
              const shiftObj = shiftCodes.find(sc => sc.code === code);
              const display = shiftObj?.display || code;
              
              return (
                <div 
                  key={code}
                  className="bg-blue-500 text-white px-2 py-1 rounded-md flex items-center font-medium"
                >
                  {display}
                  <button
                    onClick={() => setSelectedShiftCodes(selectedShiftCodes.filter(c => c !== code))}
                    className="ml-2 text-white hover:text-gray-200"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
          
          {/* Dropdown for selecting new shift codes - with modern styling */}
          <select
            className="w-full bg-gray-700 border-0 text-white rounded-md p-3 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
            value=""
            onChange={(e) => {
              if (e.target.value && !selectedShiftCodes.includes(e.target.value)) {
                setSelectedShiftCodes([...selectedShiftCodes, e.target.value]);
              }
              e.target.value = "";
            }}
            style={selectStyle}
          >
            <option value="" style={optionStyle}>Choose an option</option>
            {shiftCodes
              .filter(code => !selectedShiftCodes.includes(code.code))
              .map(code => (
                <option key={code.id} value={code.code} style={optionStyle}>
                  {code.display}
                </option>
              ))}
          </select>
        </div>
      </div>
      
      {/* Weights Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
          What Matters Most To You?
        </h3>
        
        <div className="space-y-6">
          {/* Group weight slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              I want to work in specific groups
            </label>
            <div className="relative mb-5 mt-2">
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={groupWeight}
                onChange={(e) => setGroupWeight(parseFloat(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(groupWeight/5)*100}%, #374151 ${(groupWeight/5)*100}%, #374151 100%)`
                }}
              />
              <span className="slider-value" style={{ left: `${(groupWeight/5)*100}%` }}>
                {groupWeight.toFixed(1)}
              </span>
            </div>
          </div>
          
          {/* Days off weight slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              I need specific days off
            </label>
            <div className="relative mb-5 mt-2">
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={daysWeight}
                onChange={(e) => setDaysWeight(parseFloat(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(daysWeight/5)*100}%, #374151 ${(daysWeight/5)*100}%, #374151 100%)`
                }}
              />
              <span className="slider-value" style={{ left: `${(daysWeight/5)*100}%` }}>
                {daysWeight.toFixed(1)}
              </span>
            </div>
          </div>
          
          {/* Shift times weight slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              I prefer certain shift times
            </label>
            <div className="relative mb-5 mt-2">
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={shiftWeight}
                onChange={(e) => setShiftWeight(parseFloat(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(shiftWeight/5)*100}%, #374151 ${(shiftWeight/5)*100}%, #374151 100%)`
                }}
              />
              <span className="slider-value" style={{ left: `${(shiftWeight/5)*100}%` }}>
                {shiftWeight.toFixed(1)}
              </span>
            </div>
          </div>
          
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-6 mb-3">
            Things to Avoid:
          </h4>
          
          {/* 5-day blocks weight slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Avoid 5-day work stretches
            </label>
            <div className="relative mb-5 mt-2">
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={blocks5dayWeight}
                onChange={(e) => setBlocks5dayWeight(parseFloat(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(blocks5dayWeight/5)*100}%, #374151 ${(blocks5dayWeight/5)*100}%, #374151 100%)`
                }}
              />
              <span className="slider-value" style={{ left: `${(blocks5dayWeight/5)*100}%` }}>
                {blocks5dayWeight.toFixed(1)}
              </span>
            </div>
          </div>
          
          {/* 4-day blocks weight slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Avoid 4-day work stretches
            </label>
            <div className="relative mb-5 mt-2">
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={blocks4dayWeight}
                onChange={(e) => setBlocks4dayWeight(parseFloat(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(blocks4dayWeight/5)*100}%, #374151 ${(blocks4dayWeight/5)*100}%, #374151 100%)`
                }}
              />
              <span className="slider-value" style={{ left: `${(blocks4dayWeight/5)*100}%` }}>
                {blocks4dayWeight.toFixed(1)}
              </span>
            </div>
          </div>
          
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-6 mb-3">
            Weekend Preferences:
          </h4>
          
          {/* Weekend weight slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              I want all weekends off
            </label>
            <div className="relative mb-5 mt-2">
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={weekendWeight}
                onChange={(e) => setWeekendWeight(parseFloat(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(weekendWeight/5)*100}%, #374151 ${(weekendWeight/5)*100}%, #374151 100%)`
                }}
              />
              <span className="slider-value" style={{ left: `${(weekendWeight/5)*100}%` }}>
                {weekendWeight.toFixed(1)}
              </span>
            </div>
          </div>
          
          {/* Saturday weight slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              I want Saturdays off
            </label>
            <div className="relative mb-5 mt-2">
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={saturdayWeight}
                onChange={(e) => setSaturdayWeight(parseFloat(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(saturdayWeight/5)*100}%, #374151 ${(saturdayWeight/5)*100}%, #374151 100%)`
                }}
              />
              <span className="slider-value" style={{ left: `${(saturdayWeight/5)*100}%` }}>
                {saturdayWeight.toFixed(1)}
              </span>
            </div>
          </div>
          
          {/* Sunday weight slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              I want Sundays off
            </label>
            <div className="relative mb-5 mt-2">
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={sundayWeight}
                onChange={(e) => setSundayWeight(parseFloat(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(sundayWeight/5)*100}%, #374151 ${(sundayWeight/5)*100}%, #374151 100%)`
                }}
              />
              <span className="slider-value" style={{ left: `${(sundayWeight/5)*100}%` }}>
                {sundayWeight.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}