'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Edit, Trash2, AlertCircle, Clock, Users, FileText, Download, Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from '@/lib/i18n';
import { useParams } from 'next/navigation';

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
    takenAt?: string;
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

type SortField = 'lineNumber' | 'operation' | 'status' | 'assignedDate' | 'workPattern';
type SortDirection = 'asc' | 'desc';

export default function ScheduleManagement() {
  const params = useParams();
  const { t } = useTranslation(params.locale as string);
  
  // State
  const [selectedBidPeriod, setSelectedBidPeriod] = useState<string>('');
  const [selectedOperation, setSelectedOperation] = useState<string>('');
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('lineNumber');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  
  const queryClient = useQueryClient();

  // Data fetching
  const { data: bidPeriods, error: bidPeriodsError } = useQuery({
    queryKey: ['bidPeriods'],
    queryFn: async () => {
      const res = await fetch('/api/bid-periods');
      if (!res.ok) throw new Error('Failed to fetch bid periods');
      return res.json();
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
      
      const res = await fetch(`/api/schedules?${params}`);
      if (!res.ok) {
        const error = await res.text();
        throw new Error('Failed to fetch schedules');
      }
      return res.json();
    },
    enabled: !!selectedBidPeriod,
  });

  // Auto-select active bid period on page load
  useEffect(() => {
    if (bidPeriods && bidPeriods.length > 0 && !selectedBidPeriod) {
      const activeBidPeriod = bidPeriods.find((period: any) => period.isActive);
      if (activeBidPeriod) {
        setSelectedBidPeriod(activeBidPeriod.id);
        console.log('Auto-selected active bid period:', activeBidPeriod.name);
      }
    }
  }, [bidPeriods, selectedBidPeriod]);

  // Natural sort function
  const naturalSort = (a: string, b: string): number => {
    return a.localeCompare(b, undefined, { 
      numeric: true, 
      sensitivity: 'base',
      caseFirst: 'upper'
    });
  };

  // Filter and sort schedules
  const filteredAndSortedSchedules = useMemo(() => {
    if (!schedules) return [];

    // Filter by search term
    const filtered = schedules.filter(schedule => {
      const searchLower = searchTerm.toLowerCase();
      const takenBy = schedule.bidLines?.find(bl => bl.status === 'TAKEN')?.takenBy || '';
      
      return (
        schedule.lineNumber.toLowerCase().includes(searchLower) ||
        schedule.operation.name.toLowerCase().includes(searchLower) ||
        takenBy.toLowerCase().includes(searchLower) ||
        (schedule.bidLines?.some(bl => bl.status.toLowerCase().includes(searchLower)))
      );
    });

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'lineNumber':
          return sortDirection === 'asc' 
            ? naturalSort(a.lineNumber, b.lineNumber)
            : naturalSort(b.lineNumber, a.lineNumber);
        
        case 'operation':
          aValue = a.operation.name;
          bValue = b.operation.name;
          break;
        
        case 'status':
          const aStatus = a.bidLines?.find(bl => bl.status === 'TAKEN') ? 'TAKEN' : 'AVAILABLE';
          const bStatus = b.bidLines?.find(bl => bl.status === 'TAKEN') ? 'TAKEN' : 'AVAILABLE';
          aValue = aStatus;
          bValue = bStatus;
          break;
        
        case 'assignedDate':
          const aTakenAt = a.bidLines?.find(bl => bl.status === 'TAKEN')?.takenAt;
          const bTakenAt = b.bidLines?.find(bl => bl.status === 'TAKEN')?.takenAt;
          aValue = aTakenAt || '';
          bValue = bTakenAt || '';
          break;
        
        case 'workPattern':
          const aWorkDays = a.scheduleShifts?.filter(shift => shift.shiftCode).length || 0;
          const bWorkDays = b.scheduleShifts?.filter(shift => shift.shiftCode).length || 0;
          aValue = aWorkDays;
          bValue = bWorkDays;
          break;
        
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return sorted;
  }, [schedules, searchTerm, sortField, sortDirection]);

  // Pagination
  const totalItems = filteredAndSortedSchedules.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSchedules = filteredAndSortedSchedules.slice(startIndex, endIndex);

  // Reset pagination when filters change
  const resetPagination = () => {
    setCurrentPage(1);
  };

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    resetPagination();
  };

  // Search handler
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    resetPagination();
  };

  // Mutations (keeping existing ones)
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
      toast.success(t('scheduleManagement.updateSuccess') || 'Schedule updated successfully');
    },
    onError: (error: any) => {
      toast.error(t('scheduleManagement.updateError') || `Failed to update schedule: ${error.message}`);
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
      toast.success(t('scheduleManagement.deleteSuccess') || 'Schedule deleted successfully');
    },
    onError: (error: any) => {
      toast.error(t('scheduleManagement.deleteError') || `Failed to delete schedule: ${error.message}`);
    },
  });

  // Event handlers
  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setShowEditModal(true);
  };

  const handleDeleteSchedule = (id: string) => {
    if (confirm(t('scheduleManagement.deleteConfirm') || 'Are you sure you want to delete this schedule?')) {
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
      const res = await fetch(`/api/schedules/export-assignments?bidPeriodId=${selectedBidPeriod}${selectedOperation ? `&operationId=${selectedOperation}` : ''}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch assignment data');
      }

      const assignmentData = await res.json();
      
      // Create CSV content
      const headers = [
        t('scheduleManagement.lineNumber') || 'Line Number',
        t('scheduleManagement.operation') || 'Operation', 
        t('scheduleManagement.officerName') || 'Officer Name',
        t('scheduleManagement.assignmentStatus') || 'Assignment Status',
        t('scheduleManagement.assignedDate') || 'Assigned Date',
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
      
      toast.success(t('scheduleManagement.exportSuccess') || `Exported ${assignmentData.length} schedule assignments`);
      
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(t('scheduleManagement.exportError') || `Export failed: ${error.message}`);
    }
  };

  // Get schedules with issues
  const schedulesWithIssues = schedules?.filter(schedule => 
    schedule.scheduleShifts.some(shift => 
      shift.shiftCode && shift.shiftCode.beginTime === '????'
    )
  ) || [];

  // Sortable header component
  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th 
      onClick={() => handleSort(field)}
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
        )}
      </div>
    </th>
  );

  // Enhanced Pagination component
  const Pagination = ({ position = 'bottom' }: { position?: 'top' | 'bottom' }) => {
    const maxVisiblePages = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    const visiblePages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

    const borderClass = position === 'top' 
      ? 'border-b border-gray-200 dark:border-gray-700' 
      : 'border-t border-gray-200 dark:border-gray-700';

    return (
      <div className={`bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between ${borderClass} sm:px-6`}>
        {/* Mobile View */}
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common.previous') || 'Previous'}
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
            {t('common.page') || 'Page'} {currentPage} {t('common.of') || 'of'} {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common.next') || 'Next'}
          </button>
        </div>

        {/* Desktop View */}
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t('common.showing') || 'Showing'}{' '}
              <span className="font-medium">{startIndex + 1}</span>
              {' '}{t('common.to') || 'to'}{' '}
              <span className="font-medium">{Math.min(endIndex, totalItems)}</span>
              {' '}{t('common.of') || 'of'}{' '}
              <span className="font-medium">{totalItems}</span>
              {' '}{t('common.results') || 'results'}
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              {/* First Page */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('common.firstPage') || 'First page'}
              >
                <ChevronsLeft className="h-5 w-5" />
              </button>
              
              {/* Previous Page */}
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('common.previousPage') || 'Previous page'}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Page Numbers */}
              {startPage > 1 && (
                <>
                  <button
                    onClick={() => setCurrentPage(1)}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    1
                  </button>
                  {startPage > 2 && (
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300">
                      ...
                    </span>
                  )}
                </>
              )}

              {visiblePages.map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    page === currentPage
                      ? 'z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-300'
                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  {page}
                </button>
              ))}

              {endPage < totalPages && (
                <>
                  {endPage < totalPages - 1 && (
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300">
                      ...
                    </span>
                  )}
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              {/* Next Page */}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('common.nextPage') || 'Next page'}
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Last Page */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('common.lastPage') || 'Last page'}
              >
                <ChevronsRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('scheduleManagement.title') || 'Schedule Management'}
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {t('scheduleManagement.description') || 'View and edit individual schedules'}
          </p>
        </div>
        {selectedBidPeriod && schedules && schedules.length > 0 && (
          <button
            onClick={handleExportScheduleAssignments}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
          >
            <Download className="w-4 h-4" />
            {t('scheduleManagement.exportAssignments') || 'Export Schedule Assignments'}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 shadow-xl rounded-xl p-6 border border-blue-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
              {t('scheduleManagement.bidPeriod') || 'Bid Period'}
            </label>
            <select
              value={selectedBidPeriod}
              onChange={(e) => {
                setSelectedBidPeriod(e.target.value);
                resetPagination();
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                {t('scheduleManagement.selectBidPeriod') || 'Select Bid Period'}
              </option>
              {bidPeriods?.map((period: any) => (
                <option key={period.id} value={period.id} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  {period.name} {period.isActive && `(${t('common.active') || 'Active'})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
              {t('scheduleManagement.operation') || 'Operation'} ({t('common.optional') || 'Optional'})
            </label>
            <select
              value={selectedOperation}
              onChange={(e) => {
                setSelectedOperation(e.target.value);
                resetPagination();
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                {t('scheduleManagement.allOperations') || 'All Operations'}
              </option>
              {operations?.map((operation: any) => (
                <option key={operation.id} value={operation.id} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  {operation.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search */}
        {selectedBidPeriod && (
          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
              {t('common.search') || 'Search'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={t('scheduleManagement.searchPlaceholder') || 'Search by line number, operation, or officer name...'}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        )}
      </div>

      {/* Issues Alert */}
      {schedulesWithIssues.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                {t('scheduleManagement.issuesTitle') || 'Schedules with Missing Shift Code Configuration'}
              </h3>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                {t('scheduleManagement.issuesDescription', { count: String(schedulesWithIssues.length) }) || 
                 `${schedulesWithIssues.length} schedule(s) contain shift codes that need configuration.`}
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
            {t('scheduleManagement.loadError') || 'Error loading schedules'}: {schedulesError.message}
          </p>
        </div>
      ) : selectedBidPeriod ? (
        schedules && schedules.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Results info */}
            <div className="bg-gray-50 dark:bg-gray-900 px-6 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('scheduleManagement.showingResults', { 
                    total: String(filteredAndSortedSchedules.length),
                    originalTotal: String(schedules.length) 
                  }) || `Showing ${filteredAndSortedSchedules.length} of ${schedules.length} schedules`}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {t('scheduleManagement.itemsPerPage', { count: String(itemsPerPage) }) || `${itemsPerPage} items per page`}
                </p>
              </div>
            </div>

            {/* Top Pagination */}
            {totalPages > 1 && <Pagination position="top" />}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <SortableHeader field="lineNumber">
                      {t('scheduleManagement.lineNumber') || 'Line #'}
                    </SortableHeader>
                    <SortableHeader field="operation">
                      {t('scheduleManagement.operation') || 'Operation'}
                    </SortableHeader>
                    <SortableHeader field="status">
                      {t('scheduleManagement.bidLineStatus') || 'Bid Line Status'}
                    </SortableHeader>
                    <SortableHeader field="assignedDate">
                      {t('scheduleManagement.assignedDateTime') || 'Assigned Date/Time'}
                    </SortableHeader>
                    <SortableHeader field="workPattern">
                      {t('scheduleManagement.workPattern') || 'Work Pattern'}
                    </SortableHeader>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('scheduleManagement.issues') || 'Issues'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('scheduleManagement.actions') || 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {currentSchedules.map((schedule) => {
                    const hasIssues = schedule.scheduleShifts.some(
                      shift => shift.shiftCode && shift.shiftCode.beginTime === '????'
                    );
                    const takenBidLine = schedule.bidLines?.find(bl => bl.status === 'TAKEN');
                    
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
                                <div key={idx} className="flex items-center gap-2">
                                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                                    bidLine.status === 'AVAILABLE'
                                      ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200'
                                      : bidLine.status === 'TAKEN'
                                      ? 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200'
                                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                                  }`}>
                                    {bidLine.status === 'AVAILABLE' 
                                      ? (t('bidLine.available') || 'Available')
                                      : bidLine.status === 'TAKEN'
                                      ? (t('bidLine.taken') || 'Assigned') 
                                      : bidLine.status === 'BLACKED_OUT'
                                      ? (t('bidLine.blackedOut') || 'Blacked Out')
                                      : bidLine.status
                                    }
                                  </span>
                                  {bidLine.takenBy && (
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                      {bidLine.takenBy}
                                    </span>
                                  )}
                                </div>
                              ))}
                              {schedule.bidLines.length > 2 && (
                                <span className="text-xs text-gray-500">+{schedule.bidLines.length - 2} more</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">{t('scheduleManagement.noBidLines') || 'No bid lines'}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {takenBidLine?.takenAt ? (
                            <div>
                              <div className="font-medium">
                                {new Date(takenBidLine.takenAt).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-400">
                                {new Date(takenBidLine.takenAt).toLocaleTimeString()}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">
                              {t('scheduleManagement.notAssigned') || 'Not assigned'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {(() => {
                            const totalDays = schedule._count?.scheduleShifts || 0;
                            const workDays = schedule.scheduleShifts?.filter(shift => shift.shiftCode).length || 0;
                            return (
                              <div>
                                <div className="font-medium">
                                  {t('scheduleManagement.workDays', { count: String(workDays) }) || `${workDays} work days`}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {t('scheduleManagement.totalDays', { current: String(totalDays), max: '56' }) || `${totalDays} / 56 total`}
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {hasIssues ? (
                            <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                              <AlertCircle className="w-4 h-4" />
                              {t('scheduleManagement.configNeeded') || 'Config needed'}
                            </span>
                          ) : (
                            <span className="text-green-600 dark:text-green-400">
                              ✓ {t('common.ok') || 'OK'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEditSchedule(schedule)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                            title={t('common.edit') || 'Edit'}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                            title={t('common.delete') || 'Delete'}
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

            {/* Pagination */}
            {totalPages > 1 && <Pagination position="bottom" />}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {t('scheduleManagement.noSchedulesFound') || 'No Schedules Found'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('scheduleManagement.noSchedulesDescription') || 
               `No schedules exist for this bid period${selectedOperation ? ' and operation' : ''}. Try uploading schedule data first.`}
            </p>
          </div>
        )
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {t('scheduleManagement.selectBidPeriodTitle') || 'Select a Bid Period'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {t('scheduleManagement.selectBidPeriodDescription') || 'Choose a bid period above to view and manage schedules'}
          </p>
        </div>
      )}

      {/* Edit Modal (keeping existing modal code) */}
      {showEditModal && editingSchedule && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('scheduleManagement.editSchedule') || 'Edit Schedule'} - {t('scheduleManagement.line') || 'Line'} {editingSchedule.lineNumber}
            </h3>
            
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>{t('scheduleManagement.operation') || 'Operation'}:</strong> {editingSchedule.operation.name} | 
                <strong> {t('scheduleManagement.bidPeriod') || 'Bid Period'}:</strong> {editingSchedule.bidPeriod.name}
              </p>
            </div>

            <form onSubmit={handleSaveSchedule}>
              <div className="grid grid-cols-7 gap-2 mb-6">
                {Array.from({length: 56}, (_, i) => {
                  const dayNumber = i + 1;
                  const existingShift = editingSchedule.scheduleShifts?.find(s => s.dayNumber === dayNumber);
                  
                  return (
                    <div key={dayNumber} className="text-center">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('scheduleManagement.day') || 'Day'} {dayNumber}
                      </label>
                      <select
                        name={`day_${dayNumber}`}
                        defaultValue={existingShift?.shiftCode?.id || 'OFF'}
                        className="w-full text-xs px-1 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="OFF">OFF</option>
                        {shiftCodes?.map(shiftCode => (
                          <option key={shiftCode.id} value={shiftCode.id}>
                            {shiftCode.code}
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
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  {t('common.cancel') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {t('common.save') || 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}