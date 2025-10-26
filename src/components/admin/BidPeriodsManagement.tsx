'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Check, Trash2, Plus, Settings, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface BidPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  numCycles: number;
  isActive: boolean;
  createdAt: string;
  _count?: {
    schedules: number;
  };
}

// Helper function to format UTC dates properly
const formatUTCDate = (dateString: string) => {
  const date = new Date(dateString);
  // Use UTC methods to avoid timezone issues
  return date.toLocaleDateString(undefined, { 
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short', 
    day: 'numeric'
  });
};

export default function BidPeriodsManagement() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: bidPeriods, isLoading } = useQuery<BidPeriod[]>({
    queryKey: ['bidPeriods'],
    queryFn: async () => {
      const res = await fetch('/api/bid-periods');
      if (!res.ok) throw new Error('Failed to fetch bid periods');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; startDate: string; numCycles: number }) => {
      const res = await fetch('/api/bid-periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create bid period');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bidPeriods'] });
      setShowCreateForm(false);
      toast.success('Bid period created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create bid period: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/bid-periods/${id}`, {
        method: 'DELETE',
      });
      
      // Check if response has content before trying to parse
      const text = await res.text();
      if (!text) {
        if (!res.ok) {
          throw new Error('Failed to delete bid period');
        }
        return { success: true };
      }
      
      try {
        const data = JSON.parse(text);
        if (!res.ok) {
          throw new Error(data.error || 'Failed to delete bid period');
        }
        return data;
      } catch (e) {
        console.error('Failed to parse response:', text);
        if (!res.ok) {
          throw new Error('Failed to delete bid period');
        }
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bidPeriods'] });
      toast.success('Bid period deleted successfully');
      setDeletingId(null);
    },
    onError: (error: any) => {
      toast.error(`Failed to delete: ${error.message}`);
      setDeletingId(null);
    },
  });

  const setActiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/bid-periods/${id}/activate`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to set active bid period');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bidPeriods'] });
      queryClient.invalidateQueries({ queryKey: ['bidLines'] });
      toast.success('Active bid period updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to set active: ${error.message}`);
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      startDate: formData.get('startDate') as string,
      numCycles: parseInt(formData.get('numCycles') as string),
    };
    createMutation.mutate(data);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this bid period? This will also delete all associated schedules and bid lines.')) {
      setDeletingId(id);
      deleteMutation.mutate(id);
    }
  };

  const handleSetActive = (id: string) => {
    if (confirm('Set this as the active bid period? This will change which bid lines are shown to users.')) {
      setActiveMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bid Periods</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage bidding periods and set which one is currently active
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" />
          New Bid Period
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 shadow-lg rounded-xl p-8 border border-blue-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Create New Bid Period
            </h3>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Name *
              </label>
              <input
                name="name"
                type="text"
                placeholder="e.g., Bid 2024-1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
                disabled={createMutation.isPending}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Start Date *
              </label>
              <input
                name="startDate"
                type="date"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
                disabled={createMutation.isPending}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Number of Cycles *
              </label>
              <input
                name="numCycles"
                type="number"
                min="1"
                max="10"
                defaultValue="3"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
                disabled={createMutation.isPending}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </div>
                ) : (
                  'Create'
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bid Periods List */}
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        {bidPeriods && bidPeriods.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {bidPeriods.map((period) => (
              <div
                key={period.id}
                className={`p-6 ${
                  period.isActive
                    ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center shadow-sm">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {period.name}
                      </h4>
                      {period.isActive && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p>
                        Start Date: {formatUTCDate(period.startDate)}
                        {period.endDate && ` • End Date: ${formatUTCDate(period.endDate)}`}
                      </p>
                      <p>
                        Cycles: {period.numCycles} • 
                        Schedules: {period._count?.schedules || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Created: {new Date(period.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {!period.isActive && (
                      <button
                        onClick={() => handleSetActive(period.id)}
                        disabled={setActiveMutation.isPending}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 hover:scale-105"
                        title="Set as Active"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDelete(period.id)}
                      disabled={deletingId === period.id}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                      title="Delete Bid Period"
                    >
                      {deletingId === period.id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No bid periods yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first bid period to start managing schedules
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              Create First Bid Period
            </button>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              About Bid Periods
            </h4>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              The active bid period determines which schedules and bid lines are visible to officers.
              Only one bid period can be active at a time. Deleting a bid period will also remove all
              associated schedules and bid lines.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}