// src/components/loaders/ResultsLoadingView.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useSession } from 'next-auth/react';
import { useLoading } from '@/contexts/LoadingContext';
import BackgroundParticles from './animations/BackgroundParticles';
import TouchRipple from './animations/TouchRipple';
import Confetti from './animations/Confetti';
import AnimatedCounter from './elements/AnimatedCounter';
import PredictiveInsights from './elements/PredictiveInsights';
import { loadingStyles } from '@/styles/loadingAnimations';

export function ResultsLoadingView({ 
  scheduleCount = 0, 
  onComplete = null,
  preferences = [],
  forceVisible = false // Add this prop to allow forcing visibility
}) {
  try {
    // Use the loading context to determine visibility
    const { shouldShowLoading, hideLoading } = useLoading();
    
    // Add a ref to track if we've tried to break a loading loop
    const loopBreakAttemptedRef = useRef(false);
    
    // Set a flag to track if this is after a browser refresh
    useEffect(() => {
      if (typeof window !== 'undefined') {
        // Set a timestamp if not already set
        if (!window._pageRefreshTime) {
          window._pageRefreshTime = Date.now();
          window._isAfterBrowserRefresh = true;
        } else if (Date.now() - window._pageRefreshTime < 3000) {
          window._isAfterBrowserRefresh = true;
        } else {
          window._isAfterBrowserRefresh = false;
        }
      }
      
      return () => {
        // Cleanup on unmount if needed
        if (window._loadingViewCleanupInProgress) {
          window._loadingViewCleanupInProgress = false;
        }
      };
    }, []);
    
    // Add escape hatch for infinite loading loops
    useEffect(() => {
      // Only run this after a browser refresh and if we haven't tried to break the loop yet
      if (typeof window !== 'undefined' && window._isAfterBrowserRefresh && !loopBreakAttemptedRef.current) {
        console.log("Post-refresh loading view detected, setting up escape hatch");
        
        // Set the ref so we don't try multiple times
        loopBreakAttemptedRef.current = true;
        
        // Force exit the loading view after a timeout
        const escapeTimer = setTimeout(() => {
          console.log("Escape hatch triggered - forcing loading view to close");
          window._forcedHideLoading = true;
          hideLoading();
          
          // Reset the browser refresh flag to prevent re-triggering
          window._isAfterBrowserRefresh = false;
          
          // Try to clean up any other stuck state
          if (window._loadingScreenShownAt) {
            window._loadingScreenShownAt = null;
          }
        }, 5000); // 5 second timeout to give legitimate loading a chance
        
        return () => clearTimeout(escapeTimer);
      }
      
      return () => {};
    }, [hideLoading]);
    
    // Debug logging
    console.log("ResultsLoadingView rendered with shouldShowLoading:", shouldShowLoading, "forceVisible:", forceVisible);
    
    // Skip if not explicitly requested to show and not forced visible and not after refresh
    if (!shouldShowLoading && !forceVisible && !window._forcedShowLoading) {
      console.log("ResultsLoadingView: Not showing because shouldShowLoading is false and not forced visible");
      return null;
    }
    
    console.log("ResultsLoadingView: SHOWING LOADING VIEW");
    
    const { theme } = useTheme();
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [processingComplete, setProcessingComplete] = useState(false);
    const [progressPercent, setProgressPercent] = useState(0);
    const [buttonVisible, setButtonVisible] = useState(false);
    const { data: session } = useSession();
    const userName = session?.user?.name?.split(' ')[0] || 'there';
    
    // Use example preferences if none provided
    const userPreferences = preferences.length > 0 
      ? preferences 
      : ["Commercial Day Shifts", "Weekends Off", "Morning Start Times"];
    
    // Define all steps with initial states
    const steps = [
      { label: "Loading preferences", complete: currentStepIndex > 0, active: currentStepIndex === 0 },
      { label: "Preparing data", complete: currentStepIndex > 1, active: currentStepIndex === 1 },
      { label: "Calculating scores", complete: currentStepIndex > 2, active: currentStepIndex === 2 },
      { label: "Sorting results", complete: currentStepIndex > 3, active: currentStepIndex === 3 }
    ];
    
    // Effect to progress through steps one by one (not looping)
    useEffect(() => {
      if (processingComplete) return;
      
      const totalSteps = steps.length;
      const stepDuration = 2000;
      
      if (currentStepIndex < totalSteps) {
        const timer = setTimeout(() => {
          if (currentStepIndex < totalSteps - 1) {
            setCurrentStepIndex(prevIndex => prevIndex + 1);
          } else {
            setProcessingComplete(true);
          }
        }, stepDuration);
        
        return () => clearTimeout(timer);
      }
    }, [currentStepIndex, processingComplete, steps.length]);
    
    // Effect to update progress bar to match steps
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
              
              if (currentProgress >= 100) {
                setProcessingComplete(true);
              }
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
        }, 1000); // Show button 1 second after processing completes
        
        return () => clearTimeout(timer);
      }
    }, [processingComplete]);
    
    // Force auto-exit after maximum time (another failsafe)
    useEffect(() => {
      const maxLoadingTime = setTimeout(() => {
        if (typeof window !== 'undefined' && window._isAfterBrowserRefresh) {
          console.log("Maximum loading time reached - auto-exiting");
          window._forcedHideLoading = true;
          hideLoading();
        }
      }, 15000); // 15 seconds maximum loading time after refresh
      
      return () => clearTimeout(maxLoadingTime);
    }, [hideLoading]);
    
    const handleContinue = () => {
      // First, check if we're already in the process of cleaning up
      if (window._loadingViewCleanupInProgress) {
        console.log("Loading view cleanup already in progress, ignoring duplicate click");
        return;
      }
      
      // Set a flag to prevent re-entry
      window._loadingViewCleanupInProgress = true;
      
      console.log("User clicked continue button, hiding loading screen");
      
      // For browser refresh scenarios, add additional protections
      if (window._isAfterBrowserRefresh) {
        console.log("After browser refresh detected, adding additional cleanup");
        
        // Force immediate cleanup of all flags
        window._forcedHideLoading = true;
        window._isAfterBrowserRefresh = false;
        window._pageRefreshTime = null;
        
        // Force hide the loading view
        hideLoading();
        
        // Set a flag to prevent re-showing automatically
        window._preventAutoShowLoading = true;
        
        // Force reload the page if we detect we're stuck in a loop
        if (window._loadingLoopDetected) {
          console.log("Loading loop detected, forcing page reload");
          window.location.reload();
          return;
        }
        
        // Call the callback after everything is done
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
          
          // Clear flag after everything is done
          setTimeout(() => {
            window._loadingViewCleanupInProgress = false;
          }, 200);
        }, 50);
        
        return;
      }
      
      // Regular path - hide the loading view
      hideLoading();
      
      // Call the callback after a delay to ensure the loading view unmounts first
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
        
        // Clear flag after everything is done
        setTimeout(() => {
          window._loadingViewCleanupInProgress = false;
        }, 200);
      }, 50);
    };
    
    return (
      <div className={`flex flex-col mobile-full-height ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} relative overflow-hidden`}>
        <style jsx global>{loadingStyles}</style>
        
        {/* Background particles */}
        <BackgroundParticles theme={theme} />
        
        {/* Touch ripple effect */}
        <TouchRipple theme={theme} />
        
        {/* Main content container with top padding to shift content down */}
        <div className="flex flex-col h-full items-center pt-20 px-4 relative z-10">
          {/* Top section - logo and text */}
          <div className="flex-none mb-6">
            <div className="flex flex-col items-center">
              {/* Logo with animations */}
              <div className="mb-4">
                <div className="logo-float logo-pulsate">
                  <img 
                    src="/images/logo.png" 
                    alt="ShiftCalc Logo" 
                    className="h-16 w-auto"
                  />
                </div>
              </div>
              
              {/* Title and description */}
              <div className={`${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} text-center`}>
                <p className="text-lg font-medium">Analyzing schedules...</p>
                <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Processing your preferences
                </p>
                
                {/* User greeting */}
                <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-teal-300' : 'text-teal-600'} font-medium`}>
                  Hi {userName}! We're preparing your schedules.
                </p>
                
                {/* Predictive insights */}
                <PredictiveInsights preferences={userPreferences} theme={theme} />
              
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
            <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-center space-y-2.5`}>
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
          
          {/* Button positioned lower on the screen with fixed positioning - always show after 5s */}
          {(processingComplete && buttonVisible) || window._isAfterBrowserRefresh ? (
            <div className="fixed bottom-24 left-0 right-0 flex justify-center z-20">
              <button
                onClick={handleContinue}
                className={`
                  ${theme === 'dark' ? 'bg-green-600 hover:bg-green-500' : 'bg-green-500 hover:bg-green-400'}
                  text-white font-medium py-3 px-8 rounded-lg shadow-lg button-pulse
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
          ) : null}
        </div>
        
        {/* Confetti effect */}
        <Confetti active={true} count={processingComplete ? 80 : 20} />
      </div>
    );
  } catch (error) {
    console.error("Error in ResultsLoadingView:", error);
    // Provide a simple fallback UI if anything fails
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center p-4">
          <h2 className="text-xl mb-2">Loading Results</h2>
          <p>Please wait while we analyze your schedules...</p>
          <div className="mt-4 w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 animate-pulse" style={{ width: '80%' }}></div>
          </div>
          <button 
            onClick={() => {
              if (typeof window !== 'undefined') {
                window._forcedHideLoading = true;
                const { hideLoading } = useLoading();
                hideLoading();
              }
            }}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Skip Loading
          </button>
        </div>
      </div>
    );
  }
}
