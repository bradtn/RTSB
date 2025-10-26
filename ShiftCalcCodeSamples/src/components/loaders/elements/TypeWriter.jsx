// src/components/loaders/elements/TypeWriter.jsx
import React, { useState, useEffect, useRef } from 'react';

const TypeWriter = ({ text, speed = 50, loop = false }) => {
  const [displayText, setDisplayText] = useState('');
  const index = useRef(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  
  useEffect(() => {
    if (!loop) {
      // Simple non-looping typewriter
      if (index.current < text.length) {
        const timer = setTimeout(() => {
          setDisplayText(prev => prev + text.charAt(index.current));
          index.current += 1;
        }, speed);
        
        return () => clearTimeout(timer);
      }
    } else {
      // Looping typewriter with pause and delete
      let timer;
      
      if (isWaiting) {
        timer = setTimeout(() => {
          setIsWaiting(false);
          setIsDeleting(true);
        }, 2000); // Wait time at full text
      } else if (isDeleting) {
        if (displayText.length === 0) {
          setIsDeleting(false);
          index.current = 0;
        } else {
          timer = setTimeout(() => {
            setDisplayText(prev => prev.substring(0, prev.length - 1));
          }, speed / 2);
        }
      } else {
        if (index.current < text.length) {
          timer = setTimeout(() => {
            setDisplayText(prev => prev + text.charAt(index.current));
            index.current += 1;
            
            if (index.current >= text.length) {
              setIsWaiting(true);
            }
          }, speed);
        }
      }
      
      return () => clearTimeout(timer);
    }
    
    // Reset index when text changes
    return () => {
      if (!loop) {
        index.current = 0;
        setDisplayText('');
      }
    };
  }, [text, displayText, speed, loop, isDeleting, isWaiting]);
  
  return <span>{displayText}</span>;
};

export default TypeWriter;
