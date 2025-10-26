import React from 'react';

interface ModernToggleProps {
  isOn: boolean;
  onToggle: () => void;
  leftLabel: string;
  rightLabel: string;
  tooltip?: string;
  className?: string;
}

export default function ModernToggle({ 
  isOn, 
  onToggle, 
  leftLabel, 
  rightLabel, 
  tooltip,
  className = "" 
}: ModernToggleProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative group">
        <div className="relative p-1 -m-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200">
          <button
            onClick={onToggle}
            className="relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 dark:bg-gray-700 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 hover:bg-gray-300 dark:hover:bg-gray-600"
            style={{
              backgroundColor: isOn ? '#10b981' : undefined
            }}
          >
          <span
            className={`pointer-events-none relative inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out ${
              isOn ? 'translate-x-8' : 'translate-x-1'
            }`}
            style={{ top: '1px' }}
          >
            <span
              className={`absolute inset-0 flex h-full w-full items-center justify-center transition-opacity duration-200 ease-in ${
                isOn ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
            <span
              className={`absolute inset-0 flex h-full w-full items-center justify-center transition-opacity duration-200 ease-in ${
                isOn ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          </span>
          </button>
        </div>
        {tooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-4 py-3 text-xs font-medium bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out whitespace-nowrap shadow-xl border border-gray-700 dark:border-gray-300 pointer-events-none" 
             style={{zIndex: 99999, minWidth: '200px', maxWidth: '300px', whiteSpace: 'normal'}}>
            {tooltip}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className={`transition-colors duration-200 ${!isOn ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
          {leftLabel}
        </span>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <span className={`transition-colors duration-200 ${isOn ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`}>
          {rightLabel}
        </span>
      </div>
    </div>
  );
}