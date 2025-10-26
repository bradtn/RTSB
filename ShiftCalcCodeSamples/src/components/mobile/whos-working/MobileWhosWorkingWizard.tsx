"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import { format } from "date-fns";
import MobileHeader from "../MobileHeader";
import CoffeePreferencesModal, { checkHasCoffeePreferences } from "./CoffeePreferencesModal";

interface WorkerInfo {
  operation: string;
  line: string;
  name: string;
  shift: string;
  times?: string;
  startTime?: string;
  endTime?: string;
}

interface WhosWorkingData {
  operations: string[];
  currentTime: string;
  dayInCycle: number;
  currentlyWorking: WorkerInfo[];
  comingNext: WorkerInfo[];
  justFinished: WorkerInfo[];
  onDayOff: WorkerInfo[];
  totalEmployees: number;
}

// Operation color mapping
const getOperationColor = (operation: string) => {
  const operationLower = operation.toLowerCase();
  
  if (operationLower.includes('commercial')) {
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800';
  } else if (operationLower.includes('traffic')) {
    return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800';
  } else if (operationLower.includes('technical')) {
    return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-800';
  } else if (operationLower.includes('operation')) {
    return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 border-orange-200 dark:border-orange-800';
  } else if (operationLower.includes('maintenance')) {
    return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-red-200 dark:border-red-800';
  } else if (operationLower.includes('engineering')) {
    return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
  } else {
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
  }
};

export default function MobileWhosWorkingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const [selectedOperations, setSelectedOperations] = useState<string[]>([]);
  const [operations, setOperations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<WhosWorkingData | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'current' | 'upcoming' | 'finished' | 'off'>('current');
  const [coffeeModalOpen, setCoffeeModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<WorkerInfo | null>(null);
  const [workerCoffeeStatus, setWorkerCoffeeStatus] = useState<Map<string, {hasPreferences: boolean, hasEnabledCoffee: boolean}>>(new Map());
  const [urlInitialized, setUrlInitialized] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleOperations, setVisibleOperations] = useState<string[]>([]);

  // Filter workers based on search query and visible operations
  const filteredData = useMemo(() => {
    if (!data) return null;
    
    const filterWorkers = (workers: WorkerInfo[]) => {
      return workers.filter(worker => {
        // Filter by visible operations
        if (!visibleOperations.includes(worker.operation)) {
          return false;
        }
        
        // Filter by search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            worker.name.toLowerCase().includes(query) ||
            worker.line.toLowerCase().includes(query) ||
            worker.shift.toLowerCase().includes(query)
          );
        }
        
        return true;
      });
    };
    
    return {
      ...data,
      currentlyWorking: filterWorkers(data.currentlyWorking),
      comingNext: filterWorkers(data.comingNext),
      justFinished: filterWorkers(data.justFinished),
      onDayOff: filterWorkers(data.onDayOff)
    };
  }, [data, searchQuery, visibleOperations]);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Auto-refresh data every 5 minutes when on results page
  useEffect(() => {
    if (selectedOperations.length === 0 || !data) return;

    const refreshTimer = setInterval(() => {
      fetchWhosWorking();
    }, 5 * 60 * 1000); // Refresh every 5 minutes

    return () => clearInterval(refreshTimer);
  }, [selectedOperations, data]);

  // Fetch operations on mount and handle URL params
  useEffect(() => {
    fetchOperations();
    
    // Check URL params for selected operations
    const opsParam = searchParams.get('ops');
    const tabParam = searchParams.get('tab');
    
    if (opsParam) {
      const ops = opsParam.split(',').filter(Boolean);
      if (ops.length > 0) {
        setSelectedOperations(ops);
        setUrlInitialized(true);
        // Automatically fetch data if operations are in URL
        fetchWhosWorking(ops);
      }
    }
    
    // Set active tab from URL if present
    if (tabParam && ['current', 'upcoming', 'finished', 'off'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, []);

  // Refresh data every 5 minutes if an operation is selected
  useEffect(() => {
    if (selectedOperations.length > 0 && data) {
      const refreshTimer = setInterval(() => {
        fetchWhosWorking();
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearInterval(refreshTimer);
    }
  }, [selectedOperations, data]);

  const fetchOperations = async () => {
    try {
      const response = await fetch('/api/groups');
      if (!response.ok) throw new Error("Failed to fetch operations");
      const data = await response.json();
      setOperations(data);
    } catch (error) {
      console.error("Error fetching operations:", error);
      setError("Failed to load operations");
    }
  };

  const fetchWhosWorking = async (ops?: string[]) => {
    const operations = ops || selectedOperations;
    
    // Ensure operations is an array
    if (!operations || !Array.isArray(operations) || operations.length === 0) {
      console.error('Invalid operations:', operations);
      setError("No operations selected");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/whos-working?operations=${encodeURIComponent(operations.join(','))}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch data");
      }
      const data = await response.json();
      setData(data);
      
      // Initialize visible operations with all selected operations
      setVisibleOperations(data.operations);
      
      // Check coffee preferences for all workers
      checkAllWorkersCoffeePreferences(data);
    } catch (error) {
      console.error("Error fetching who's working:", error);
      setError(error instanceof Error ? error.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const checkAllWorkersCoffeePreferences = async (workingData: WhosWorkingData) => {
    const allWorkers = [
      ...workingData.currentlyWorking,
      ...workingData.comingNext,
      ...workingData.justFinished,
      ...workingData.onDayOff
    ].filter(w => w.shift !== 'Day Off');

    const statusMap = new Map<string, {hasPreferences: boolean, hasEnabledCoffee: boolean}>();
    
    for (const worker of allWorkers) {
      const key = `${worker.name}-${worker.operation}-${worker.line}`;
      try {
        const status = await checkHasCoffeePreferences(worker.name, worker.operation, worker.line);
        statusMap.set(key, status);
      } catch {
        statusMap.set(key, { hasPreferences: false, hasEnabledCoffee: false });
      }
    }
    
    setWorkerCoffeeStatus(statusMap);
  };

  const toggleOperation = (operation: string) => {
    setSelectedOperations(prev => {
      if (prev.includes(operation)) {
        return prev.filter(op => op !== operation);
      } else {
        return [...prev, operation];
      }
    });
  };

  const updateURL = (ops: string[], tab?: string) => {
    const params = new URLSearchParams();
    if (ops.length > 0) {
      params.set('ops', ops.join(','));
    }
    if (tab) {
      params.set('tab', tab);
    }
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  };

  const handleSubmit = async () => {
    if (selectedOperations.length === 0) {
      setError("Please select at least one operation");
      return;
    }
    
    // Update URL with selected operations and default tab
    updateURL(selectedOperations, 'current');
    
    await fetchWhosWorking(selectedOperations);
  };

  const getTabCount = (tab: string) => {
    if (!filteredData) return 0;
    switch (tab) {
      case 'current': return filteredData.currentlyWorking.length;
      case 'upcoming': return filteredData.comingNext.length;
      case 'finished': return filteredData.justFinished.length;
      case 'off': return filteredData.onDayOff.length;
      default: return 0;
    }
  };

  const renderWorkerCard = (worker: WorkerInfo) => {
    // Calculate time-based info
    const now = new Date();
    const currentTime = format(now, 'HH:mm');
    
    let timeInfo = '';
    let urgencyColor = '';
    
    if (activeTab === 'current' && worker.endTime) {
      // Calculate how much time left in shift
      const endHour = parseInt(worker.endTime.split(':')[0]);
      const endMin = parseInt(worker.endTime.split(':')[1]);
      const currentHour = parseInt(currentTime.split(':')[0]);
      const currentMin = parseInt(currentTime.split(':')[1]);
      
      let minutesLeft = (endHour * 60 + endMin) - (currentHour * 60 + currentMin);
      
      // Handle overnight shifts
      if (worker.endTime < worker.startTime! && currentTime >= worker.startTime!) {
        minutesLeft += 24 * 60;
      }
      
      if (minutesLeft < 0) minutesLeft += 24 * 60;
      
      const hoursLeft = Math.floor(minutesLeft / 60);
      const minsLeft = minutesLeft % 60;
      
      if (minutesLeft <= 60) {
        timeInfo = `Ending in ${minutesLeft} min`;
        urgencyColor = 'text-orange-600 dark:text-orange-400';
      } else {
        timeInfo = `${hoursLeft}h ${minsLeft}m left`;
      }
    } else if (activeTab === 'upcoming' && worker.startTime) {
      // Calculate time until start
      const startHour = parseInt(worker.startTime.split(':')[0]);
      const startMin = parseInt(worker.startTime.split(':')[1]);
      const currentHour = parseInt(currentTime.split(':')[0]);
      const currentMin = parseInt(currentTime.split(':')[1]);
      
      const minutesUntil = (startHour * 60 + startMin) - (currentHour * 60 + currentMin);
      
      if (minutesUntil <= 30) {
        timeInfo = `Starting in ${minutesUntil} min`;
        urgencyColor = 'text-green-600 dark:text-green-400';
      } else {
        const hoursUntil = Math.floor(minutesUntil / 60);
        const minsUntil = minutesUntil % 60;
        timeInfo = `Starts in ${hoursUntil}h ${minsUntil}m`;
      }
    }
    
    return (
      <div key={`${worker.line}-${worker.name}`} className={`p-3 rounded-lg ${styles.cardBg} border ${styles.borderDefault} transition-all duration-200 hover:shadow-md ${
        urgencyColor ? 'border-l-4 ' + (urgencyColor.includes('orange') ? 'border-l-orange-500' : 'border-l-green-500') : ''
      }`}>
        <div>
          {data?.operations.length > 1 && (
            <div className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 border ${getOperationColor(worker.operation)}`}>
              {worker.operation}
            </div>
          )}
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className={`font-semibold ${styles.textPrimary}`}>{worker.name}</div>
              <div className="flex items-center gap-2">
                <div className={`text-sm ${styles.textMuted}`}>Line {worker.line}</div>
                {timeInfo && (
                  <div className={`text-sm font-medium ${urgencyColor || styles.textMuted}`}>
                    • {timeInfo}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="text-right">
                <div className={`text-sm font-medium ${
                  worker.shift === 'Day Off' ? 'text-gray-500' : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {worker.shift}
                </div>
                {worker.times && (
                  <div className={`text-xs ${styles.textMuted}`}>{worker.times}</div>
                )}
              </div>
              {worker.shift !== 'Day Off' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedWorker(worker);
                    setCoffeeModalOpen(true);
                  }}
                  className={`p-1.5 rounded-lg transition-all ${styles.hoverOverlay} ${styles.textMuted}`}
                  title="Coffee preferences"
                >
                  <span className="text-lg">
                    {(() => {
                      const key = `${worker.name}-${worker.operation}-${worker.line}`;
                      const status = workerCoffeeStatus.get(key);
                      if (!status?.hasPreferences) {
                        return '☕'; // Default coffee icon for no preferences
                      } else if (!status.hasEnabledCoffee) {
                        return '🚫'; // No coffee icon
                      } else {
                        return '☕'; // Has enabled coffee preferences
                      }
                    })()}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (selectedOperations.length === 0 || !data) {
    return (
      <div className={`min-h-screen ${styles.bodyBg}`}>
        <div className="flex min-h-screen flex-col">
          <MobileHeader isLoading={isLoading} />
          <div className="p-4 flex-1">
            <div className="max-w-md mx-auto">
            <h1 className={`text-2xl font-bold ${styles.textPrimary} mb-6`}>Who's Working Now?</h1>
            
            <div className={`rounded-lg ${styles.cardBg} p-4 ${styles.borderDefault}`}>
              <p className={`text-sm ${styles.textMuted} mb-4`}>Select your operation to see who's currently working</p>
              
              {error && (
                <div className={`mb-4 p-3 ${styles.errorBg} ${styles.errorText} rounded-lg border ${styles.errorBorder}`}>
                  {error}
                </div>
              )}

              <div className="space-y-2 mb-4">
                {operations.map((operation) => (
                  <button
                    key={operation}
                    onClick={() => toggleOperation(operation)}
                    className={`w-full p-4 rounded-lg text-left transition-all duration-200 ${
                      selectedOperations.includes(operation) 
                        ? styles.groupButtonSelected 
                        : styles.groupButtonUnselected
                    } active:scale-[0.98]`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{operation}</span>
                      <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                        selectedOperations.includes(operation)
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-400'
                      }`}>
                        {selectedOperations.includes(operation) && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              {selectedOperations.length > 0 && (
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className={`w-full py-3 rounded-lg font-medium transition-all ${
                    isLoading 
                      ? styles.buttonDisabled 
                      : `${styles.buttonPrimary} active:scale-[0.98]`
                  }`}
                >
                  {isLoading ? 'Loading...' : `View ${selectedOperations.length} Operation${selectedOperations.length > 1 ? 's' : ''}`}
                </button>
              )}
            </div>
            
            {/* Cancel button at bottom - matching ical-download style */}
            <div className="mt-4">
              <button
                onClick={() => router.push('/')}
                className={`w-full ${theme === 'dark' 
                  ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}
                  py-3 rounded-lg font-medium`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${styles.bodyBg}`}>
      <div className="flex min-h-screen flex-col">
        <MobileHeader isLoading={isLoading} />
        <div className="flex-1">
        {/* Results Header */}
        <div className={`${styles.cardBg} shadow-sm`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => {
                // Clear data first to prevent refresh attempts
                setData(null);
                setSelectedOperations([]);
                setSearchQuery("");
                updateURL([]); // Clear URL params
              }}
              className={`text-sm ${styles.textAccent} hover:underline`}
            >
              ← Change Operations
            </button>
            <button
              onClick={() => fetchWhosWorking()}
              disabled={isLoading}
              className={`p-2 rounded-lg ${styles.buttonSecondary} ${isLoading ? 'opacity-50' : ''}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="mb-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, line, or shift..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full px-3 py-2 pl-9 rounded-lg ${styles.inputBg} ${styles.borderDefault} ${styles.textPrimary} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-2 p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* Operation Filters */}
          {data?.operations.length > 1 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                {data.operations.map((operation) => (
                  <button
                    key={operation}
                    onClick={() => {
                      setVisibleOperations(prev => {
                        if (prev.includes(operation)) {
                          // Don't allow removing all operations
                          if (prev.length > 1) {
                            return prev.filter(op => op !== operation);
                          }
                          return prev;
                        } else {
                          return [...prev, operation];
                        }
                      });
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                      visibleOperations.includes(operation)
                        ? getOperationColor(operation)
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {operation}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="text-center">
            <h1 className={`text-lg font-bold ${styles.textPrimary}`}>
              {data?.operations.length === 1 
                ? data.operations[0] 
                : `${data?.operations.length} Operations`}
            </h1>
            {data?.operations.length > 1 && (
              <p className={`text-xs ${styles.textMuted} mb-1`}>
                {data.operations.join(' • ')}
              </p>
            )}
            <p className={`text-sm ${styles.textMuted}`}>
              {format(currentTime, 'EEEE, MMM d')} • {format(currentTime, 'h:mm a')}
            </p>
            {data && (
              <>
                <p className={`text-xs ${styles.textMuted}`}>
                  Cycle Day {data.dayInCycle} of 56
                </p>
                {(searchQuery || visibleOperations.length < data.operations.length) && (
                  <p className={`text-xs ${styles.textAccent} mt-1`}>
                    Showing {
                      filteredData.currentlyWorking.length + 
                      filteredData.comingNext.length + 
                      filteredData.justFinished.length + 
                      filteredData.onDayOff.length
                    } of {
                      data.currentlyWorking.length + 
                      data.comingNext.length + 
                      data.justFinished.length + 
                      data.onDayOff.length
                    } results
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`flex border-t ${styles.borderDefault}`}>
          {[
            { id: 'current', label: 'Now', color: 'green' },
            { id: 'upcoming', label: 'Next', color: 'blue' },
            { id: 'finished', label: 'Done', color: 'gray' },
            { id: 'off', label: 'Off', color: 'purple' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                updateURL(selectedOperations, tab.id);
              }}
              className={`flex-1 py-3 text-center relative transition-colors ${
                activeTab === tab.id
                  ? `${styles.secondaryBg} ${styles.textPrimary}`
                  : styles.textMuted
              }`}
            >
              <span className="text-sm font-medium">{tab.label}</span>
              {data && getTabCount(tab.id) > 0 && (
                <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id
                    ? `text-white ${
                        tab.color === 'green' ? 'bg-green-500' : 
                        tab.color === 'blue' ? 'bg-blue-500' : 
                        tab.color === 'gray' ? 'bg-gray-500' : 
                        'bg-purple-500'
                      }`
                    : theme === 'dark' 
                      ? 'bg-gray-600 text-gray-200'
                      : 'bg-gray-400 text-white'
                }`}>
                  {getTabCount(tab.id)}
                </span>
              )}
              {activeTab === tab.id && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                  tab.color === 'green' ? 'bg-green-500' : 
                  tab.color === 'blue' ? 'bg-blue-500' : 
                  tab.color === 'gray' ? 'bg-gray-500' : 
                  'bg-purple-500'
                }`} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-20">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
            {error}
          </div>
        ) : filteredData ? (
          <div className="space-y-3">
            {/* Show no results message if search/filter returns nothing */}
            {searchQuery || visibleOperations.length < data.operations.length ? (
              filteredData.currentlyWorking.length === 0 && 
              filteredData.comingNext.length === 0 && 
              filteredData.justFinished.length === 0 && 
              filteredData.onDayOff.length === 0 ? (
                <div className={`text-center py-8 ${styles.textMuted}`}>
                  <svg className="w-16 h-16 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="mb-2">No results found</p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setVisibleOperations(data.operations);
                    }}
                    className={`text-sm ${styles.textAccent} hover:underline`}
                  >
                    Clear filters
                  </button>
                </div>
              ) : null
            ) : null}
            
            {activeTab === 'current' && (
              filteredData.currentlyWorking.length > 0 ? (
                <>
                  {/* Group by time remaining */}
                  {(() => {
                    const endingSoon = filteredData.currentlyWorking.filter(w => {
                      if (!w.endTime) return false;
                      const now = new Date();
                      const currentTime = format(now, 'HH:mm');
                      const endHour = parseInt(w.endTime.split(':')[0]);
                      const endMin = parseInt(w.endTime.split(':')[1]);
                      const currentHour = parseInt(currentTime.split(':')[0]);
                      const currentMin = parseInt(currentTime.split(':')[1]);
                      let minutesLeft = (endHour * 60 + endMin) - (currentHour * 60 + currentMin);
                      if (w.endTime < w.startTime! && currentTime >= w.startTime!) {
                        minutesLeft += 24 * 60;
                      }
                      if (minutesLeft < 0) minutesLeft += 24 * 60;
                      return minutesLeft <= 60;
                    });
                    
                    const others = filteredData.currentlyWorking.filter(w => !endingSoon.includes(w));
                    
                    return (
                      <>
                        {endingSoon.length > 0 && (
                          <>
                            <p className={`text-sm font-medium ${styles.textMuted} mb-2 flex items-center gap-2`}>
                              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                              Ending Soon ({endingSoon.length})
                            </p>
                            <div className="mb-4 space-y-2">
                              {endingSoon.map(renderWorkerCard)}
                            </div>
                          </>
                        )}
                        {others.length > 0 && (
                          <>
                            <p className={`text-sm font-medium ${styles.textMuted} mb-2`}>
                              Currently Working ({others.length})
                            </p>
                            <div className="space-y-2">
                              {others.map(renderWorkerCard)}
                            </div>
                          </>
                        )}
                      </>
                    );
                  })()}
                </>
              ) : (
                <div className={`text-center py-8 ${styles.textMuted}`}>
                  <svg className="w-16 h-16 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p>No one is currently working</p>
                </div>
              )
            )}

            {activeTab === 'upcoming' && (
              filteredData.comingNext.length > 0 ? (
                <>
                  <p className={`text-sm ${styles.textMuted} mb-2`}>
                    Starting within the next 2 hours
                  </p>
                  {filteredData.comingNext.map(renderWorkerCard)}
                </>
              ) : (
                <div className={`text-center py-8 ${styles.textMuted}`}>
                  <p>No one starting in the next 2 hours</p>
                </div>
              )
            )}

            {activeTab === 'finished' && (
              filteredData.justFinished.length > 0 ? (
                <>
                  <p className={`text-sm ${styles.textMuted} mb-2`}>
                    Finished within the last hour
                  </p>
                  {filteredData.justFinished.map(renderWorkerCard)}
                </>
              ) : (
                <div className={`text-center py-8 ${styles.textMuted}`}>
                  <p>No one finished in the last hour</p>
                </div>
              )
            )}

            {activeTab === 'off' && (
              filteredData.onDayOff.length > 0 ? (
                <>
                  <p className={`text-sm ${styles.textMuted} mb-2`}>
                    {filteredData.onDayOff.length} {filteredData.onDayOff.length === 1 ? 'person' : 'people'} off today
                  </p>
                  {filteredData.onDayOff.map(renderWorkerCard)}
                </>
              ) : (
                <div className={`text-center py-8 ${styles.textMuted}`}>
                  <p>No one is off today</p>
                </div>
              )
            )}
          </div>
        ) : null}

        {/* Summary Stats */}
        {data && data.totalEmployees > 0 && (
          <div className={`mt-6 p-4 rounded-lg ${styles.statBlue}`}>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className={`text-2xl font-bold ${styles.textPrimary}`}>
                  {filteredData.currentlyWorking.length}
                </div>
                <div className={`text-xs ${styles.textMuted}`}>Working Now</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${styles.textPrimary}`}>
                  {data.totalEmployees}
                </div>
                <div className={`text-xs ${styles.textMuted}`}>Total Assigned</div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Coffee Preferences Modal */}
      {selectedWorker && (
        <CoffeePreferencesModal
          isOpen={coffeeModalOpen}
          onClose={async () => {
            setCoffeeModalOpen(false);
            // Refresh coffee status for this worker
            if (selectedWorker) {
              const key = `${selectedWorker.name}-${selectedWorker.operation}-${selectedWorker.line}`;
              try {
                const status = await checkHasCoffeePreferences(
                  selectedWorker.name, 
                  selectedWorker.operation, 
                  selectedWorker.line
                );
                setWorkerCoffeeStatus(prev => new Map(prev).set(key, status));
              } catch {}
            }
            setSelectedWorker(null);
          }}
          employeeName={selectedWorker.name}
          operation={selectedWorker.operation}
          line={selectedWorker.line}
        />
      )}
        </div>
      </div>
    </div>
  );
}