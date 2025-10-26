// src/components/loaders/elements/RandomFact.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const RandomFact = ({ className }) => {
  const [factIndex, setFactIndex] = useState(0);
  const [animationState, setAnimationState] = useState('visible'); // 'visible', 'exiting', 'changing', 'entering'
  const { theme } = useTheme();
  const containerRef = useRef(null);
  
  // Sample facts array
  const funFacts = [
    "Shift workers make up about 20% of the global workforce",
    "Regular sleep schedules can improve your work performance by up to 15%",
    "Taking short breaks every 90 minutes can boost productivity by 30%",
    "The most productive time of day for most people is 9-11am",
    "Getting natural light during work hours can improve sleep quality by 46%"
  ];
  
  useEffect(() => {
    // Change fact every 8 seconds with elaborate transition
    const interval = setInterval(() => {
      // Start exit animation
      setAnimationState('exiting');
      
      // After exit animation, change content
      setTimeout(() => {
        setAnimationState('changing');
        setFactIndex(prev => (prev + 1) % funFacts.length);
        
        // Short delay to ensure content updated
        setTimeout(() => {
          setAnimationState('entering');
          
          // After entry animation completes
          setTimeout(() => {
            setAnimationState('visible');
          }, 600); // Entry animation duration
        }, 50);
      }, 600); // Exit animation duration
      
    }, 8000); // Change fact every 8 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Add confetti burst when fact changes
  useEffect(() => {
    if (animationState === 'entering' && containerRef.current) {
      // Create small confetti burst
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const centerX = rect.width / 2;
      
      // Create and add mini confetti pieces
      for (let i = 0; i < 15; i++) {
        const confetti = document.createElement('div');
        const size = Math.random() * 4 + 2; // 2-6px
        
        // Random confetti styling
        confetti.style.position = 'absolute';
        confetti.style.width = `${size}px`;
        confetti.style.height = `${size}px`;
        confetti.style.backgroundColor = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'][Math.floor(Math.random() * 4)];
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        confetti.style.left = `${centerX + (Math.random() * 40 - 20)}px`;
        confetti.style.top = '50%';
        
        // Animation
        confetti.style.animation = `factConfetti ${Math.random() * 1 + 0.5}s forwards`;
        container.appendChild(confetti);
        
        // Remove after animation completes
        setTimeout(() => {
          if (container.contains(confetti)) {
            container.removeChild(confetti);
          }
        }, 1500);
      }
    }
  }, [animationState]);
  
  // Dynamic styles based on animation state
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
      case 'visible':
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
      
      <p className="text-xs italic">
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
        
        {/* Highlight underline that sweeps across the text when it enters */}
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

export default RandomFact;
