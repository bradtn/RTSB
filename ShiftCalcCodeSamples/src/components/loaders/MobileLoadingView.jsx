// src/components/loaders/MobileLoadingView.jsx
import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useSession } from 'next-auth/react';
import BackgroundParticles from './animations/BackgroundParticles';
import TouchRipple from './animations/TouchRipple';
import Confetti from './animations/Confetti';
import AnimatedCounter from './elements/AnimatedCounter';
import RandomFact from './elements/RandomFact';
import PredictiveInsights from './elements/PredictiveInsights';
import { loadingStyles } from '@/styles/loadingAnimations';
import MobileHeader from '../mobile/MobileHeader';
import { useThemeStyles } from '@/hooks/useThemeStyles';

export function MobileLoadingView({ 
  scheduleCount = 0,
  preferences = [],
  onComplete = null,
  includeHeader = false,
  isSyncing = false
}) {
  console.log("MobileLoadingView rendered with onComplete:", !!onComplete);
  
  const { theme } = useTheme();
  const styles = useThemeStyles(); // Add theme styles hook
  const { data: session } = useSession();
  const userName = session?.user?.name?.split(' ')[0] || 'there';
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [buttonVisible, setButtonVisible] = useState(false);
  
  // Define all steps with initial states
  const steps = [
    { label: "Loading preferences", complete: currentStepIndex > 0, active: currentStepIndex === 0 },
    { label: "Preparing data", complete: currentStepIndex > 1, active: currentStepIndex === 1 },
    { label: "Calculating scores", complete: currentStepIndex > 2, active: currentStepIndex === 2 },
    { label: "Sorting results", complete: currentStepIndex > 3, active: currentStepIndex === 3 }
  ];
  
  // Effect to progress through steps one by one
  useEffect(() => {
    if (processingComplete) return;
    
    const totalSteps = steps.length;
    const stepDuration = 2000;
    
    if (currentStepIndex < totalSteps) {
      const timer = setTimeout(() => {
        if (currentStepIndex < totalSteps - 1) {
          setCurrentStepIndex(prev => prev + 1);
        } else {
          setProcessingComplete(true);
        }
      }, stepDuration);
      
      return () => clearTimeout(timer);
    }
  }, [currentStepIndex, processingComplete, steps.length]);
  
  // Effect to update progress bar
  useEffect(() => {
    const totalSteps = steps.length;
    
    if (!processingComplete) {
      const animateProgress = () => {
        const stepSize = 100 / totalSteps;
        const startProgress = currentStepIndex * stepSize;
        const endProgress = (currentStepIndex + 1) * stepSize;
        let currentProgress = startProgress;
        const increment = 1;
        
        const progressInterval = setInterval(() => {
          if (currentProgress >= endProgress) {
            clearInterval(progressInterval);
          } else {
            currentProgress += increment;
            setProgressPercent(currentProgress);
          }
        }, 50);
        
        return () => clearInterval(progressInterval);
      };
      
      animateProgress();
    } else {
      setProgressPercent(100);
    }
  }, [currentStepIndex, processingComplete, steps.length]);
  
  // Show button after processing is complete
  useEffect(() => {
    if (processingComplete) {
      const timer = setTimeout(() => {
        setButtonVisible(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [processingComplete]);
  
  // Button click handler with debugging
  const handleContinue = () => {
    console.log("Continue button clicked, onComplete available:", !!onComplete);
    
    // Force fast execution of the callback to avoid timing issues
    if (typeof onComplete === 'function') {
      // Use setTimeout with 0 delay to ensure it's called after current execution context
      setTimeout(() => {
        console.log("Executing onComplete callback");
        onComplete();
      }, 0);
    } else {
      console.error("No onComplete callback provided to MobileLoadingView");
    }
  };
  
  return (
    <div className={`flex flex-col h-full mobile-full-height safe-area-inset-bottom ${styles.pageBg}`}>
      <style jsx global>{loadingStyles}</style>
      
      {/* Background particles */}
      <BackgroundParticles theme={theme} />
      
      {/* Touch ripple effect */}
      <TouchRipple theme={theme} />
      
      {/* Only render header if includeHeader is true */}
      {includeHeader && (
        <MobileHeader
          isSyncing={isSyncing}
          isLoading={true}
        />
      )}
      
      {/* Main content container - using flex-grow to push content to top */}
      <div className="flex-grow flex flex-col items-center px-4 pt-16 pb-24 relative z-10">
        {/* Top section - logo and text */}
        <div className="flex-none mb-6">
          <div className="flex flex-col items-center">
            {/* Logo with animations - theme-specific version */}
            <div className="mb-4">
              <div className="logo-float logo-pulsate">
                {theme === 'dark' ? (
                  <img 
                    src="/images/logo-dark.png" 
                    alt="Logo - Dark Mode" 
                    className="h-16 w-auto"
                  />
                ) : (
                  <img 
                    src="/images/logo.png" 
                    alt="Logo - Light Mode" 
                    className="h-16 w-auto"
                  />
                )}
              </div>
            </div>
            
            {/* Title and description */}
            <div className={`${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} text-center`}>
              <p className="text-lg font-medium">Analyzing schedules...</p>
              <p className={`text-xs mt-1 ${styles.textMuted}`}>
                Processing your preferences
              </p>
              
              {/* User greeting */}
              <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-teal-300' : 'text-teal-600'} font-medium`}>
                Hi {userName}! We're preparing your schedules.
              </p>
              
              {/* Predictive insights */}
              <PredictiveInsights preferences={preferences} theme={theme} />
            
              {/* Schedule count */}
              {scheduleCount > 0 && (
                <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                  Processing <AnimatedCounter value={scheduleCount} /> schedules...
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Middle section - progress bar and steps */}
        <div className="flex-none w-full max-w-xs mt-6">
          {/* Progress bar with percentage */}
          <div className={`w-full h-3 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden relative mb-6`}>
            <div 
              className={`h-full ${processingComplete 
                ? 'bg-gradient-to-r from-green-500 via-green-400 to-green-300' 
                : 'bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400'} 
                ${processingComplete ? 'button-pulse' : 'progress-shimmer'}`}
              style={{ width: `${progressPercent}%`, transition: 'width 0.3s ease-out' }}
            ></div>
            
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2 text-xs font-bold">
              <span className={processingComplete ? 'text-green-500' : 'text-blue-500'}>
                {Math.round(progressPercent)}%
              </span>
            </div>
          </div>
          
          {/* Steps in a single column */}
          <div className={`text-xs ${styles.textMuted} text-center space-y-2.5`}>
            {steps.map((step, index) => {
              const isComplete = processingComplete || index < currentStepIndex;
              const isActive = !processingComplete && index === currentStepIndex;
              
              return (
                <p 
                  key={index} 
                  className={`
                    ${isComplete
                      ? (theme === 'dark' ? 'text-green-300' : 'text-green-600')
                      : isActive
                        ? (theme === 'dark' ? 'text-blue-300' : 'text-blue-600')
                        : (theme === 'dark' ? 'text-gray-600' : 'text-gray-400')
                    }
                    ${isActive ? 'step-appear' : ''}
                    flex items-center justify-center
                  `}
                >
                  {isComplete ? (
                    <span className="mr-1">✓</span>
                  ) : isActive ? (
                    <svg className="animate-spin -ml-1 mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <span className="mr-1">○</span>
                  )}
                  {step.label}
                </p>
              );
            })}
          </div>
        </div>
        
        {/* Random fact section */}
        <div className={`mt-8 ${styles.textMuted} text-center max-w-xs`}>
          <RandomFact className="animate-pulse" />
        </div>
      </div>
      
      {/* Fixed bottom button container - similar to your navigation bars */}
      {buttonVisible && (
        <div className={`flex-none fixed bottom-0 left-0 right-0 px-4 pb-6 pt-2 z-20 safe-area-inset-bottom ${styles.pageBg}`}>
          <button
            onClick={handleContinue}
            id="view-results-button"
            className={`
              w-full ${theme === 'dark' ? 'bg-green-600 hover:bg-green-500' : 'bg-green-500 hover:bg-green-400'}
              text-white font-medium py-3 px-4 rounded-lg shadow-lg button-pulse
              transition duration-300 ease-in-out transform hover:scale-105
              flex items-center justify-center
            `}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>View Results</span>
          </button>
        </div>
      )}
      
      {/* Confetti effect */}
      <Confetti active={true} count={processingComplete ? 80 : 20} />
    </div>
  );
}