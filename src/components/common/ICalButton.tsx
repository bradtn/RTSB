// src/components/common/ICalButton.tsx
"use client";

import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useParams } from 'next/navigation';

interface ICalButtonProps {
  bidLineId: string;
  className?: string;
  buttonText?: string;
  showIcon?: boolean;
  disabled?: boolean;
}

export default function ICalButton({ 
  bidLineId, 
  className = "",
  buttonText,
  showIcon = true,
  disabled = false
}: ICalButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const params = useParams();
  const { t } = useTranslation(params.locale as string);
  
  const defaultButtonText = buttonText || t('calendar.downloadIcal');
  
  const handleDownload = async () => {
    console.log("iCal button clicked for bid line ID:", bidLineId);
    
    if (!bidLineId || disabled) {
      console.error("No bid line ID provided or button is disabled");
      setHasError(true);
      return;
    }

    // Show confirmation dialog before downloading
    const userConfirmed = window.confirm(
      t('calendar.downloadNoticeMessage')
    );

    if (!userConfirmed) {
      return; // User cancelled, don't download
    }
    
    setIsLoading(true);
    setHasError(false);
    
    try {
      // Open in a new tab for direct download
      window.open(`/api/bid-lines/${bidLineId}/ical`, '_blank');
      
      // Reset loading state after a delay
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Failed to trigger iCal download:", error);
      setHasError(true);
      setIsLoading(false);
    }
  };
  
  return (
    <button 
      onClick={handleDownload}
      disabled={isLoading || disabled}
      title={hasError ? t('calendar.errorDownloading') : t('calendar.downloadTooltip')}
      className={`flex items-center gap-2 transition-all duration-200 ${
        isLoading || disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:opacity-90 active:scale-95'
      } ${className}`}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : hasError ? (
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : showIcon ? (
        <Download size={16} />
      ) : null}
      {defaultButtonText}
    </button>
  );
}