'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Eye, EyeOff, Save, RotateCcw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface MetricSettings {
  id: string;
  operationId: string | null;
  showWeekends: boolean;
  showSaturdays: boolean;
  showSundays: boolean;
  show5DayBlocks: boolean;
  show4DayBlocks: boolean;
  show3DayBlocks: boolean;
  show2DayBlocks: boolean;
  show6DayBlocks: boolean;
  showSingleDays: boolean;
  showHolidays: boolean;
  showTotalSaturdays: boolean;
  showTotalSundays: boolean;
  showTotalDays: boolean;
  showTotalMondays: boolean;
  showTotalTuesdays: boolean;
  showTotalWednesdays: boolean;
  showTotalThursdays: boolean;
  showTotalFridays: boolean;
  showLongestStretch: boolean;
  showFridayWeekendBlocks: boolean;
  showWeekdayBlocks: boolean;
  showOffBlocks2day: boolean;
  showOffBlocks3day: boolean;
  showOffBlocks4day: boolean;
  showOffBlocks5day: boolean;
  showOffBlocks6day: boolean;
  showOffBlocks7dayPlus: boolean;
  showLongestOffStretch: boolean;
  showShortestOffStretch: boolean;
  metricOrder: string[];
}

interface Operation {
  id: string;
  name: string;
  nameEn: string;
  nameFr: string;
}

export default function MetricSettingsManagement() {
  const queryClient = useQueryClient();
  const [selectedOperation, setSelectedOperation] = useState<string>('global');
  const [settings, setSettings] = useState<MetricSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch operations
  const { data: operations } = useQuery({
    queryKey: ['operations'],
    queryFn: async () => {
      const res = await fetch('/api/operations');
      if (!res.ok) throw new Error('Failed to fetch operations');
      return res.json();
    },
  });

  // Fetch metric settings
  const { data: metricSettings, isLoading } = useQuery({
    queryKey: ['metricSettings', selectedOperation],
    queryFn: async () => {
      const operationParam = selectedOperation === 'global' ? '' : `?operationId=${selectedOperation}`;
      const res = await fetch(`/api/admin/metric-settings${operationParam}`);
      if (!res.ok) throw new Error('Failed to fetch metric settings');
      return res.json();
    },
  });

  // Update settings state when data changes
  useEffect(() => {
    if (metricSettings) {
      setSettings(metricSettings);
      setHasChanges(false);
    }
  }, [metricSettings]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<MetricSettings>) => {
      const payload = {
        ...updatedSettings,
        operationId: selectedOperation === 'global' ? null : selectedOperation,
      };
      console.log('Saving metric settings:', payload);
      
      const res = await fetch('/api/admin/metric-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to save settings' }));
        throw new Error(error.message || error.error || 'Failed to save settings');
      }
      return res.json();
    },
    onSuccess: (data) => {
      console.log('Settings saved successfully:', data);
      toast.success(`Metric settings saved for ${selectedOperation === 'global' ? 'Global' : 'Operation'}`);
      queryClient.invalidateQueries({ queryKey: ['metricSettings'] });
      setHasChanges(false);
    },
    onError: (error: any) => {
      console.error('Failed to save settings:', error);
      toast.error(error.message || 'Failed to save metric settings');
    }
  });

  const handleToggleMetric = (key: keyof MetricSettings) => {
    if (!settings) return;
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    setHasChanges(true);
  };

  const handleSave = () => {
    console.log('handleSave called with settings:', settings);
    console.log('Selected operation:', selectedOperation);
    
    if (settings) {
      toast('Saving metric settings...', { icon: 'ℹ️' });
      saveMutation.mutate(settings);
    } else {
      toast.error('No settings to save');
    }
  };

  const handleReset = () => {
    if (metricSettings) {
      setSettings(metricSettings);
      setHasChanges(false);
    }
  };

  const metricOptions = [
    { key: 'showWeekends' as keyof MetricSettings, label: 'Full Weekends', description: 'Show weekends where BOTH Saturday AND Sunday are worked together' },
    { key: 'showSaturdays' as keyof MetricSettings, label: 'Solo Saturdays', description: 'Show Saturdays worked WITHOUT the Sunday (orphaned Saturdays)' },
    { key: 'showSundays' as keyof MetricSettings, label: 'Solo Sundays', description: 'Show Sundays worked WITHOUT the Saturday (orphaned Sundays)' },
    { key: 'show6DayBlocks' as keyof MetricSettings, label: '6-Day Blocks', description: 'Show consecutive 6-day work blocks' },
    { key: 'show5DayBlocks' as keyof MetricSettings, label: '5-Day Blocks', description: 'Show consecutive 5-day work blocks' },
    { key: 'show4DayBlocks' as keyof MetricSettings, label: '4-Day Blocks', description: 'Show consecutive 4-day work blocks' },
    { key: 'show3DayBlocks' as keyof MetricSettings, label: '3-Day Blocks', description: 'Show consecutive 3-day work blocks' },
    { key: 'show2DayBlocks' as keyof MetricSettings, label: '2-Day Blocks', description: 'Show consecutive 2-day work blocks' },
    { key: 'showSingleDays' as keyof MetricSettings, label: 'Single Days', description: 'Show isolated single work days' },
    { key: 'showHolidays' as keyof MetricSettings, label: 'Holidays', description: 'Show holidays worked during the schedule period' },
    { key: 'showTotalSaturdays' as keyof MetricSettings, label: 'Total Saturdays', description: 'Show total Saturdays worked (X of Y format)' },
    { key: 'showTotalSundays' as keyof MetricSettings, label: 'Total Sundays', description: 'Show total Sundays worked (X of Y format)' },
    { key: 'showTotalDays' as keyof MetricSettings, label: 'Total Days', description: 'Show total days worked in the period (X of Y format)' },
    { key: 'showTotalMondays' as keyof MetricSettings, label: 'Total Mondays', description: 'Show total Mondays worked (X of Y format)' },
    { key: 'showTotalTuesdays' as keyof MetricSettings, label: 'Total Tuesdays', description: 'Show total Tuesdays worked (X of Y format)' },
    { key: 'showTotalWednesdays' as keyof MetricSettings, label: 'Total Wednesdays', description: 'Show total Wednesdays worked (X of Y format)' },
    { key: 'showTotalThursdays' as keyof MetricSettings, label: 'Total Thursdays', description: 'Show total Thursdays worked (X of Y format)' },
    { key: 'showTotalFridays' as keyof MetricSettings, label: 'Total Fridays', description: 'Show total Fridays worked (X of Y format)' },
    { key: 'showLongestStretch' as keyof MetricSettings, label: 'Longest Stretch', description: 'Show the longest consecutive work period' },
    { key: 'showFridayWeekendBlocks' as keyof MetricSettings, label: 'Friday-Weekend Blocks', description: 'Show Friday + weekend (Sat/Sun) work blocks' },
    { key: 'showWeekdayBlocks' as keyof MetricSettings, label: 'Weekday Blocks', description: 'Show Monday-Friday work blocks' },
    { key: 'showOffBlocks2day' as keyof MetricSettings, label: 'Off: 2-Day Blocks', description: 'Show consecutive 2-day off blocks' },
    { key: 'showOffBlocks3day' as keyof MetricSettings, label: 'Off: 3-Day Blocks', description: 'Show consecutive 3-day off blocks' },
    { key: 'showOffBlocks4day' as keyof MetricSettings, label: 'Off: 4-Day Blocks', description: 'Show consecutive 4-day off blocks' },
    { key: 'showOffBlocks5day' as keyof MetricSettings, label: 'Off: 5-Day Blocks', description: 'Show consecutive 5-day off blocks' },
    { key: 'showOffBlocks6day' as keyof MetricSettings, label: 'Off: 6-Day Blocks', description: 'Show consecutive 6-day off blocks' },
    { key: 'showOffBlocks7dayPlus' as keyof MetricSettings, label: 'Off: 7+ Day Blocks', description: 'Show consecutive 7+ day off blocks' },
    { key: 'showLongestOffStretch' as keyof MetricSettings, label: 'Longest Off Stretch', description: 'Show the longest consecutive days off' },
    { key: 'showShortestOffStretch' as keyof MetricSettings, label: 'Shortest Off Stretch', description: 'Show the shortest consecutive days off' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-md dark:shadow-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Metric Display Settings</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Control which metrics are displayed on bid line cards
            </p>
          </div>
        </div>

        {/* Operation Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Configure settings for:
          </label>
          <select
            value={selectedOperation}
            onChange={(e) => setSelectedOperation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="global">Global Default Settings</option>
            {operations?.map((op: Operation) => (
              <option key={op.id} value={op.id}>
                {op.name} ({op.nameEn})
              </option>
            ))}
          </select>
          {selectedOperation === 'global' && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              These settings apply to all operations unless overridden
            </p>
          )}
        </div>
      </div>

      {/* Metric Toggles */}
      <div className="bg-white dark:bg-gray-800 shadow-md dark:shadow-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Visible Metrics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {metricOptions.map((option) => (
            <div
              key={option.key}
              className="flex items-start justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {option.label}
                  </h4>
                  {settings?.[option.key] ? (
                    <Eye className="h-4 w-4 text-green-500" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {option.description}
                </p>
              </div>
              <button
                onClick={() => handleToggleMetric(option.key)}
                className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                  settings?.[option.key]
                    ? 'bg-blue-600'
                    : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings?.[option.key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save/Reset Actions */}
      {hasChanges && (
        <div className="bg-white dark:bg-gray-800 shadow-md dark:shadow-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                You have unsaved changes
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {saveMutation.isSuccess && !hasChanges && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-green-800 dark:text-green-300 font-medium">
            Settings saved successfully!
          </p>
        </div>
      )}

      {saveMutation.isError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-300 font-medium">
            Failed to save settings. Please try again.
          </p>
        </div>
      )}
    </div>
  );
}