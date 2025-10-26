'use client';

import { useTheme } from '@/contexts/ThemeContext';

interface LogoWithThemeProps {
  className?: string;
  alt?: string;
}

export default function LogoWithTheme({ className = "h-20 w-auto object-contain", alt = "ShiftBid" }: LogoWithThemeProps) {
  const { theme, mounted } = useTheme();

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={className}>
        <div className="h-full w-full animate-pulse bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <img 
      src={theme === 'dark' ? '/ShiftBidLogoDark.png' : '/ShiftBidLogo.png'} 
      alt={alt}
      className={className}
    />
  );
}