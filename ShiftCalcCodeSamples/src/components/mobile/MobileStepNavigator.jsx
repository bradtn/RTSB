// src/components/mobile/MobileStepNavigator.jsx
import React, { useEffect, useRef } from 'react';
import { useFilter } from '@/contexts/FilterContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { motion, AnimatePresence } from 'framer-motion';
import MobileGroupSelector from './steps/MobileGroupSelector';
import MobileDateSelector from './steps/MobileDateSelector';
import MobileShiftSelector from './steps/MobileShiftSelector';
import MobileWorkStretchSelector from './steps/MobileWorkStretchSelector';
import MobileWeekendPreferences from './steps/MobileWeekendPreferences';
import MobileStepIndicator from './MobileStepIndicator';

// Memoize components to prevent unnecessary re-renders
const MemoizedGroupSelector = React.memo(MobileGroupSelector);
const MemoizedDateSelector = React.memo(MobileDateSelector);
const MemoizedShiftSelector = React.memo(MobileShiftSelector);
const MemoizedWorkStretchSelector = React.memo(MobileWorkStretchSelector);
const MemoizedWeekendPreferences = React.memo(MobileWeekendPreferences);

export default function MobileStepNavigator({ 
  shiftsResetKey = Date.now(),
  onFinalStepComplete // NEW: Add callback for final step completion
}) {
  const { 
    step, parsedCriteria, nextStep, prevStep, resetFilters,
    updateCriteria, updateWeight, set5DayWeight, set4DayWeight,
    subModes, onGroupViewModeChange, onDateViewModeChange, 
    onShiftModeChange, onWeekendTabChange, onStretchTabChange,
    allGroups, shiftCodes, updateSubModes
  } = useFilter();
  
  const { theme } = useTheme();
  const styles = useThemeStyles();
  
  // Check if screen is small
  const isSmallScreenRef = useRef(false);
  
  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      isSmallScreenRef.current = window.innerHeight < 700;
    };
    
    // Initial check
    checkScreenSize();
    
    // Add resize listener
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);
  
  // MODIFIED: Helper to handle step changes - with special handling for final step
  const handleStepChange = (newStep) => {
    // If we're on the last step (5) and trying to go forward, trigger the loading view
    if (step === 5 && newStep > step && onFinalStepComplete) {
      console.log("Final step complete, triggering loading view");
      // Call the callback to show loading view
      onFinalStepComplete();
    }
    
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
  
  // Wrap shift mode change to handle errors properly
  const handleShiftModeChange = (mode, filter, extras) => {
    try {
      // Call original handler with safety checks
      if (onShiftModeChange) {
        // Make a safe copy of extras
        const safeExtras = extras || {};
        
        // Make sure to mark the selector as visited
        onShiftModeChange(mode, filter, { 
          ...safeExtras, 
          visited: true 
        });
      }
    } catch (error) {
      console.error("Error in handleShiftModeChange:", error);
    }
  };
  
  // MODIFIED: Handle final step completion directly
  const handleFinalStepComplete = () => {
    console.log("Final step completed through handler");
    if (onFinalStepComplete) {
      onFinalStepComplete();
    }
    nextStep();
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
            onBack={() => window.location.href = '/'}
            initialViewMode={subModes?.groupSelector?.viewMode || 'selection'}
            onViewModeChange={onGroupViewModeChange}
            isCompactView={isSmallScreenRef.current}
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
            isCompactView={isSmallScreenRef.current}
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
            onModeChange={handleShiftModeChange}
            isCompactView={isSmallScreenRef.current}
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
            initialActiveTab={subModes?.workStretchSelector?.activeTab || '5day'}
            onActiveTabChange={onStretchTabChange}
            isCompactView={isSmallScreenRef.current}
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
            onNext={handleFinalStepComplete}
            onBack={() => handleStepChange(4)}
            initialActiveTab={subModes?.weekendPreferences?.activeTab || 'all'}
            onActiveTabChange={onWeekendTabChange}
            isCompactView={isSmallScreenRef.current}
          />
        );
      default:
        return null;
    }
  };

  // Get title based on current step
  const getStepTitle = () => {
    switch(step) {
      case 1: return "Work Group Preferences";
      case 2: return "Days Off Preferences";
      case 3: return "Shift Type Preferences";
      case 4: return "Work Stretch Preferences";
      case 5: return "Weekend Preferences";
      default: return "Filter Preferences";
    }
  };

  // Modified reset without URL state update - matches desktop implementation
  const handleReset = () => {
    // Just reset all filters
    resetFilters();
  };

  return (
    <div className={`flex-1 p-2 ${styles.pageBg}`}>
      <div className={`${styles.cardBg} rounded-lg shadow`}>
        <div className="flex justify-between items-center px-3 py-2">
          <div className="flex items-center">
            <h2 className={`${isSmallScreenRef.current ? 'text-base' : 'text-lg'} font-semibold ${styles.textPrimary}`}>
              {getStepTitle()}
            </h2>
          </div>
          <button 
            onClick={handleReset} 
            className={`text-xs text-blue-400`}
          >
            Reset
          </button>
        </div>
        
        {/* Progress indicator with centered, narrower progress bar */}
        <MobileStepIndicator currentStep={step} totalSteps={5} />
        
        {/* Content wrapper with adjusted padding */}
        <div className="px-2 pb-2">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
}