// src/components/wizard/DesktopStepNavigator.tsx
import React, { useEffect, useRef } from 'react';
import { useFilter } from '@/contexts/FilterContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { motion, AnimatePresence } from 'framer-motion';
import DesktopGroupSelector from './steps/DesktopGroupSelector';
import DesktopDateSelector from './steps/DesktopDateSelector';
import DesktopShiftSelector from './steps/DesktopShiftSelector';
import DesktopWorkStretchSelector from './steps/DesktopWorkStretchSelector';
import DesktopWeekendPreferences from './steps/DesktopWeekendPreferences';

// Memoize components to prevent unnecessary re-renders
const MemoizedGroupSelector = React.memo(DesktopGroupSelector);
const MemoizedDateSelector = React.memo(DesktopDateSelector);
const MemoizedShiftSelector = React.memo(DesktopShiftSelector);
const MemoizedWorkStretchSelector = React.memo(DesktopWorkStretchSelector);
const MemoizedWeekendPreferences = React.memo(DesktopWeekendPreferences);

interface DesktopStepNavigatorProps {
  shiftsResetKey?: number;
}

export default function DesktopStepNavigator({ shiftsResetKey = Date.now() }: DesktopStepNavigatorProps) {
  const { 
    step, parsedCriteria, nextStep, prevStep, resetFilters,
    updateCriteria, updateWeight, set5DayWeight, set4DayWeight,
    subModes, onGroupViewModeChange, onDateViewModeChange, 
    onShiftModeChange, onWeekendTabChange, updateSubModes,
    allGroups, shiftCodes
  } = useFilter();
  
  const { theme } = useTheme();
  const styles = useThemeStyles();
  
  // Helper to handle step changes
  const handleStepChange = (newStep) => {
    // If already navigating to step 3, reset shift selector mode
    const shouldResetShiftSelector = newStep === 3;
    
    // Call the actual step change handler right away
    if (newStep > step) {
      nextStep();
    } else {
      prevStep(newStep);
    }
    
    // If we need to reset shift selector mode, do it directly
    if (shouldResetShiftSelector && typeof updateSubModes === 'function') {
      updateSubModes('shiftSelector', {
        mode: 'main',
        filterChoice: '',
        screen: 'main',
        selectedTab: ''
      });
    }
  };
  
  // Render the appropriate step content
  const renderStepContent = () => {
    // If criteria isn't loaded yet, show a loading placeholder
    if (!parsedCriteria) {
      return (
        <div className={`flex flex-col items-center justify-center p-8 ${styles.textMuted}`}>
          <div className="relative w-20 h-20">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-500/30 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-t-4 border-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="mt-6 text-lg font-medium">Loading preferences...</p>
        </div>
      );
    }
    
    switch (step) {
      case 1:
        return (
          <MemoizedGroupSelector
            selectedGroups={parsedCriteria.selectedGroups || []}
            setSelectedGroups={(groups) => updateCriteria('selectedGroups', groups)}
            groupWeight={parsedCriteria.weights?.groupWeight != null ? 
              Number(parsedCriteria.weights.groupWeight) : 1}
            setGroupWeight={(val) => updateWeight('groupWeight', val)}
            availableGroups={allGroups}
            onNext={() => handleStepChange(2)}
            initialViewMode={subModes?.groupSelector?.viewMode || 'selection'}
            onViewModeChange={onGroupViewModeChange}
          />
        );
      case 2:
        return (
          <MemoizedDateSelector
            dayOffDates={parsedCriteria.dayOffDates || []}
            setDayOffDates={(dates) => updateCriteria('dayOffDates', dates)}
            daysWeight={parsedCriteria.weights?.daysWeight != null ?
              Number(parsedCriteria.weights.daysWeight) : 0}
            setDaysWeight={(val) => updateWeight('daysWeight', val)}
            onNext={() => handleStepChange(3)}
            onBack={() => handleStepChange(1)}
            showWeightView={subModes?.dateSelector?.showWeightView || false}
            onViewModeChange={onDateViewModeChange}
          />
        );
      case 3:
        return (
          <MemoizedShiftSelector
            selectedCategories={parsedCriteria.selectedShiftCategories || []}
            setSelectedCategories={(categories) => updateCriteria('selectedShiftCategories', categories)}
            selectedLengths={parsedCriteria.selectedShiftLengths || []}
            setSelectedLengths={(lengths) => updateCriteria('selectedShiftLengths', lengths)}
            selectedCodes={parsedCriteria.selectedShiftCodes || []}
            setSelectedCodes={(codes) => updateCriteria('selectedShiftCodes', codes)}
            shiftWeight={parsedCriteria.weights?.shiftWeight != null ?
              Number(parsedCriteria.weights.shiftWeight) : 0}
            setShiftWeight={(val) => updateWeight('shiftWeight', val)}
            shiftCategoryIntent={parsedCriteria.shiftCategoryIntent || 'any'}
            setShiftCategoryIntent={(intent) => updateCriteria('shiftCategoryIntent', intent)}
            shiftCodes={shiftCodes}
            onNext={() => handleStepChange(4)}
            onBack={() => handleStepChange(2)}
            // IMPORTANT: Always force 'main' as initial screen/mode when first landing on step 3
            initialMode={step === 3 && !subModes?.shiftSelector?.visited ? 'main' : (subModes?.shiftSelector?.mode || 'main')}
            initialFilterChoice={step === 3 && !subModes?.shiftSelector?.visited ? '' : (subModes?.shiftSelector?.filterChoice || '')}
            initialScreen={step === 3 && !subModes?.shiftSelector?.visited ? 'main' : (subModes?.shiftSelector?.screen || '')}
            initialSelectedTab={step === 3 && !subModes?.shiftSelector?.visited ? '' : (subModes?.shiftSelector?.selectedTab || '')}
            onModeChange={(mode, filter, extras) => {
              // Mark the selector as visited when mode changes
              onShiftModeChange(mode, filter, { 
                ...extras, 
                visited: true 
              });
            }}
          />
        );
      case 4:
        return (
          <MemoizedWorkStretchSelector
            blocks5dayWeight={parsedCriteria.weights?.blocks5dayWeight != null ?
              Number(parsedCriteria.weights.blocks5dayWeight) : 0}
            setBlocks5dayWeight={(val) => set5DayWeight(val)}
            blocks4dayWeight={parsedCriteria.weights?.blocks4dayWeight != null ?
              Number(parsedCriteria.weights.blocks4dayWeight) : 0}
            setBlocks4dayWeight={(val) => set4DayWeight(val)}
            onNext={() => handleStepChange(5)}
            onBack={() => handleStepChange(3)}
          />
        );
      case 5:
        return (
          <MemoizedWeekendPreferences
            weekendWeight={parsedCriteria.weights?.weekendWeight != null ?
              Number(parsedCriteria.weights.weekendWeight) : 0}
            setWeekendWeight={(val) => updateWeight('weekendWeight', val)}
            saturdayWeight={parsedCriteria.weights?.saturdayWeight != null ?
              Number(parsedCriteria.weights.saturdayWeight) : 0}
            setSaturdayWeight={(val) => updateWeight('saturdayWeight', val)}
            sundayWeight={parsedCriteria.weights?.sundayWeight != null ?
              Number(parsedCriteria.weights.sundayWeight) : 0}
            setSundayWeight={(val) => updateWeight('sundayWeight', val)}
            onNext={nextStep}
            onBack={() => handleStepChange(4)}
            initialActiveTab={subModes?.weekendPreferences?.activeTab || 'all'}
            onActiveTabChange={onWeekendTabChange}
          />
        );
      default:
        return null;
    }
  };

  // Get color for current step
  const getStepColor = (stepNumber) => {
    const colors = {
      1: { bg: 'bg-blue-500', bgDark: 'bg-blue-600', completed: 'bg-green-500', completedDark: 'bg-green-600'},
      2: { bg: 'bg-purple-500', bgDark: 'bg-purple-600', completed: 'bg-green-500', completedDark: 'bg-green-600'},
      3: { bg: 'bg-orange-500', bgDark: 'bg-orange-600', completed: 'bg-green-500', completedDark: 'bg-green-600'},
      4: { bg: 'bg-emerald-500', bgDark: 'bg-emerald-600', completed: 'bg-green-500', completedDark: 'bg-green-600'},
      5: { bg: 'bg-red-500', bgDark: 'bg-red-600', completed: 'bg-green-500', completedDark: 'bg-green-600'}
    };
    return colors[stepNumber] || colors[1];
  };

  // Generate step indicators
  const steps = [
    { number: 1, title: "Work Groups", icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )},
    { number: 2, title: "Days Off", icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )},
    { number: 3, title: "Shift Types", icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { number: 4, title: "Work Stretches", icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    )},
    { number: 5, title: "Weekends", icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )}
  ];

  // Modified reset without URL state update
  const handleReset = () => {
    // Just reset all filters
    resetFilters();
  };

  return (
    <div className={`flex flex-col h-full ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {renderStepContent()}
    </div>
  );
}