// src/components/desktop/day-off-finder/DesktopDayOffFinder.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import { motion } from "framer-motion";
import { format, parseISO, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, isSameDay } from "date-fns";

interface DesktopDayOffFinderProps {
  onModeChange: (mode: any) => void;
  currentMode: any;
}

// Define the wizard steps
const STEPS = [
  { id: 1, label: "Your Operation", icon: "🏢", description: "Select your work operation" },
  { id: 2, label: "Your Line", icon: "📍", description: "Choose your line number" },
  { id: 3, label: "Days Off", icon: "📅", description: "Select dates you need off" },
  { id: 4, label: "Target Operations", icon: "🎯", description: "Choose operations to search" },
  { id: 5, label: "Results", icon: "✨", description: "Find matching schedules" }
];

export default function DesktopDayOffFinder({ onModeChange, currentMode }: DesktopDayOffFinderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const styles = useThemeStyles();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [userOperation, setUserOperation] = useState<string>("");
  const [userLine, setUserLine] = useState<string>("");
  const [desiredDaysOff, setDesiredDaysOff] = useState<string[]>([]);
  const [targetOperations, setTargetOperations] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);
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

  // Calendar state
  const [systemSettings, setSystemSettings] = useState({
    startDate: '2024-10-09', // Will be replaced by API call
    numCycles: 3
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [userScheduleData, setUserScheduleData] = useState<any>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [userSchedulePattern, setUserSchedulePattern] = useState<string[] | null>(null);

  // Update URL with current state
  const updateUrlState = useCallback(() => {
    const params = new URLSearchParams();
    params.set('step', currentStep.toString());
    if (userOperation) params.set('userOperation', userOperation);
    if (userLine) params.set('userLine', userLine);
    if (desiredDaysOff.length > 0) params.set('desiredDaysOff', desiredDaysOff.join(','));
    if (targetOperations.length > 0) params.set('targetOperations', targetOperations.join(','));
    
    const newUrl = `/day-off-finder?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [currentStep, userOperation, userLine, desiredDaysOff, targetOperations]);

  // Initialize state from URL on mount
  useEffect(() => {
    if (isInitialized) return;
    
    const step = searchParams.get('step');
    const operation = searchParams.get('userOperation');
    const line = searchParams.get('userLine');
    const daysOff = searchParams.get('desiredDaysOff');
    const targets = searchParams.get('targetOperations');
    
    if (step) setCurrentStep(parseInt(step));
    if (operation) setUserOperation(operation);
    if (line) setUserLine(line);
    if (daysOff) setDesiredDaysOff(daysOff.split(','));
    if (targets) setTargetOperations(targets.split(','));
    
    setIsInitialized(true);
  }, [searchParams, isInitialized]);

  // Update URL whenever state changes
  useEffect(() => {
    if (isInitialized) {
      updateUrlState();
    }
  }, [currentStep, userOperation, userLine, desiredDaysOff, targetOperations, updateUrlState, isInitialized]);

  // Fetch operations and settings on mount
  useEffect(() => {
    fetchOperations();
    fetchSystemSettings();
  }, []);

  // Fetch lines when operation is selected
  useEffect(() => {
    if (userOperation && currentStep === 2) {
      fetchLines();
    }
  }, [userOperation, currentStep]);

  // Fetch user schedule data when opening calendar
  useEffect(() => {
    if (showCalendar && userOperation && userLine) {
      fetch("/api/schedules")
        .then(res => res.json())
        .then(schedules => {
          const schedule = schedules.find(
            (s: any) => s.GROUP === userOperation && s.LINE.toString() === userLine.toString()
          );
          setUserScheduleData(schedule);
        })
        .catch(console.error);
    }
  }, [showCalendar, userOperation, userLine]);

  const fetchSystemSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      if (response.ok) {
        const data = await response.json();
        // The API returns settings directly, not nested under 'settings'
        setSystemSettings({
          startDate: data.startDate,
          numCycles: data.numCycles
        });
      }
    } catch (error) {
      console.error("Error fetching system settings:", error);
    }
  };

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
    if (!userOperation) return;
    
    setLinesLoading(true);
    setLinesError(null);
    
    try {
      const response = await fetch('/api/schedules');
      const data = await response.json();
      
      if (Array.isArray(data)) {
        // Filter lines by selected operation and extract line numbers
        const filteredLines = data
          .filter((s: any) => s.GROUP === userOperation)
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
    setUserOperation(operation);
    setUserLine(""); // Reset line selection
    setSearchTerm(""); // Reset search term
    goToNextStep();
  };

  // Handle line selection
  const handleLineSelect = (line: string) => {
    setUserLine(line);
    goToNextStep();
  };

  // Handle days off selection
  const handleDaysOffSelect = (days: string[]) => {
    setDesiredDaysOff(days);
    goToNextStep();
  };

  // Handle target operations selection
  const handleTargetOperationsSelect = (targets: string[]) => {
    setTargetOperations(targets);
    searchForMatches(targets);
  };

  // Search for matching schedules
  const searchForMatches = async (targets?: string[]) => {
    const searchTargets = targets || targetOperations;
    
    if (!userOperation || !userLine || !desiredDaysOff.length || !searchTargets.length) {
      setError("Missing required search criteria");
      return;
    }

    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch('/api/schedules/day-off-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userOperation,
          userLine,
          desiredDaysOff,
          targetOperations: searchTargets,
          startDate: systemSettings.startDate
        })
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data.results || []);
      goToNextStep();
    } catch (err) {
      console.error('Error searching for matches:', err);
      setError('Failed to search for matching schedules. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get filtered lines based on search term
  const getFilteredLines = () => {
    return availableLines.filter(line => 
      searchTerm ? line.toString().startsWith(searchTerm) : true
    );
  };

  // Generate calendar for day selection
  const generateCalendar = () => {
    const start = parseISO(systemSettings.startDate);
    const totalDays = 56 * systemSettings.numCycles;
    const days = [];
    
    for (let i = 0; i < totalDays; i++) {
      const date = addDays(start, i);
      days.push({
        date,
        dateString: format(date, 'yyyy-MM-dd'),
        displayDate: format(date, 'MMM d'),
        dayOfWeek: format(date, 'EEE')
      });
    }
    
    return days;
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
          What operation do you work in?
        </h2>
        <p className={`text-lg ${styles.textSecondary}`}>
          Select your current work operation
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
                ${userOperation === operation 
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
          Enter or select your line number in {userOperation}
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
              setUserLine(e.target.value);
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
                onClick={() => setUserLine(line)}
                className={`py-3 rounded-lg text-center text-lg font-medium transition-all duration-200 
                  ${userLine === line
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
              >
                {line}
              </button>
            ))}
          </div>

          {/* Validation messages */}
          {userLine && !availableLines.includes(userLine) && (
            <div className={`p-4 rounded-lg ${styles.warningBg} ${styles.warningText} text-center mb-4`}>
              Line {userLine} not found in {userOperation}. Please select from the list or enter a valid line number.
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
          onClick={() => handleLineSelect(userLine)}
          disabled={!userLine || !availableLines.includes(userLine)}
          className={`px-6 py-3 rounded-lg font-medium ${
            !userLine || !availableLines.includes(userLine)
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          Next →
        </button>
      </div>
    </motion.div>
  );

  // Render day off selector
  const renderDayOffSelector = () => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-8">
          <h2 className={`text-3xl font-bold mb-4 ${styles.textPrimary}`}>
            Which days do you need off?
          </h2>
          <p className={`text-lg ${styles.textSecondary} mb-2`}>
            Select specific dates you need coverage for
          </p>
          <p className={`text-sm ${styles.textMuted}`}>
            {desiredDaysOff.length} day{desiredDaysOff.length !== 1 ? 's' : ''} selected
          </p>
        </div>

        <div className="flex-grow flex flex-col items-center justify-center p-4">
          <div className={`${styles.cardBg} rounded-lg p-6 w-full max-w-sm text-center`}>
            <div className="mb-6">
              <svg className="w-16 h-16 mx-auto text-blue-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h4 className={`text-lg font-semibold ${styles.textPrimary} mb-2`}>
                Select Your Work Days
              </h4>
              <p className={`text-sm ${styles.textMuted} mb-4`}>
                Select your scheduled work days where you need coverage. We'll find officers who are off on those days.
              </p>
            </div>

            {desiredDaysOff.length > 0 && (
              <div className={`mb-4 p-3 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"}`}>
                <p className={`text-sm font-medium ${styles.textPrimary} mb-2`}>
                  Selected: {desiredDaysOff.length} day{desiredDaysOff.length > 1 ? "s" : ""}
                </p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {desiredDaysOff.sort().slice(0, 3).map(day => (
                    <span
                      key={day}
                      className={`text-xs px-2 py-0.5 rounded ${
                        theme === "dark" ? "bg-gray-700 text-gray-200" : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {format(parseISO(day), "MMM d")}
                    </span>
                  ))}
                  {desiredDaysOff.length > 3 && (
                    <span className={`text-xs ${styles.textMuted}`}>
                      +{desiredDaysOff.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                console.log('Calendar button clicked, setting showCalendar to true');
                setShowCalendar(true);
              }}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                theme === "dark"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              {desiredDaysOff.length > 0 ? "Change Selection" : "Select Days"}
            </button>
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={goToPreviousStep}
            className={`px-6 py-3 rounded-lg font-medium ${styles.buttonSecondary}`}
          >
            ← Back
          </button>
          <button
            onClick={() => handleDaysOffSelect(desiredDaysOff)}
            disabled={desiredDaysOff.length === 0}
            className={`px-6 py-3 rounded-lg font-medium ${
              desiredDaysOff.length === 0
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Next →
          </button>
        </div>
      </motion.div>
    );
  };

  // Render target operations selector
  const renderTargetOperationsSelector = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className={`text-3xl font-bold mb-4 ${styles.textPrimary}`}>
          Which operations should we search?
        </h2>
        <p className={`text-lg ${styles.textSecondary} mb-2`}>
          Select operations to search for officers who are off on your selected dates
        </p>
        <p className={`text-sm ${styles.textMuted}`}>
          {targetOperations.length} operation{targetOperations.length !== 1 ? 's' : ''} selected
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {operations.map((operation) => {
          const isSelected = targetOperations.includes(operation);
          
          return (
            <motion.button
              key={operation}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (isSelected) {
                  setTargetOperations(targetOperations.filter(op => op !== operation));
                } else {
                  setTargetOperations([...targetOperations, operation]);
                }
              }}
              className={`
                p-6 rounded-lg border-2 transition-all text-lg font-medium
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'}
              `}
            >
              {operation}
              {isSelected && (
                <div className="mt-2 text-sm">
                  ✓ Selected
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={goToPreviousStep}
          className={`px-6 py-3 rounded-lg font-medium ${styles.buttonSecondary}`}
        >
          ← Back
        </button>
        <button
          onClick={() => handleTargetOperationsSelect(targetOperations)}
          disabled={targetOperations.length === 0 || isLoading}
          className={`px-6 py-3 rounded-lg font-medium ${
            targetOperations.length === 0 || isLoading
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isLoading ? 'Searching...' : 'Search →'}
        </button>
      </div>
    </motion.div>
  );

  // Fetch user schedule pattern for comparison
  useEffect(() => {
    if (userOperation && userLine && results.length > 0) {
      fetch("/api/schedules")
        .then(res => res.json())
        .then(schedules => {
          const schedule = schedules.find(
            (s: any) => s.GROUP === userOperation && s.LINE.toString() === userLine.toString()
          );
          if (schedule) {
            const pattern = Array.from({ length: 56 }, (_, i) => 
              schedule[`DAY_${(i + 1).toString().padStart(3, '0')}`]
            );
            setUserSchedulePattern(pattern);
          }
        })
        .catch(console.error);
    }
  }, [userOperation, userLine, results]);

  // Desktop Schedule Comparison Card Component
  const DesktopScheduleComparisonCard = ({ result, userSchedule, desiredDaysOff, startDate, index }: {
    result: any;
    userSchedule: { operation: string; line: string; pattern: string[] } | null;
    desiredDaysOff: string[];
    startDate: string;
    index: number;
  }) => {
    const [showComparison, setShowComparison] = useState(false);

    const formatShiftTime = (time: string) => {
      if (!time) return "";
      try {
        const [hours, minutes] = time.split(":");
        const hour = parseInt(hours);
        const paddedHour = hour.toString().padStart(2, '0');
        return `${paddedHour}:${minutes}`;
      } catch {
        return time;
      }
    };

    const getCompatibilityBadge = (score: number, isFromSameOp: boolean) => {
      if (isFromSameOp) {
        return { text: "Same Operation", color: "bg-green-500", textColor: "text-white" };
      } else if (score >= 10) {
        return { text: "High Match", color: "bg-blue-500", textColor: "text-white" };
      } else if (score >= 5) {
        return { text: "Good Match", color: "bg-blue-400", textColor: "text-white" };
      } else {
        return { text: "Match", color: "bg-gray-400", textColor: "text-white" };
      }
    };

    const renderComparisonView = () => {
      if (!result.schedulePattern || !userSchedule) return null;

      const start = parseISO(startDate);
      const weeksToShow = 3; // Show 3 weeks for desktop
      const daysToShow = weeksToShow * 7;

      // Find the first desired day off to center the view around
      const firstDesiredDay = parseISO(desiredDaysOff[0]);
      const daysSinceStart = Math.floor((firstDesiredDay.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const startOffset = Math.max(0, daysSinceStart - 7); // Start 1 week before first desired day

      return (
        <div className={`mt-4 ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"} rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-4">
            <h5 className={`text-lg font-medium ${styles.textPrimary}`}>Schedule Comparison</h5>
            <button
              onClick={() => setShowComparison(false)}
              className={`text-sm ${styles.textMuted} hover:${styles.textPrimary} transition-colors`}
            >
              Hide Comparison
            </button>
          </div>

          <div className="space-y-4">
            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className={styles.textMuted}>Matching Day Off</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 ${theme === "dark" ? "bg-gray-700" : "bg-gray-300"} rounded`}></div>
                <span className={styles.textMuted}>Day Off</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 ${theme === "dark" ? "bg-blue-600" : "bg-blue-500"} rounded`}></div>
                <span className={styles.textMuted}>Work Day</span>
              </div>
            </div>

            {/* Calendar comparison */}
            <div className="overflow-x-auto">
              <div className="min-w-max">
                {/* Date headers */}
                <div className="flex gap-1 mb-2">
                  <div className="w-32 flex-shrink-0"></div>
                  {Array.from({ length: daysToShow }, (_, i) => {
                    const date = addDays(start, startOffset + i);
                    const isDesiredDay = desiredDaysOff.some(d => isSameDay(parseISO(d), date));
                    return (
                      <div
                        key={i}
                        className={`w-10 text-center text-xs ${
                          isDesiredDay ? "font-bold text-green-500" : styles.textMuted
                        }`}
                      >
                        <div>{format(date, "d")}</div>
                        <div className="text-xs">{format(date, "EEE")}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Your schedule */}
                <div className="flex gap-1 mb-2">
                  <div className={`w-32 flex-shrink-0 text-sm ${styles.textMuted} py-2`}>
                    Your Line {userSchedule.line}
                  </div>
                  {Array.from({ length: daysToShow }, (_, i) => {
                    const dayIndex = (startOffset + i) % 56;
                    const shift = userSchedule.pattern[dayIndex];
                    const date = addDays(start, startOffset + i);
                    const isDesiredDay = desiredDaysOff.some(d => isSameDay(parseISO(d), date));
                    const isDayOff = shift === "----";

                    return (
                      <div
                        key={i}
                        className={`w-10 h-10 flex items-center justify-center text-xs font-medium rounded ${
                          isDayOff
                            ? isDesiredDay
                              ? "bg-green-500 text-white"
                              : theme === "dark"
                              ? "bg-gray-700 text-gray-400"
                              : "bg-gray-200 text-gray-600"
                            : theme === "dark"
                            ? "bg-blue-600 text-white"
                            : "bg-blue-500 text-white"
                        }`}
                      >
                        {isDayOff ? "-" : shift}
                      </div>
                    );
                  })}
                </div>

                {/* Target schedule */}
                <div className="flex gap-1">
                  <div className={`w-32 flex-shrink-0 text-sm ${styles.textMuted} py-2`}>
                    Line {result.line}
                  </div>
                  {Array.from({ length: daysToShow }, (_, i) => {
                    const dayIndex = (startOffset + i) % 56;
                    const shift = result.schedulePattern[dayIndex];
                    const date = addDays(start, startOffset + i);
                    const isDesiredDay = desiredDaysOff.some(d => isSameDay(parseISO(d), date));
                    const isDayOff = shift === "----";

                    return (
                      <div
                        key={i}
                        className={`w-10 h-10 flex items-center justify-center text-xs font-medium rounded ${
                          isDayOff
                            ? isDesiredDay
                              ? "bg-green-500 text-white"
                              : theme === "dark"
                              ? "bg-gray-700 text-gray-400"
                              : "bg-gray-200 text-gray-600"
                            : theme === "dark"
                            ? "bg-blue-600 text-white"
                            : "bg-blue-500 text-white"
                        }`}
                      >
                        {isDayOff ? "-" : shift}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Summary stats */}
            <div className={`grid grid-cols-2 gap-4 pt-4 border-t ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
              <div className={`text-sm ${styles.textMuted}`}>
                <span className="font-medium">Work Days:</span> {result.totalWorkDays} per cycle
              </div>
              <div className={`text-sm ${styles.textMuted}`}>
                <span className="font-medium">Days Off:</span> {56 - result.totalWorkDays} per cycle
              </div>
            </div>
          </div>
        </div>
      );
    };

    const badge = getCompatibilityBadge(result.shiftCompatibility, result.isFromSameOperation);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`${styles.cardBg} rounded-lg p-6 border ${styles.borderDefault}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h3 className={`text-xl font-bold ${styles.textPrimary}`}>
                Line {result.line} - {result.operation}
              </h3>
              <span className={`text-sm px-3 py-1 rounded ${badge.color} ${badge.textColor}`}>
                {badge.text}
              </span>
            </div>
            <p className={`text-sm ${styles.textMuted}`}>
              {result.totalWorkDays} work days per cycle
            </p>
          </div>
          <div className="text-right ml-4">
            <div className={`text-3xl font-bold ${
              result.matchPercentage === 100 ? "text-green-500" : 
              result.matchPercentage >= 75 ? "text-blue-500" : 
              result.matchPercentage >= 50 ? "text-yellow-500" : "text-orange-500"
            }`}>
              {result.matchPercentage}%
            </div>
            <div className={`text-sm ${styles.textMuted}`}>
              {result.matchCount}/{result.totalDesiredDays} days match
            </div>
          </div>
        </div>

        {/* Shift times */}
        {result.shiftTimes && result.shiftTimes.length > 0 && (
          <div className={`${theme === "dark" ? "bg-gray-800" : "bg-gray-50"} rounded-lg p-4 mb-4`}>
            <p className={`text-sm font-medium ${styles.textSecondary} mb-2`}>
              Common shift times:
            </p>
            <div className="flex flex-wrap gap-3">
              {result.shiftTimes.map((shift: any, i: number) => (
                <div key={i} className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                  <span className="font-medium">{shift.code}:</span>{" "}
                  {formatShiftTime(shift.begin)}-{formatShiftTime(shift.end)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Matched days summary */}
        {result.matchedDays && result.matchedDays.length > 0 && (
          <div className="mb-4">
            <span className={`${styles.textMuted} text-sm`}>Matched dates:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {result.matchedDays.slice(0, 10).map((date: string) => (
                <span 
                  key={date}
                  className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded text-sm"
                >
                  {format(parseISO(date), 'MMM d')}
                </span>
              ))}
              {result.matchedDays.length > 10 && (
                <span className={`text-sm ${styles.textMuted}`}>
                  +{result.matchedDays.length - 10} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className={`w-full px-4 py-3 text-sm font-medium rounded-lg ${
              theme === "dark"
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-blue-500 text-white hover:bg-blue-600"
            } transition-colors`}
          >
            {showComparison ? "Hide" : "Show"} Schedule Comparison
          </button>
        </div>

        {/* Comparison view */}
        {showComparison && renderComparisonView()}
      </motion.div>
    );
  };

  // Render results
  const renderResults = () => {

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <div className="text-center mb-8">
          <h2 className={`text-3xl font-bold mb-4 ${styles.textPrimary}`}>
            Matching Schedules Found
          </h2>
          <p className={`text-lg ${styles.textSecondary}`}>
            {results.length} schedule{results.length !== 1 ? 's' : ''} found with officers off on your selected dates
          </p>
        </div>

        <button
          onClick={() => {
            setCurrentStep(1);
            setResults([]);
            setUserOperation("");
            setUserLine("");
            setDesiredDaysOff([]);
            setTargetOperations([]);
          }}
          className={`mb-6 text-lg ${styles.textAccent} hover:underline`}
        >
          ← New Search
        </button>

        {/* Summary of selected days */}
        <div className={`${styles.cardBg} rounded-lg p-4 mb-6`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-sm ${styles.textMuted}`}>Your work days needing coverage:</span>
            {desiredDaysOff.slice(0, 8).map((day, idx) => (
              <span key={idx} className={`text-sm px-3 py-1 rounded ${
                theme === "dark" ? "bg-gray-700 text-gray-200" : "bg-blue-100 text-blue-700"
              }`}>
                {format(parseISO(day), "MMM d")}
              </span>
            ))}
            {desiredDaysOff.length > 8 && (
              <span className={`text-sm ${styles.textMuted}`}>
                +{desiredDaysOff.length - 8} more
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className={`p-4 rounded-lg ${styles.errorBg} ${styles.errorText} mb-6`}>
            {error}
          </div>
        )}

        {results.length === 0 ? (
          <div className={`${styles.warningBg} border ${styles.warningBorder} rounded-lg p-8 text-center`}>
            <p className={`${styles.warningText} text-lg mb-2`}>
              No matching schedules found
            </p>
            <p className={`${styles.warningText} text-sm`}>
              Try adjusting your search criteria or selecting different target operations.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {results.map((result, index) => (
              <DesktopScheduleComparisonCard
                key={`${result.operation}-${result.line}`}
                result={result}
                userSchedule={userSchedulePattern ? {
                  operation: userOperation,
                  line: userLine,
                  pattern: userSchedulePattern
                } : null}
                desiredDaysOff={desiredDaysOff}
                startDate={systemSettings.startDate}
                index={index}
              />
            ))}
          </div>
        )}

        <div className={`mt-8 ${styles.statCyan} rounded-lg p-6`}>
          <h4 className={`font-medium mb-3 text-lg`}>How to Use These Results</h4>
          <ol className={`list-decimal pl-5 space-y-2`}>
            <li>Contact officers from the matching schedules who are off on your needed dates</li>
            <li>Focus on higher percentage matches and same-operation schedules first</li>
            <li>Propose shift trades that work for both parties</li>
            <li>Submit trade requests through proper departmental channels</li>
            <li>Ensure both parties confirm the arrangement before the scheduled dates</li>
          </ol>
        </div>
      </motion.div>
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
        return renderDayOffSelector();
      case 4:
        return renderTargetOperationsSelector();
      case 5:
        return renderResults();
      default:
        return null;
    }
  };

  // Render desktop calendar modal
  const renderCalendarModal = () => {
    console.log('renderCalendarModal called, showCalendar:', showCalendar);
    if (!showCalendar) return null;

    const startDate = parseISO(systemSettings.startDate);
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const isWorkDay = (date: Date) => {
      if (!userScheduleData) return false;
      const daysSinceStart = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // If date is before schedule start date, it's not a work day
      if (daysSinceStart < 0) {
        return false;
      }
      
      const dayIndex = daysSinceStart % 56;
      const dayKey = `DAY_${(dayIndex + 1).toString().padStart(3, '0')}`;
      return userScheduleData[dayKey] !== "----";
    };

    const toggleDay = (date: Date) => {
      if (!isWorkDay(date)) return;
      
      const dateString = format(date, "yyyy-MM-dd");
      if (desiredDaysOff.includes(dateString)) {
        setDesiredDaysOff(desiredDaysOff.filter(d => d !== dateString));
      } else {
        setDesiredDaysOff([...desiredDaysOff, dateString]);
      }
    };

    const getDayClassName = (date: Date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const isWork = isWorkDay(date);
      const isSelected = desiredDaysOff.includes(dateStr);
      const isCurrentMonth = isSameMonth(date, currentMonth);
      
      if (!isCurrentMonth) {
        return `${theme === "dark" ? "text-gray-600" : "text-gray-400"}`;
      }
      
      if (!isWork) {
        return `${theme === "dark" ? "bg-gray-800 text-gray-500" : "bg-gray-100 text-gray-400"} cursor-not-allowed`;
      }
      
      if (isSelected) {
        return "bg-green-500 text-white hover:bg-green-600";
      }
      
      return `${theme === "dark" ? "bg-blue-900 text-blue-200 hover:bg-blue-800" : "bg-blue-50 text-blue-700 hover:bg-blue-100"} cursor-pointer`;
    };

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4" style={{zIndex: 9999}}>
        <div className={`${styles.cardBg} rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-xl font-semibold ${styles.textPrimary}`}>Select Work Days to Trade</h3>
            <button
              onClick={() => setShowCalendar(false)}
              className={`p-2 rounded-lg ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className={`mb-6 p-4 rounded-lg ${theme === "dark" ? "bg-blue-900/50" : "bg-blue-50"}`}>
            <p className={`text-sm ${theme === "dark" ? "text-blue-200" : "text-blue-700"}`}>
              Select your work days (blue) where you need coverage. We'll find officers who have those days off. Gray days are your scheduled days off.
            </p>
          </div>

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className={`p-2 rounded-lg ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h4 className={`text-lg font-medium ${styles.textPrimary}`}>
              {format(currentMonth, "MMMM yyyy")}
            </h4>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className={`p-2 rounded-lg ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 mb-6">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => (
              <div key={day} className={`text-center text-xs font-medium py-2 ${styles.textMuted}`}>
                {day}
              </div>
            ))}
            
            {/* Empty cells for alignment */}
            {Array.from({ length: days[0].getDay() }, (_, i) => (
              <div key={`empty-${i}`} />
            ))}
            
            {/* Calendar days */}
            {days.map(date => {
              const dateStr = format(date, "yyyy-MM-dd");
              const isWork = isWorkDay(date);
              const isSelected = desiredDaysOff.includes(dateStr);
              
              return (
                <button
                  key={dateStr}
                  onClick={() => toggleDay(date)}
                  disabled={!isWork}
                  className={`
                    relative h-10 rounded-lg transition-colors flex items-center justify-center
                    ${getDayClassName(date)}
                  `}
                >
                  <span className="text-sm font-medium">{format(date, "d")}</span>
                  {isWork && isSelected && (
                    <div className="absolute top-0.5 right-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected days summary */}
          {desiredDaysOff.length > 0 && (
            <div className={`mb-6 p-3 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"}`}>
              <p className={`text-sm font-medium ${styles.textPrimary} mb-2`}>
                Selected: {desiredDaysOff.length} day{desiredDaysOff.length > 1 ? "s" : ""}
              </p>
              <div className="flex flex-wrap gap-1">
                {desiredDaysOff.sort().slice(0, 8).map(day => (
                  <span
                    key={day}
                    className={`text-xs px-2 py-1 rounded ${
                      theme === "dark" ? "bg-gray-700 text-gray-200" : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {format(parseISO(day), "MMM d")}
                  </span>
                ))}
                {desiredDaysOff.length > 8 && (
                  <span className={`text-xs ${styles.textMuted}`}>
                    +{desiredDaysOff.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setDesiredDaysOff([])}
              className={`flex-1 py-2.5 rounded-lg font-medium ${
                theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"
              }`}
            >
              Clear All
            </button>
            <button
              onClick={() => setShowCalendar(false)}
              disabled={desiredDaysOff.length === 0}
              className={`flex-1 py-2.5 rounded-lg font-medium ${
                desiredDaysOff.length === 0
                  ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              Apply ({desiredDaysOff.length})
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden ${styles.bodyBg}`}>
      <div className="flex-1 overflow-auto p-8">
        {renderStepIndicator()}
        {renderCurrentStep()}
      </div>
      {renderCalendarModal()}
    </div>
  );
}