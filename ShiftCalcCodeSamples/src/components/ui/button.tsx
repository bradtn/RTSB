import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  children: React.ReactNode;
}

export function Button({ 
  variant = 'default', 
  children, 
  className = '', 
  ...props 
}: ButtonProps) {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  
  const baseClasses = 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variantClasses = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: theme === 'dark' 
      ? 'border border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700' 
      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    ghost: theme === 'dark'
      ? 'text-gray-300 hover:bg-gray-800'
      : 'text-gray-700 hover:bg-gray-100'
  };

  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}