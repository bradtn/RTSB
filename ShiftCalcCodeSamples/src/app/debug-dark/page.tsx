"use client";

import { useEffect, useState } from 'react';

export default function DebugDarkPage() {
  const [darkClass, setDarkClass] = useState(false);
  const [themeInStorage, setThemeInStorage] = useState('');
  const [htmlClasses, setHtmlClasses] = useState('');

  const checkState = () => {
    setDarkClass(document.documentElement.classList.contains('dark'));
    setThemeInStorage(localStorage.getItem('theme') || 'not set');
    setHtmlClasses(document.documentElement.className || 'none');
  };

  useEffect(() => {
    checkState();
    
    // Listen for class changes
    const observer = new MutationObserver(() => {
      checkState();
    });
    
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);

  const addDarkClass = () => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
    checkState();
  };

  const removeDarkClass = () => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    checkState();
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Dark Mode Debug</h1>
        
        <div className="space-y-2">
          <button 
            onClick={addDarkClass}
            className="px-4 py-2 bg-green-500 text-white rounded mr-2"
          >
            Add Dark Class
          </button>
          <button 
            onClick={removeDarkClass}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Remove Dark Class
          </button>
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Current State:</h2>
          <p>Dark class on html: <strong>{darkClass ? 'YES' : 'NO'}</strong></p>
          <p>Theme in localStorage: <strong>{themeInStorage}</strong></p>
          <p>HTML element classes: <strong>{htmlClasses}</strong></p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
            <p className="text-gray-900 dark:text-gray-100">
              This box should be light gray in light mode and dark gray in dark mode
            </p>
          </div>
          
          <div className="p-4 bg-white dark:bg-black rounded">
            <p className="text-black dark:text-white">
              This box should be white in light mode and black in dark mode
            </p>
          </div>
        </div>

        <div className="p-4 border border-gray-300 dark:border-gray-700 rounded">
          <p className="text-gray-700 dark:text-gray-300">
            Border should be light in light mode and dark in dark mode
          </p>
        </div>

        <div className="mt-8">
          <h2 className="font-semibold mb-2">Test Classes:</h2>
          <div className="space-y-2">
            <div className="p-2 bg-gray-50">bg-gray-50 (no dark variant)</div>
            <div className="p-2 bg-gray-50 dark:bg-gray-900">bg-gray-50 dark:bg-gray-900</div>
            <div className="p-2 text-gray-900 dark:text-gray-100">text-gray-900 dark:text-gray-100</div>
          </div>
        </div>
      </div>
    </div>
  );
}