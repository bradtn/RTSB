// src/components/wizard/DesktopLoadingView.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from "@/contexts/ThemeContext";
import { useSession } from 'next-auth/react';

// CSS for all animations
const loadingStyles = `
  @keyframes progress {
    0% { width: 0; }
    20% { width: 20%; }
    40% { width: 40%; }
    60% { width: 60%; }
    80% { width: 80%; }
    100% { width: 100%; }
  }
  .animate-progress {
    animation: progress 5s ease-in-out;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  @keyframes gentleFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }
  .logo-float {
    animation: gentleFloat 4s ease-in-out infinite;
  }
  
  @keyframes pulsate {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  .logo-pulsate {
    animation: pulsate 2s ease-in-out infinite;
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  .progress-shimmer::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      rgba(255,255,255,0) 0%,
      rgba(255,255,255,0.2) 50%,
      rgba(255,255,255,0) 100%
    );
    animation: shimmer 2s infinite;
  }
  
  @keyframes stepAppear {
    0% { transform: translateX(-10px); opacity: 0; }
    100% { transform: translateX(0); opacity: 1; }
  }
  .step-appear {
    animation: stepAppear 0.5s forwards;
  }
  
  @keyframes countUp {
    0% { opacity: 0; transform: translateY(10px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .count-up {
    animation: countUp 0.5s forwards;
  }
  
  .particles {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    z-index: 0;
  }
  
  .particle {
    position: absolute;
    border-radius: 50%;
    opacity: 0.3;
    animation-name: particleFloat;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
    animation-direction: alternate;
  }
  
  @keyframes particleFloat {
    0% { transform: translateY(0) rotate(0deg); }
    100% { transform: translateY(-20px) rotate(360deg); }
  }
  
  @keyframes confettiDrop {
    0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100px) rotate(360deg); opacity: 0; }
  }
  
  .confetti {
    position: absolute;
    width: 10px;
    height: 10px;
    animation: confettiDrop linear forwards;
  }
  
  @keyframes buttonPulse {
    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5); }
    50% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
  }
  .button-pulse {
    animation: buttonPulse 2s infinite;
  }
  
  @keyframes fadeIn {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
  .fade-in {
    animation: fadeIn 1s forwards;
  }
  
  @keyframes insightFlash {
    0% { opacity: 0; transform: translateY(10px); }
    10% { opacity: 1; transform: translateY(0); }
    90% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-10px); }
  }
  
  .insight-flash {
    animation: insightFlash 4s ease-in-out forwards;
  }
`;

const BackgroundParticles = ({ theme }) => {
  const [particles, setParticles] = useState([]);
  
  useEffect(() => {
    const colors = theme === 'dark' 
      ? ['#4F46E5', '#3B82F6', '#60A5FA', '#93C5FD']
      : ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD'];
    
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: `${Math.random() * 15 + 5}px`,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: `${Math.random() * 10 + 10}s`,
      delay: `${Math.random() * 5}s`
    }));
    
    setParticles(newParticles);
  }, [theme]);
  
  return (
    <div className="particles">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="particle"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            animationDuration: particle.duration,
            animationDelay: particle.delay
          }}
        />
      ))}
    </div>
  );
};

const Confetti = ({ active, count = 50 }) => {
  const [confetti, setConfetti] = useState([]);
  
  useEffect(() => {
    if (active) {
      const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];
      const shapes = ['square', 'circle', 'triangle'];
      
      const newConfetti = Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        size: `${Math.random() * 10 + 5}px`,
        duration: `${Math.random() * 3 + 1}s`,
        delay: `${Math.random() * 0.5}s`
      }));
      
      setConfetti(newConfetti);
      
      const timer = setInterval(() => {
        setConfetti(prev => {
          const newBatch = Array.from({ length: Math.floor(count/3) }, (_, i) => ({
            id: `new-${Date.now()}-${i}`,
            left: `${Math.random() * 100}%`,
            color: colors[Math.floor(Math.random() * colors.length)],
            shape: shapes[Math.floor(Math.random() * shapes.length)],
            size: `${Math.random() * 10 + 5}px`,
            duration: `${Math.random() * 3 + 1}s`,
            delay: '0s'
          }));
          
          return [...prev.slice(-60), ...newBatch];
        });
      }, 2000);
      
      return () => clearInterval(timer);
    }
    
    return () => {};
  }, [active, count]);
  
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none' }}>
      {confetti.map(item => (
        <div
          key={item.id}
          className="confetti"
          style={{
            left: item.left,
            top: '-10px',
            width: item.size,
            height: item.size,
            backgroundColor: item.color,
            borderRadius: item.shape === 'circle' ? '50%' : item.shape === 'triangle' ? '0% 50% 50% 50%' : '0%',
            animationDuration: item.duration,
            animationDelay: item.delay,
            transform: item.shape === 'triangle' ? 'rotate(45deg)' : 'rotate(0deg)'
          }}
        />
      ))}
    </div>
  );
};

const AnimatedCounter = ({ value, className }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);
  
  useEffect(() => {
    if (value === 0) {
      setDisplayValue(0);
      return;
    }
    
    const duration = 2000;
    const steps = 20;
    const increment = value / steps;
    let current = 0;
    let timer;
    
    const updateCounter = () => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
        setAnimationKey(prev => prev + 1);
      } else {
        setDisplayValue(Math.round(current));
      }
    };
    
    timer = setInterval(updateCounter, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  
  return (
    <span key={animationKey} className={`count-up ${className}`}>
      {displayValue}
    </span>
  );
};

const RandomFact = ({ className }) => {
  const [factIndex, setFactIndex] = useState(0);
  const [animationState, setAnimationState] = useState('visible');
  const { theme } = useTheme();
  const containerRef = useRef(null);
  
  const funFacts = [
    "Shift workers make up about 20% of the global workforce",
    "Regular sleep schedules can improve your work performance by up to 15%",
    "Taking short breaks every 90 minutes can boost productivity by 30%",
    "The most productive time of day for most people is 9-11am",
    "Getting natural light during work hours can improve sleep quality by 46%"
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationState('exiting');
      
      setTimeout(() => {
        setAnimationState('changing');
        setFactIndex(prev => (prev + 1) % funFacts.length);
        
        setTimeout(() => {
          setAnimationState('entering');
          
          setTimeout(() => {
            setAnimationState('visible');
          }, 600);
        }, 50);
      }, 600);
      
    }, 8000);
    
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    if (animationState === 'entering' && containerRef.current) {
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const centerX = rect.width / 2;
      
      for (let i = 0; i < 15; i++) {
        const confetti = document.createElement('div');
        const size = Math.random() * 4 + 2;
        
        confetti.style.position = 'absolute';
        confetti.style.width = `${size}px`;
        confetti.style.height = `${size}px`;
        confetti.style.backgroundColor = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'][Math.floor(Math.random() * 4)];
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        confetti.style.left = `${centerX + (Math.random() * 40 - 20)}px`;
        confetti.style.top = '50%';
        
        confetti.style.animation = `factConfetti ${Math.random() * 1 + 0.5}s forwards`;
        container.appendChild(confetti);
        
        setTimeout(() => {
          if (container.contains(confetti)) {
            container.removeChild(confetti);
          }
        }, 1500);
      }
    }
  }, [animationState]);
  
  const getStyles = () => {
    switch (animationState) {
      case 'exiting':
        return {
          transform: 'translateY(20px) scale(0.95)',
          opacity: 0,
          filter: 'blur(4px)',
          transition: 'all 0.6s ease-in-out'
        };
      case 'changing':
        return {
          transform: 'translateY(-20px) scale(0.95)',
          opacity: 0,
          filter: 'blur(4px)',
          transition: 'all 0.6s ease-in-out'
        };
      case 'entering':
        return {
          transform: 'translateY(0) scale(1)',
          opacity: 1,
          filter: 'blur(0px)',
          transition: 'all 0.6s ease-in-out'
        };
      default:
        return {
          transform: 'translateY(0) scale(1)',
          opacity: 1,
          filter: 'blur(0px)',
          transition: 'all 0.6s ease-in-out'
        };
    }
  };
  
  return (
    <div className={`${className} relative`} ref={containerRef}>
      <style jsx>{`
        @keyframes factConfetti {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(${Math.random() > 0.5 ? '-' : ''}${Math.random() * 50 + 20}px, -${Math.random() * 40 + 20}px) rotate(${Math.random() * 360}deg); opacity: 0; }
        }
        
        @keyframes glow {
          0%, 100% { text-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
          50% { text-shadow: 0 0 15px rgba(59, 130, 246, 0.8), 0 0 20px rgba(59, 130, 246, 0.5); }
        }
      `}</style>
      
      <p className="text-base italic">
        <span className="font-medium">Did you know? </span>
        <span 
          className={`inline-block transition-all duration-600 ease-in-out ${animationState === 'entering' ? 'animate-glow' : ''}`}
          style={{
            ...getStyles(),
            animation: animationState === 'entering' ? 'glow 1.5s ease-in-out' : 'none'
          }}
        >
          {funFacts[factIndex]}
        </span>
        
        {animationState === 'entering' && (
          <span 
            className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
            style={{
              width: '100%',
              animation: 'sweep 1s ease-in-out forwards',
              opacity: 0.7,
              left: '0',
              bottom: '-2px'
            }}
          />
        )}
      </p>
    </div>
  );
};

const PredictiveInsights = ({ preferences = [], theme }) => {
  const [currentInsight, setCurrentInsight] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);
  
  const formatPreference = (pref) => {
    if (pref.includes("dayOffDates")) return "preferred days off";
    if (pref.includes("startTime")) return "start time preferences";
    if (pref.includes("endTime")) return "end time preferences";
    if (pref.includes("shift")) return "shift type preferences";
    if (pref.includes("Date")) return "date preferences";
    
    return pref.replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())
              .replace(/:.*/, '');
  };
  
  const insights = [
    "Looking for matching start times...",
    "Analyzing weekend availability...",
    "Checking for consecutive days off...",
    "Finding shifts with your preferred hours...",
    "Prioritizing your worklife balance preferences..."
  ];
  
  const customInsights = preferences.length > 0 
    ? preferences.map(pref => `Optimizing for ${formatPreference(pref)}...`) 
    : [];
  
  const allInsights = [...customInsights, ...insights];
  
  useEffect(() => {
    if (allInsights.length <= 1) return;
    
    const cycleTimer = setInterval(() => {
      setFadingOut(true);
      
      setTimeout(() => {
        setCurrentInsight(prev => (prev + 1) % allInsights.length);
        setFadingOut(false);
      }, 500);
      
    }, 4000);
    
    return () => clearInterval(cycleTimer);
  }, [allInsights.length]);
  
  return (
    <div className="mt-3 mb-3 text-base font-light h-8 flex items-center justify-center">
      <div 
        className={`inline-flex items-center transition-opacity duration-500 ${
          fadingOut ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <svg className={`w-5 h-5 mr-2 ${theme === 'dark' ? 'text-purple-300' : 'text-purple-500'}`} 
             fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
        </svg>
        <span className={`${theme === 'dark' ? 'text-purple-300' : 'text-purple-500'} font-medium`}>
          {allInsights[currentInsight]}
        </span>
      </div>
    </div>
  );
};

const TouchRipple = ({ theme }) => {
  const [ripples, setRipples] = useState([]);
  const containerRef = useRef(null);
  const nextId = useRef(0);
  
  const addRipple = useCallback((x, y) => {
    const newRipple = {
      id: nextId.current,
      x,
      y,
      size: Math.random() * 50 + 50,
      color: theme === 'dark' 
        ? ['rgba(79, 70, 229, 0.3)', 'rgba(59, 130, 246, 0.3)', 'rgba(16, 185, 129, 0.3)'][Math.floor(Math.random() * 3)]
        : ['rgba(37, 99, 235, 0.2)', 'rgba(59, 130, 246, 0.2)', 'rgba(16, 185, 129, 0.2)'][Math.floor(Math.random() * 3)]
    };
    
    nextId.current += 1;
    setRipples(prev => [...prev, newRipple]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 1000);
  }, [theme]);
  
  const handlePointerDown = useCallback((e) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    addRipple(x, y);
  }, [addRipple]);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener('pointerdown', handlePointerDown);
    
    return () => {
      container.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [handlePointerDown]);
  
  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 z-10 pointer-events-auto"
    >
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="ripple"
          style={{
            position: 'absolute',
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: ripple.color,
            borderRadius: '50%',
            transform: 'scale(0)',
            animation: 'rippleEffect 1s ease-out forwards'
          }}
        />
      ))}
      <style jsx>{`
        @keyframes rippleEffect {
          0% { transform: scale(0); opacity: 0.7; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default function DesktopResultsLoadingView({ 
  scheduleCount = 0,
  preferences = [], 
  onComplete = null
}) {
  const { theme } = useTheme();
  const { data: session } = useSession();
  const userName = session?.user?.name?.split(' ')[0] || 'there';
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [buttonVisible, setButtonVisible] = useState(false);
  
  const steps = [
    { label: "Loading preferences", complete: currentStepIndex > 0, active: currentStepIndex === 0 },
    { label: "Preparing data", complete: currentStepIndex > 1, active: currentStepIndex === 1 },
    { label: "Calculating scores", complete: currentStepIndex > 2, active: currentStepIndex === 2 },
    { label: "Sorting results", complete: currentStepIndex > 3, active: currentStepIndex === 3 }
  ];
  
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
  
  useEffect(() => {
    if (processingComplete) {
      const timer = setTimeout(() => {
        setButtonVisible(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [processingComplete]);

  const handleContinue = () => {
    onComplete?.();
  };

  return (
    <div className="flex flex-col h-full w-full absolute inset-0 z-50">
      <style jsx global>{loadingStyles}</style>

      <div className={`flex-1 flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'} relative overflow-hidden`}>
        <BackgroundParticles theme={theme} />
        <TouchRipple theme={theme} />
        <Confetti active={true} count={processingComplete ? 80 : 30} />
        
        <div className={`max-w-4xl w-full mx-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-xl rounded-xl p-10 relative z-10`}>
          <div className="flex flex-col items-center">
            <div className="mb-8">
              <div className="logo-float logo-pulsate">
                <img 
                  src="/images/logo.png" 
                  alt="Logo" 
                  className="h-28 w-auto"
                />
              </div>
            </div>

            <h2 className={`text-2xl font-semibold mb-2 text-center ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              Analyzing schedules...
            </h2>
            <p className={`text-base mb-2 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Processing your preferences to find the best matches
            </p>
            
            <p className={`text-lg mt-2 ${theme === 'dark' ? 'text-teal-300' : 'text-teal-600'} font-medium`}>
              Hi {userName}! We're preparing your personalized schedules.
            </p>
            
            <PredictiveInsights preferences={preferences} theme={theme} />
            
            {scheduleCount > 0 && (
              <div className={`w-full mb-3 text-center ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'} text-lg`}>
                Processing <AnimatedCounter value={scheduleCount} /> schedules...
              </div>
            )}

            <div className={`w-full max-w-md h-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden mb-8 relative`}>
              <div 
                className={`h-full ${processingComplete 
                  ? 'bg-gradient-to-r from-green-500 via-green-400 to-green-300' 
                  : 'bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400'} 
                  progress-shimmer`}
                style={{ width: `${progressPercent}%`, transition: 'width 0.3s ease-out' }}
              ></div>
              
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs font-bold">
                <span className={`${processingComplete ? 'text-green-200' : 'text-blue-100'}`}>
                  {Math.round(progressPercent)}%
                </span>
              </div>
            </div>

            <div className="w-full max-w-md grid grid-cols-2 gap-4">
              {steps.map((step, index) => {
                const isComplete = processingComplete || index < currentStepIndex;
                const isActive = !processingComplete && index === currentStepIndex;
                
                return (
                  <div key={index} className="mb-4">
                    <div className="flex items-center mb-1">
                      <div className={`flex-shrink-0 w-6 h-6 mr-3 rounded-full flex items-center justify-center 
                        ${isComplete
                          ? (theme === 'dark' ? 'bg-green-600' : 'bg-green-500')
                          : isActive
                            ? (theme === 'dark' ? 'bg-blue-600' : 'bg-blue-500')
                            : (theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300')
                        }`}>
                        {isComplete ? (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : isActive ? (
                          <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                        ) : null}
                      </div>
                      <span className={`text-sm font-medium ${
                        isComplete
                          ? (theme === 'dark' ? 'text-green-400' : 'text-green-600')
                          : isActive
                            ? (theme === 'dark' ? 'text-blue-400' : 'text-blue-600')
                            : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400')
                      } ${isActive ? 'step-appear' : ''}`}>
                        {step.label}
                      </span>
                    </div>
                    
                    {isActive && (
                      <div className="ml-9 h-1.5 rounded-full overflow-hidden bg-gray-700 relative">
                        <div className="h-full bg-blue-600 animate-progress"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {buttonVisible && (
              <div className="mt-8 fade-in">
                <button
                  onClick={handleContinue}
                  className={`${theme === 'dark' ? 'bg-green-600 hover:bg-green-500' : 'bg-green-500 hover:bg-green-400'}
                    text-white font-medium py-3 px-8 rounded-lg shadow-lg button-pulse
                    transition duration-300 ease-in-out transform hover:scale-105
                    flex items-center justify-center`}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  View Results
                </button>
              </div>
            )}
            
            <div className={`mt-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-center max-w-lg`}>
              <RandomFact className="animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}