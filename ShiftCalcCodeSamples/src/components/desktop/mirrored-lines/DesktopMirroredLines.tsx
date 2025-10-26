// src/components/desktop/mirrored-lines/DesktopMirroredLines.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import { useMirroredLines } from "@/contexts/MirroredLinesContext";
import { motion } from "framer-motion";
import { parseISO, format } from "date-fns";

interface DesktopMirroredLinesProps {
  // Props are kept for compatibility but not used since ProtectedLayout handles the header
}

interface Schedule {
  id: number;
  GROUP: string;
  LINE: string;
  shiftPattern?: string;
  [key: string]: any;
}

export default function DesktopMirroredLines() {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  
  // Use the MirroredLinesContext
  const {
    operations,
    selectedOperation,
    setSelectedOperation,
    lineNumber,
    setLineNumber,
    targetOperations,
    setTargetOperations,
    loading,
    error,
    userLine,
    mirrorResults,
    fetchMirrorLines,
    resetSteps
  } = useMirroredLines();
  
  // Local state for UI flow
  const [currentStep, setCurrentStep] = useState<'operation' | 'line' | 'target' | 'results'>('operation');
  const [availableLines, setAvailableLines] = useState<Schedule[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<number | null>(null);
  const [isLoadingLines, setIsLoadingLines] = useState(false);
  const [showDetailView, setShowDetailView] = useState(false);
  const [selectedDetailResult, setSelectedDetailResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'different' | 'workoff' | 'same'>('all');
  const [searchLineNumber, setSearchLineNumber] = useState('');
  const [searchLineInSelection, setSearchLineInSelection] = useState('');
  
  
  // When operation is selected, fetch lines for that operation
  useEffect(() => {
    if (selectedOperation && currentStep === 'line') {
      fetchLinesForOperation();
    }
  }, [selectedOperation, currentStep]);

  const fetchLinesForOperation = async () => {
    setIsLoadingLines(true);
    
    try {
      const response = await fetch("/api/schedules");
      if (!response.ok) {
        throw new Error("Failed to fetch schedules");
      }
      
      const data = await response.json();
      if (Array.isArray(data)) {
        const filteredLines = data
          .filter(schedule => schedule.GROUP === selectedOperation && schedule.LINE)
          .sort((a, b) => {
            const lineA = Number(a.LINE);
            const lineB = Number(b.LINE);
            if (!isNaN(lineA) && !isNaN(lineB)) {
              return lineA - lineB;
            }
            return String(a.LINE).localeCompare(String(b.LINE));
          });
        setAvailableLines(filteredLines);
      }
    } catch (err) {
      console.error("Failed to load lines:", err);
    } finally {
      setIsLoadingLines(false);
    }
  };

  const handleOperationSelect = (operation: string) => {
    setSelectedOperation(operation);
    setCurrentStep('line');
  };

  const handleLineSelect = async (line: Schedule) => {
    setSelectedLineId(line.id);
    setLineNumber(line.LINE);
    setCurrentStep('target');
  };

  const handleTargetOperationsSelect = async () => {
    if (selectedLineId) {
      setCurrentStep('results');
      await fetchMirrorLines(selectedLineId);
    }
  };

  const handleNewSearch = () => {
    // Preserve detail view state
    const preserveDetailView = showDetailView;
    const preserveDetailResult = selectedDetailResult;
    const preserveActiveTab = activeTab;
    
    resetSteps();
    setCurrentStep('operation');
    setSelectedLineId(null);
    setAvailableLines([]);
    setTargetOperations([]);
    setSearchLineNumber(''); // Clear search when starting new search
    setSearchLineInSelection(''); // Clear line selection search
    
    // Restore detail view state if it was open
    if (preserveDetailView) {
      setShowDetailView(true);
      setSelectedDetailResult(preserveDetailResult);
      setActiveTab(preserveActiveTab);
    }
  };

  const handleToggleTargetOperation = (operation: string) => {
    setTargetOperations(prev => 
      prev.includes(operation) 
        ? prev.filter(op => op !== operation)
        : [...prev, operation]
    );
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'line':
        setCurrentStep('operation');
        setSearchLineInSelection(''); // Clear line search when going back
        break;
      case 'target':
        setCurrentStep('line');
        break;
      case 'results':
        setCurrentStep('target');
        break;
    }
  };

  const handleViewDetails = (result: any, event?: React.MouseEvent) => {
    // Prevent any context state changes from interfering
    event?.preventDefault?.();
    event?.stopPropagation?.();
    
    // Set the state
    setSelectedDetailResult(result);
    setActiveTab('all'); // Reset tab when opening detail view
    setShowDetailView(true);
  };

  const formatPercent = (value: number) => {
    return `${Math.round(value)}%`;
  };
  
  // Format date string for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM d');
    } catch {
      return dateString;
    }
  };

  const getScoreColor = (score: number) => {
    const roundedScore = Math.round(score || 0);
    if (roundedScore >= 85) return 'bg-emerald-500 text-white';
    if (roundedScore >= 70) return 'bg-green-500 text-white';
    if (roundedScore >= 60) return 'bg-blue-500 text-white';
    if (roundedScore >= 50) return 'bg-yellow-500 text-black';
    if (roundedScore >= 40) return 'bg-orange-500 text-white';
    return 'bg-red-500 text-white';
  };

  // Filter comparisons based on active tab
  const getFilteredComparisons = () => {
    if (!selectedDetailResult || !selectedDetailResult.shiftComparison) return [];
    
    return selectedDetailResult.shiftComparison.filter((comparison: any) => {
      if (activeTab === 'all') return true;
      if (activeTab === 'different') return comparison.isDifferent && !comparison.isWorkDayMismatch;
      if (activeTab === 'workoff') return comparison.isWorkDayMismatch;
      if (activeTab === 'same') return !comparison.isDifferent && !comparison.isWorkDayMismatch;
      return true;
    });
  };

  // Filter mirrored results by line number search
  const getFilteredResults = () => {
    if (!searchLineNumber.trim()) return mirrorResults;
    
    return mirrorResults.filter((result) => 
      result.line.LINE.toString().toLowerCase().includes(searchLineNumber.toLowerCase())
    );
  };

  // Filter available lines during selection by line number search
  const getFilteredAvailableLines = () => {
    if (!searchLineInSelection.trim()) return availableLines;
    
    return availableLines.filter((line) => 
      line.LINE.toString().toLowerCase().includes(searchLineInSelection.toLowerCase())
    );
  };

  const getStepInfo = () => {
    switch (currentStep) {
      case 'operation':
        return {
          title: "Select Your Operation",
          description: "Choose your current operation to begin finding mirror lines.",
          tips: [
            "Select your assigned operation",
            "This helps narrow down to your specific lines",
            "Each operation has different shift patterns",
            "Choose the operation you currently work in"
          ]
        };
      case 'line':
        return {
          title: "Select Your Line",
          description: "Choose your current line number within your operation.",
          tips: [
            "Select your assigned line number",
            "Lines are sorted numerically",
            "Your line determines your shift pattern",
            "This will be used to find matching lines"
          ]
        };
      case 'target':
        return {
          title: "Select Target Operations",
          description: "Choose which operations to search for mirror lines.",
          tips: [
            "Select one or more operations to search",
            "More operations = more potential matches",
            "Consider operations with different shift types",
            "Leave empty to search all operations"
          ]
        };
      case 'results':
        return {
          title: "Mirrored Lines Found",
          description: "Lines with matching days but different shift types for easy trades.",
          tips: [
            "Higher scores mean better matches",
            "Look for lines with opposite shift types",
            "Contact officers on matching lines",
            "Arrange mutually beneficial trades",
            "Submit trade requests through proper channels"
          ]
        };
      default:
        return {
          title: "Mirrored Lines",
          description: "Find lines with matching schedules.",
          tips: []
        };
    }
  };

  const stepInfo = getStepInfo();

  return (
    <div className={`flex flex-col h-full overflow-hidden ${styles.bodyBg}`}>
      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className={`w-1/4 h-full overflow-auto ${styles.secondaryBg} p-4 space-y-4`}>
          {/* Step info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg p-5 shadow-md ${styles.cardBg} border ${styles.borderDefault}`}
          >
            <h3 className={`font-bold text-lg mb-3 ${styles.textPrimary}`}>
              {stepInfo.title}
            </h3>
            <p className={`mb-4 ${styles.textSecondary}`}>
              {stepInfo.description}
            </p>
            
            <div className={`${styles.purpleHeader} p-3 rounded-lg`}>
              <h4 className={`font-medium mb-2`}>Pro Tips</h4>
              <ul className={`list-disc pl-5 text-sm space-y-1`}>
                {stepInfo.tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          </motion.div>
          
          {/* Selection summary */}
          {selectedOperation && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-lg p-5 shadow-md ${styles.cardBg} border ${styles.borderDefault}`}
            >
              <h3 className={`font-bold text-lg mb-3 ${styles.textPrimary}`}>
                Your Selection
              </h3>
              
              <div className={`p-3 rounded ${styles.tertiaryBg} mb-3`}>
                <p className={`text-sm ${styles.textMuted} mb-1`}>Operation</p>
                <p className={`font-medium ${styles.textPrimary}`}>
                  {selectedOperation}
                </p>
              </div>
              
              {lineNumber && (
                <div className={`p-3 rounded ${styles.tertiaryBg} mb-3`}>
                  <p className={`text-sm ${styles.textMuted} mb-1`}>Line</p>
                  <p className={`font-medium ${styles.textPrimary}`}>
                    {lineNumber}
                  </p>
                </div>
              )}
              
              {targetOperations.length > 0 && (
                <div className={`p-3 rounded ${styles.tertiaryBg}`}>
                  <p className={`text-sm ${styles.textMuted} mb-1`}>Target Operations</p>
                  <p className={`font-medium ${styles.textPrimary}`}>
                    {targetOperations.join(', ')}
                  </p>
                </div>
              )}
              
              <button
                onClick={handleNewSearch}
                className={`mt-4 text-sm ${styles.textAccent} hover:underline`}
              >
                Start New Search
              </button>
            </motion.div>
          )}
          
          {/* Results summary */}
          {currentStep === 'results' && getFilteredResults().length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`rounded-lg p-5 shadow-md ${styles.cardBg} border ${styles.borderDefault}`}
            >
              <h3 className={`font-bold text-lg mb-3 ${styles.textPrimary}`}>
                Results Summary
              </h3>
              
              <div className="space-y-2">
                <div className={`p-2 rounded ${styles.statPurple}`}>
                  <p className="text-2xl font-bold">{getFilteredResults().length}</p>
                  <p className="text-sm">{searchLineNumber ? 'Filtered Results' : 'Matching Lines Found'}</p>
                  {searchLineNumber && (
                    <p className="text-xs opacity-75">of {mirrorResults.length} total</p>
                  )}
                </div>
                
                <div className={`p-2 rounded ${styles.statTeal}`}>
                  <p className="text-lg font-semibold">
                    {Math.max(...getFilteredResults().map(r => r.meaningfulTradeScore || 0))}%
                  </p>
                  <p className="text-sm">Best Match Score</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Main content */}
        <div className="flex-1 h-full overflow-auto p-6">
          {/* Operation Selection */}
          {currentStep === 'operation' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-4xl mx-auto"
            >
              <h2 className={`text-2xl font-bold mb-6 ${styles.textPrimary}`}>
                Select Your Operation
              </h2>
              
              {loading && operations.length === 0 ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
              ) : error ? (
                <div className={`p-4 rounded-lg ${styles.errorBg} ${styles.errorText}`}>
                  {error}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {operations.map((operation) => (
                    <motion.button
                      key={operation}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleOperationSelect(operation)}
                      className={`
                        p-6 rounded-lg transition-all font-medium text-lg
                        ${selectedOperation === operation 
                          ? styles.groupButtonSelected 
                          : styles.groupButtonUnselected
                        }
                      `}
                    >
                      {operation}
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Line Selection */}
          {currentStep === 'line' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-4xl mx-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${styles.textPrimary}`}>
                  Select Your Line in {selectedOperation}
                </h2>
                <button
                  onClick={handleBack}
                  className={`${styles.buttonSecondary} px-4 py-2 rounded-lg`}
                >
                  Back
                </button>
              </div>
              
              {/* Search Input for Line Selection */}
              <div className="mb-6">
                <div className="relative max-w-md">
                  <input
                    type="text"
                    placeholder="Search for your line number..."
                    value={searchLineInSelection}
                    onChange={(e) => setSearchLineInSelection(e.target.value)}
                    className={`
                      w-full px-4 py-3 pl-10 rounded-lg border transition-colors
                      ${styles.cardBg} ${styles.borderDefault} ${styles.textPrimary}
                      focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800
                      placeholder:${styles.textMuted}
                    `}
                  />
                  <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${styles.textMuted}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  {searchLineInSelection && (
                    <button
                      onClick={() => setSearchLineInSelection('')}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${styles.textMuted} hover:${styles.textPrimary}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                {searchLineInSelection && (
                  <p className={`mt-2 text-sm ${styles.textMuted}`}>
                    Showing {getFilteredAvailableLines().length} of {availableLines.length} lines
                  </p>
                )}
              </div>
              
              {isLoadingLines ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
              ) : availableLines.length === 0 ? (
                <div className={`p-4 rounded-lg ${styles.warningBg} ${styles.warningText}`}>
                  No lines found for {selectedOperation}. Please go back and select a different operation.
                </div>
              ) : getFilteredAvailableLines().length === 0 ? (
                <div className={`p-4 rounded-lg ${styles.warningBg} ${styles.warningText} text-center`}>
                  <p>No lines found matching "{searchLineInSelection}".</p>
                  <button
                    onClick={() => setSearchLineInSelection('')}
                    className={`mt-3 ${styles.buttonSecondary} px-4 py-2 rounded-lg`}
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                  {getFilteredAvailableLines().map((line) => (
                    <motion.button
                      key={line.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleLineSelect(line)}
                      className={`
                        p-4 rounded transition-all font-medium text-lg
                        ${selectedLineId === line.id 
                          ? styles.groupButtonSelected 
                          : styles.groupButtonUnselected
                        }
                      `}
                    >
                      {line.LINE}
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Target Operation Selection */}
          {currentStep === 'target' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-4xl mx-auto"
            >
              <h2 className={`text-2xl font-bold mb-6 ${styles.textPrimary}`}>
                Select Target Operations to Search
              </h2>
              
              <p className={`mb-6 ${styles.textSecondary}`}>
                Select which operations you want to search for mirror lines. Leave empty to search all operations.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {operations.map((operation) => (
                  <motion.button
                    key={operation}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleToggleTargetOperation(operation)}
                    className={`
                      p-4 rounded-lg transition-all font-medium
                      ${targetOperations.includes(operation)
                        ? styles.groupButtonSelected 
                        : styles.groupButtonUnselected
                      }
                    `}
                  >
                    {operation}
                  </motion.button>
                ))}
              </div>
              
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleBack}
                  className={`${styles.buttonSecondary} px-6 py-3 rounded-lg`}
                >
                  Back
                </button>
                <button
                  onClick={handleTargetOperationsSelect}
                  className={`${styles.buttonPrimary} px-6 py-3 rounded-lg`}
                >
                  Find Mirror Lines
                </button>
              </div>
            </motion.div>
          )}

          {/* Results View */}
          {currentStep === 'results' && !showDetailView && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-5xl mx-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${styles.textPrimary}`}>
                  Mirrored Lines for {userLine?.GROUP} - Line {userLine?.LINE}
                </h2>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleBack}
                    className={`${styles.buttonSecondary} px-4 py-2 rounded-lg`}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNewSearch}
                    className={`${styles.buttonPrimary} px-4 py-2 rounded-lg`}
                  >
                    New Search
                  </button>
                </div>
              </div>
              
              {/* Search Input */}
              <div className="mb-6">
                <div className="relative max-w-md">
                  <input
                    type="text"
                    placeholder="Search by line number..."
                    value={searchLineNumber}
                    onChange={(e) => setSearchLineNumber(e.target.value)}
                    className={`
                      w-full px-4 py-3 pl-10 rounded-lg border transition-colors
                      ${styles.cardBg} ${styles.borderDefault} ${styles.textPrimary}
                      focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800
                      placeholder:${styles.textMuted}
                    `}
                  />
                  <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${styles.textMuted}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  {searchLineNumber && (
                    <button
                      onClick={() => setSearchLineNumber('')}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${styles.textMuted} hover:${styles.textPrimary}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                {searchLineNumber && (
                  <p className={`mt-2 text-sm ${styles.textMuted}`}>
                    Showing results for "{searchLineNumber}" ({getFilteredResults().length} of {mirrorResults.length} results)
                  </p>
                )}
              </div>
              
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
              ) : mirrorResults.length === 0 ? (
                <div className={`${styles.warningBg} border ${styles.warningBorder} rounded-lg p-6 text-center`}>
                  <p className={`${styles.warningText}`}>
                    No mirrored lines found for this schedule.
                  </p>
                  <p className={`${styles.warningText} text-sm mt-2`}>
                    Try selecting a different line or check back later.
                  </p>
                </div>
              ) : getFilteredResults().length === 0 ? (
                <div className={`${styles.warningBg} border ${styles.warningBorder} rounded-lg p-6 text-center`}>
                  <p className={`${styles.warningText}`}>
                    {searchLineNumber ? `No results found for line "${searchLineNumber}".` : 'No mirrored lines found for this schedule.'}
                  </p>
                  <p className={`${styles.warningText} text-sm mt-2`}>
                    {searchLineNumber ? 'Try a different search term or clear the search.' : 'Try selecting a different line or check back later.'}
                  </p>
                  {searchLineNumber && (
                    <button
                      onClick={() => setSearchLineNumber('')}
                      className={`mt-3 ${styles.buttonSecondary} px-4 py-2 rounded-lg`}
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {getFilteredResults().map((result, index) => (
                    <div
                      key={index}
                      className={`${styles.cardBg} rounded-lg border ${styles.borderDefault} p-2 cursor-pointer transition-all duration-200 hover:border-blue-500 hover:ring-2 hover:ring-blue-200 dark:hover:ring-blue-800`}
                      onClick={(e) => handleViewDetails(result, e)}
                    >
                      <div className="flex items-start justify-between p-5">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h4 className={`font-semibold text-lg ${styles.textPrimary}`}>
                              {result.line.GROUP} - Line {result.line.LINE}
                            </h4>
                            {/* User Pattern Score Badge */}
                            <span className={`
                              px-3 py-1 rounded-full text-sm font-medium
                              ${getScoreColor(result.userShiftPatternScore || 0)}
                            `}>
                              {formatPercent(result.userShiftPatternScore || 0)} Pattern Match
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                            {/* User Pattern */}
                            <div>
                              <span className={`text-sm ${styles.textMuted}`}>User Pattern</span>
                              <div className="flex flex-col">
                                <p className={`font-medium ${styles.textPrimary}`}>
                                  {formatPercent(result.userShiftPatternScore || 0)}
                                </p>
                                {(() => {
                                  const percent = result.userShiftPatternScore || 0;
                                  const totalOnDays = result.shiftComparison ? 
                                    result.shiftComparison.filter((day: any) => day.userShift !== '----').length : 
                                    (result.sameCategoryCount + result.differentCategoryCount);
                                  const matchDays = Math.round(percent * totalOnDays / 100);
                                  return (
                                    <span className={`text-xs ${styles.textMuted}`}>
                                      {matchDays}/{totalOnDays} days
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                            {/* Different Shifts */}
                            <div>
                              <span className={`text-sm ${styles.textMuted}`}>Different</span>
                              <p className={`font-medium ${styles.textPrimary}`}>
                                {result.differentCategoryCount} days
                              </p>
                            </div>
                            {/* Significant Differences */}
                            <div>
                              <span className={`text-sm ${styles.textMuted}`}>Sig. Diff</span>
                              <p className={`font-medium ${styles.textPrimary}`}>
                                {result.significantDifferenceCount || 0} days
                              </p>
                            </div>
                            {/* Overall Score */}
                            <div>
                              <span className={`text-sm ${styles.textMuted}`}>Overall Score</span>
                              <p className={`font-medium ${styles.textPrimary}`}>
                                {Math.round(result.meaningfulTradeScore || 0)}%
                              </p>
                            </div>
                          </div>

                          {/* Click to view details hint */}
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <p className={`text-sm ${styles.textMuted} italic flex items-center gap-2`}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Click to view detailed day-by-day comparison
                            </p>
                          </div>
                        </div>
                        
                        {/* User Pattern Score Circle */}
                        <div className="ml-4">
                          <div className={`
                            w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold
                            ${getScoreColor(result.userShiftPatternScore || 0)}
                          `}>
                            {Math.round(result.userShiftPatternScore || 0)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* How to Trade Shifts */}
              {mirrorResults.length > 0 && (
                <div className={`mt-6 ${styles.statCyan} rounded-lg p-4`}>
                  <h4 className={`font-medium mb-2`}>How to Trade Shifts</h4>
                  <ol className={`list-decimal pl-5 text-sm space-y-1`}>
                    <li>Contact officers on matching lines</li>
                    <li>Propose trading your shift types while keeping same days</li>
                    <li>Both parties maintain their days off</li>
                    <li>Submit trade request through official channels</li>
                    <li>Get supervisor approval if required</li>
                  </ol>
                </div>
              )}
            </motion.div>
          )}

          {/* Detail View */}
          {currentStep === 'results' && showDetailView && selectedDetailResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-5xl mx-auto"
            >
              {/* Back to Results Button */}
              <div className="mb-6">
                <button
                  onClick={() => {
                    setShowDetailView(false);
                    setSelectedDetailResult(null);
                  }}
                  className={`${styles.buttonSecondary} px-4 py-2 rounded-lg flex items-center gap-2`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  ← Back to Results
                </button>
              </div>

              {/* Detail Header */}
              <div className={`${styles.cardBg} rounded-lg border ${styles.borderDefault} p-6 mb-6`}>
                <div className="flex items-center gap-4 mb-4">
                  <h2 className={`text-xl font-bold ${styles.textPrimary}`}>
                    Mirror Line Details: {selectedDetailResult.line.GROUP} - Line {selectedDetailResult.line.LINE}
                  </h2>
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                    ${getScoreColor(selectedDetailResult.userShiftPatternScore || 0)}
                  `}>
                    {Math.round(selectedDetailResult.userShiftPatternScore || 0)}%
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`${styles.cardBg} p-4 rounded-lg border ${styles.borderDefault}`}>
                    <div className={`text-sm ${styles.textMuted} mb-1`}>User Pattern Match</div>
                    <div className={`text-2xl font-bold ${styles.textPrimary}`}>
                      {formatPercent(selectedDetailResult.userShiftPatternScore || 0)}
                    </div>
                    {(() => {
                      const percent = selectedDetailResult.userShiftPatternScore || 0;
                      const totalOnDays = selectedDetailResult.shiftComparison ? 
                        selectedDetailResult.shiftComparison.filter((day: any) => day.userShift !== '----').length : 
                        (selectedDetailResult.sameCategoryCount + selectedDetailResult.differentCategoryCount);
                      const matchDays = Math.round(percent * totalOnDays / 100);
                      return (
                        <div className={`text-sm ${styles.textMuted}`}>
                          {matchDays} of {totalOnDays} work days match
                        </div>
                      );
                    })()}
                  </div>
                  
                  <div className={`${styles.cardBg} p-4 rounded-lg border ${styles.borderDefault}`}>
                    <div className={`text-sm ${styles.textMuted} mb-1`}>Different Shifts</div>
                    <div className={`text-2xl font-bold ${styles.textPrimary}`}>
                      {selectedDetailResult.differentCategoryCount}
                    </div>
                    <div className={`text-sm ${styles.textMuted}`}>days with different shift types</div>
                  </div>
                  
                  <div className={`${styles.cardBg} p-4 rounded-lg border ${styles.borderDefault}`}>
                    <div className={`text-sm ${styles.textMuted} mb-1`}>Significant Differences</div>
                    <div className={`text-2xl font-bold ${styles.textPrimary}`}>
                      {selectedDetailResult.significantDifferenceCount || 0}
                    </div>
                    <div className={`text-sm ${styles.textMuted}`}>large time differences</div>
                  </div>
                  
                  <div className={`${styles.cardBg} p-4 rounded-lg border ${styles.borderDefault}`}>
                    <div className={`text-sm ${styles.textMuted} mb-1`}>Overall Score</div>
                    <div className={`text-2xl font-bold ${styles.textPrimary}`}>
                      {Math.round(selectedDetailResult.meaningfulTradeScore || 0)}%
                    </div>
                    <div className={`text-sm ${styles.textMuted}`}>trade potential</div>
                  </div>
                </div>
              </div>

              {/* Day-by-Day Comparison */}
              {selectedDetailResult.shiftComparison && (
                <div className={`${styles.cardBg} rounded-lg border ${styles.borderDefault} p-6`}>
                  <h3 className={`text-lg font-semibold ${styles.textPrimary} mb-4`}>
                    Day-by-Day Comparison
                  </h3>
                  
                  {/* Filter Tabs */}
                  <div className={`grid grid-cols-4 gap-2 mb-4 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100'} p-2 rounded-lg`}>
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                        activeTab === 'all'
                          ? (theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                          : (theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                      }`}
                    >
                      All Days ({selectedDetailResult.shiftComparison.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('different')}
                      className={`py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                        activeTab === 'different'
                          ? (theme === 'dark' ? 'bg-yellow-600 text-white' : 'bg-yellow-500 text-white')
                          : (theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                      }`}
                    >
                      Different ({selectedDetailResult.shiftComparison.filter((day: any) => day.isDifferent && !day.isWorkDayMismatch).length})
                    </button>
                    <button
                      onClick={() => setActiveTab('workoff')}
                      className={`py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                        activeTab === 'workoff'
                          ? (theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                          : (theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                      }`}
                    >
                      Work/Off ({selectedDetailResult.shiftComparison.filter((day: any) => day.isWorkDayMismatch).length})
                    </button>
                    <button
                      onClick={() => setActiveTab('same')}
                      className={`py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                        activeTab === 'same'
                          ? (theme === 'dark' ? 'bg-green-600 text-white' : 'bg-green-500 text-white')
                          : (theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                      }`}
                    >
                      Identical ({selectedDetailResult.shiftComparison.filter((day: any) => !day.isDifferent && !day.isWorkDayMismatch).length})
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <div className={`w-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm overflow-hidden`}>
                      {/* Table Header */}
                      <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} px-4 py-3 grid grid-cols-4 gap-4 text-sm font-medium ${styles.textSecondary}`}>
                        <div>Date</div>
                        <div>Your Shift</div>
                        <div>Mirror Shift</div>
                        <div>Difference</div>
                      </div>
                      
                      {/* Table Body */}
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {getFilteredComparisons().map((day: any, index: number) => (
                          <div 
                            key={index}
                            className={`px-4 py-3 grid grid-cols-4 gap-4 items-center ${
                              day.isDifferent
                                ? (theme === 'dark' ? 'bg-yellow-800/30' : 'bg-yellow-200')
                                : day.isWorkDayMismatch
                                  ? (theme === 'dark' ? 'bg-blue-800/30' : 'bg-blue-200')
                                  : ''
                            }`}
                          >
                            <div className={`font-medium ${styles.textPrimary}`}>
                              {formatDate(day.date || '') || `Day ${day.day}`}
                            </div>
                            <div>
                              <div className={`font-mono font-bold text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                                {day.userShift}
                              </div>
                              {day.userTime && (
                                <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>
                                  {day.userTime}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className={`font-mono font-bold text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                                {day.otherShift}
                              </div>
                              {day.otherTime && (
                                <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>
                                  {day.otherTime}
                                </div>
                              )}
                            </div>
                            <div>
                              {day.isWorkDayMismatch ? (
                                <div className="text-xs font-bold px-2 py-1 rounded-md bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-100 shadow-sm text-center">
                                  Work/Off
                                </div>
                              ) : day.isDifferent ? (
                                <div className="text-xs font-bold px-2 py-1 rounded-md bg-yellow-200 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-100 shadow-sm text-center">
                                  Different
                                </div>
                              ) : (
                                <div className="text-xs font-bold px-2 py-1 rounded-md bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-100 shadow-sm text-center">
                                  Identical
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {getFilteredComparisons().length === 0 && (
                          <div className="p-4 text-center text-sm">
                            <p className={styles.textSecondary}>No matching days found.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {false && selectedDetailResult && (
        <div className="fixed inset-0 bg-blue-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className={`${styles.cardBg} rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b ${styles.borderDefault} flex items-center justify-between`}>
              <div className="flex items-center gap-4">
                <h2 className={`text-xl font-bold ${styles.textPrimary}`}>
                  Mirror Line Details: {selectedDetailResult.line.GROUP} - Line {selectedDetailResult.line.LINE}
                </h2>
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                  ${getScoreColor(selectedDetailResult.userShiftPatternScore || 0)}
                `}>
                  {Math.round(selectedDetailResult.userShiftPatternScore || 0)}%
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className={`${styles.textMuted} hover:${styles.textPrimary} text-2xl`}
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className={`${styles.cardBg} p-4 rounded-lg border ${styles.borderDefault}`}>
                  <div className={`text-sm ${styles.textMuted} mb-1`}>User Pattern Match</div>
                  <div className={`text-2xl font-bold ${styles.textPrimary}`}>
                    {formatPercent(selectedDetailResult.userShiftPatternScore || 0)}
                  </div>
                  {(() => {
                    const percent = selectedDetailResult.userShiftPatternScore || 0;
                    const totalOnDays = selectedDetailResult.shiftComparison ? 
                      selectedDetailResult.shiftComparison.filter((day: any) => day.userShift !== '----').length : 
                      (selectedDetailResult.sameCategoryCount + selectedDetailResult.differentCategoryCount);
                    const matchDays = Math.round(percent * totalOnDays / 100);
                    return (
                      <div className={`text-sm ${styles.textMuted}`}>
                        {matchDays} of {totalOnDays} work days match
                      </div>
                    );
                  })()}
                </div>
                
                <div className={`${styles.cardBg} p-4 rounded-lg border ${styles.borderDefault}`}>
                  <div className={`text-sm ${styles.textMuted} mb-1`}>Different Shifts</div>
                  <div className={`text-2xl font-bold ${styles.textPrimary}`}>
                    {selectedDetailResult.differentCategoryCount}
                  </div>
                  <div className={`text-sm ${styles.textMuted}`}>days with different shift types</div>
                </div>
                
                <div className={`${styles.cardBg} p-4 rounded-lg border ${styles.borderDefault}`}>
                  <div className={`text-sm ${styles.textMuted} mb-1`}>Significant Differences</div>
                  <div className={`text-2xl font-bold ${styles.textPrimary}`}>
                    {selectedDetailResult.significantDifferenceCount || 0}
                  </div>
                  <div className={`text-sm ${styles.textMuted}`}>large time differences</div>
                </div>
                
                <div className={`${styles.cardBg} p-4 rounded-lg border ${styles.borderDefault}`}>
                  <div className={`text-sm ${styles.textMuted} mb-1`}>Overall Score</div>
                  <div className={`text-2xl font-bold ${styles.textPrimary}`}>
                    {Math.round(selectedDetailResult.meaningfulTradeScore || 0)}%
                  </div>
                  <div className={`text-sm ${styles.textMuted}`}>trade potential</div>
                </div>
              </div>

              {/* Day-by-Day Comparison */}
              {selectedDetailResult.shiftComparison && (
                <div>
                  <h3 className={`text-lg font-semibold ${styles.textPrimary} mb-4`}>
                    Day-by-Day Comparison
                  </h3>
                  
                  {/* Filter Tabs */}
                  <div className={`grid grid-cols-4 gap-2 mb-4 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100'} p-2 rounded-lg`}>
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                        activeTab === 'all'
                          ? (theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                          : (theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                      }`}
                    >
                      All Days ({selectedDetailResult.shiftComparison.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('different')}
                      className={`py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                        activeTab === 'different'
                          ? (theme === 'dark' ? 'bg-yellow-600 text-white' : 'bg-yellow-500 text-white')
                          : (theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                      }`}
                    >
                      Different ({selectedDetailResult.shiftComparison.filter((day: any) => day.isDifferent && !day.isWorkDayMismatch).length})
                    </button>
                    <button
                      onClick={() => setActiveTab('workoff')}
                      className={`py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                        activeTab === 'workoff'
                          ? (theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                          : (theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                      }`}
                    >
                      Work/Off ({selectedDetailResult.shiftComparison.filter((day: any) => day.isWorkDayMismatch).length})
                    </button>
                    <button
                      onClick={() => setActiveTab('same')}
                      className={`py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                        activeTab === 'same'
                          ? (theme === 'dark' ? 'bg-green-600 text-white' : 'bg-green-500 text-white')
                          : (theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                      }`}
                    >
                      Identical ({selectedDetailResult.shiftComparison.filter((day: any) => !day.isDifferent && !day.isWorkDayMismatch).length})
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <div className={`w-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm overflow-hidden`}>
                      {/* Table Header */}
                      <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} px-4 py-3 grid grid-cols-4 gap-4 text-sm font-medium ${styles.textSecondary}`}>
                        <div>Date</div>
                        <div>Your Shift</div>
                        <div>Mirror Shift</div>
                        <div>Difference</div>
                      </div>
                      
                      {/* Table Body */}
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {getFilteredComparisons().map((day: any, index: number) => (
                          <div 
                            key={index}
                            className={`px-4 py-3 grid grid-cols-4 gap-4 items-center ${
                              day.isDifferent
                                ? (theme === 'dark' ? 'bg-yellow-800/30' : 'bg-yellow-200')
                                : day.isWorkDayMismatch
                                  ? (theme === 'dark' ? 'bg-blue-800/30' : 'bg-blue-200')
                                  : ''
                            }`}
                          >
                            <div className={`font-medium ${styles.textPrimary}`}>
                              {formatDate(day.date)}
                            </div>
                            <div>
                              <div className={`font-mono font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                                {day.userShift}
                              </div>
                              {day.userTime && (
                                <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>
                                  {day.userTime}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className={`font-mono font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                                {day.otherShift}
                              </div>
                              {day.otherTime && (
                                <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>
                                  {day.otherTime}
                                </div>
                              )}
                            </div>
                            <div>
                              {day.isWorkDayMismatch ? (
                                <div className="text-xs font-bold px-2 py-1 rounded-md bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-100 shadow-sm text-center">
                                  Work/Off
                                </div>
                              ) : day.isDifferent ? (
                                <div className="text-xs font-bold px-2 py-1 rounded-md bg-yellow-200 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-100 shadow-sm text-center">
                                  Different
                                </div>
                              ) : (
                                <div className="text-xs font-bold px-2 py-1 rounded-md bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-100 shadow-sm text-center">
                                  Identical
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {getFilteredComparisons().length === 0 && (
                          <div className="p-4 text-center text-sm">
                            <p className={styles.textSecondary}>No matching days found for this filter.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className={`px-6 py-4 border-t ${styles.borderDefault} flex justify-end`}>
              <button
                onClick={() => setShowDetailModal(false)}
                className={`${styles.buttonSecondary} px-6 py-2 rounded-lg`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}