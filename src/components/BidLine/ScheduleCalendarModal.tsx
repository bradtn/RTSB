'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Calendar } from 'lucide-react';
import ScheduleCalendar from './ScheduleCalendar';
import MobileCalendarView from './MobileCalendarView';
import { useMobileDetect } from '@/hooks/useMobileDetect';
import { useTranslation } from '@/lib/i18n';
import { useParams } from 'next/navigation';

interface ScheduleCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  bidLine: {
    id: string;
    lineNumber: string;
    operation?: {
      name: string;
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
        } | null;
      }>;
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
  bidPeriod?: {
    startDate: Date;
    endDate: Date;
    numCycles?: number;
  };
  translations: {
    close?: string;
    scheduleMetricsTitle?: string;
    weekendsWorking?: string;
    saturdays?: string;
    sundays?: string;
    fiveDayBlocks?: string;
    fourDayBlocks?: string;
  };
}

export default function ScheduleCalendarModal({
  isOpen,
  onClose,
  bidLine,
  bidPeriod,
  translations
}: ScheduleCalendarModalProps) {
  const [mounted, setMounted] = useState(false);
  const isMobile = useMobileDetect(768);
  const params = useParams();
  const { t } = useTranslation(params.locale as string);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount or close
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  // Calculate shift code breakdown with details
  const getShiftBreakdown = () => {
    if (!bidLine.schedule?.scheduleShifts) return { shiftDetails: {}, totalWorkingDays: 0, totalOffDays: 0 };
    
    // Get number of cycles from bidPeriod
    const numCycles = bidPeriod?.numCycles || 1;
    
    const shiftDetails: { [key: string]: { 
      count: number; 
      countPerCycle: number;
      beginTime: string; 
      endTime: string;
      hoursLength: number;
      category: string;
    } } = {};
    let totalWorkingDaysPerCycle = 0;
    let totalOffDaysPerCycle = 0;
    
    // Calculate for one 56-day cycle first
    bidLine.schedule.scheduleShifts.forEach(shift => {
      if (shift.shiftCode) {
        totalWorkingDaysPerCycle++;
        const code = shift.shiftCode.code;
        if (!shiftDetails[code]) {
          shiftDetails[code] = {
            count: 0,
            countPerCycle: 0,
            beginTime: shift.shiftCode.beginTime,
            endTime: shift.shiftCode.endTime,
            hoursLength: shift.shiftCode.hoursLength,
            category: shift.shiftCode.category
          };
        }
        shiftDetails[code].countPerCycle++;
      } else {
        totalOffDaysPerCycle++;
      }
    });
    
    // Now multiply by number of cycles for total counts
    Object.keys(shiftDetails).forEach(code => {
      shiftDetails[code].count = shiftDetails[code].countPerCycle * numCycles;
    });
    
    const totalWorkingDays = totalWorkingDaysPerCycle * numCycles;
    const totalOffDays = totalOffDaysPerCycle * numCycles;
    
    return { shiftDetails, totalWorkingDays, totalOffDays, numCycles };
  };

  const { shiftDetails, totalWorkingDays, totalOffDays } = getShiftBreakdown();

  // Transform schedule data for MobileCalendarView - pass raw schedule and bidPeriod
  const transformScheduleData = (schedule: any, bidPeriod: any) => {
    if (!schedule?.scheduleShifts || !bidPeriod) return [];

    // The desktop version gets bidPeriod directly
    // Let's pass the exact same bidPeriod object to mobile
    return [
      schedule.scheduleShifts, // The raw schedule shifts array
      bidPeriod // The exact same bid period the desktop gets
    ];
  };

  const handleDownloadiCal = async () => {
    if (!bidLine.schedule || !bidPeriod) {
      console.error('No schedule or bid period data available');
      return;
    }

    // Show confirmation dialog
    const userConfirmed = window.confirm(
      t('calendar.downloadNoticeMessage')
    );

    if (!userConfirmed) {
      return;
    }

    try {
      // Use server-side generation by opening the API endpoint
      window.open(`/api/bid-lines/${bidLine.id}/ical`, '_blank');
      
      // Fallback to client-side generation if server fails
    } catch (error) {
      console.error('Server-side download failed, trying client-side:', error);
      
      try {
        const { downloadICalFile } = await import('@/utils/ical/generator');
        downloadICalFile(bidLine.schedule, bidPeriod, bidLine);
      } catch (clientError) {
        console.error('Client-side download also failed:', clientError);
        alert(t('calendar.downloadFailed'));
      }
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ 
        zIndex: 2147483647, // Maximum safe z-index value
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl max-h-[90vh] overflow-hidden"
        style={{ zIndex: 100000 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 lg:p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 lg:gap-3">
            <Calendar className="text-blue-600 dark:text-blue-400" size={20} />
            <div>
              <h2 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white leading-tight">
                {bidLine.operation?.name || 'Unknown Operation'}
              </h2>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-tight">
                {t('bidLine.line')} {bidLine.lineNumber} • {t('calendar.cycles', { count: (bidPeriod?.numCycles || 1).toString() })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Download button */}
            <button
              onClick={handleDownloadiCal}
              className="flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:gap-2 sm:px-3 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors"
              title={t('calendar.downloadIcal')}
            >
              <Download size={16} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{t('calendar.downloadIcal')}</span>
            </button>
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {bidLine.schedule && bidPeriod ? (
            <div className="flex flex-col lg:flex-row">
              {/* Calendar Section */}
              <div className="flex-1 lg:border-r lg:border-gray-200 lg:dark:border-gray-700">
                {isMobile ? (
                  <div className="p-4">
                    <MobileCalendarView 
                      scheduleData={transformScheduleData(bidLine.schedule, bidPeriod)}
                      bidLineId={parseInt(bidLine.lineNumber)}
                    />
                  </div>
                ) : (
                  <ScheduleCalendar 
                    schedule={bidLine.schedule}
                    bidPeriod={bidPeriod}
                    compact={false}
                  />
                )}
              </div>
              
              {/* Shift Codes Summary Section - Hidden on mobile */}
              {!isMobile && (
                <div className="border-t lg:border-t-0 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3 lg:p-4 lg:w-80 xl:w-96">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  {bidPeriod?.numCycles && bidPeriod.numCycles > 1 
                    ? t('calendar.shiftCodesWithCycles', { cycles: bidPeriod.numCycles.toString() }) 
                    : t('calendar.shiftCodesSummary')
                  }
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2 lg:gap-3">
                  {Object.entries(shiftDetails)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([code, details]) => (
                      <div 
                        key={code} 
                        className="bg-white dark:bg-gray-800 rounded-lg p-2 lg:p-3 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-base text-blue-600 dark:text-blue-400">
                            {code}
                          </span>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            ×{details.count}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          <div>{details.beginTime} - {details.endTime}</div>
                          <div className="text-gray-500 dark:text-gray-500">
                            {details.hoursLength} {t('calendar.hours')} • {details.category}
                          </div>
                          {bidPeriod?.numCycles && bidPeriod.numCycles > 1 && (
                            <div className="text-gray-400 dark:text-gray-500 mt-1">
                              ({t('calendar.cycleBreakdown', { count: details.countPerCycle.toString(), cycles: bidPeriod.numCycles.toString() })})
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  
                  {/* Days Off Summary */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-2 lg:p-3 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-base text-gray-600 dark:text-gray-400">
                        OFF
                      </span>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        ×{totalOffDays}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {t('scheduleMetrics.dayOff')}
                    </div>
                  </div>
                </div>
                
                {/* Total Summary */}
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col lg:flex-col space-y-2 lg:space-y-1 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t('calendar.totalWorkingDays')}: <span className="font-semibold">{totalWorkingDays}</span>
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {t('calendar.totalOffDays')}: <span className="font-semibold">{totalOffDays}</span>
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {t('calendar.totalDays')}: <span className="font-semibold">{totalWorkingDays + totalOffDays}</span>
                    </span>
                  </div>
                </div>
              </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                {t('calendar.noScheduleData')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof window === 'undefined' || !mounted) return null;
  
  return createPortal(modalContent, document.body);
}