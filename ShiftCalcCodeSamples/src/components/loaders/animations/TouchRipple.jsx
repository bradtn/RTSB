// src/components/loaders/animations/TouchRipple.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';

const TouchRipple = ({ theme }) => {
  const [ripples, setRipples] = useState([]);
  const containerRef = useRef(null);
  const nextId = useRef(0);
  
  const addRipple = useCallback((x, y) => {
    const newRipple = {
      id: nextId.current,
      x,
      y,
      size: Math.random() * 50 + 50, // Random size between 50-100px
      color: theme === 'dark' 
        ? ['rgba(79, 70, 229, 0.3)', 'rgba(59, 130, 246, 0.3)', 'rgba(16, 185, 129, 0.3)'][Math.floor(Math.random() * 3)]
        : ['rgba(37, 99, 235, 0.2)', 'rgba(59, 130, 246, 0.2)', 'rgba(16, 185, 129, 0.2)'][Math.floor(Math.random() * 3)]
    };
    
    nextId.current += 1;
    setRipples(prev => [...prev, newRipple]);
    
    // Remove ripple after animation completes
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
      className="absolute inset-0 z-10 pointer-events-auto touch-none"
      style={{ touchAction: 'none' }}
    >
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: ripple.color,
            animation: 'rippleEffect 1s ease-out forwards'
          }}
        />
      ))}
    </div>
  );
};

export default TouchRipple;
