// src/components/mobile/MirroredLinesStepNavigator.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useMirroredLines } from '@/contexts/MirroredLinesContext';
import MobileOperationSelector from './steps/mirrored-lines/MobileOperationSelector';
import MobileLineSelector from './steps/mirrored-lines/MobileLineSelector';
import MobileTargetSelector from './steps/mirrored-lines/MobileTargetSelector';
import MobileResultsList from './steps/mirrored-lines/MobileResultsList';
import MobileResultDetail from './steps/mirrored-lines/MobileResultDetail';
import MobileStepIndicator from './MobileStepIndicator';
import MobileHeader from './MobileHeader.jsx';

export default function MirroredLinesStepNavigator() {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const {
    step,
    nextStep,
    prevStep,
    resetSteps
  } = useMirroredLines();
  
  // Local state to track if we're viewing result details
  const [viewingDetails, setViewingDetails] = useState(false);
  
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
  
  // Handle navigation
  const handleNext = () => {
    if (step < 4) {
      nextStep();
    }
  };
  
  const handleBack = () => {
    if (viewingDetails) {
      setViewingDetails(false);
    } else if (step === 1) {
      // On first step, navigate to home page
      window.location.href = '/';
    } else {
      prevStep();
    }
  };
  
  const handleViewDetails = () => {
    setViewingDetails(true);
  };
  
  // Handle reset
  const handleReset = () => {
    resetSteps();
    setViewingDetails(false);
  };
  
  // Get title based on current step
  const getStepTitle = () => {
    if (viewingDetails) return "Mirror Comparison";
    
    switch(step) {
      case 1: return "Select Your Operation";
      case 2: return "Select Your Line";
      case 3: return "Select Target Operations";
      case 4: return "Mirror Line Results";
      default: return "Mirrored Lines";
    }
  };
  
  // Render the appropriate step content
  const renderStepContent = () => {
    if (viewingDetails) {
      return (
        <MobileResultDetail
          onBack={() => setViewingDetails(false)}
          isCompactView={isSmallScreenRef.current}
        />
      );
    }
    
    switch (step) {
      case 1:
        return (
          <MobileOperationSelector
            onNext={handleNext}
            onBack={handleBack}
            isCompactView={isSmallScreenRef.current}
          />
        );
      case 2:
        return (
          <MobileLineSelector
            onNext={handleNext}
            onBack={handleBack}
            isCompactView={isSmallScreenRef.current}
          />
        );
      case 3:
        return (
          <MobileTargetSelector
            onNext={handleNext}
            onBack={handleBack}
            isCompactView={isSmallScreenRef.current}
          />
        );
      case 4:
        return (
          <MobileResultsList
            onViewDetail={handleViewDetails}
            onBack={handleBack}
            isCompactView={isSmallScreenRef.current}
          />
        );
      default:
        return null;
    }
  };
  
  // For steps 1-3, show the wizard UI with card
  // For step 4 (results) and details view, show full-width layout like shift calculator
  if (step < 4 && !viewingDetails) {
    // Original card-based layout
    return React.createElement(
      'div', 
      { className: `flex flex-col h-full ${styles.pageBg}` }, 
      // Include the MobileHeader component for consistent mobile experience
      React.createElement(MobileHeader, null),
      React.createElement(
        'div', 
        { className: `flex-1 overflow-auto p-2 ${styles.pageBg}` },
        React.createElement(
          'div', 
          { className: `${styles.cardBg} rounded-lg shadow overflow-hidden` },
          React.createElement(
            'div', 
            { className: 'flex justify-between items-center px-3 py-2' },
            React.createElement(
              'div', 
              { className: 'flex items-center' },
              React.createElement(
                'h2', 
                { 
                  className: `${isSmallScreenRef.current ? 'text-base' : 'text-lg'} font-semibold ${styles.textPrimary}` 
                },
                getStepTitle()
              )
            ),
            React.createElement(
              'button', 
              { 
                onClick: handleReset, 
                className: 'text-xs text-blue-400' 
              },
              'Reset'
            )
          ),
          React.createElement(
            MobileStepIndicator, 
            { 
              currentStep: step, 
              totalSteps: 4 
            }
          ),
          React.createElement(
            'div', 
            { className: 'px-2 pb-2' },
            renderStepContent()
          )
        )
      )
    );
  } else {
    // Full-width layout like shiftbid calculator for results and details
    return React.createElement(
      'div', 
      { className: `flex flex-col h-full ${styles.pageBg}` }, 
      // Include the MobileHeader component for consistent mobile experience
      React.createElement(MobileHeader, null),
      renderStepContent()
    );
  }
}