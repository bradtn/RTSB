// src/utils/useIsMobile.ts
import { useState, useEffect } from 'react';

export default function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    // Function to check if screen is mobile size
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    
    // Check on mount
    checkMobile();
    
    // Listen for window resize
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);
  
  return isMobile;
}