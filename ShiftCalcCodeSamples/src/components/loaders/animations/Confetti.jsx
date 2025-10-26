// src/components/loaders/animations/Confetti.jsx
import React, { useState, useEffect } from 'react';

const Confetti = ({ active, count = 30 }) => {
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
        size: `${Math.random() * 8 + 5}px`,
        duration: `${Math.random() * 3 + 1}s`,
        delay: `${Math.random() * 0.5}s`
      }));
      
      setConfetti(newConfetti);
      
      // Generate new confetti periodically
      const timer = setInterval(() => {
        setConfetti(prev => {
          const newBatch = Array.from({ length: Math.floor(count/3) }, (_, i) => ({
            id: `new-${Date.now()}-${i}`,
            left: `${Math.random() * 100}%`,
            color: colors[Math.floor(Math.random() * colors.length)],
            shape: shapes[Math.floor(Math.random() * shapes.length)],
            size: `${Math.random() * 8 + 5}px`,
            duration: `${Math.random() * 3 + 1}s`,
            delay: '0s'
          }));
          
          return [...prev.slice(-40), ...newBatch]; // Keep max 50 particles
        });
      }, 2000);
      
      return () => clearInterval(timer);
    }
    
    return () => {};
  }, [active, count]);
  
  return (
    <div className="confetti-container" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none' }}>
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

export default Confetti;
