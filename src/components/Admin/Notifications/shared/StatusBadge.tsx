import React from 'react';

type BiddingStatus = 'completed' | 'up_next' | 'next_in_line' | 'waiting';

interface StatusBadgeProps {
  status: BiddingStatus;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const baseClasses = 'px-2 py-1 text-xs rounded-full';
  
  const statusConfig = {
    completed: {
      classes: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      label: 'Completed',
    },
    up_next: {
      classes: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 animate-pulse',
      label: 'Up Next',
    },
    next_in_line: {
      classes: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      label: 'Next in Line',
    },
    waiting: {
      classes: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
      label: 'Waiting',
    },
  };

  const config = statusConfig[status] || statusConfig.waiting;

  return (
    <span className={`${baseClasses} ${config.classes} ${className}`}>
      {config.label}
    </span>
  );
}