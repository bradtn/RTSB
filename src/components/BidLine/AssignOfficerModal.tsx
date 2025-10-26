'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, UserCheck, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useParams } from 'next/navigation';

interface AssignOfficerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (officerName: string) => void;
  lineNumber: string;
  operationName?: string;
}

export default function AssignOfficerModal({
  isOpen,
  onClose,
  onAssign,
  lineNumber,
  operationName
}: AssignOfficerModalProps) {
  const [mounted, setMounted] = useState(false);
  const [officerName, setOfficerName] = useState('');
  const [error, setError] = useState('');
  const params = useParams();
  const { t } = useTranslation(params.locale as string);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setOfficerName('');
      setError('');
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

  const handleInputChange = (value: string) => {
    // Force uppercase and remove any non-alphanumeric characters except spaces and hyphens
    const cleanedValue = value.toUpperCase().replace(/[^A-Z0-9\s-]/g, '');
    setOfficerName(cleanedValue);
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = officerName.trim();
    
    if (!trimmedName) {
      setError(t('bidLine.officerNameRequired') || 'Officer name is required');
      return;
    }
    
    if (trimmedName.length < 2) {
      setError(t('bidLine.officerNameTooShort') || 'Officer name must be at least 2 characters');
      return;
    }
    
    onAssign(trimmedName);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ 
        zIndex: 2147483647,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md overflow-hidden"
        style={{ zIndex: 100000 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
              <UserCheck className="text-blue-600 dark:text-blue-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('bidLine.assignToOfficer') || 'Assign to Officer'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {operationName && `${operationName} • `}{t('bidLine.line')} {lineNumber}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            <div>
              <label 
                htmlFor="officerName" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {t('bidLine.officerName') || 'Officer Name'}
              </label>
              <input
                id="officerName"
                type="text"
                value={officerName}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('bidLine.enterOfficerName') || 'Enter officer name...'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                autoFocus
                autoComplete="off"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t('bidLine.officerNameHint') || 'Name will be automatically converted to uppercase'}
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              {t('common.cancel') || 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={!officerName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t('bidLine.assignLine') || 'Assign Line'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (typeof window === 'undefined' || !mounted) return null;
  
  return createPortal(modalContent, document.body);
}