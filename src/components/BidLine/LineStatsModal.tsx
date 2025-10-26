'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, BarChart3 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useParams } from 'next/navigation';

interface LineStatsModalProps {
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
}

export default function LineStatsModal({
  isOpen,
  onClose,
  bidLine,
  bidPeriod
}: LineStatsModalProps) {
  const [mounted, setMounted] = useState(false);
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

  // Calculate shift code breakdown with details (same logic as ScheduleCalendarModal)
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

  const modalContent = (
    <div 
      className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4"
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
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-sm sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-hidden"
        style={{ zIndex: 100000 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <BarChart3 className="text-blue-600 dark:text-blue-400" size={24} />
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                {bidLine.operation?.name || 'Unknown Operation'}
              </h2>
              <p className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">
                {t('bidLine.line')} {bidLine.lineNumber}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {bidPeriod?.numCycles && bidPeriod.numCycles > 1 
                  ? t('calendar.cycles', { count: bidPeriod.numCycles.toString() }) 
                  : t('lineStats.singleCycle')
                } • {t('lineStats.title')}
              </p>
            </div>
          </div>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-4 sm:p-6">
          {bidLine.schedule && bidPeriod ? (
            <div>
              {/* Schedule Metrics */}
              {bidLine.scheduleMetrics && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                    {t('scheduleMetrics.title')}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {bidLine.scheduleMetrics.weekendsOn}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {t('scheduleMetrics.weekendsWorking')}
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {bidLine.scheduleMetrics.saturdaysOn}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {t('scheduleMetrics.saturdays')}
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        {bidLine.scheduleMetrics.sundaysOn}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {t('scheduleMetrics.sundays')}
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {bidLine.scheduleMetrics.blocks5day}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {t('scheduleMetrics.fiveDayBlocks')}
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {bidLine.scheduleMetrics.blocks4day}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {t('scheduleMetrics.fourDayBlocks')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Shift Codes Summary */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  {bidPeriod?.numCycles && bidPeriod.numCycles > 1 
                    ? t('calendar.shiftCodesWithCycles', { cycles: bidPeriod.numCycles.toString() }) 
                    : t('calendar.shiftCodesSummary')
                  }
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {Object.entries(shiftDetails)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([code, details]) => (
                      <div 
                        key={code} 
                        className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                            {code}
                          </span>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            ×{details.count}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <div className="font-medium">{details.beginTime} - {details.endTime}</div>
                          <div className="text-gray-500 dark:text-gray-500">
                            {details.hoursLength} hours • {details.category}
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
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-lg text-gray-600 dark:text-gray-400">
                        OFF
                      </span>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        ×{totalOffDays}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-500">
                      {t('scheduleMetrics.dayOff')}
                    </div>
                  </div>
                </div>
                
                {/* Total Summary */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between text-sm">
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