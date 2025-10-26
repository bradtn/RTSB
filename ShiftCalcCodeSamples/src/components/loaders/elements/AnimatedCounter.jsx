// src/components/loaders/elements/AnimatedCounter.jsx
import React, { useState, useEffect } from 'react';

const AnimatedCounter = ({ value, className }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);
  
  useEffect(() => {
    if (value === 0) {
      setDisplayValue(0);
      return;
    }
    
    // Calculate increment for smooth counting
    const duration = 2000; // 2 seconds
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

export default AnimatedCounter;
