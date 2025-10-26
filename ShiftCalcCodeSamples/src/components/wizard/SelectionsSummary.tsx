// src/components/wizard/SelectionsSummary.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFilter } from '@/contexts/FilterContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';

interface SelectionsSummaryProps {
  resultsCount?: number;
  onFilterAgain?: () => void;
  onResetFilters?: () => void;
  onReapplyFilters?: () => void;
  onSectionEdit?: (section: string, options?: any) => void;
}

export default function SelectionsSummary({
  resultsCount,
  onFilterAgain,
  onResetFilters,
  onReapplyFilters,
  onSectionEdit
}: SelectionsSummaryProps) {
  const { 
    parsedCriteria, 
    navigateToSection, 
    navigateToSubsection, 
    resetFilters, // Use the context's resetFilters instead of prop
    reapplyFilters, // Use the context's reapplyFilters instead of prop
    updateCriteria // Add direct access to updateCriteria
  } = useFilter();
  
  const { theme } = useTheme();
  const styles = useThemeStyles();
  
  // State for collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    groups: true,
    dates: true,
    shifts: true,
    stretches: true,
    weekends: true
  });
  
  // Add state to track reset in progress
  const [isResetting, setIsResetting] = useState(false);
  
  // Add state to track navigation in progress
  const [isNavigating, setIsNavigating] = useState(false);
  
  // State for notification message
  const [showNotification, setShowNotification] = useState(false);
  
  // Handle reset with server sync
  const handleResetFilters = () => {
    // If already resetting or navigating, block action
    if (isResetting || isNavigating) {
      console.log("SelectionsSummary: Operation blocked - action in progress");
      return;
    }
    
    if (onResetFilters) {
      console.log("SelectionsSummary: Starting filter reset");
      setIsResetting(true);
      
      // Call the provided reset handler
      onResetFilters();
      
      // Then use the context's reset function to ensure server sync
      resetFilters();
      
      // Mark reset as complete after a delay to ensure sync happens
      setTimeout(() => {
        console.log("SelectionsSummary: Reset complete");
        setIsResetting(false);
      }, 500);
    }
  };
  
  // Handle refresh with protection against ongoing reset
  const handleReapplyFilters = () => {
    // If already resetting or navigating, block action
    if (isResetting || isNavigating) {
      console.log("SelectionsSummary: Refresh blocked - action in progress");
      return;
    }
    
    if (onReapplyFilters) {
      console.log("SelectionsSummary: Refreshing filters");
      
      // First call the parent callback
      onReapplyFilters();
      
      // Then call the context's reapply function to ensure consistent behavior
      reapplyFilters();
    }
  };
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Handle section edit with options for shifts
  const handleSectionEdit = (section: string) => {
    // If already navigating or resetting, ignore the click
    if (isNavigating || isResetting) {
      console.log("SelectionsSummary: Section edit blocked - action in progress");
      return;
    }
    
    // Set navigating state to block additional clicks
    setIsNavigating(true);
    
    // For shifts section, pass special resetToMain option
    if (section === 'shifts') {
      // Call parent's onSectionEdit with resetToMain option
      if (onSectionEdit) {
        onSectionEdit(section, { resetToMain: true });
      }
      
      // Navigate to shifts/main subsection with a short delay
      setTimeout(() => {
        navigateToSubsection('shifts', 'main');
        
        // Reset the navigation lock after a delay
        setTimeout(() => {
          setIsNavigating(false);
        }, 500);
      }, 10);
      
      return;
    }
    
    // For other sections, call onSectionEdit normally
    if (onSectionEdit) {
      onSectionEdit(section);
    }
    
    // Navigate to specific subsections for each module with a short delay
    setTimeout(() => {
      switch(section) {
        case 'groups':
          navigateToSubsection('groups', 'selection');
          break;
        case 'dates':
          navigateToSubsection('dates', 'calendar');
          break;
        case 'stretches':
          navigateToSubsection('stretches', '5day');
          break;
        case 'weekends':
          navigateToSubsection('weekends', 'all');
          break;
        default:
          navigateToSection(section);
          break;
      }
      
      // Reset the navigation lock after a delay
      setTimeout(() => {
        setIsNavigating(false);
      }, 500);
    }, 10);
  };
  
  // Handle "See Results" button click with validation
  const handleSeeResults = () => {
    // If already navigating or resetting, ignore the click
    if (isNavigating || isResetting) {
      console.log("SelectionsSummary: See Results blocked - action in progress");
      return;
    }
    
    // Check if any actual selections are visible in the component
    const hasGroups = Array.isArray(parsedCriteria.selectedGroups) && parsedCriteria.selectedGroups.length > 0;
    const hasDates = Array.isArray(parsedCriteria.dayOffDates) && parsedCriteria.dayOffDates.filter(d => d !== null && d !== undefined).length > 0;
    const hasShiftCodes = Array.isArray(parsedCriteria.selectedShiftCodes) && parsedCriteria.selectedShiftCodes.length > 0;
    const hasShiftCategories = Array.isArray(parsedCriteria.selectedShiftCategories) && parsedCriteria.selectedShiftCategories.length > 0;
    
    // Count the number of visible selections in the UI
    const selectionCount = 
      (hasGroups ? 1 : 0) + 
      (hasDates ? 1 : 0) + 
      (hasShiftCodes || hasShiftCategories ? 1 : 0);
    
    // If there are fewer than 2 visible selections, show the notification
    if (selectionCount < 2) {
      setShowNotification(true);
      
      // Hide notification after 4 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 4000);
      
      // Don't navigate to results
      return;
    }
    
    // Set navigating state to block additional clicks
    setIsNavigating(true);
    
    // Navigate with a small delay to ensure UI updates
    setTimeout(() => {
      navigateToSection('results');
      
      // Reset the navigation lock after a delay
      setTimeout(() => {
        setIsNavigating(false);
      }, 500);
    }, 10);
  };
  
  // Handle filtering again with navigation protection
  const handleFilterAgain = () => {
    // If already navigating or resetting, ignore the click
    if (isNavigating || isResetting) {
      console.log("SelectionsSummary: Filter Again blocked - action in progress");
      return;
    }
    
    // Set navigating state to block additional clicks
    setIsNavigating(true);
    
    if (onFilterAgain) {
      onFilterAgain();
    }
    
    // Reset the navigation lock after a delay
    setTimeout(() => {
      setIsNavigating(false);
    }, 500);
  };
  
  // Early return if no criteria is available
  if (!parsedCriteria) {
    return null;
  }

  // Updated filter count function to match MobileResults.jsx
  const getFilterCount = (criteria: any) => {
    if (!criteria) return 0;
    
    let count = 0;
    
    // Count selection-based filters - these are only present if explicitly selected
    if (criteria.selectedGroups?.length) count++;
    if (criteria.selectedShiftCategories?.length) count++;
    if (criteria.selectedShiftLengths?.length) count++;
    if (criteria.selectedShiftCodes?.length) count++;
    if (criteria.dayOffDates?.length) count++;
    
    // For weights, we need to check if they're explicitly set to non-default values
    // Assuming default values are typically 1 for importance weights
    if (criteria.weights?.weekendWeight > 0 && criteria.weights?.weekendWeight !== 1) count++;
    if (criteria.weights?.saturdayWeight > 0 && criteria.weights?.saturdayWeight !== 1) count++;
    if (criteria.weights?.sundayWeight > 0 && criteria.weights?.sundayWeight !== 1) count++;
    if (criteria.weights?.blocks5dayWeight > 0 && criteria.weights?.blocks5dayWeight !== 1) count++;
    if (criteria.weights?.blocks4dayWeight > 0 && criteria.weights?.blocks4dayWeight !== 1) count++;
    // If groupWeight has a default of 1, also exclude that
    if (criteria.weights?.groupWeight > 0 && criteria.weights?.groupWeight !== 1) count++;
    // Same for daysWeight if it has a default value
    if (criteria.weights?.daysWeight > 0 && criteria.weights?.daysWeight !== 1) count++;
    
    return count;
  };

  const getImportanceLabel = (weight: number) => {
    // Add defensive check for invalid inputs
    if (weight === undefined || weight === null || isNaN(weight)) {
      return { label: 'Not Set', color: theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600' };
    }
    
    // Map weight to labels and colors - improved for light mode too
    const options = [
      { value: 0, label: 'Not Important', 
        color: theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-400 text-white' },
      { value: 1.5, label: 'Somewhat Important', 
        color: theme === 'dark' ? 'bg-blue-700 text-white' : 'bg-blue-500 text-white' },
      { value: 3, label: 'Important', 
        color: theme === 'dark' ? 'bg-yellow-600 text-black' : 'bg-yellow-400 text-yellow-900' },
      { value: 5, label: 'Essential', 
        color: theme === 'dark' ? 'bg-green-600 text-white' : 'bg-green-500 text-white' }
    ];
    
    const opt = options.find(o => o.value === weight);
    return opt ? opt : { label: 'Not Set', color: theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600' };
  };

  // Safe date formatter
  const formatDate = (date: any) => {
    try {
      // First, ensure we have a Date object
      const dateObj = date instanceof Date ? date : new Date(date);
      
      // Check if it's a valid date
      if (isNaN(dateObj.getTime())) {
        return "Invalid date";
      }
      
      return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      return "Invalid date";
    }
  };

  // Category icons
  const icons = {
    groups: (
      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
      </svg>
    ),
    dates: (
      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
      </svg>
    ),
    shifts: (
      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
    ),
    stretches: (
      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
    ),
    weekends: (
      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
    edit: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
      </svg>
    )
  };

  // Chevron icon for collapse/expand
  const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
    <svg 
      className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'transform rotate-180' : ''}`} 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );

  // Importance badge component
  const ImportanceBadge = ({ weight }: { weight: number | undefined | null }) => {
    if (weight === undefined || weight === null) return null;
    
    const { label, color } = getImportanceLabel(weight);
    return (
      <div className={`text-xs px-1.5 py-0.5 rounded inline-flex items-center ${color}`}>
        <span className="mr-0.5">•</span>
        {label}
      </div>
    );
  };

  // "Not set yet" text for empty expanded sections
  const NotSetYetMessage = () => (
    <div className={`flex items-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
      <span className="text-xs italic">Not set yet</span>
    </div>
  );

  // Check if groups have actual selections
  const hasGroups = Array.isArray(parsedCriteria.selectedGroups) && parsedCriteria.selectedGroups.length > 0;
  const hasGroupWeight = parsedCriteria.weights?.groupWeight > 1 || parsedCriteria.weights?.groupWeight === 0;
  
  // Check if dates have actual selections
  const hasDates = Array.isArray(parsedCriteria.dayOffDates) && 
    parsedCriteria.dayOffDates.filter(d => d !== null && d !== undefined).length > 0;
  const hasDaysWeight = parsedCriteria.weights?.daysWeight > 1 || parsedCriteria.weights?.daysWeight === 0;
  
  // Check if shifts have actual selections
  const hasShiftCodes = Array.isArray(parsedCriteria.selectedShiftCodes) && parsedCriteria.selectedShiftCodes.length > 0;
  const hasShiftCategories = Array.isArray(parsedCriteria.selectedShiftCategories) && parsedCriteria.selectedShiftCategories.length > 0;
  const hasShiftLengths = Array.isArray(parsedCriteria.selectedShiftLengths) && parsedCriteria.selectedShiftLengths.length > 0;
  const hasShifts = hasShiftCodes || hasShiftCategories || hasShiftLengths;
  const hasShiftWeight = parsedCriteria.weights?.shiftWeight > 1 || parsedCriteria.weights?.shiftWeight === 0;

  return (
    <div className={`rounded-lg p-4 shadow-md text-sm ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
      {/* Header with results count */}
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <h3 className={`font-bold text-base ${styles.textPrimary}`}>Your Selections</h3>
          {resultsCount !== undefined && (
            <div className={`text-sm ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} font-medium`}>
              {resultsCount} Results
            </div>
          )}
        </div>
        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} flex items-center justify-between`}>
          <span>Review and manage your preferences</span>
          {parsedCriteria && getFilterCount(parsedCriteria) > 0 && (
            <span className="flex items-center text-blue-400">
              <svg className="w-3.5 h-3.5 mr-0.5" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707L16 11.586V19a1 1 0 01-.293.707l-2 2A1 1 0 0112 21v-9.414l-4.707-4.707A1 1 0 017 6.586V4z" />
              </svg>
              {getFilterCount(parsedCriteria)} filters
            </span>
          )}
        </p>
      </div>
      
      {/* Notification message */}
      <AnimatePresence>
        {showNotification && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`mb-3 ${theme === 'dark' ? 'bg-yellow-900/30 text-yellow-200 border-yellow-600' : 'bg-yellow-50 text-yellow-800 border-yellow-400'} border-l-4 p-3 rounded-md`}
          >
            <div className="flex">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-xs">
                Please select criteria in at least two categories to get meaningful results.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Reset in progress indicator */}
      <AnimatePresence>
        {isResetting && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`mb-3 ${theme === 'dark' ? 'bg-blue-900/30 text-blue-200 border-blue-600' : 'bg-blue-50 text-blue-800 border-blue-400'} border-l-4 p-3 rounded-md`}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-xs">
                Resetting filters...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Navigation in progress indicator */}
      <AnimatePresence>
        {isNavigating && !isResetting && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`mb-3 ${theme === 'dark' ? 'bg-purple-900/30 text-purple-200 border-purple-600' : 'bg-purple-50 text-purple-800 border-purple-400'} border-l-4 p-3 rounded-md`}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 flex-shrink-0 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5.5a.75.75 0 001.5 0V5zm0 10a.75.75 0 000-1.5h-.008a.75.75 0 000 1.5H10.75z" clipRule="evenodd" />
              </svg>
              <span className="text-xs">
                Navigating...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Filter action buttons - FIXED FOR RESPONSIVE LAYOUT */}
      <div className="mb-3 grid grid-cols-4 gap-2">
        {onFilterAgain && (
          <button
            onClick={handleFilterAgain} // Use the protected handler
            disabled={isResetting || isNavigating}
            className={`${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-500 hover:bg-blue-600'} 
                      text-white px-2 py-1.5 rounded text-sm transition-colors
                      ${(isResetting || isNavigating) ? 'opacity-50 cursor-not-allowed' : ''}`}
            type="button"
          >
            Edit Filters
          </button>
        )}
        
        {onResetFilters && (
          <button
            onClick={handleResetFilters}
            disabled={isResetting || isNavigating}
            className={`${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} 
                      ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} 
                      ${(isResetting || isNavigating) ? 'opacity-50 cursor-not-allowed' : ''} 
                      px-2 py-1.5 rounded text-sm transition-colors`}
            type="button"
          >
            Clear All
          </button>
        )}
        
        {onReapplyFilters && (
          <button
            onClick={handleReapplyFilters}
            disabled={isResetting || isNavigating}
            className={`${theme === 'dark' ? 'bg-green-600 hover:bg-green-500' : 'bg-green-500 hover:bg-green-600'} 
                      text-white px-2 py-1.5 rounded text-sm transition-colors
                      ${(isResetting || isNavigating) ? 'opacity-50 cursor-not-allowed' : ''}`}
            type="button"
          >
            Refresh
          </button>
        )}
        
        <button
          onClick={handleSeeResults}
          disabled={isResetting || isNavigating}
          className={`${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-purple-500 hover:bg-purple-600'} 
                    text-white px-2 py-1.5 rounded text-sm transition-colors
                    ${(isResetting || isNavigating) ? 'opacity-50 cursor-not-allowed' : ''}`}
          type="button"
        >
          See Results
        </button>
      </div>

      {/* Selection categories - Single Column Layout with Collapsible Sections */}
      <div className="space-y-2 max-h-[calc(100vh-350px)] overflow-y-auto pr-1">
        {/* Work Groups */}
        <div className={`rounded-md overflow-hidden ${theme === 'dark' ? 'bg-gray-700/50 border border-gray-600' : 'bg-gray-50 border border-gray-200'}`}>
          <div className="flex">
            <button 
              onClick={() => toggleSection('groups')} 
              className={`flex-1 flex items-center justify-between p-2 ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <div className="flex items-center">
                <div className={`p-1 rounded-md mr-1.5 ${theme === 'dark' ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                  {icons.groups}
                </div>
                <span className={`text-sm font-medium ${styles.textSecondary}`}>Work Groups</span>
              </div>
              
              <ChevronIcon expanded={expandedSections.groups} />
            </button>
            
            {onSectionEdit && (
              <button
                onClick={() => handleSectionEdit('groups')}
                disabled={isResetting || isNavigating}
                className={`px-2 flex items-center ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}
                          ${(isResetting || isNavigating) ? 'opacity-50 cursor-not-allowed' : ''}`}
                type="button"
                title="Edit Work Groups"
              >
                {icons.edit}
              </button>
            )}
          </div>
          
          <AnimatePresence>
            {expandedSections.groups && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-2 pt-0">
                  {hasGroups || hasGroupWeight ? (
                    <div className="flex flex-col space-y-1.5 mt-1.5">
                      {/* Group selections */}
                      {hasGroups && (
                        <div className="flex flex-wrap gap-1">
                          {parsedCriteria.selectedGroups.map(group => (
                            <span
                              key={group}
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                theme === 'dark' 
                                  ? 'bg-blue-900/50 text-blue-100 border border-blue-700/50' 
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}
                            >
                              {group}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Group importance */}
                      {hasGroupWeight && (
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              theme === 'dark' 
                                ? 'bg-blue-900/50 text-blue-100 border border-blue-700/50' 
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            Group Importance
                          </span>
                          <ImportanceBadge weight={parsedCriteria.weights.groupWeight} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <NotSetYetMessage />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Days Off */}
        <div className={`rounded-md overflow-hidden ${theme === 'dark' ? 'bg-gray-700/50 border border-gray-600' : 'bg-gray-50 border border-gray-200'}`}>
          <div className="flex">
            <button 
              onClick={() => toggleSection('dates')} 
              className={`flex-1 flex items-center justify-between p-2 ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <div className="flex items-center">
                <div className={`p-1 rounded-md mr-1.5 ${theme === 'dark' ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                  {icons.dates}
                </div>
                <span className={`text-sm font-medium ${styles.textSecondary}`}>Days Off</span>
              </div>
              
              <ChevronIcon expanded={expandedSections.dates} />
            </button>
            
            {onSectionEdit && (
              <button
                onClick={() => handleSectionEdit('dates')}
                disabled={isResetting || isNavigating}
                className={`px-2 flex items-center ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}
                          ${(isResetting || isNavigating) ? 'opacity-50 cursor-not-allowed' : ''}`}
                type="button"
                title="Edit Days Off"
              >
                {icons.edit}
              </button>
            )}
          </div>
          
          <AnimatePresence>
            {expandedSections.dates && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-2 pt-0">
                  {hasDates || hasDaysWeight ? (
                    <div className="flex flex-col space-y-1.5 mt-1.5">
                      {/* Date selections */}
                      {hasDates && (
                        <div className="flex flex-wrap gap-1">
                          {parsedCriteria.dayOffDates
                            .filter(date => date !== null && date !== undefined)
                            .map((date, index) => {
                              try {
                                // Skip invalid dates
                                if (!(date instanceof Date || typeof date === 'string' || typeof date === 'number')) {
                                  return null;
                                }
                                
                                return (
                                  <span
                                    key={index}
                                    className={`text-xs px-2 py-0.5 rounded-full ${
                                      theme === 'dark' 
                                        ? 'bg-purple-900/50 text-purple-100 border border-purple-700/50' 
                                        : 'bg-purple-100 text-purple-800 border border-purple-200'
                                    }`}
                                  >
                                    {formatDate(date)}
                                  </span>
                                );
                              } catch (e) {
                                return null; // Skip rendering this item if it causes an error
                              }
                            })
                            .filter(Boolean)}
                        </div>
                      )}
                      
                      {/* Days importance */}
                      {hasDaysWeight && (
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              theme === 'dark' 
                                ? 'bg-purple-900/50 text-purple-100 border border-purple-700/50' 
                                : 'bg-purple-100 text-purple-800 border border-purple-200'
                            }`}
                          >
                            Days Off Importance
                          </span>
                          <ImportanceBadge weight={parsedCriteria.weights.daysWeight} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <NotSetYetMessage />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Shift Types */}
        <div className={`rounded-md overflow-hidden ${theme === 'dark' ? 'bg-gray-700/50 border border-gray-600' : 'bg-gray-50 border border-gray-200'}`}>
          <div className="flex">
            <button 
              onClick={() => toggleSection('shifts')} 
              className={`flex-1 flex items-center justify-between p-2 ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <div className="flex items-center">
              <div className={`p-1 rounded-md mr-1.5 ${theme === 'dark' ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-100 text-orange-700'}`}>
                  {icons.shifts}
                </div>
                <span className={`text-sm font-medium ${styles.textSecondary}`}>Shift Types</span>
              </div>
              
              <ChevronIcon expanded={expandedSections.shifts} />
            </button>
            
            {onSectionEdit && (
              <button
                onClick={() => handleSectionEdit('shifts')}
                disabled={isResetting || isNavigating}
                className={`px-2 flex items-center ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}
                          ${(isResetting || isNavigating) ? 'opacity-50 cursor-not-allowed' : ''}`}
                type="button"
                title="Edit Shift Types"
              >
                {icons.edit}
              </button>
            )}
          </div>
          
          <AnimatePresence>
            {expandedSections.shifts && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-2 pt-0">
                  {hasShifts || hasShiftWeight ? (
                    <div className="flex flex-col space-y-1.5 mt-1.5">
                      {/* Shift codes */}
                      {hasShiftCodes && (
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(parsedCriteria.selectedShiftCodes) && parsedCriteria.selectedShiftCodes.map(code => (
                            <span
                              key={code}
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                theme === 'dark' 
                                  ? 'bg-orange-900/50 text-orange-100 border border-orange-700/50' 
                                  : 'bg-orange-100 text-orange-800 border border-orange-200'
                              }`}
                            >
                              {code}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Shift categories */}
                      {hasShiftCategories && (
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(parsedCriteria.selectedShiftCategories) && parsedCriteria.selectedShiftCategories.map(category => (
                            <span
                              key={category}
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                theme === 'dark' 
                                  ? 'bg-orange-800/50 text-orange-100 border border-orange-600/50' 
                                  : 'bg-orange-50 text-orange-800 border border-orange-200'
                              }`}
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Shift lengths */}
                      {hasShiftLengths && (
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(parsedCriteria.selectedShiftLengths) && parsedCriteria.selectedShiftLengths.map(length => (
                            <span
                              key={length}
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                theme === 'dark' 
                                  ? 'bg-orange-700/50 text-orange-100 border border-orange-500/50' 
                                  : 'bg-orange-200 text-orange-800 border border-orange-300'
                              }`}
                            >
                              {length}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Shift importance */}
                      {hasShiftWeight && (
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              theme === 'dark' 
                                ? 'bg-orange-900/50 text-orange-100 border border-orange-700/50' 
                                : 'bg-orange-100 text-orange-800 border border-orange-200'
                            }`}
                          >
                            Shift Importance
                          </span>
                          <ImportanceBadge weight={parsedCriteria.weights.shiftWeight} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <NotSetYetMessage />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Work Stretches */}
        <div className={`rounded-md overflow-hidden ${theme === 'dark' ? 'bg-gray-700/50 border border-gray-600' : 'bg-gray-50 border border-gray-200'}`}>
          <div className="flex">
            <button 
              onClick={() => toggleSection('stretches')} 
              className={`flex-1 flex items-center justify-between p-2 ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <div className="flex items-center">
                <div className={`p-1 rounded-md mr-1.5 ${theme === 'dark' ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'}`}>
                  {icons.stretches}
                </div>
                <span className={`text-sm font-medium ${styles.textSecondary}`}>Work Stretches</span>
              </div>
              <ChevronIcon expanded={expandedSections.stretches} />
            </button>
            
            {onSectionEdit && (
              <button
                onClick={() => handleSectionEdit('stretches')}
                disabled={isResetting || isNavigating}
                className={`px-2 flex items-center ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}
                          ${(isResetting || isNavigating) ? 'opacity-50 cursor-not-allowed' : ''}`}
                type="button"
                title="Edit Work Stretches"
              >
                {icons.edit}
              </button>
            )}
          </div>
          
          <AnimatePresence>
            {expandedSections.stretches && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-2 pt-0">
                  {(parsedCriteria.weights?.blocks5dayWeight > 0 || parsedCriteria.weights?.blocks4dayWeight > 0) ? (
                    <div className="flex flex-col space-y-1.5 mt-1.5">
                      {parsedCriteria.weights?.blocks5dayWeight > 0 && (
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              theme === 'dark' 
                                ? 'bg-green-900/50 text-green-100 border border-green-700/50' 
                                : 'bg-green-100 text-green-800 border border-green-200'
                            }`}
                          >
                            5-Day Blocks
                          </span>
                          <ImportanceBadge weight={parsedCriteria.weights.blocks5dayWeight} />
                        </div>
                      )}
                      {parsedCriteria.weights?.blocks4dayWeight > 0 && (
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              theme === 'dark' 
                                ? 'bg-green-900/50 text-green-100 border border-green-700/50' 
                                : 'bg-green-100 text-green-800 border border-green-200'
                            }`}
                          >
                            4-Day Blocks
                          </span>
                          <ImportanceBadge weight={parsedCriteria.weights.blocks4dayWeight} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <NotSetYetMessage />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Weekends */}
        <div className={`rounded-md overflow-hidden ${theme === 'dark' ? 'bg-gray-700/50 border border-gray-600' : 'bg-gray-50 border border-gray-200'}`}>
          <div className="flex">
            <button 
              onClick={() => toggleSection('weekends')} 
              className={`flex-1 flex items-center justify-between p-2 ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <div className="flex items-center">
                <div className={`p-1 rounded-md mr-1.5 ${theme === 'dark' ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'}`}>
                  {icons.weekends}
                </div>
                <span className={`text-sm font-medium ${styles.textSecondary}`}>Weekends</span>
              </div>
              <ChevronIcon expanded={expandedSections.weekends} />
            </button>
            
            {onSectionEdit && (
              <button
                onClick={() => handleSectionEdit('weekends')}
                disabled={isResetting || isNavigating}
                className={`px-2 flex items-center ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}
                          ${(isResetting || isNavigating) ? 'opacity-50 cursor-not-allowed' : ''}`}
                type="button"
                title="Edit Weekends"
              >
                {icons.edit}
              </button>
            )}
          </div>
          
          <AnimatePresence>
            {expandedSections.weekends && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-2 pt-0">
                  {(parsedCriteria.weights?.weekendWeight > 1 || 
                    parsedCriteria.weights?.saturdayWeight > 1 || 
                    parsedCriteria.weights?.sundayWeight > 1 ||
                    parsedCriteria.weights?.weekendWeight === 0 ||
                    parsedCriteria.weights?.saturdayWeight === 0 ||
                    parsedCriteria.weights?.sundayWeight === 0) ? (
                    <div className="flex flex-col space-y-1.5 mt-1.5">
                      {(parsedCriteria.weights?.weekendWeight > 1 || parsedCriteria.weights?.weekendWeight === 0) && (
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              theme === 'dark' 
                                ? 'bg-red-900/50 text-red-100 border border-red-700/50' 
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}
                          >
                            All Weekends
                          </span>
                          <ImportanceBadge weight={parsedCriteria.weights.weekendWeight} />
                        </div>
                      )}
                      {(parsedCriteria.weights?.saturdayWeight > 1 || parsedCriteria.weights?.saturdayWeight === 0) && (
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              theme === 'dark' 
                                ? 'bg-red-900/50 text-red-100 border border-red-700/50' 
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}
                          >
                            Saturdays
                          </span>
                          <ImportanceBadge weight={parsedCriteria.weights.saturdayWeight} />
                        </div>
                      )}
                      {(parsedCriteria.weights?.sundayWeight > 1 || parsedCriteria.weights?.sundayWeight === 0) && (
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              theme === 'dark' 
                                ? 'bg-red-900/50 text-red-100 border border-red-700/50' 
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}
                          >
                            Sundays
                          </span>
                          <ImportanceBadge weight={parsedCriteria.weights.sundayWeight} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <NotSetYetMessage />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}