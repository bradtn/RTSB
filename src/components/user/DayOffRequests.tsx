'use client';

import { useState, useEffect } from 'react';
import { Calendar, Save, Trash2, Info } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

interface DayOffRequestsProps {
  locale?: string;
  bidPeriodStartDate?: string | null;
  translations?: {
    title?: string;
    description?: string;
    selectDates?: string;
    notes?: string;
    notesPlaceholder?: string;
    save?: string;
    clear?: string;
    saving?: string;
    saved?: string;
    cleared?: string;
    error?: string;
  };
}

export default function DayOffRequests({ locale, bidPeriodStartDate, translations = {} }: DayOffRequestsProps) {
  const [dates, setDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  // Initialize date input with bid period start date if available
  const getDefaultDate = () => {
    if (bidPeriodStartDate) {
      try {
        return format(parseISO(bidPeriodStartDate), 'yyyy-MM-dd');
      } catch (error) {
        console.error('Error formatting bid period start date:', error);
        return '';
      }
    }
    return '';
  };
  
  const [dateInputValue, setDateInputValue] = useState(getDefaultDate());

  // Default translations
  const t = {
    title: translations.title || 'Day-Off Requests',
    description: translations.description || 'Select dates you would like to have off. This will help you see which shifts best match your preferences.',
    selectDates: translations.selectDates || 'Select Dates',
    save: translations.save || 'Save Requests',
    clear: translations.clear || 'Clear All',
    saving: translations.saving || 'Saving...',
    saved: translations.saved || 'Day-off requests saved!',
    cleared: translations.cleared || 'Day-off requests cleared!',
    error: translations.error || 'Failed to save. Please try again.',
  };

  // Fetch existing day-off requests
  useEffect(() => {
    const fetchDayOffRequests = async () => {
      try {
        const res = await fetch('/api/day-off-requests');
        if (res.ok) {
          const data = await res.json();
          if (data.dates) {
            setDates(data.dates.map((d: string) => {
              // Extract just the date part from ISO string to avoid timezone issues
              return d.split('T')[0]; // Gets 'yyyy-MM-dd' from 'yyyy-MM-ddTHH:mm:ss.sssZ'
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching day-off requests:', error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchDayOffRequests();
  }, []);

  // Add or remove a date
  const toggleDate = (date: string) => {
    setDates(prev => {
      if (prev.includes(date)) {
        return prev.filter(d => d !== date);
      } else {
        return [...prev, date].sort();
      }
    });
  };

  // Handle date input change (only update the display value)
  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateInputValue(e.target.value);
  };

  // Handle date selection (when user actually clicks a date)
  const handleDateSelect = () => {
    if (dateInputValue && !dates.includes(dateInputValue)) {
      toggleDate(dateInputValue);
      // Reset back to bid period start date instead of clearing
      setDateInputValue(getDefaultDate());
    }
  };

  // Save day-off requests
  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/day-off-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dates, notes: null }),
      });

      if (res.ok) {
        toast.success(t.saved);
        // Trigger refresh of day-off match data by dispatching a custom event
        window.dispatchEvent(new CustomEvent('dayOffRequestsUpdated'));
      } else {
        toast.error(t.error);
      }
    } catch (error) {
      console.error('Error saving day-off requests:', error);
      toast.error(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all day-off requests
  const handleClear = async () => {
    if (!confirm('Are you sure you want to clear all day-off requests?')) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/day-off-requests', {
        method: 'DELETE',
      });

      if (res.ok) {
        setDates([]);
        toast.success(t.cleared);
        // Trigger refresh of day-off match data
        window.dispatchEvent(new CustomEvent('dayOffRequestsUpdated'));
      } else {
        toast.error(t.error);
      }
    } catch (error) {
      console.error('Error clearing day-off requests:', error);
      toast.error(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-purple-50/50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
      <div className="mb-4 p-3 bg-purple-100/50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-purple-800 dark:text-purple-300">
            {t.description}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Date picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t.selectDates}
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={dateInputValue}
              onChange={handleDateInput}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={handleDateSelect}
              disabled={!dateInputValue || dates.includes(dateInputValue)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Selected dates */}
        {dates.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Selected Dates ({dates.length})
            </label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
              {dates.map(date => (
                <button
                  key={date}
                  onClick={() => toggleDate(date)}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors"
                >
                  {format(parseISO(date), 'MMM dd, yyyy')}
                  <span className="ml-2">×</span>
                </button>
              ))}
            </div>
          </div>
        )}


        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {isLoading ? t.saving : t.save}
          </button>
          {dates.length > 0 && (
            <button
              onClick={handleClear}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-4 w-4" />
              {t.clear}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}