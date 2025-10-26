import React from 'react';
import { StatusBadge } from './StatusBadge';

interface OfficerCardProps {
  officer: {
    id: string;
    name: string;
    badge: string;
    rank: number;
    status: 'completed' | 'up_next' | 'next_in_line' | 'waiting';
    email: string | null;
    phone: string | null;
    bidAt?: string;
    notificationLanguage?: 'EN' | 'FR';
  };
  recentNotification?: {
    minutesAgo: number;
    typeText: string;
    isRecent: boolean;
    type: string;
  } | null;
  actions?: React.ReactNode;
  highlighted?: boolean;
}

export function OfficerCard({ 
  officer, 
  recentNotification,
  actions,
  highlighted = false 
}: OfficerCardProps) {
  const cardClasses = highlighted
    ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-600'
    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900';

  const rankBgColor = officer.status === 'completed'
    ? 'bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300'
    : 'bg-gray-200 dark:bg-gray-700';

  return (
    <div className={`p-3 rounded-lg border ${cardClasses}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${rankBgColor}`}>
            {officer.rank}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {officer.name}
              </span>
              {officer.notificationLanguage && (
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                  officer.notificationLanguage === 'FR' 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                }`}>
                  {officer.notificationLanguage === 'FR' ? '⚜️ FR' : '🇨🇦 EN'}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Badge: {officer.badge}
              {officer.bidAt && (
                <span className="ml-2">
                  • Completed: {new Date(officer.bidAt).toLocaleDateString()} {new Date(officer.bidAt).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>
        <StatusBadge status={officer.status} />
      </div>
      
      {/* Contact info */}
      <div className="mt-2 flex gap-3 text-xs text-gray-600 dark:text-gray-400">
        {officer.email && (
          <span className="flex items-center gap-1">
            📧 {officer.email}
          </span>
        )}
        {officer.phone && (
          <span className="flex items-center gap-1">
            📱 {officer.phone}
          </span>
        )}
        {!officer.email && !officer.phone && (
          <span className="text-red-600 dark:text-red-400">⚠ No contact info</span>
        )}
      </div>

      {/* Recent notification indicator */}
      {recentNotification && (
        <div className="mt-2 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span>
            Last notified {recentNotification.minutesAgo}m ago ({recentNotification.typeText})
          </span>
        </div>
      )}
      
      {/* Action buttons */}
      {actions && (
        <div className="mt-2 flex gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}