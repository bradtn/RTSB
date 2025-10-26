// src/components/common/ModeToggle.tsx
// Component that allows users to switch between wizard and advanced interface modes

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { InterfaceMode } from '@/utils/useInterfaceMode';

interface ModeToggleProps {
  currentMode: InterfaceMode;
  onChange: (mode: InterfaceMode) => void;
  className?: string;
}

export default function ModeToggle({ currentMode, onChange, className = '' }: ModeToggleProps) {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  
  return (
    <div className={`${className} flex items-center`}>
      <span className={`mr-2 text-sm ${styles.textMuted}`}>Mode:</span>
      <div className={`flex rounded-md overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
        <button
          onClick={() => onChange('wizard')}
          className={`px-3 py-1 text-sm transition ${
            currentMode === 'wizard'
              ? theme === 'dark' 
                ? 'bg-blue-600 text-white' 
                : 'bg-blue-500 text-white'
              : `${styles.textSecondary}`
          }`}
          aria-pressed={currentMode === 'wizard'}
        >
          Wizard
        </button>
        <button
          onClick={() => onChange('advanced')}
          className={`px-3 py-1 text-sm transition ${
            currentMode === 'advanced'
              ? theme === 'dark' 
                ? 'bg-blue-600 text-white' 
                : 'bg-blue-500 text-white'
              : `${styles.textSecondary}`
          }`}
          aria-pressed={currentMode === 'advanced'}
        >
          Advanced
        </button>
      </div>
    </div>
  );
}