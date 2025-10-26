"use client";

import { useEffect, useState } from 'react';

export default function TestDarkPage() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial state
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleDarkMode = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Dark Mode Test
        </h1>
        
        <button 
          onClick={toggleDarkMode}
          className="mb-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
        >
          Toggle Dark Mode (Currently: {isDark ? 'Dark' : 'Light'})
        </button>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            This should change colors when you toggle dark mode.
          </p>
          <p className="text-sm mt-2 text-gray-500 dark:text-gray-500">
            HTML classes: {typeof window !== 'undefined' && document.documentElement.className}
          </p>
        </div>

        <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Debug Info:</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Dark class present: {isDark ? 'Yes' : 'No'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Theme in localStorage: {typeof window !== 'undefined' && localStorage.getItem('theme')}
          </p>
        </div>
      </div>
    </div>
  );
}