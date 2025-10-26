'use client';

import { formatDate } from '@/utils/dateFormatting';

interface PDFTitlePageProps {
  bidLine: any;
  bidPeriod?: {
    startDate: Date;
    endDate: Date;
    numCycles?: number;
  };
  operationName?: string;
  translations: Record<string, string>;
  locale?: string;
}

export default function PDFTitlePage({ bidLine, bidPeriod, operationName, translations, locale = 'en' }: PDFTitlePageProps) {
  const currentDate = new Date();
  
  return (
    <div className="pdf-title-page min-h-screen flex flex-col justify-center items-center bg-white p-8 page-break-after">
      {/* Logo */}
      <div className="mb-8">
        <img 
          src="/ShiftBidLogo.png" 
          alt="ShiftBid" 
          className="h-20 w-auto object-contain mx-auto"
          style={{ maxHeight: '80px' }}
        />
      </div>

      {/* Main Title */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {translations.shiftScheduleReport}
        </h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
          {operationName || bidLine.operation?.name || 'Unknown Operation'}
        </h2>
        <h3 className="text-xl font-medium text-gray-600">
          {translations.line} {bidLine.lineNumber}
        </h3>
      </div>

      {/* Bid Period Information */}
      {bidPeriod && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-center">
          <h4 className="text-lg font-semibold text-blue-900 mb-3">{translations.bidPeriodInfo}</h4>
          <div className="space-y-2 text-blue-800">
            <p className="text-base">
              <span className="font-medium">{translations.period}:</span> {formatDate(new Date(bidPeriod.startDate), 'MMMM dd, yyyy', locale)} - {formatDate(new Date(bidPeriod.endDate), 'MMMM dd, yyyy', locale)}
            </p>
            <p className="text-base">
              <span className="font-medium">{translations.duration}:</span> {Math.ceil((new Date(bidPeriod.endDate).getTime() - new Date(bidPeriod.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} {translations.days}
            </p>
            {bidPeriod.numCycles && bidPeriod.numCycles > 1 && (
              <p className="text-base">
                <span className="font-medium">{translations.cycles}:</span> {bidPeriod.numCycles}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Report Contents */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 max-w-md">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">{translations.reportContents}</h4>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
            {translations.metricsAnalysis}
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
            {translations.multiMonthCalendar}
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
            {translations.monthlyCalendars}
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
            {translations.holidayShiftInfo}
          </li>
        </ul>
      </div>

      
      <style jsx>{`
        .pdf-title-page {
          page-break-after: always !important;
          break-after: page !important;
        }
        
        @media print {
          .pdf-title-page {
            page-break-after: always !important;
            break-after: page !important;
          }
        }
      `}</style>
    </div>
  );
}