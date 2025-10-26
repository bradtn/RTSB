import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  
  return (
    <div className={`${styles.cardBg} rounded-lg border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`p-6 pb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  const styles = useThemeStyles();
  
  return (
    <h3 className={`font-semibold ${styles.textPrimary} ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '' }: CardDescriptionProps) {
  const styles = useThemeStyles();
  
  return (
    <p className={`${styles.textSecondary} ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={`p-6 pt-0 ${className}`}>
      {children}
    </div>
  );
}