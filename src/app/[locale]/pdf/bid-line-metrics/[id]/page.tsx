import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { BidLinePDFContent } from '@/components/PDF/BidLinePDFContent';
import { getBidLineWithMetrics } from '@/lib/bidLineQueries';
import { useTranslation } from '@/lib/i18n';

interface PDFPageProps {
  params: {
    locale: string;
    id: string;
  };
}

export default async function BidLinePDFPage({ params }: PDFPageProps) {
  const { locale, id } = await params;
  
  try {
    // Get bid line data
    const bidLine = await getBidLineWithMetrics(id);
    if (!bidLine) {
      notFound();
    }

    // Use the translation system
    const { t } = useTranslation(locale);
    
    // Create translations object using the t function
    const translations = {
      // Main labels
      bidLineNumber: t('metrics.bidLineNumber'),
      totalDaysWorked: t('metrics.totalDaysWorked'),
      daysOff: t('metrics.daysOff'),
      workLoad: t('metrics.workLoad'),
      allMetricsReport: t('pdf.allMetricsReport'),
      allMetricsForPeriod: t('pdf.allMetricsForPeriod'),
      
      // Weekend metrics
      weekendMetrics: t('metrics.weekendMetrics'),
      weekendsWorking: t('metrics.weekendsWorking'),
      saturdays: t('metrics.saturdays'),
      sundays: t('metrics.sundays'),
      totalSaturdays: t('metrics.totalSaturdays'),
      totalSundays: t('metrics.totalSundays'),
      fridayWeekendBlocks: t('metrics.fridayWeekendBlocks'),
      fullWeekendDef: t('pdf.fullWeekendDef'),
      soloWeekendDef: t('pdf.soloWeekendDef'),
      
      // Weekday metrics
      weekdayBreakdown: t('metrics.weekdayBreakdown'),
      totalMondays: t('metrics.totalMondays'),
      totalTuesdays: t('metrics.totalTuesdays'),
      totalWednesdays: t('metrics.totalWednesdays'),
      totalThursdays: t('metrics.totalThursdays'),
      totalFridays: t('metrics.totalFridays'),
      weekdayBlocks: t('metrics.weekdayBlocks'),
      
      // Work blocks
      workBlocks: t('metrics.workBlocks'),
      singleDays: t('metrics.singleDays'),
      blocks2day: t('metrics.blocks2day'),
      blocks3day: t('metrics.blocks3day'),
      blocks4day: t('metrics.blocks4day'),
      blocks5day: t('metrics.blocks5day'),
      blocks6day: t('metrics.blocks6day'),
      longestStretch: t('metrics.longestStretch'),
      
      // Off blocks
      offDayPatterns: t('metrics.offDayPatterns'),
      offBlocks2day: t('metrics.offBlocks2day'),
      offBlocks3day: t('metrics.offBlocks3day'),
      offBlocks4day: t('metrics.offBlocks4day'),
      offBlocks5day: t('metrics.offBlocks5day'),
      offBlocks6day: t('metrics.offBlocks6day'),
      offBlocks7dayPlus: t('metrics.offBlocks7dayPlus'),
      longestOff: t('metrics.longestOff'),
      shortestOff: t('metrics.shortestOff'),
      
      // Shift codes
      shiftPattern: t('metrics.shiftPattern'),
      shiftCodes: t('pdf.shiftCodes'),
      shiftCodesSummary: t('pdf.shiftCodesSummary'),
      
      // Holidays
      holidayInfo: t('metrics.holidayInfo'),
      holidaysWorking: t('metrics.holidaysWorking'),
      holidaysOff: t('metrics.holidaysOff'),
      holidaysThisMonth: t('pdf.holidaysThisMonth'),
      working: t('pdf.working'),
      off: t('pdf.off'),
      
      // Calendar
      scheduleCalendar: t('pdf.scheduleCalendar'),
      legend: t('pdf.legend'),
      day: t('pdf.day'),
      evening: t('pdf.evening'),
      night: t('pdf.night'),
      weekendWork: t('pdf.weekendWork'),
      holiday: t('pdf.holiday'),
      
      // Title page
      shiftScheduleReport: t('pdf.shiftScheduleReport'),
      bidPeriodInfo: t('pdf.bidPeriodInfo'),
      period: t('pdf.period'),
      duration: t('pdf.duration'),
      cycles: t('pdf.cycles'),
      days: t('pdf.days'),
      reportContents: t('pdf.reportContents'),
      metricsAnalysis: t('pdf.metricsAnalysis'),
      multiMonthCalendar: t('pdf.multiMonthCalendar'),
      monthlyCalendars: t('pdf.monthlyCalendars'),
      holidayShiftInfo: t('pdf.holidayShiftInfo'),
      
      // Common
      of: t('common.of'),
      line: t('common.line')
    };

    return (
      <html lang={locale} className="print-mode">
        <head>
          <meta name="robots" content="noindex, nofollow" />
          <title>Bid Line {bidLine.lineNumber} Metrics - {bidLine.operation?.name}</title>
          <style dangerouslySetInnerHTML={{
            __html: `
              @media print {
                body { 
                  margin: 0; 
                  padding: 0; 
                  font-size: 12px;
                }
                .no-print { display: none !important; }
                
                /* Page break rules */
                .page-break-avoid {
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
                
                .page-break-before {
                  page-break-before: always !important;
                  break-before: page !important;
                }
                
                .page-break-after {
                  page-break-after: always !important;
                  break-after: page !important;
                }
                
                /* Keep sections together */
                section {
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                  margin-bottom: 1rem !important;
                }
                
                /* Prevent orphan headers */
                h1, h2, h3 {
                  page-break-after: avoid !important;
                  break-after: avoid !important;
                }
              }
              
              .print-mode {
                background: white !important;
                max-width: 100% !important;
                margin: 0 !important;
              }
              
              .print-mode * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              /* Compact layout for PDF */
              .pdf-compact {
                font-size: 11px !important;
                line-height: 1.3 !important;
              }
              
              .pdf-compact h1 {
                font-size: 1.8rem !important;
                margin-bottom: 0.5rem !important;
              }
              
              .pdf-compact h3 {
                font-size: 1.1rem !important;
                margin-bottom: 0.75rem !important;
              }
              
              .pdf-metric-card {
                width: 110px !important;
                height: 65px !important;
                padding: 0.375rem !important;
                font-size: 8px !important;
              }
              
              .pdf-metric-value {
                font-size: 1.1rem !important;
              }
              
              /* Calendar PDF styles */
              .pdf-calendar-page {
                font-size: 8px !important;
              }
              
              .calendar-grid {
                margin-top: 1rem !important;
              }
              
              .month-container {
                width: 100% !important;
              }
              
              /* Monthly Calendar PDF styles */
              .pdf-monthly-page {
                page-break-before: always !important;
                break-before: page !important;
                padding: 20px !important;
                min-height: 100vh !important;
              }
              
              @media print {
                .pdf-calendar-page {
                  page-break-before: always !important;
                  break-before: page !important;
                  font-size: 7px !important;
                }
                
                .calendar-grid {
                  margin-top: 0.5rem !important;
                }
                
                .pdf-monthly-page {
                  page-break-before: always !important;
                  break-before: page !important;
                  margin: 0 !important;
                  padding: 15px !important;
                  min-height: 100vh !important;
                }
              }
            `
          }} />
        </head>
        <body className="bg-white">
          <Suspense fallback={<div>Loading...</div>}>
            <BidLinePDFContent 
              bidLine={bidLine}
              translations={translations}
              locale={locale}
            />
          </Suspense>
        </body>
      </html>
    );
  } catch (error) {
    console.error('Error loading bid line for PDF:', error);
    notFound();
  }
}

export async function generateMetadata({ params }: PDFPageProps) {
  const { id } = await params;
  return {
    title: `Bid Line ${id} Metrics PDF`,
    robots: 'noindex, nofollow',
  };
}