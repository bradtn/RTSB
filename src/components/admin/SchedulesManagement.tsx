'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Calendar, Building, Users, FileText, BarChart3, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface BidPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  numCycles: number;
  isActive: boolean;
}

interface Operation {
  id: string;
  name: string;
  nameEn: string;
  nameFr: string;
}

export default function SchedulesManagement() {
  const [selectedBidPeriod, setSelectedBidPeriod] = useState('');
  const [selectedOperation, setSelectedOperation] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);
  const queryClient = useQueryClient();

  const { data: bidPeriods } = useQuery<BidPeriod[]>({
    queryKey: ['bidPeriods'],
    queryFn: async () => {
      const res = await fetch('/api/bid-periods');
      if (!res.ok) throw new Error('Failed to fetch bid periods');
      return res.json();
    },
  });

  const { data: operations } = useQuery<Operation[]>({
    queryKey: ['operations'],
    queryFn: async () => {
      const res = await fetch('/api/operations');
      if (!res.ok) throw new Error('Failed to fetch operations');
      return res.json();
    },
  });

  const { data: schedules } = useQuery({
    queryKey: ['schedules', selectedBidPeriod, selectedOperation],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedBidPeriod) params.append('bidPeriodId', selectedBidPeriod);
      if (selectedOperation) params.append('operationId', selectedOperation);
      params.append('includeShifts', 'true');
      
      const res = await fetch(`/api/schedules?${params}`);
      if (!res.ok) throw new Error('Failed to fetch schedules');
      return res.json();
    },
    enabled: !!selectedBidPeriod,
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/schedules/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to upload schedules');
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setUploading(false);
      setUploadResult({
        success: true,
        message: `Successfully processed ${data.created} schedules and ${data.bidLines} bid lines`,
        details: data
      });
    },
    onError: (error: any) => {
      setUploading(false);
      setUploadResult({
        success: false,
        message: error.message || 'Upload failed',
        details: error
      });
    },
  });

  const createBidPeriodMutation = useMutation({
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
      toast.success('Bid period created successfully!');
      // Reset form
      (document.getElementById('create-bid-period-form') as HTMLFormElement)?.reset();
    },
    onError: (error: any) => {
      toast.error(`Failed to create bid period: ${error.message}`);
    },
  });

  const clearSchedulesMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/schedules/clear', {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to clear schedules');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success(data.message || 'All schedules cleared successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to clear schedules: ${error.message}`);
    },
  });

  const handleFileUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (!selectedBidPeriod) {
      alert('Please select a bid period');
      return;
    }
    
    formData.append('bidPeriodId', selectedBidPeriod);
    if (selectedOperation) {
      formData.append('operationId', selectedOperation);
    }
    
    setUploading(true);
    setUploadResult(null);
    uploadMutation.mutate(formData);
  };

  const handleCreateBidPeriod = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      startDate: formData.get('startDate') as string,
      numCycles: parseInt(formData.get('numCycles') as string),
    };
    createBidPeriodMutation.mutate(data);
  };

  const handleClearSchedules = () => {
    if (window.confirm('Are you sure you want to clear ALL schedules? This will remove all schedule data and reset bid line metrics. This action cannot be undone.')) {
      clearSchedulesMutation.mutate();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Schedules Management</h2>
        <button
          onClick={handleClearSchedules}
          disabled={clearSchedulesMutation.isPending}
          className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2 font-medium transform hover:-translate-y-0.5"
        >
          {clearSchedulesMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Clearing...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              Clear All Schedules
            </>
          )}
        </button>
      </div>

      {/* Create Bid Period */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 shadow-xl rounded-xl p-8 border border-blue-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Create New Bid Period
          </h3>
        </div>
        <form id="create-bid-period-form" onSubmit={handleCreateBidPeriod} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Name</label>
            <input
              name="name"
              type="text"
              placeholder="e.g., Bid 2024-1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Start Date</label>
            <input
              name="startDate"
              type="date"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Number of Cycles</label>
            <input
              name="numCycles"
              type="number"
              min="1"
              max="10"
              defaultValue="3"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={createBidPeriodMutation.isPending}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
          >
            {createBidPeriodMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating...
              </div>
            ) : (
              'Create Bid Period'
            )}
          </button>
        </form>
      </div>

      {/* Upload Schedules */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 shadow-xl rounded-xl p-8 border border-blue-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <Upload className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Upload Schedule Excel File
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Bid Period *</label>
            <select
              value={selectedBidPeriod}
              onChange={(e) => setSelectedBidPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">Select Bid Period</option>
              {bidPeriods?.map((period) => (
                <option key={period.id} value={period.id} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  {period.name} ({period.numCycles} cycles)
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Operation (Optional)</label>
            <select
              value={selectedOperation}
              onChange={(e) => setSelectedOperation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">Auto-detect from Excel file</option>
              {operations?.map((operation) => (
                <option key={operation.id} value={operation.id} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  {operation.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <form onSubmit={handleFileUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Excel File</label>
            <input
              name="file"
              type="file"
              accept=".xlsx,.xls"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all file:mr-4 file:py-1 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900 file:text-blue-700 dark:file:text-blue-200 hover:file:bg-blue-100 dark:hover:file:bg-blue-800"
              required
            />
          </div>
          
          {/* Upload Progress/Results */}
          {uploading && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-blue-700 dark:text-blue-300 font-medium">Uploading and processing Excel file...</span>
            </div>
          )}
          
          {uploadResult && (
            <div className={`p-4 rounded-md border ${
              uploadResult.success 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            }`}>
              <div className="flex items-start gap-2">
                <div className={`mt-0.5 ${
                  uploadResult.success ? 'text-green-500' : 'text-red-500'
                }`}>
                  {uploadResult.success ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{uploadResult.message}</p>
                  {uploadResult.success && uploadResult.details && (
                    <div className="mt-2 text-sm">
                      <p>• {uploadResult.details.created} schedules created/updated</p>
                      <p>• {uploadResult.details.bidLines} bid lines created/updated</p>
                      <p>• {uploadResult.details.processed} total lines processed</p>
                      <p className="text-blue-700 dark:text-blue-400 font-medium">✓ Schedules now available on bid lines page</p>
                      {uploadResult.details.errors && uploadResult.details.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="font-medium text-orange-700 dark:text-orange-400">Warnings:</p>
                          <ul className="list-disc list-inside text-orange-700 dark:text-orange-400">
                            {uploadResult.details.errors.slice(0, 5).map((error: any, idx: number) => (
                              <li key={idx}>Line {error.lineNumber}: {error.error}</li>
                            ))}
                            {uploadResult.details.errors.length > 5 && (
                              <li>... and {uploadResult.details.errors.length - 5} more</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  {!uploadResult.success && uploadResult.details && (
                    <p className="mt-1 text-sm">{uploadResult.details.details || 'Please check the file format and try again.'}</p>
                  )}
                </div>
                <button
                  onClick={() => setUploadResult(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Upload Excel files containing 56-day shift schedules. The system will parse shift codes and create the schedule structure automatically.
            </p>
            <button
              type="submit"
              disabled={uploading || !selectedBidPeriod}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2 font-medium transform hover:-translate-y-0.5"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  Upload Schedules
                  <Upload className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Existing Schedules */}
      {schedules && schedules.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Existing Schedules ({schedules.length})
            </h3>
            {selectedBidPeriod && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {bidPeriods?.find(bp => bp.id === selectedBidPeriod)?.name}
                {selectedOperation && operations && (
                  <span> • {operations.find(op => op.id === selectedOperation)?.name}</span>
                )}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {schedules.map((schedule: any) => {
              const workingDays = schedule.scheduleShifts?.filter((shift: any) => shift.shiftCode).length || 0;
              const totalHours = schedule.scheduleShifts?.reduce((sum: number, shift: any) => 
                sum + (shift.shiftCode?.hoursLength || 0), 0
              ) || 0;
              const avgHoursPerWeek = totalHours / 8;
              
              return (
                <div key={schedule.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      Line {schedule.lineNumber}
                    </span>
                  </div>
                  
                  {schedule.operation && (
                    <div className="mb-2">
                      <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                        {schedule.operation.name}
                      </span>
                    </div>
                  )}
                  
                  <div className="space-y-2 text-sm text-gray-700 dark:text-gray-400">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-3 h-3 text-blue-600 dark:text-blue-500" />
                        <span>Working days</span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{workingDays}/56</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-green-600 dark:text-green-500" />
                        <span>Total hours</span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{totalHours.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3 text-purple-600 dark:text-purple-500" />
                        <span>Avg/week</span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{avgHoursPerWeek.toFixed(1)}h</span>
                    </div>
                  </div>
                  
                  {/* Schedule pattern preview */}
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Pattern preview</div>
                    <div className="flex flex-wrap gap-1">
                      {schedule.scheduleShifts?.slice(0, 14).map((shift: any, idx: number) => (
                        <div
                          key={idx}
                          className={`w-3 h-3 rounded-sm text-[8px] flex items-center justify-center ${
                            shift.shiftCode 
                              ? 'bg-blue-500 dark:bg-blue-600 border border-blue-600 dark:border-blue-500' 
                              : 'bg-gray-300 dark:bg-gray-600 border border-gray-400 dark:border-gray-500'
                          }`}
                          title={shift.shiftCode ? `Day ${idx + 1}: ${shift.shiftCode.code}` : `Day ${idx + 1}: OFF`}
                        />
                      ))}
                      {schedule.scheduleShifts?.length > 14 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">...</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Empty state when no schedules */}
      {selectedBidPeriod && (!schedules || schedules.length === 0) && (
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
          <FileText className="w-12 h-12 text-gray-500 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Schedules Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No schedules have been uploaded for this bid period yet.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Upload an Excel file containing 56-day shift schedules to get started.
          </p>
        </div>
      )}
    </div>
  );
}