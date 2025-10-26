// src/utils/useResponsiveSize.js
import { useEffect, useState } from 'react';

export function useResponsiveSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });
  
  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    window.addEventListener("resize", handleResize);
    // Initial size
    handleResize();
    
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // Return size categories
  return {
    isSmall: windowSize.width < 640,
    isMedium: windowSize.width >= 640 && windowSize.width < 768,
    isLarge: windowSize.width >= 768 && windowSize.width < 1024,
    isXLarge: windowSize.width >= 1024,
    windowSize,
  };
}