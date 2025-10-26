'use client';

import { Star, MapPin, Clock, User, Calendar, Users, Settings, UserCheck, UserX, Ban, CalendarDays, Download, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import toast from 'react-hot-toast';
import MetricModal from './MetricModal';
import AllMetricsModal from './AllMetricsModal';
import ScheduleCalendarModal from './ScheduleCalendarModal';
import DayOffMatchModal from './DayOffMatchModal';
import AssignOfficerModal from './AssignOfficerModal';
import ICalButton from '../common/ICalButton';
import { useBidLineCardModals } from '@/hooks/useBidLineCardModals';
import { useBidLineHolidays } from '@/hooks/useBidLineHolidays';
import { useMetricSettings } from '@/hooks/useMetricSettings';
import ScheduleMetrics from './ScheduleMetrics';
import StatusActions from './StatusActions';
import { getTotalWeekendsInPeriod, getShiftBreakdown, getMetricLabel, formatDaysOfWeek, getStatusColor } from '@/utils/bidLineMetrics';

interface MetricSettings {
  showWeekends: boolean;
  showSaturdays: boolean;
  showSundays: boolean;
  show5DayBlocks: boolean;
  show4DayBlocks: boolean;
  showHolidays: boolean;
}

interface BidLineCardProps {
  bidLine: {
    id: string;
    lineNumber: string;
    shiftStart: string;
    shiftEnd: string;
    daysOfWeek: string[];
    location?: string;
    status: 'AVAILABLE' | 'TAKEN' | 'BLACKED_OUT';
    takenBy?: string;
    takenAt?: string;
    notes?: string;
    isFavorited?: boolean;
    favoriteRank?: number;
    favoriteId?: string;
    operation?: {
      id: string;
      name: string;
      nameEn: string;
      nameFr: string;
    };
    schedule?: {
      scheduleShifts: Array<{
        dayNumber: number;
        shiftCode?: {
          code: string;
          beginTime: string;
          endTime: string;
          category: string;
          hoursLength: number;
        };
      }>;
      bidPeriod?: {
        id: string;
        name: string;
        numCycles: number;
        startDate: string;
        endDate: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      };
    };
    bidPeriod?: {
      id: string;
      name: string;
      numCycles: number;
      startDate: string;
      endDate: string;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    };
    scheduleMetrics?: {
      weekendsOn: number;
      saturdaysOn: number;
      sundaysOn: number;
      blocks5day: number;
      blocks4day: number;
      shiftPattern: string;
    };
  };
  translations: {
    favoriteRemoved: string;
    favoriteAdded: string;
    changesError: string;
    lineClaimedSuccess: string;
    lineClaimedError: string;
    bidLineNumber: string;
    bidLineClaim: string;
    bidLineAvailable: string;
    bidLineTaken: string;
    bidLineBlackedOut: string;
    daysMon: string;
    daysTue: string;
    daysWed: string;
    daysThu: string;
    daysFri: string;
    daysSat: string;
    daysSun: string;
    // Schedule metrics translations
    scheduleMetricsTitle?: string;
    weekendsWorking?: string;
    saturdays?: string;
    sundays?: string;
    fiveDayBlocks?: string;
    fourDayBlocks?: string;
    holidays?: string;
    // Modal-specific translations
    whatThisMeans?: string;
    whyItMatters?: string;
    completeScheduleSummary?: string;
    close?: string;
    // Metric descriptions
    weekendsDescription?: string;
    saturdaysDescription?: string;
    sundaysDescription?: string;
    fiveDayBlocksDescription?: string;
    fourDayBlocksDescription?: string;
    holidaysDescription?: string;
    // Metric explanations
    weekendsExplanation?: string;
    saturdaysExplanation?: string;
    sundaysExplanation?: string;
    fiveDayBlocksExplanation?: string;
    fourDayBlocksExplanation?: string;
    holidaysExplanation?: string;
    // Day-off match modal translations
    dayOffMatch?: {
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
  };
  onFavoriteToggle: (id: string) => void;
  onClaim?: (id: string) => void;
  canClaim?: boolean;
  isAdmin?: boolean;
  onManage?: (id: string, action: 'assign' | 'release' | 'blackout', data?: any) => void;
  shouldFetchDayOffMatch?: boolean;
  metricSettings?: MetricSettings;
}

export default function BidLineCard({ bidLine, translations, onFavoriteToggle, onClaim, canClaim, isAdmin, onManage, shouldFetchDayOffMatch = false, metricSettings: globalMetricSettings }: BidLineCardProps) {
  const params = useParams();
  const { t } = useTranslation(params.locale as string);
  
  const [isLoading, setIsLoading] = useState(false);
  const [dayOffMatch, setDayOffMatch] = useState<{
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
  } | null>(null);

  // Modal states using extracted hook
  const {
    showMetricModal,
    showCalendarModal,
    showDayOffModal,
    showAssignModal,
    showAdminMenu,
    selectedMetric,
    openMetricModal,
    closeMetricModal,
    openCalendarModal,
    closeCalendarModal,
    openDayOffModal,
    closeDayOffModal,
    openAssignModal,
    closeAssignModal,
    toggleAdminMenu,
    closeAdminMenu,
    showAllMetricsModal,
    openAllMetricsModal,
    closeAllMetricsModal,
  } = useBidLineCardModals();

  // Use extracted hooks and utilities
  const bidPeriod = bidLine.bidPeriod || bidLine.schedule?.bidPeriod;
  const totalWeekends = getTotalWeekendsInPeriod(bidPeriod);
  const shiftBreakdown = getShiftBreakdown(bidLine.schedule?.scheduleShifts, bidPeriod);
  const { holidayData } = useBidLineHolidays(bidPeriod, bidLine.schedule?.scheduleShifts);

  // Fetch operation-specific settings if the bid line has an operation
  const { metricSettings: operationSpecificSettings } = useMetricSettings({ 
    selectedOperation: bidLine.operation?.id || 'all' 
  });

  // Use operation-specific settings if available, otherwise fall back to global settings passed as props
  const currentMetricSettings = operationSpecificSettings || globalMetricSettings || {
    showWeekends: true,
    showSaturdays: true,
    showSundays: true,
    show5DayBlocks: true,
    show4DayBlocks: true,
    showHolidays: true,
  };
  
  // Debug logging to check what settings are being used
  if (bidLine.operation?.name === 'COMM' && bidLine.lineNumber === '1') {
    console.log('COMM Line 1 operation ID:', bidLine.operation?.id);
    console.log('COMM Line 1 metric settings:', currentMetricSettings);
  }

  // Fetch day-off match data ONLY if user has day-off requests AND it's enabled
  // This is passed from parent to prevent repeated checks
  useEffect(() => {
    // Only fetch if explicitly enabled by parent (which checks once for all cards)
    if (!shouldFetchDayOffMatch) {
      return;
    }

    const fetchDayOffMatch = async () => {
      try {
        const res = await fetch('/api/day-off-requests/calculate-matches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bidLineId: bidLine.id }),
        });
        
        if (res.ok) {
          const data = await res.json();
          setDayOffMatch(data);
        }
      } catch (error) {
        console.error('Failed to fetch day-off match:', error);
      }
    };

    fetchDayOffMatch();
  }, [bidLine.id, shouldFetchDayOffMatch]);

  // Use extracted utility function
  const statusColor = getStatusColor(bidLine.status);

  const handleFavoriteClick = async () => {
    setIsLoading(true);
    try {
      await onFavoriteToggle(bidLine.id);
      toast.success(bidLine.isFavorited ? translations.favoriteRemoved : translations.favoriteAdded);
    } catch (error) {
      toast.error(translations.changesError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimClick = async () => {
    if (!onClaim || !canClaim) return;
    
    setIsLoading(true);
    try {
      await onClaim(bidLine.id);
      toast.success(translations.lineClaimedSuccess);
    } catch (error) {
      toast.error(translations.lineClaimedError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminAction = async (action: 'assign' | 'release' | 'blackout', data?: any) => {
    if (!onManage || !isAdmin) return;
    
    setIsLoading(true);
    closeAdminMenu();
    try {
      await onManage(bidLine.id, action, data);
      const successMessage = action === 'assign' 
        ? t('messages.lineAssignedSuccess')
        : action === 'release' 
        ? t('messages.lineReleasedSuccess')
        : t('messages.lineBlackedOutSuccess');
      toast.success(successMessage);
    } catch (error) {
      const errorMessage = action === 'assign' 
        ? t('messages.lineAssignFailed')
        : action === 'release' 
        ? t('messages.lineReleaseFailed')
        : t('messages.lineBlackoutFailed');
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMetricClick = (
    e: React.MouseEvent,
    type: 'weekends' | 'saturdays' | 'sundays' | 'fiveDayBlocks' | 'fourDayBlocks' | 'holidays',
    value: number | string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    openMetricModal(type, value);
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm');
  };

  return (
    <>
    <div className={`rounded-lg border p-4 shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 flex flex-col h-full ${statusColor}`}>
      <div className="mb-3">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {bidLine.operation?.name || 'Unknown Operation'}
        </h2>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
          {t('bidLine.line')} {bidLine.lineNumber}
        </p>
      </div>

      {/* Schedule Metrics with extracted component */}
      <ScheduleMetrics
        scheduleMetrics={bidLine.scheduleMetrics}
        metricSettings={currentMetricSettings}
        holidayData={holidayData}
        shiftBreakdown={shiftBreakdown}
        onMetricClick={handleMetricClick}
        t={t}
      />

      {/* View All Metrics Button */}
      {bidLine.scheduleMetrics && (
        <div className="flex justify-center mt-3 mb-3">
          <button
            onClick={() => {
              openAllMetricsModal();
            }}
            className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2 px-6 rounded font-medium transition-all duration-200 hover:scale-105 hover:shadow-md transform"
            title={'View All Metrics'}
          >
            <BarChart3 size={16} />
            <span className="text-sm">View All Metrics</span>
          </button>
        </div>
      )}

      {/* Calendar Actions */}
      {bidLine.scheduleMetrics && (
        <div className="flex gap-1 sm:gap-2 mb-3">
          <button
            onClick={openCalendarModal}
            className="flex items-center justify-center gap-1 flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-2 rounded font-medium transition-all duration-200 hover:scale-105 hover:shadow-md transform"
          >
            <CalendarDays size={16} />
            <span className="text-xs sm:text-sm lg:text-base">{t('common.view')}</span>
          </button>
          <ICalButton
            bidLineId={bidLine.id}
            buttonText={t('common.addToCalendar')}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-2 rounded font-medium text-xs sm:text-sm lg:text-base transition-all duration-200 hover:scale-105 hover:shadow-md transform"
            showIcon={true}
          />
        </div>
      )}

      {/* Day-Off Match Indicator */}
      {dayOffMatch?.hasRequests && (
        <div 
          onClick={openDayOffModal}
          className={`mb-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md transform border-2 ${
            dayOffMatch.matchPercentage === 100
              ? 'bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 border-blue-400 dark:border-blue-600 hover:from-blue-200 hover:to-indigo-200 dark:hover:from-blue-900/50 dark:hover:to-indigo-900/50' 
              : dayOffMatch.matchPercentage >= 80 
              ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/40' 
              : dayOffMatch.matchPercentage >= 50
              ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 hover:bg-yellow-200 dark:hover:bg-yellow-900/40'
              : 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-900/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className={`h-5 w-5 ${
                dayOffMatch.matchPercentage === 100
                  ? 'text-blue-600 dark:text-blue-400' 
                  : dayOffMatch.matchPercentage >= 80 
                  ? 'text-green-600 dark:text-green-400' 
                  : dayOffMatch.matchPercentage >= 50
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-600 dark:text-red-400'
              }`} />
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {params.locale === 'fr' ? 'Correspondance congés' : 'Day-Off Match'}: {dayOffMatch.matchPercentage}%
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {dayOffMatch.conflictingDays > 0 
                    ? (params.locale === 'fr' 
                        ? `${dayOffMatch.conflictingDays} conflit${dayOffMatch.conflictingDays !== 1 ? 's' : ''} avec les jours de congé demandés`
                        : `${dayOffMatch.conflictingDays} conflict${dayOffMatch.conflictingDays !== 1 ? 's' : ''} with requested days off`
                      )
                    : t('dayOffMatch.allPreserved')
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2 text-sm">
        {bidLine.location && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 opacity-60" />
            <span>{bidLine.location}</span>
          </div>
        )}

        {bidLine.status === 'TAKEN' && bidLine.takenBy && (
          <div className="mt-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-950/60 dark:to-rose-950/60 border border-red-400 dark:border-red-600 rounded-full shadow-sm">
              <div className="flex items-center justify-center w-5 h-5 bg-red-600 dark:bg-red-500 rounded-full">
                <User className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 pr-1">
                {bidLine.takenBy}
              </span>
              {bidLine.takenAt && (
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 border-l border-red-400 dark:border-red-600 pl-2">
                  {format(new Date(bidLine.takenAt), 'MMM d, HH:mm')}
                </span>
              )}
            </div>
          </div>
        )}

        {bidLine.notes && (
          <div className="mt-2 p-2 bg-black/10 dark:bg-white/10 rounded text-xs">
            {bidLine.notes}
          </div>
        )}
      </div>

      {/* Status Actions with extracted component */}
      <StatusActions
        bidLine={bidLine}
        translations={translations}
        isLoading={isLoading}
        canClaim={canClaim ?? false}
        isAdmin={isAdmin ?? false}
        showAdminMenu={showAdminMenu}
        onFavoriteClick={handleFavoriteClick}
        onClaimClick={handleClaimClick}
        onToggleAdminMenu={toggleAdminMenu}
        onAdminAction={handleAdminAction}
        onShowAssignModal={openAssignModal}
        t={t}
      />
    </div>
    
    {/* Metric Modal */}
    {selectedMetric && (
      <MetricModal
        isOpen={showMetricModal}
        onClose={closeMetricModal}
        metricType={selectedMetric.type}
        metricValue={selectedMetric.value}
        bidLine={bidLine}
        translations={translations}
      />
    )}
    
    {/* Schedule Calendar Modal */}
    <ScheduleCalendarModal
      isOpen={showCalendarModal}
      onClose={closeCalendarModal}
      bidLine={bidLine}
      bidPeriod={(bidLine.bidPeriod || bidLine.schedule?.bidPeriod) ? {
        startDate: new Date((bidLine.bidPeriod || bidLine.schedule?.bidPeriod)!.startDate),
        endDate: new Date((bidLine.bidPeriod || bidLine.schedule?.bidPeriod)!.endDate),
        numCycles: (bidLine.bidPeriod || bidLine.schedule?.bidPeriod)!.numCycles
      } : undefined}
      translations={translations}
    />

    {/* Day-Off Match Modal */}
    <DayOffMatchModal
      isOpen={showDayOffModal}
      onClose={closeDayOffModal}
      lineNumber={bidLine.lineNumber}
      operationName={bidLine.operation?.name}
      locale={params.locale as string}
      matchData={dayOffMatch}
      translations={translations.dayOffMatch}
    />

    {/* Assign Officer Modal */}
    {showAssignModal && (
      <AssignOfficerModal
        isOpen={showAssignModal}
        onClose={closeAssignModal}
        onAssign={(officerName: string) => {
          handleAdminAction('assign', { officerName, officerId: 'manual' });
          closeAssignModal();
        }}
        lineNumber={bidLine.lineNumber}
        operationName={bidLine.operation?.name}
      />
    )}

    {/* All Metrics Modal */}
    <AllMetricsModal
      isOpen={showAllMetricsModal}
      onClose={closeAllMetricsModal}
      bidLine={bidLine}
      holidayData={holidayData}
      shiftBreakdown={shiftBreakdown}
      translations={translations}
      locale={params.locale as string}
    />
    </>
  );
}