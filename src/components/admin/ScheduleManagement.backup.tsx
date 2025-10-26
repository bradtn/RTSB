'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Edit, Trash2, AlertCircle, Clock, Users, FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface Schedule {
  id: string;
  lineNumber: string;
  groupName?: string;
  bidPeriod: {
    id: string;
    name: string;
    isActive: boolean;
  };
  operation: {
    id: string;
    name: string;
  };
  bidLines?: Array<{
    id: string;
    status: string;
    takenBy?: string;
  }>;
  scheduleShifts: Array<{
    id: string;
    dayNumber: number;
    date: string;
    shiftCode?: {
      id: string;
      code: string;
      beginTime: string;
      endTime: string;
      category: string;
    };
  }>;
  _count?: {
    scheduleShifts: number;
  };
}

interface ShiftCode {
  id: string;
  code: string;
  beginTime: string;
  endTime: string;
  category: string;
}

export default function ScheduleManagement() {
  const [selectedBidPeriod, setSelectedBidPeriod] = useState<string>('');
  const [selectedOperation, setSelectedOperation] = useState<string>('');
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: bidPeriods, error: bidPeriodsError } = useQuery({
    queryKey: ['bidPeriods'],
    queryFn: async () => {
      const res = await fetch('/api/bid-periods');
      if (!res.ok) throw new Error('Failed to fetch bid periods');
      const data = await res.json();
      console.log('Bid periods fetched in ScheduleManagement:', data);
      return data;
    },
  });

  const { data: operations } = useQuery({
    queryKey: ['operations'],
    queryFn: async () => {
      const res = await fetch('/api/operations');
      if (!res.ok) throw new Error('Failed to fetch operations');
      return res.json();
    },
  });

  const { data: shiftCodes } = useQuery<ShiftCode[]>({
    queryKey: ['shiftCodes'],
    queryFn: async () => {
      const res = await fetch('/api/shift-codes');
      if (!res.ok) throw new Error('Failed to fetch shift codes');
      return res.json();
    },
  });

  const { data: schedules, isLoading, error: schedulesError } = useQuery<Schedule[]>({
    queryKey: ['schedules', selectedBidPeriod, selectedOperation],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedBidPeriod) params.append('bidPeriodId', selectedBidPeriod);
      if (selectedOperation) params.append('operationId', selectedOperation);
      params.append('includeShifts', 'true');
      
      console.log('Fetching schedules with params:', params.toString());
      const res = await fetch(`/api/schedules?${params}`);
      if (!res.ok) {
        const error = await res.text();
        console.error('Schedules API error:', error);
        throw new Error('Failed to fetch schedules');
      }
      const data = await res.json();
      console.log('Schedules data received:', data.length, 'schedules');
      return data;
    },
    enabled: !!selectedBidPeriod,
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async ({ id, shifts }: { id: string; shifts: any[] }) => {
      const res = await fetch(`/api/schedules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shifts }),
      });
      if (!res.ok) throw new Error('Failed to update schedule');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setShowEditModal(false);
      setEditingSchedule(null);
      toast.success('Schedule updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update schedule: ${error.message}`);
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/schedules/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete schedule');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Schedule deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete schedule: ${error.message}`);
    },
  });

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setShowEditModal(true);
  };

  const handleDeleteSchedule = (id: string) => {
    if (confirm('Are you sure you want to delete this schedule? This will also affect the associated bid line.')) {
      deleteScheduleMutation.mutate(id);
    }
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const shifts = [];

    for (let i = 1; i <= 56; i++) {
      const shiftCodeId = formData.get(`day_${i}`) as string;
      if (shiftCodeId) {
        shifts.push({
          dayNumber: i,
          shiftCodeId: shiftCodeId === 'OFF' ? null : shiftCodeId,
        });
      }
    }

    updateScheduleMutation.mutate({
      id: editingSchedule.id,
      shifts,
    });
  };

  const handleExportScheduleAssignments = async () => {
    if (!schedules || !selectedBidPeriod) return;

    try {
      // Fetch detailed schedule data with bid line assignments
      const res = await fetch(`/api/schedules/export-assignments?bidPeriodId=${selectedBidPeriod}${selectedOperation ? `&operationId=${selectedOperation}` : ''}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch assignment data');
      }

      const assignmentData = await res.json();
      
      // Create CSV content
      const headers = [
        'Line Number',
        'Operation', 
        'Officer Name',
        'Assignment Status',
        'Assigned Date',
        'Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7',
        'Day 8', 'Day 9', 'Day 10', 'Day 11', 'Day 12', 'Day 13', 'Day 14',
        'Day 15', 'Day 16', 'Day 17', 'Day 18', 'Day 19', 'Day 20', 'Day 21',
        'Day 22', 'Day 23', 'Day 24', 'Day 25', 'Day 26', 'Day 27', 'Day 28',
        'Day 29', 'Day 30', 'Day 31', 'Day 32', 'Day 33', 'Day 34', 'Day 35',
        'Day 36', 'Day 37', 'Day 38', 'Day 39', 'Day 40', 'Day 41', 'Day 42',
        'Day 43', 'Day 44', 'Day 45', 'Day 46', 'Day 47', 'Day 48', 'Day 49',
        'Day 50', 'Day 51', 'Day 52', 'Day 53', 'Day 54', 'Day 55', 'Day 56'
      ];

      const rows = assignmentData.map((item: any) => {
        // Get shift codes for all 56 days
        const shiftCodes = Array.from({length: 56}, (_, i) => {
          const shift = item.schedule?.scheduleShifts?.find((s: any) => s.dayNumber === i + 1);
          return shift?.shiftCode?.code || 'OFF';
        });

        return [
          item.schedule.lineNumber,
          item.schedule.operation?.name || 'N/A',
          item.assignedOfficer || 'UNASSIGNED',
          item.status || 'AVAILABLE',
          item.assignedDate ? new Date(item.assignedDate).toLocaleString() : 'N/A',
          ...shiftCodes
        ];
      });

      const csvContent = [headers, ...rows]
        .map(row => row.map((field: any) => `"${field}"`).join(','))
        .join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      const bidPeriodName = bidPeriods?.find((bp: any) => bp.id === selectedBidPeriod)?.name || 'Unknown';
      const operationName = selectedOperation && operations ? operations.find((op: any) => op.id === selectedOperation)?.name : 'All-Operations';
      const filename = `schedule-assignments-${bidPeriodName}${operationName ? `-${operationName}` : ''}-${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Exported ${assignmentData.length} schedule assignments`);
      
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(`Export failed: ${error.message}`);
    }
  };

  // Get schedules with issues (missing shift codes)
  const schedulesWithIssues = schedules?.filter(schedule => 
    schedule.scheduleShifts.some(shift => 
      shift.shiftCode && shift.shiftCode.beginTime === '????'
    )
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Schedule Management</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            View and edit individual schedules
          </p>
        </div>
        {selectedBidPeriod && schedules && schedules.length > 0 && (
          <button
            onClick={handleExportScheduleAssignments}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
          >
            <Download className="w-4 h-4" />
            Export Schedule Assignments
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 shadow-xl rounded-xl p-6 border border-blue-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Bid Period
            </label>
            <select
              value={selectedBidPeriod}
              onChange={(e) => setSelectedBidPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">Select Bid Period</option>
              {bidPeriods?.map((period: any) => (
                <option key={period.id} value={period.id} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  {period.name} {period.isActive && '(Active)'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Operation (Optional)
            </label>
            <select
              value={selectedOperation}
              onChange={(e) => setSelectedOperation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">All Operations</option>
              {operations?.map((operation: any) => (
                <option key={operation.id} value={operation.id} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  {operation.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Issues Alert */}
      {schedulesWithIssues.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                Schedules with Missing Shift Code Configuration
              </h3>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                {schedulesWithIssues.length} schedule(s) contain shift codes that need configuration.
                These are marked with "????" times and should be updated in Shift Codes Management.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Schedules List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : schedulesError ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-300">
            Error loading schedules: {schedulesError.message}
          </p>
        </div>
      ) : selectedBidPeriod ? (
        schedules && schedules.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Line #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Operation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Bid Line Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Work Pattern
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Issues
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {schedules?.map((schedule) => {
                  const hasIssues = schedule.scheduleShifts.some(
                    shift => shift.shiftCode && shift.shiftCode.beginTime === '????'
                  );
                  
                  return (
                    <tr key={schedule.id} className={hasIssues ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {schedule.lineNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {schedule.operation.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {schedule.bidLines && schedule.bidLines.length > 0 ? (
                          <div className="space-y-1">
                            {schedule.bidLines.slice(0, 2).map((bidLine, idx) => (
                              <span key={idx} className={`inline-block px-2 py-1 text-xs font-medium rounded-full mr-1 ${
                                bidLine.status === 'AVAILABLE'
                                  ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200'
                                  : bidLine.status === 'TAKEN'
                                  ? 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                              }`}>
                                {bidLine.status}
                                {bidLine.takenBy && ` - ${bidLine.takenBy}`}
                              </span>
                            ))}
                            {schedule.bidLines.length > 2 && (
                              <span className="text-xs text-gray-500">+{schedule.bidLines.length - 2} more</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">No bid lines</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {(() => {
                          const totalDays = schedule._count?.scheduleShifts || 0;
                          const workDays = schedule.scheduleShifts?.filter(shift => shift.shiftCode).length || 0;
                          return (
                            <div>
                              <div className="font-medium">{workDays} work days</div>
                              <div className="text-xs text-gray-400">{totalDays} / 56 total</div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {hasIssues ? (
                          <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                            <AlertCircle className="w-4 h-4" />
                            Config needed
                          </span>
                        ) : (
                          <span className="text-green-600 dark:text-green-400">✓ OK</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEditSchedule(schedule)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Schedules Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No schedules exist for this bid period{selectedOperation ? ' and operation' : ''}. 
              Try uploading schedule data first.
            </p>
          </div>
        )
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Select a Bid Period
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Choose a bid period above to view and manage schedules
          </p>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingSchedule && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Edit Schedule - Line {editingSchedule.lineNumber}
            </h3>
            
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Operation:</strong> {editingSchedule.operation.name} | 
                <strong> Bid Period:</strong> {editingSchedule.bidPeriod.name}
              </p>
            </div>

            <form onSubmit={handleSaveSchedule}>
              <div className="grid grid-cols-7 gap-2 mb-4">
                <div className="col-span-7 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  56-Day Schedule Pattern
                </div>
                {Array.from({ length: 56 }, (_, i) => i + 1).map((day) => {
                  const shift = editingSchedule.scheduleShifts.find(s => s.dayNumber === day);
                  return (
                    <div key={day} className="text-center">
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Day {day}
                      </label>
                      <select
                        name={`day_${day}`}
                        defaultValue={shift?.shiftCode?.id || 'OFF'}
                        className="w-full px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="OFF">OFF</option>
                        {shiftCodes?.map((code) => (
                          <option key={code.id} value={code.id}>
                            {code.code}
                            {code.beginTime === '????' && ' ⚠'}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingSchedule(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateScheduleMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  {updateScheduleMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </div>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}