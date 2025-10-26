'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="relative p-2 w-9 h-9">
        <div className="h-5 w-5 animate-pulse bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
    );
  }

  const handleToggle = () => {
    console.log('ThemeToggle clicked - current theme:', theme);
    toggleTheme();
  };

  return (
    <button
      onClick={handleToggle}
      className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-lg sm:w-10 sm:h-10"
      aria-label="Toggle theme"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400" />
      ) : (
        <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 dark:text-yellow-400" />
      )}
    </button>
  );
}