// src/components/loaders/animations/BackgroundParticles.jsx
import React, { useState, useEffect } from 'react';

const BackgroundParticles = ({ theme }) => {
  const [particles, setParticles] = useState([]);
  
  useEffect(() => {
    const colors = theme === 'dark' 
      ? ['#4F46E5', '#3B82F6', '#60A5FA', '#93C5FD']  // Blues for dark theme
      : ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD']; // Blues for light theme
    
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: `${Math.random() * 10 + 5}px`,
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

export default BackgroundParticles;
