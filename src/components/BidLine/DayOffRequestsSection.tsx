'use client';

import React, { useState } from 'react';
import { ChevronRight, Calendar, X } from 'lucide-react';
import DayOffRequests from '@/components/user/DayOffRequests';

interface DayOffRequestsSectionProps {
  locale: string;
  bidPeriodStartDate?: string | null;
  translations: {
    title: string;
    description: string;
    selectDates: string;
    notes: string;
    notesPlaceholder: string;
    saving: string;
    saved: string;
    cleared: string;
    error: string;
    expand: string;
    collapse: string;
  };
}

export default function DayOffRequestsSection({ locale, bidPeriodStartDate, translations }: DayOffRequestsSectionProps) {
  const [isDayOffExpanded, setIsDayOffExpanded] = useState(false);

  return (
    <>
      {/* Day-Off Requests Header */}
      <button
        onClick={() => setIsDayOffExpanded(!isDayOffExpanded)}
        className={`w-full px-6 py-4 flex items-center justify-between hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-all duration-300 hover:shadow-md group ${isDayOffExpanded ? 'rounded-t-xl' : 'rounded-xl'}`}
      >
        <div className="flex items-center gap-3">
          <ChevronRight 
            className={`h-5 w-5 text-purple-600 dark:text-purple-400 transition-all duration-300 group-hover:text-purple-700 dark:group-hover:text-purple-300 ${
              isDayOffExpanded ? 'rotate-90' : 'rotate-0'
            }`} 
          />
          <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{translations.title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {isDayOffExpanded ? translations.collapse : translations.expand}
          </span>
        </div>
      </button>

      {/* Day-Off Requests Content */}
      {isDayOffExpanded && (
        <div className="px-6 pb-6 animate-in slide-in-from-top-2 fade-in duration-300">
          <DayOffRequests 
            locale={locale}
            translations={translations}
            bidPeriodStartDate={bidPeriodStartDate}
          />
        </div>
      )}
    </>
  );
}