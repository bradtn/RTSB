// src/components/DebugWrapper.jsx
'use client';

import { useEffect, useRef } from 'react';

export default function DebugWrapper({ componentName, children }) {
  const renderCount = useRef(0);
  const effectCount = useRef(0);
  
  // Track renders
  renderCount.current += 1;
  
  useEffect(() => {
    // Track effect runs
    effectCount.current += 1;
    console.log(`🔍 [${componentName}] MOUNTED (render #${renderCount.current}, effect #${effectCount.current})`);
    
    // Setup unload detection
    window.addEventListener('beforeunload', () => {
      console.log(`🔍 [${componentName}] PAGE UNLOAD with ${renderCount.current} renders and ${effectCount.current} effect runs`);
    });
    
    return () => {
      console.log(`🔍 [${componentName}] UNMOUNTED after ${renderCount.current} renders and ${effectCount.current} effect runs`);
    };
  }, [componentName]);
  
  // Log API calls from this component
  const originalFetch = global.fetch;
  if (!global._fetchIntercepted) {
    global._fetchIntercepted = true;
    global.fetch = function(...args) {
      const url = args[0]?.toString() || '';
      if (url.includes('/api/schedules')) {
        console.log(`🌐 [${componentName}] API CALL to ${url}`);
      }
      return originalFetch.apply(this, args);
    };
  }
  
  return children;
}