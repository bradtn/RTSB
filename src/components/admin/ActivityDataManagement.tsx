'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, Calendar, AlertTriangle, CheckCircle, Clock, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

interface ActivityDataManagementProps {
  locale?: string;
}

export default function ActivityDataManagement({ locale }: ActivityDataManagementProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [clearType, setClearType] = useState<'all' | 'older_than_days' | 'by_bid_period'>('all');
  const [daysValue, setDaysValue] = useState(30);
  const [selectedBidPeriod, setSelectedBidPeriod] = useState('');
  const queryClient = useQueryClient();

  // Get activity count for display
  const { data: activityStats } = useQuery({
    queryKey: ['activityStats'],
    queryFn: async () => {
      const res = await fetch('/api/activity?limit=1000&hours=8760'); // Get year's worth for stats
      if (!res.ok) throw new Error('Failed to fetch activity stats');
      const data = await res.json();
      return {
        total: data.activities.length,
        last24h: data.activities.filter((a: any) => 
          new Date(a.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length,
        last7d: data.activities.filter((a: any) => 
          new Date(a.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        last30d: data.activities.filter((a: any) => 
          new Date(a.timestamp) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        ).length,
      };
    },
  });

  // Get bid periods for selection
  const { data: bidPeriods } = useQuery({
    queryKey: ['bidPeriods'],
    queryFn: async () => {
      const res = await fetch('/api/bid-periods');
      if (!res.ok) throw new Error('Failed to fetch bid periods');
      return res.json();
    },
  });

  const clearActivityMutation = useMutation({
    mutationFn: async () => {
      const body = {
        type: clearType,
        ...(clearType === 'older_than_days' && { days: daysValue }),
        ...(clearType === 'by_bid_period' && { bidPeriodId: selectedBidPeriod }),
      };

      const res = await fetch('/api/admin/clear-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to clear activity data');
      }

      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`Successfully cleared ${data.deletedCount} activity records`);
      queryClient.invalidateQueries({ queryKey: ['activityStats'] });
      queryClient.invalidateQueries({ queryKey: ['activityLog'] });
      setShowConfirmDialog(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleClearActivity = () => {
    setShowConfirmDialog(true);
  };

  const confirmClear = () => {
    clearActivityMutation.mutate();
  };

  const getClearDescription = () => {
    switch (clearType) {
      case 'all':
        return 'This will permanently delete ALL activity records from the database.';
      case 'older_than_days':
        return `This will permanently delete all activity records older than ${daysValue} days.`;
      case 'by_bid_period':
        const period = bidPeriods?.find((p: any) => p.id === selectedBidPeriod);
        return `This will permanently delete all activity records for bid period: ${period?.name || 'Selected Period'}.`;
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-6">
          <div className="flex items-center space-x-3 mb-6">
            <RotateCcw className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xl leading-6 font-semibold text-gray-900 dark:text-gray-100">
              Activity Data Management
            </h3>
          </div>

          {/* Current Stats */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Records</p>
                  <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
                    {activityStats?.total || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">Last 24 Hours</p>
                  <p className="text-lg font-bold text-green-800 dark:text-green-200">
                    {activityStats?.last24h || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Last 7 Days</p>
                  <p className="text-lg font-bold text-yellow-800 dark:text-yellow-200">
                    {activityStats?.last7d || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Last 30 Days</p>
                  <p className="text-lg font-bold text-purple-800 dark:text-purple-200">
                    {activityStats?.last30d || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Clear Options */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Clear Activity Data Options
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Clear All */}
              <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                clearType === 'all'
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`} onClick={() => setClearType('all')}>
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={clearType === 'all'}
                    onChange={() => setClearType('all')}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <Trash2 className="h-5 w-5 text-red-600" />
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-gray-100">Clear All Data</h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Remove all activity records
                    </p>
                  </div>
                </div>
              </div>

              {/* Clear Older Than Days */}
              <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                clearType === 'older_than_days'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`} onClick={() => setClearType('older_than_days')}>
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={clearType === 'older_than_days'}
                    onChange={() => setClearType('older_than_days')}
                    className="text-orange-600 focus:ring-orange-500"
                  />
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-gray-100">Clear Old Records</h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Remove records older than X days
                    </p>
                  </div>
                </div>
                {clearType === 'older_than_days' && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Days to keep (newer records will be preserved):
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={daysValue}
                      onChange={(e) => setDaysValue(parseInt(e.target.value) || 30)}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                )}
              </div>

              {/* Clear by Bid Period */}
              <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                clearType === 'by_bid_period'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`} onClick={() => setClearType('by_bid_period')}>
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={clearType === 'by_bid_period'}
                    onChange={() => setClearType('by_bid_period')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-gray-100">Clear by Bid Period</h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Remove records for specific period
                    </p>
                  </div>
                </div>
                {clearType === 'by_bid_period' && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Select Bid Period:
                    </label>
                    <select
                      value={selectedBidPeriod}
                      onChange={(e) => setSelectedBidPeriod(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a bid period...</option>
                      {bidPeriods?.map((period: any) => (
                        <option key={period.id} value={period.id}>
                          {period.name} ({new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleClearActivity}
                disabled={clearActivityMutation.isPending || 
                         (clearType === 'by_bid_period' && !selectedBidPeriod)}
                className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>
                  {clearActivityMutation.isPending ? 'Clearing...' : 'Clear Activity Data'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl border dark:border-gray-600 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Confirm Data Deletion
              </h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {getClearDescription()}
            </p>
            
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-md mb-4">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Warning:</strong> This action cannot be undone. All deleted activity records will be permanently lost.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmClear}
                disabled={clearActivityMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                {clearActivityMutation.isPending ? 'Deleting...' : 'Yes, Delete Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}