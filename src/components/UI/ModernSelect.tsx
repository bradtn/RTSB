import React from 'react';
import { ChevronDown } from 'lucide-react';

interface ModernSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{value: string, label: string}>;
  placeholder?: string;
  className?: string;
}

export default function ModernSelect({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  className = "" 
}: ModernSelectProps) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none w-full py-3 px-4 pr-10 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 cursor-pointer font-inter font-semibold text-sm antialiased"
        style={{
          fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
        }}
      >
        {placeholder && (
          <option 
            value=""
            style={{ 
              fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              fontWeight: '400'
            }}
          >
            {placeholder}
          </option>
        )}
        {options.map(option => (
          <option 
            key={option.value} 
            value={option.value}
            style={{ 
              fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              fontWeight: '600',
              fontSize: '14px',
              padding: '8px 12px'
            }}
          >
            {option.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <ChevronDown className="w-5 h-5 text-gray-400 transition-transform duration-200" />
      </div>
    </div>
  );
}