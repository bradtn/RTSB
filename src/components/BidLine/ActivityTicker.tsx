'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, TrendingUp, Trash2 } from 'lucide-react';
import { BidLineUpdateData } from '@/lib/socket';
import { useTranslation } from '@/lib/i18n';

interface ActivityMessage {
  id: string;
  timestamp: Date;
  type: 'claim' | 'assign' | 'release' | 'blackout';
  lineNumber: string;
  operationName?: string;
  status: string; // Raw status from BidLineUpdateData
}

interface ActivityTickerProps {
  className?: string;
  locale: string;
}

const ActivityTicker = React.forwardRef<
  { addMessage: (data: BidLineUpdateData) => void }, 
  ActivityTickerProps
>(({ className = '', locale }, ref) => {
  const { t } = useTranslation(locale);
  const [messages, setMessages] = useState<ActivityMessage[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  const tickerRef = useRef<HTMLDivElement>(null);

  // Load recent activity from database on component mount
  useEffect(() => {
    const loadRecentActivity = async () => {
      try {
        console.log('ActivityTicker: Loading recent activity from database...');
        const response = await fetch('/api/activity?limit=50&hours=24');
        console.log('ActivityTicker: Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('ActivityTicker: Received data:', data);
          console.log('ActivityTicker: Number of activities:', data.activities?.length || 0);
          
          const dbMessages: ActivityMessage[] = data.activities.map((activity: any) => ({
            id: activity.id,
            timestamp: new Date(activity.timestamp),
            type: activity.type,
            lineNumber: activity.lineNumber,
            operationName: activity.operationName,
            status: activity.status
          }));
          setMessages(dbMessages);
        }
      } catch (error) {
        console.error('Error loading recent activity:', error);
        
        // Fallback to localStorage for development/offline use
        try {
          const stored = localStorage.getItem('activityTicker-messages');
          if (stored && stored !== '[]' && stored !== 'null') {
            const rawParsed = JSON.parse(stored);
            // Parse the stored messages and convert timestamps
            
            const parsedMessages = rawParsed.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }));
            setMessages(parsedMessages.slice(0, 20));
          }
        } catch (localError) {
          console.warn('Fallback localStorage also failed:', localError);
        }
      } finally {
        setHasLoadedFromStorage(true);
      }
    };

    loadRecentActivity();

    // Refresh activity every 30 seconds to get new activities from other users
    const refreshInterval = setInterval(loadRecentActivity, 30000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Save messages to localStorage whenever messages change (but only after we've loaded from storage)
  useEffect(() => {
    if (!hasLoadedFromStorage) return; // Don't save until we've tried to load first
    
    try {
      localStorage.setItem('activityTicker-messages', JSON.stringify(messages));
    } catch (error) {
      console.warn('Failed to save activity ticker to localStorage:', error);
    }
  }, [messages, hasLoadedFromStorage]);

  // Clear excessive messages if they somehow accumulate
  useEffect(() => {
    if (messages.length > 20) {
      setMessages(prev => prev.slice(0, 20));
    }
  }, [messages.length]);

  // Add a new activity message
  const addMessage = (data: BidLineUpdateData) => {
    const message: ActivityMessage = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      type: getMessageType(data.status),
      lineNumber: data.lineNumber,
      operationName: data.operationName,
      status: data.status,
    };

    setMessages(prev => [message, ...prev].slice(0, 20)); // Keep last 20 messages for better performance
  };

  // Format message text based on message data (for current locale)
  const formatMessage = (message: ActivityMessage): string => {
    if (message.operationName) {
      // With operation name
      switch (message.status) {
        case 'TAKEN':
          return t('activityTicker.operationLineClaimed', { 
            operationName: message.operationName, 
            lineNumber: message.lineNumber 
          });
        case 'AVAILABLE':
          return t('activityTicker.operationLineAvailable', { 
            operationName: message.operationName, 
            lineNumber: message.lineNumber 
          });
        case 'BLACKED_OUT':
          return t('activityTicker.operationLineBlackedOut', { 
            operationName: message.operationName, 
            lineNumber: message.lineNumber 
          });
        default:
          return t('activityTicker.operationLineStatusUpdated', { 
            operationName: message.operationName, 
            lineNumber: message.lineNumber 
          });
      }
    } else {
      // Without operation name
      switch (message.status) {
        case 'TAKEN':
          return t('activityTicker.lineClaimed', { lineNumber: message.lineNumber });
        case 'AVAILABLE':
          return t('activityTicker.lineAvailable', { lineNumber: message.lineNumber });
        case 'BLACKED_OUT':
          return t('activityTicker.lineBlackedOut', { lineNumber: message.lineNumber });
        default:
          return t('activityTicker.lineStatusUpdated', { lineNumber: message.lineNumber });
      }
    }
  };

  // Get message type for styling
  const getMessageType = (status: string): ActivityMessage['type'] => {
    switch (status) {
      case 'TAKEN': return 'claim';
      case 'AVAILABLE': return 'release';
      case 'BLACKED_OUT': return 'blackout';
      default: return 'assign';
    }
  };

  // Get icon for message type
  const getMessageIcon = (type: ActivityMessage['type']) => {
    switch (type) {
      case 'claim': return '🎯';
      case 'assign': return '👮';
      case 'release': return '🔓';
      case 'blackout': return '⛔';
      default: return '📋';
    }
  };

  // Get color for message type
  const getMessageColor = (type: ActivityMessage['type']) => {
    switch (type) {
      case 'claim': return 'text-blue-600 bg-blue-50';
      case 'assign': return 'text-green-600 bg-green-50';
      case 'release': return 'text-orange-600 bg-orange-50';
      case 'blackout': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Format timestamp for display
  const formatTime = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  // Clear all messages and localStorage
  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem('activityTicker-messages');
    // Keep hasLoadedFromStorage true so future messages can be saved
  };

  // Expose addMessage function to parent components
  React.useImperativeHandle(ref, () => ({
    addMessage
  }), []);

  // No mock data - start with empty state

  return (
    <div className={`bg-gray-900 text-white border-t-4 border-red-600 ${className}`}>
      {/* Ticker Header */}
      <div className="bg-red-600 px-3 py-1 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm font-bold">{t('activityTicker.liveActivity')}</span>
        </div>
        
        <div className="flex items-center space-x-1">
          {/* Play/Pause Button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1 hover:bg-red-700 rounded transition-colors"
            title={isPlaying ? t('activityTicker.pauseTicker') : t('activityTicker.resumeTicker')}
          >
            {isPlaying ? (
              <Pause className="h-3 w-3" />
            ) : (
              <Play className="h-3 w-3" />
            )}
          </button>

          {/* History Toggle */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-1 hover:bg-red-700 rounded transition-colors text-xs"
            title={t('activityTicker.toggleHistory')}
          >
            <RotateCcw className="h-3 w-3" />
          </button>

          {/* Clear History */}
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              className="p-1 hover:bg-red-700 rounded transition-colors text-xs"
              title="Clear activity history"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}

          {/* Message Count */}
          <span className="text-xs bg-red-800 px-1 rounded">
            {messages.length}
          </span>
        </div>
      </div>

      {/* Scrolling Ticker */}
      <div className="h-8 overflow-hidden relative bg-gray-900">
        <div
          ref={tickerRef}
          className={`flex items-center h-full whitespace-nowrap ${
            isPlaying ? 'animate-scroll' : ''
          }`}
          style={{
            animation: isPlaying ? 'scroll-left 30s linear infinite' : 'none'
          }}
        >
          {messages.length > 0 ? (
            messages.map((msg, index) => (
              <div
                key={msg.id}
                className="flex items-center space-x-2 mr-8 text-sm"
              >
                <span className="text-red-400">●</span>
                <span className="text-xs text-gray-400">
                  {formatTime(msg.timestamp)}
                </span>
                <span className="text-yellow-400">
                  {getMessageIcon(msg.type)}
                </span>
                <span className="text-white">
                  {formatMessage(msg)}
                </span>
              </div>
            ))
          ) : (
            <>
              <div className="flex items-center space-x-2 mr-8 text-sm text-gray-400">
                <span className="text-red-400">●</span>
                <span>{t('activityTicker.waitingForActivity')}</span>
              </div>
              <div className="flex items-center space-x-2 mr-8 text-sm text-gray-400">
                <span className="text-red-400">●</span>
                <span>{t('activityTicker.waitingForActivity')}</span>
              </div>
              <div className="flex items-center space-x-2 mr-8 text-sm text-gray-400">
                <span className="text-red-400">●</span>
                <span>{t('activityTicker.waitingForActivity')}</span>
              </div>
              <div className="flex items-center space-x-2 mr-8 text-sm text-gray-400">
                <span className="text-red-400">●</span>
                <span>{t('activityTicker.waitingForActivity')}</span>
              </div>
              <div className="flex items-center space-x-2 mr-8 text-sm text-gray-400">
                <span className="text-red-400">●</span>
                <span>{t('activityTicker.waitingForActivity')}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="bg-gray-800 border-t border-gray-700 max-h-64 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs text-gray-400 mb-2 font-semibold">
              {t('activityTicker.recentActivityHistory')}
            </div>
            {messages.length === 0 ? (
              <div className="text-xs text-gray-500 italic">{t('activityTicker.noActivityYet')}</div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`text-xs p-2 mb-1 rounded ${getMessageColor(msg.type)} text-gray-800`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1">
                      <span>{getMessageIcon(msg.type)}</span>
                      <span className="font-medium">{formatMessage(msg)}</span>
                    </span>
                    <span className="text-gray-500">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translate3d(100%, 0, 0);
          }
          100% {
            transform: translate3d(-100%, 0, 0);
          }
        }
        .animate-scroll {
          animation: scroll-left 30s linear infinite;
          will-change: transform;
        }
      `}</style>
    </div>
  );
});

ActivityTicker.displayName = 'ActivityTicker';

export default ActivityTicker;