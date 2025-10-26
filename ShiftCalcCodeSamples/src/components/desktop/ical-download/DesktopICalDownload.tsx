// src/components/desktop/ical-download/DesktopICalDownload.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import { motion } from "framer-motion";
import { format, parseISO, addDays } from "date-fns";
import ICalButton from "@/components/schedules/ICalButton";
import { DEFAULT_SETTINGS } from "@/lib/settings";

interface DesktopICalDownloadProps {
  onModeChange: (mode: any) => void;
  currentMode: any;
}

// Define the wizard steps
const STEPS = [
  { id: 1, label: "Operation", icon: "🏭", description: "Select your work operation" },
  { id: 2, label: "Line", icon: "📍", description: "Choose your line number" },
  { id: 3, label: "Preview", icon: "📅", description: "Download your schedule" }
];

export default function DesktopICalDownload({ onModeChange, currentMode }: DesktopICalDownloadProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const styles = useThemeStyles();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedOperation, setSelectedOperation] = useState<string>("");
  const [selectedLine, setSelectedLine] = useState<string>("");
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);

  // Operation selector state
  const [operations, setOperations] = useState<string[]>([]);
  const [operationsLoading, setOperationsLoading] = useState(true);
  const [operationsError, setOperationsError] = useState<string | null>(null);

  // Line selector state
  const [availableLines, setAvailableLines] = useState<string[]>([]);
  const [linesLoading, setLinesLoading] = useState(false);
  const [linesError, setLinesError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Update URL with current state
  const updateUrlState = useCallback(() => {
    const params = new URLSearchParams();
    params.set('step', currentStep.toString());
    if (selectedOperation) params.set('operation', selectedOperation);
    if (selectedLine) params.set('line', selectedLine);
    if (scheduleData?.id) params.set('scheduleId', scheduleData.id.toString());
    
    const newUrl = `/ical-download?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [currentStep, selectedOperation, selectedLine, scheduleData]);

  // Initialize state from URL on mount
  useEffect(() => {
    if (isInitialized) return;
    
    const step = searchParams.get('step');
    const operation = searchParams.get('operation');
    const line = searchParams.get('line');
    
    if (step) setCurrentStep(parseInt(step));
    if (operation) setSelectedOperation(operation);
    if (line) setSelectedLine(line);
    
    setIsInitialized(true);
  }, [searchParams, isInitialized]);

  // Update URL whenever state changes
  useEffect(() => {
    if (isInitialized) {
      updateUrlState();
    }
  }, [currentStep, selectedOperation, selectedLine, scheduleData, updateUrlState, isInitialized]);

  // Load schedule data when refreshing on step 3
  useEffect(() => {
    if (isInitialized && currentStep === 3 && selectedOperation && selectedLine && !scheduleData && !isLoading) {
      handleLineSelect(selectedLine, selectedOperation);
    }
  }, [isInitialized, currentStep, selectedOperation, selectedLine, scheduleData, isLoading]);

  // Fetch operations on mount
  useEffect(() => {
    fetchOperations();
  }, []);

  // Fetch lines when operation is selected
  useEffect(() => {
    if (selectedOperation && currentStep === 2) {
      fetchLines();
    }
  }, [selectedOperation, currentStep]);

  const fetchOperations = async () => {
    setOperationsLoading(true);
    setOperationsError(null);
    
    try {
      const response = await fetch("/api/groups");
      if (response.ok) {
        const data = await response.json();
        setOperations(data || []);
      } else {
        setOperationsError("Failed to load operations");
      }
    } catch (error) {
      console.error("Error fetching operations:", error);
      setOperationsError("Error loading operations. Please try again.");
    } finally {
      setOperationsLoading(false);
    }
  };

  const fetchLines = async () => {
    if (!selectedOperation) return;
    
    setLinesLoading(true);
    setLinesError(null);
    
    try {
      const response = await fetch('/api/schedules');
      const data = await response.json();
      
      if (Array.isArray(data)) {
        // Filter lines by selected operation and extract line numbers
        const filteredLines = data
          .filter((s: any) => s.GROUP === selectedOperation)
          .map((s: any) => s.LINE.toString())
          .filter((line, index, self) => self.indexOf(line) === index) // Remove duplicates
          .sort((a, b) => Number(a) - Number(b)); // Sort numerically
        
        setAvailableLines(filteredLines);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching lines:', err);
      setLinesError('Failed to load lines. Please try again.');
    } finally {
      setLinesLoading(false);
    }
  };

  // Handle step navigation
  const goToNextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle operation selection
  const handleOperationSelect = (operation: string) => {
    setSelectedOperation(operation);
    setSelectedLine(""); // Reset line selection
    setSearchTerm(""); // Reset search term
    goToNextStep();
  };

  // Handle line selection
  const handleLineSelect = async (line: string, operation?: string) => {
    const targetOperation = operation || selectedOperation;
    setSelectedLine(line);
    setIsLoading(true);
    setError("");
    
    try {
      // First fetch all schedules
      const response = await fetch('/api/schedules');
      
      if (!response.ok) {
        throw new Error("Failed to fetch schedules");
      }
      
      const schedules = await response.json();
      
      // Find the specific schedule matching the group and line
      const matchingSchedule = schedules.find((s: any) => 
        s.GROUP === targetOperation && s.LINE.toString() === line.toString()
      );
      
      if (matchingSchedule) {
        setScheduleData(matchingSchedule);
        goToNextStep();
      } else {
        setError("No schedule found for this line");
      }
    } catch (err) {
      setError("Error loading schedule. Please try again.");
      console.error("Error fetching schedule:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle line input change
  const handleLineSelection = (line: string) => {
    setSelectedLine(line);
    setSearchTerm(line);
  };

  // Get filtered lines based on search term
  const getFilteredLines = () => {
    return availableLines.filter(line => 
      searchTerm ? line.toString().startsWith(searchTerm) : true
    );
  };

  // Render step indicator
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
            ${currentStep >= step.id 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}
          `}>
            {step.id}
          </div>
          <div className="ml-3 mr-8">
            <div className={`text-sm font-medium ${
              currentStep >= step.id ? styles.textPrimary : styles.textMuted
            }`}>
              {step.label}
            </div>
            <div className={`text-xs ${styles.textMuted}`}>
              {step.description}
            </div>
          </div>
          {index < STEPS.length - 1 && (
            <div className={`w-16 h-0.5 mr-8 ${
              currentStep > step.id ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  // Render operation selector
  const renderOperationSelector = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className={`text-3xl font-bold mb-4 ${styles.textPrimary}`}>
          Which operation do you work in?
        </h2>
        <p className={`text-lg ${styles.textSecondary}`}>
          Select your primary work operation to continue
        </p>
      </div>

      {operationsLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : operationsError ? (
        <div className={`p-4 rounded-lg ${styles.errorBg} ${styles.errorText} text-center`}>
          {operationsError}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {operations.map((operation) => (
            <motion.button
              key={operation}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOperationSelect(operation)}
              className={`
                p-6 rounded-lg border-2 transition-all text-lg font-medium
                ${selectedOperation === operation 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'}
              `}
            >
              {operation}
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );

  // Render line selector
  const renderLineSelector = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className={`text-3xl font-bold mb-4 ${styles.textPrimary}`}>
          What's your line number?
        </h2>
        <p className={`text-lg ${styles.textSecondary}`}>
          Enter or select your line number in {selectedOperation}
        </p>
      </div>

      {/* Search input */}
      <div className="mb-6">
        <div className="relative max-w-md mx-auto">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <input
            type="text"
            className={`block w-full pl-10 pr-3 py-3 rounded-lg border ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700 text-white focus:ring-blue-500 focus:border-blue-500' 
                : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
            } text-lg`}
            placeholder="Type or select your line number"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedLine(e.target.value);
            }}
          />
        </div>
      </div>

      {linesLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : linesError ? (
        <div className={`p-4 rounded-lg ${styles.errorBg} ${styles.errorText} text-center`}>
          {linesError}
        </div>
      ) : (
        <>
          <h3 className={`text-lg font-medium ${styles.textSecondary} mb-4 text-center`}>
            Available lines:
          </h3>
          
          <div className="grid grid-cols-6 lg:grid-cols-8 gap-3 mb-6">
            {getFilteredLines().map(line => (
              <button
                key={line}
                onClick={() => handleLineSelection(line)}
                className={`py-3 rounded-lg text-center text-lg font-medium transition-all duration-200 
                  ${selectedLine === line
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
              >
                {line}
              </button>
            ))}
          </div>

          {/* Validation messages */}
          {selectedLine && !availableLines.includes(selectedLine) && (
            <div className={`p-4 rounded-lg ${styles.warningBg} ${styles.warningText} text-center mb-4`}>
              Line {selectedLine} not found in {selectedOperation}. Please select from the list or enter a valid line number.
            </div>
          )}

          {getFilteredLines().length === 0 && searchTerm && (
            <div className={`text-center py-8 ${styles.textMuted}`}>
              No lines found matching "{searchTerm}"
            </div>
          )}
        </>
      )}

      <div className="flex justify-center gap-4 mt-8">
        <button
          onClick={goToPreviousStep}
          className={`px-6 py-3 rounded-lg font-medium ${styles.buttonSecondary}`}
        >
          ← Back
        </button>
        <button
          onClick={() => handleLineSelect(selectedLine)}
          disabled={!selectedLine || !availableLines.includes(selectedLine) || isLoading}
          className={`px-6 py-3 rounded-lg font-medium ${
            !selectedLine || !availableLines.includes(selectedLine) || isLoading
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isLoading ? 'Loading...' : 'Next →'}
        </button>
      </div>
    </motion.div>
  );

  // Desktop-optimized schedule preview
  const renderSchedulePreview = () => {
    if (isLoading || !scheduleData) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className={`text-lg ${styles.textSecondary}`}>Loading schedule...</p>
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <div className="text-center mb-8">
          <button
            onClick={goToPreviousStep}
            className={`mb-4 text-lg ${styles.textAccent} hover:underline`}
          >
            ← Change Line
          </button>
          <h2 className={`text-3xl font-bold mb-4 ${styles.textPrimary}`}>
            Schedule Preview
          </h2>
          <p className={`text-lg ${styles.textSecondary}`}>
            Preview and download your schedule for {selectedOperation} - Line {selectedLine}
          </p>
        </div>

        <DesktopSchedulePreview
          scheduleData={scheduleData}
          onBack={goToPreviousStep}
          onClose={() => router.push("/")}
        />
      </motion.div>
    );
  };

  // Desktop Schedule Preview Component
  const DesktopSchedulePreview = ({ scheduleData, onBack, onClose }: any) => {
    const [shiftCodes, setShiftCodes] = useState<any[]>([]);
    const [systemSettings, setSystemSettings] = useState({
      startDate: DEFAULT_SETTINGS.startDate,
      numCycles: DEFAULT_SETTINGS.numCycles
    });
    const [holidays, setHolidays] = useState<any[]>([]);
    const [showAllHolidays, setShowAllHolidays] = useState(false);

    useEffect(() => {
      fetchShiftCodes();
      fetchSystemSettings();
      fetchHolidays();
    }, []);

    const fetchSystemSettings = async () => {
      try {
        const response = await fetch("/api/admin/settings");
        if (response.ok) {
          const data = await response.json();
          // The API returns settings directly, not nested under 'settings'
          setSystemSettings({
            startDate: data.startDate || DEFAULT_SETTINGS.startDate,
            numCycles: data.numCycles || DEFAULT_SETTINGS.numCycles
          });
        }
      } catch (error) {
        console.error("Error fetching system settings:", error);
      }
    };

    const fetchShiftCodes = async () => {
      try {
        const response = await fetch("/api/shift-codes");
        if (response.ok) {
          const data = await response.json();
          setShiftCodes(data || []);
        }
      } catch (error) {
        console.error("Error fetching shift codes:", error);
      }
    };

    const fetchHolidays = async () => {
      try {
        const response = await fetch('/api/holidays/total');
        if (response.ok) {
          const data = await response.json();
          setHolidays(data.holidays || []);
        }
      } catch (error) {
        console.error('Error fetching holidays:', error);
      }
    };

    // Generate full schedule based on cycles
    const getFullSchedule = () => {
      const schedule = [];
      const dayColumns = Object.keys(scheduleData)
        .filter(key => key.startsWith('DAY_'))
        .sort();
      const daysInCycle = dayColumns.length; // Should be 56
      const totalDays = daysInCycle * systemSettings.numCycles;
      
      const start = parseISO(systemSettings.startDate);
      
      for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
        const dayInCycle = (dayIndex % daysInCycle);
        const dayKey = dayColumns[dayInCycle];
        const shiftCode = scheduleData[dayKey];
        
        const currentDate = addDays(start, dayIndex);
        
        schedule.push({
          date: currentDate,
          dayNum: dayIndex + 1,
          code: shiftCode,
          dayInCycle: dayInCycle + 1
        });
      }
      
      return schedule;
    };

    // Group schedule by month for display
    const getScheduleByMonth = () => {
      const fullSchedule = getFullSchedule();
      const months: { [key: string]: any[] } = {};
      
      fullSchedule.forEach(day => {
        const monthKey = day.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        if (!months[monthKey]) {
          months[monthKey] = [];
        }
        months[monthKey].push(day);
      });
      
      return months;
    };

    // Check if a date is a holiday
    const isHoliday = (date: Date): { isHoliday: boolean; name?: string } => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const holiday = holidays.find(h => h.date === dateStr);
      return {
        isHoliday: !!holiday,
        name: holiday?.name
      };
    };

    // Calculate holidays worked
    const getHolidaysWorked = () => {
      const fullSchedule = getFullSchedule();
      let holidaysWorked = 0;
      
      fullSchedule.forEach(day => {
        if (day.code !== "----") { // Working day
          const holidayInfo = isHoliday(day.date);
          if (holidayInfo.isHoliday) {
            holidaysWorked++;
          }
        }
      });
      
      return holidaysWorked;
    };

    // Get shift details
    const getShiftDetails = (code: string) => {
      if (!code || code === "----") return { label: "Day Off", color: "gray" };
      
      const shiftCode = shiftCodes.find(sc => sc.code === code);
      if (!shiftCode) return { label: code, color: "blue" };
      
      const startHour = parseInt(shiftCode.begin?.split(':')[0] || "0");
      let color = "blue";
      if (startHour >= 5 && startHour < 12) color = "amber";
      else if (startHour >= 12 && startHour < 17) color = "green";
      else color = "purple";
      
      return {
        label: code,
        time: `${shiftCode.begin || ""} - ${shiftCode.end || ""}`,
        color
      };
    };

    const formatScheduleDate = (dateString: string) => {
      const date = parseISO(dateString);
      return format(date, 'MMM d, yyyy');
    };

    const getEndDate = () => {
      const startDate = parseISO(systemSettings.startDate);
      const endDate = addDays(startDate, (56 * systemSettings.numCycles) - 1);
      return format(endDate, 'MMM d, yyyy');
    };

    return (
      <div className="space-y-6">
        {/* Schedule Info Card */}
        <div className={`rounded-lg bg-gradient-to-r ${
          theme === 'dark' 
            ? 'from-gray-800 to-gray-700' 
            : 'from-gray-50 to-white'
        } p-6 border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          {/* Line and Operation at top center - updated layout */}
          <div className="text-center mb-6">
            <div className={`text-3xl font-bold ${styles.textPrimary} mb-1`}>Line {scheduleData.LINE}</div>
            <div className={`text-lg font-semibold ${styles.textSecondary}`}>{scheduleData.GROUP}</div>
          </div>
          
          {/* Stats grid below */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-xl font-semibold ${styles.textPrimary}`}>
                {getFullSchedule().filter(d => d.code !== "----").length}
              </div>
              <div className={`text-sm ${styles.textSecondary}`}>Work Days</div>
            </div>
            <div className="text-center">
              <div className={`text-xl font-semibold ${styles.textPrimary}`}>
                {getFullSchedule().filter(d => d.code === "----").length}
              </div>
              <div className={`text-sm ${styles.textSecondary}`}>Days Off</div>
            </div>
            <div className="text-center">
              <div className={`text-xl font-semibold text-purple-500`}>
                {(() => {
                  const fullSchedule = getFullSchedule();
                  const weekendPairs = new Set();
                  const totalWeekends = new Set();
                  
                  fullSchedule.forEach(day => {
                    const dayOfWeek = day.date.getDay();
                    
                    // Count total weekends in schedule period
                    if (dayOfWeek === 6) { // Saturday
                      const weekendKey = `${day.date.getFullYear()}-${day.date.getMonth()}-${Math.floor(day.date.getDate() / 7)}`;
                      totalWeekends.add(weekendKey);
                    }
                    
                    // Count worked weekend pairs
                    if (day.code !== "----") {
                      // If it's a Saturday, check if Sunday is also worked
                      if (dayOfWeek === 6) {
                        const nextDay = fullSchedule.find(d => 
                          d.date.getTime() === day.date.getTime() + 86400000
                        );
                        if (nextDay && nextDay.code !== "----") {
                          // Both Saturday and Sunday are worked - this is one weekend
                          const weekendKey = `${day.date.getFullYear()}-${day.date.getMonth()}-${Math.floor(day.date.getDate() / 7)}`;
                          weekendPairs.add(weekendKey);
                        }
                      }
                    }
                  });
                  
                  return `${weekendPairs.size} of ${totalWeekends.size}`;
                })()}
              </div>
              <div className={`text-sm ${styles.textSecondary}`}>Weekends</div>
            </div>
            <div className="text-center">
              <div className={`text-xl font-semibold text-red-500`}>
                {getHolidaysWorked()} of {holidays.length}
              </div>
              <div className={`text-sm ${styles.textSecondary}`}>Holidays</div>
            </div>
          </div>
          
          {/* Orphaned Weekend Days - Only show if there are any */}
          {(() => {
            const fullSchedule = getFullSchedule();
            let orphanedSaturdays = 0;
            let orphanedSundays = 0;
            
            fullSchedule.forEach(day => {
              if (day.code !== "----") {
                const dayOfWeek = day.date.getDay();
                
                if (dayOfWeek === 6) { // Saturday
                  const nextDay = fullSchedule.find(d => 
                    d.date.getTime() === day.date.getTime() + 86400000
                  );
                  if (!nextDay || nextDay.code === "----") {
                    orphanedSaturdays++;
                  }
                } else if (dayOfWeek === 0) { // Sunday
                  const prevDay = fullSchedule.find(d => 
                    d.date.getTime() === day.date.getTime() - 86400000
                  );
                  if (!prevDay || prevDay.code === "----") {
                    orphanedSundays++;
                  }
                }
              }
            });
            
            if (orphanedSaturdays === 0 && orphanedSundays === 0) return null;
            
            return (
              <div className={`grid gap-4 mt-4 ${orphanedSaturdays > 0 && orphanedSundays > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {orphanedSaturdays > 0 && (
                  <div className="text-center">
                    <div className={`text-lg font-semibold text-orange-500`}>
                      {orphanedSaturdays}
                    </div>
                    <div className={`text-sm ${styles.textSecondary}`}>Solo Saturdays</div>
                  </div>
                )}
                {orphanedSundays > 0 && (
                  <div className="text-center">
                    <div className={`text-lg font-semibold text-blue-500`}>
                      {orphanedSundays}
                    </div>
                    <div className={`text-sm ${styles.textSecondary}`}>Solo Sundays</div>
                  </div>
                )}
              </div>
            );
          })()}
          
          <div className={`mt-6 pt-4 border-t ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
            <div className="flex justify-between items-center">
              <div>
                <div className={`text-sm ${styles.textSecondary}`}>Start Date</div>
                <div className={`font-medium ${styles.textPrimary}`}>
                  {formatScheduleDate(systemSettings.startDate)}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm ${styles.textSecondary}`}>End Date</div>
                <div className={`font-medium ${styles.textPrimary}`}>
                  {getEndDate()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Holiday List */}
        {holidays.length > 0 && (
          <div className={`rounded-lg ${styles.cardBg} p-6 shadow-lg`}>
            <h3 className={`text-xl font-semibold ${styles.textPrimary} mb-4 flex items-center gap-2`}>
              <span className="text-red-500">🎉</span>
              Holidays ({getHolidaysWorked()} working)
            </h3>
            <div className="grid gap-3">
              {(showAllHolidays ? holidays : holidays.slice(0, 6)).map((holiday, index) => {
                const holidayDate = parseISO(holiday.date);
                const fullSchedule = getFullSchedule();
                const scheduleDay = fullSchedule.find(d => 
                  format(d.date, 'yyyy-MM-dd') === holiday.date
                );
                const isWorking = scheduleDay && scheduleDay.code !== "----";
                
                return (
                  <div 
                    key={index} 
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isWorking 
                        ? theme === 'dark' ? 'bg-red-900/20 border border-red-500/30' : 'bg-red-50 border border-red-200'
                        : theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-lg ${
                        isWorking ? 'text-red-500' : styles.textSecondary
                      }`}>
                        {isWorking ? '🏢' : '🏠'}
                      </span>
                      <div>
                        <div className={`font-medium ${styles.textPrimary}`}>
                          {holiday.name}
                        </div>
                        <div className={`text-sm ${styles.textSecondary}`}>
                          {format(holidayDate, 'EEE, MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                    <div className={`text-sm font-medium px-3 py-1 rounded-full ${
                      isWorking 
                        ? 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30' 
                        : 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30'
                    }`}>
                      {isWorking ? 'Working' : 'Off'}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Show more/less button */}
            {holidays.length > 6 && (
              <button
                onClick={() => setShowAllHolidays(!showAllHolidays)}
                className={`
                  w-full mt-4 py-3 text-sm font-medium rounded-lg transition-colors
                  ${theme === "dark" 
                    ? "bg-gray-800 hover:bg-gray-700 text-gray-300" 
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"}
                `}
              >
                {showAllHolidays ? (
                  <span>Show Less</span>
                ) : (
                  <span>Show {holidays.length - 6} More Holiday{holidays.length - 6 !== 1 ? 's' : ''}</span>
                )}
              </button>
            )}
          </div>
        )}

        {/* Calendar Display */}
        <div className="space-y-4">
          <div className="text-center">
            <h3 className={`text-xl font-semibold ${styles.textPrimary} mb-2`}>
              Schedule Calendar
            </h3>
            <p className={`text-sm ${styles.textMuted} mb-4`}>
              Scroll horizontally to see more months
            </p>
          </div>
          
          {/* Scrollable calendar container with improved scrolling */}
          <div className="relative">
            <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800" style={{ scrollBehavior: 'smooth' }}>
              <div className="flex gap-6" style={{ width: 'max-content', minWidth: '100%' }}>
                {Object.entries(getScheduleByMonth()).map(([month, days]) => (
                  <div key={month} className={`flex-shrink-0 rounded-lg ${styles.cardBg} p-4 shadow-md`} style={{ width: '350px' }}>
                    <h4 className={`font-medium ${styles.textPrimary} mb-4 text-center text-lg`}>{month}</h4>
                    <div className="grid grid-cols-7 gap-1">
                      {/* Day headers */}
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                        <div key={idx} className={`text-center font-semibold text-sm ${styles.textMuted} py-1`}>
                          {day}
                        </div>
                      ))}
                      
                      {/* Empty cells for first week alignment */}
                      {Array.from({ length: days[0].date.getDay() }, (_, i) => (
                        <div key={`empty-${i}`} />
                      ))}
                      
                      {/* Days */}
                      {days.map((day) => {
                        const isOff = day.code === "----";
                        const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
                        const holidayInfo = isHoliday(day.date);
                        
                        let bgColor = '';
                        let textColor = '';
                        
                        if (holidayInfo.isHoliday) {
                          bgColor = theme === 'dark' 
                            ? 'bg-red-900/50 ring-1 ring-red-500' 
                            : 'bg-red-100 ring-1 ring-red-400';
                          textColor = theme === 'dark' ? 'text-red-200' : 'text-red-700';
                        } else if (isOff) {
                          bgColor = theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100';
                          textColor = 'text-gray-500';
                        } else if (isWeekend) {
                          bgColor = theme === 'dark' 
                            ? 'bg-purple-900/50 ring-1 ring-purple-500' 
                            : 'bg-purple-100 ring-1 ring-purple-400';
                          textColor = theme === 'dark' ? 'text-purple-200' : 'text-purple-700';
                        } else {
                          bgColor = theme === 'dark' 
                            ? 'bg-blue-900/30' 
                            : 'bg-blue-50';
                          textColor = theme === 'dark' ? 'text-blue-200' : 'text-blue-700';
                        }
                        
                        return (
                          <div
                            key={day.dayNum}
                            className={`p-2 rounded-lg text-center ${bgColor} relative transition-all hover:scale-105`}
                            title={holidayInfo.isHoliday ? holidayInfo.name : ''}
                          >
                            <div className={`font-bold text-sm ${textColor}`}>
                              {day.date.getDate()}
                            </div>
                            <div className={`text-xs font-medium ${textColor}`}>
                              {isOff ? 'OFF' : day.code}
                            </div>
                            {holidayInfo.isHoliday && (
                              <div className="absolute -top-1 -right-1 text-xs">
                                🎉
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop-optimized bottom buttons */}
        <div className="flex justify-center gap-4 pt-6">
          <button
            onClick={onBack}
            className={`px-6 py-3 rounded-lg font-medium ${styles.buttonSecondary}`}
          >
            ← Back
          </button>
          <div className="inline-block">
            <ICalButton
              scheduleId={scheduleData.id}
              className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg whitespace-nowrap"
              buttonText="📥 Download iCal File"
            />
          </div>
          <button
            onClick={onClose}
            className={`px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 ${styles.textPrimary} font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
          >
            Done
          </button>
        </div>
      </div>
    );
  };

  // Render the current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderOperationSelector();
      case 2:
        return renderLineSelector();
      case 3:
        return renderSchedulePreview();
      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden ${styles.bodyBg}`}>
      <div className="flex-1 overflow-auto p-8">
        {renderStepIndicator()}
        {renderCurrentStep()}
      </div>
    </div>
  );
}