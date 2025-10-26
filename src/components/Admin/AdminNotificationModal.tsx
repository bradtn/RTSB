'use client';

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { X, Bell, Users, Send, Upload, History, ChevronRight } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/lib/i18n';

// Lazy load tab components for better performance
const QueueTab = lazy(() => import('./Notifications/tabs/QueueTab').then(m => ({ default: m.QueueTab })));
const CompletedTab = lazy(() => import('./Notifications/tabs/CompletedTab').then(m => ({ default: m.CompletedTab })));
const SendTab = lazy(() => import('./Notifications/tabs/SendTab').then(m => ({ default: m.SendTab })));
const UploadTab = lazy(() => import('./Notifications/tabs/UploadTab').then(m => ({ default: m.UploadTab })));
const HistoryTab = lazy(() => import('./Notifications/tabs/HistoryTab').then(m => ({ default: m.HistoryTab })));

type TabType = 'queue' | 'completed' | 'send' | 'upload' | 'history';

interface AdminNotificationModalProps {
  locale: string;
}

export default function AdminNotificationModal({ locale }: AdminNotificationModalProps) {
  const { data: session } = useSession();
  const { t } = useTranslation(locale);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('queue');
  const [mounted, setMounted] = useState(false);
  
  // Load saved state from localStorage
  useEffect(() => {
    setMounted(true);
    const savedState = localStorage.getItem('adminNotificationModal');
    if (savedState) {
      try {
        const { isOpen: savedOpen, activeTab: savedTab } = JSON.parse(savedState);
        if (savedOpen) setIsOpen(savedOpen);
        if (savedTab) setActiveTab(savedTab);
      } catch (error) {
        console.warn('Failed to parse saved modal state');
      }
    }
  }, []);
  
  // Save state to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('adminNotificationModal', JSON.stringify({ 
        isOpen, 
        activeTab 
      }));
    }
  }, [isOpen, activeTab, mounted]);
  
  // Only show for SUPER_ADMIN and SUPERVISOR
  if (!session?.user || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'SUPERVISOR')) {
    return null;
  }
  
  const tabs = [
    { id: 'queue', label: 'Queue', icon: Users, count: null },
    { id: 'completed', label: 'Completed', icon: ChevronRight, count: null },
    { id: 'send', label: 'Send', icon: Send, count: null },
    { id: 'upload', label: 'Upload', icon: Upload, count: null },
    { id: 'history', label: 'History', icon: History, count: null },
  ] as const;

  // Loading fallback component
  const TabLoadingFallback = () => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      <span className="ml-2 text-gray-600 dark:text-gray-400">Loading...</span>
    </div>
  );
  
  const renderTabContent = () => {
    const tabProps = { locale };
    
    switch (activeTab) {
      case 'queue':
        return (
          <Suspense fallback={<TabLoadingFallback />}>
            <QueueTab {...tabProps} />
          </Suspense>
        );
      case 'completed':
        return (
          <Suspense fallback={<TabLoadingFallback />}>
            <CompletedTab {...tabProps} />
          </Suspense>
        );
      case 'send':
        return (
          <Suspense fallback={<TabLoadingFallback />}>
            <SendTab {...tabProps} />
          </Suspense>
        );
      case 'upload':
        return (
          <Suspense fallback={<TabLoadingFallback />}>
            <UploadTab {...tabProps} />
          </Suspense>
        );
      case 'history':
        return (
          <Suspense fallback={<TabLoadingFallback />}>
            <HistoryTab {...tabProps} />
          </Suspense>
        );
      default:
        return <div className="p-4 text-center text-gray-500">Tab not found</div>;
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
      
      // Tab shortcuts (Ctrl/Cmd + number)
      if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '5') {
        e.preventDefault();
        const tabIndex = parseInt(e.key) - 1;
        if (tabs[tabIndex]) {
          setActiveTab(tabs[tabIndex].id as TabType);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);
  
  if (!mounted) return null;
  
  return createPortal(
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-300 group ${
          isOpen ? 'scale-110' : 'hover:scale-105'
        }`}
        title={`Admin Notifications ${isOpen ? '(Escape to close)' : ''}`}
        aria-label="Open notification management panel"
      >
        <Bell className={`h-6 w-6 transition-transform ${isOpen ? 'rotate-12' : 'group-hover:rotate-12'}`} />
        
        {/* Notification badge */}
        <span className="absolute -top-1 -right-1 flex h-5 w-5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs items-center justify-center font-bold">
            !
          </span>
        </span>
      </button>
      
      {/* Side Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] lg:w-[560px] bg-white dark:bg-gray-800 shadow-2xl transform transition-all duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Notification Management Panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Notification Manager</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-blue-700 rounded transition-colors"
            title="Close (Esc)"
            aria-label="Close panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`relative flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 min-w-0 flex-1 ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
                title={`${tab.label} (Ctrl+${tabs.indexOf(tab) + 1})`}
                aria-pressed={isActive}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="truncate">{tab.label}</span>
                
                {/* Tab indicator */}
                {isActive && (
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Content */}
        <div 
          className="flex-1 overflow-y-auto" 
          style={{ height: 'calc(100vh - 120px)' }}
        >
          {renderTabContent()}
        </div>
        
        {/* Footer with keyboard shortcuts hint */}
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Press Ctrl+1-5 to switch tabs • Esc to close
          </div>
        </div>
      </div>
      
    </>,
    document.body
  );
}