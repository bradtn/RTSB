'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, CheckCircle, XCircle, Info } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DayOffMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  lineNumber: string;
  operationName?: string;
  locale?: string;
  matchData: {
    hasRequests: boolean;
    matchPercentage: number;
    totalRequestedDaysOff: number;
    conflictingDays: number;
    matchingDays: number;
    details?: {
      conflictDays: Array<{
        date: string;
        shiftInfo?: {
          code: string;
          beginTime?: string;
          endTime?: string;
        } | null;
      }> | string[]; // Support both new and old formats for backward compatibility
      matchingDays: string[];
    };
  } | null;
  translations?: {
    title: string;
    matchWith: string;
    totalRequested: string;
    daysOffMatch: string;
    conflicts: string;
    conflictingDays: string;
    matchingDays: string;
    conflictDescription: string;
    matchDescription: string;
    allPreserved: string;
    infoNote: string;
    close: string;
  };
}

export default function DayOffMatchModal({
  isOpen,
  onClose,
  lineNumber,
  operationName,
  locale,
  matchData,
  translations,
}: DayOffMatchModalProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Helper function for locale-aware date formatting
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'MMM dd, yyyy', {
      locale: locale === 'fr' ? fr : undefined
    });
  };

  // Default translations
  const t = {
    title: translations?.title || 'Day-Off Match Analysis',
    matchWith: translations?.matchWith || 'with your requested days off',
    totalRequested: translations?.totalRequested || 'Total Requested',
    daysOffMatch: translations?.daysOffMatch || 'Days Off Match',
    conflicts: translations?.conflicts || 'Conflicts',
    conflictingDays: translations?.conflictingDays || 'Conflicting Days',
    matchingDays: translations?.matchingDays || 'Matching Days',
    conflictDescription: translations?.conflictDescription || 'You requested these days off, but would be working:',
    matchDescription: translations?.matchDescription || 'You requested these days off and they align with your days off:',
    allPreserved: translations?.allPreserved || 'All requested days off are preserved!',
    infoNote: translations?.infoNote || 'This analysis compares your requested days off with the working schedule of this bid line. A higher percentage means more of your requested days off are preserved.',
    close: translations?.close || 'Close',
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !isOpen || !matchData) return null;

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getPercentageBg = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 dark:bg-green-900/30';
    if (percentage >= 50) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden relative">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {t.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {operationName} - Line {lineNumber}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Match Score */}
          <div className={`mb-6 p-4 rounded-lg ${getPercentageBg(matchData.matchPercentage)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className={`h-8 w-8 ${getPercentageColor(matchData.matchPercentage)}`} />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {matchData.matchPercentage}% Match
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t.matchWith}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {matchData.totalRequestedDaysOff}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{t.totalRequested}</p>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {matchData.matchingDays}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{t.daysOffMatch}</p>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {matchData.conflictingDays}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{t.conflicts}</p>
            </div>
          </div>

          {/* Detailed Breakdown */}
          {matchData.details && (
            <div className="space-y-4">
              {/* Conflicts */}
              {matchData.details.conflictDays.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {t.conflictingDays} ({matchData.details.conflictDays.length})
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {t.conflictDescription}
                  </p>
                  <div className="space-y-2">
                    {matchData.details.conflictDays.map(conflict => (
                      <div
                        key={typeof conflict === 'string' ? conflict : conflict.date}
                        className="flex items-center justify-between px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg text-sm"
                      >
                        <span className="font-medium">
                          {typeof conflict === 'string' 
                            ? formatDate(conflict)
                            : formatDate(conflict.date)
                          }
                        </span>
                        {typeof conflict !== 'string' && conflict.shiftInfo && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="bg-red-200 dark:bg-red-800 px-2 py-1 rounded font-mono font-bold">
                              {conflict.shiftInfo.code}
                            </span>
                            {conflict.shiftInfo.beginTime && conflict.shiftInfo.endTime && (
                              <span className="text-red-700 dark:text-red-200">
                                {conflict.shiftInfo.beginTime} - {conflict.shiftInfo.endTime}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matches */}
              {matchData.details.matchingDays.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {t.matchingDays} ({matchData.details.matchingDays.length})
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {t.matchDescription}
                  </p>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {matchData.details.matchingDays.map(date => (
                      <span
                        key={date}
                        className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm"
                      >
                        {formatDate(date)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info Note */}
          <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800 dark:text-blue-300">
                {t.infoNote}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}