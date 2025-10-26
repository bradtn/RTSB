import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface AlertProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'destructive' | 'warning';
}

interface AlertDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function Alert({ children, className = '', variant = 'default' }: AlertProps) {
  const { theme } = useTheme();
  
  const variantClasses = {
    default: theme === 'dark'
      ? 'border-blue-600 bg-blue-900/20 text-blue-200'
      : 'border-blue-200 bg-blue-50 text-blue-800',
    destructive: theme === 'dark'
      ? 'border-red-600 bg-red-900/20 text-red-200'
      : 'border-red-200 bg-red-50 text-red-800',
    warning: theme === 'dark'
      ? 'border-yellow-600 bg-yellow-900/20 text-yellow-200'
      : 'border-yellow-200 bg-yellow-50 text-yellow-800'
  };

  return (
    <div className={`rounded-lg border p-4 ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}

export function AlertDescription({ children, className = '' }: AlertDescriptionProps) {
  return (
    <div className={`text-sm ${className}`}>
      {children}
    </div>
  );
}