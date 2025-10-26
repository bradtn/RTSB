'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Clock, Tag, AlertTriangle, Upload, Download, FileText, ChevronUp, ChevronDown, Sun, Sunset, Moon, Calendar, AlertCircle, Coffee, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from '@/lib/i18n';
import { useParams } from 'next/navigation';

interface ShiftCode {
  id: string;
  code: string;
  beginTime: string;
  endTime: string;
  category: string;
  hoursLength: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type SortField = 'code' | 'category' | 'beginTime' | 'hoursLength' | 'isActive';
type SortDirection = 'asc' | 'desc';

export default function ShiftCodesManagement() {
  const params = useParams();
  const { t } = useTranslation(params.locale as string);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<ShiftCode | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [sortField, setSortField] = useState<SortField>('code');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [formTimes, setFormTimes] = useState<{ beginTime: string; endTime: string }>({ beginTime: '', endTime: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  
  const queryClient = useQueryClient();

  // Reset form times when modal opens/closes or when editing code changes
  useEffect(() => {
    if (isModalOpen) {
      setFormTimes({
        beginTime: editingCode?.beginTime || '',
        endTime: editingCode?.endTime || '',
      });
    }
  }, [isModalOpen, editingCode]);

  const { data: shiftCodes, isLoading } = useQuery<ShiftCode[]>({
    queryKey: ['shiftCodes'],
    queryFn: async () => {
      const res = await fetch('/api/shift-codes');
      if (!res.ok) throw new Error('Failed to fetch shift codes');
      return res.json();
    },
  });

  // Get unique categories from existing shift codes, plus standard ones
  const availableCategories = useMemo(() => {
    const standardCategories = ['Days', 'Afternoons', 'Midnights', 'Double', 'Overtime', 'Off'];
    const existingCategories = shiftCodes ? [...new Set(shiftCodes.map(code => code.category))] : [];
    
    // Combine and deduplicate, maintaining order preference
    const allCategories = [...standardCategories];
    existingCategories.forEach(category => {
      if (!allCategories.includes(category)) {
        allCategories.push(category);
      }
    });
    
    return allCategories;
  }, [shiftCodes]);

  // Helper function to calculate hours between two times (with lunch deduction)
  const calculateHours = (beginTime: string, endTime: string, deductLunch: boolean = true): number => {
    if (!beginTime || !endTime || beginTime === '????' || endTime === '????') {
      return 0;
    }
    
    const [beginHour, beginMin] = beginTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    let beginMinutes = beginHour * 60 + beginMin;
    let endMinutes = endHour * 60 + endMin;
    
    // Handle overnight shifts (end time is next day)
    if (endMinutes <= beginMinutes) {
      endMinutes += 24 * 60; // Add 24 hours in minutes
    }
    
    const diffMinutes = endMinutes - beginMinutes;
    
    // Calculate exact hours (no rounding needed - exact calculation)
    // Convert minutes to hours with 2 decimal precision
    let totalHours = parseFloat((diffMinutes / 60).toFixed(2));
    
    // Deduct 0.5 hours for lunch if shift is long enough (typically 6+ hours)
    if (deductLunch && totalHours >= 6) {
      totalHours -= 0.5;
    }
    
    return totalHours;
  };

  // Helper function to translate category names
  const getCategoryTranslation = (category: string) => {
    switch (category) {
      case 'Days': return t('admin.days');
      case 'Afternoons': return t('admin.afternoons');
      case 'Midnights': return t('admin.midnights');
      case 'Double': return t('admin.double');
      case 'Overtime': return t('admin.overtime');
      case 'Off': return t('admin.off');
      case 'UNKNOWN': return t('admin.unknownNeedsConfig');
      default: return category;
    }
  };

  // Helper function to get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Days':
        return Sun;
      case 'Afternoons':
        return Sunset;
      case 'Midnights':
        return Moon;
      case 'Double':
        return Calendar;
      case 'Overtime':
        return Clock;
      case 'Off':
        return Coffee;
      case 'UNKNOWN':
        return AlertCircle;
      default:
        return Tag;
    }
  };

  // Helper function to get category chip color classes
  const getCategoryColorClasses = (category: string) => {
    switch (category) {
      case 'Days':
        // Sunny yellow/gold for day shifts
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
      case 'Afternoons':
        // Orange/sunset colors for afternoon shifts
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700';
      case 'Midnights':
        // Dark blue/purple for midnight shifts
        return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700';
      case 'Double':
        // Red for double shifts (long/intense)
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700';
      case 'Overtime':
        // Purple for overtime
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700';
      case 'Off':
        // Gray for days off
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600';
      case 'UNKNOWN':
        // Amber/warning color for unknown
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700';
      default:
        // Default blue for any other categories
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700';
    }
  };

  // Filter and sort the shift codes
  const filteredAndSortedShiftCodes = useMemo(() => {
    if (!shiftCodes) return [];
    
    // Filter by search term
    const filtered = shiftCodes.filter(code => {
      const searchLower = searchTerm.toLowerCase();
      return (
        code.code.toLowerCase().includes(searchLower) ||
        code.category.toLowerCase().includes(searchLower) ||
        code.beginTime.toLowerCase().includes(searchLower) ||
        code.endTime.toLowerCase().includes(searchLower) ||
        (code.hoursLength && code.hoursLength.toString().includes(searchLower))
      );
    });
    
    // Sort the filtered results
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      // Handle special cases
      if (sortField === 'category') {
        // Sort categories in logical order
        const categoryOrder = ['Days', 'Afternoons', 'Midnights', 'Double', 'Overtime', 'Off', 'UNKNOWN'];
        aValue = categoryOrder.indexOf(a.category) !== -1 ? categoryOrder.indexOf(a.category) : 999;
        bValue = categoryOrder.indexOf(b.category) !== -1 ? categoryOrder.indexOf(b.category) : 999;
      }
      
      // Handle numeric comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      // Handle boolean comparison
      if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        return sortDirection === 'asc' 
          ? (aValue === bValue ? 0 : aValue ? -1 : 1)
          : (aValue === bValue ? 0 : aValue ? 1 : -1);
      }
      
      return 0;
    });
    
    // Secondary sort by code if primary sort is category
    if (sortField === 'category') {
      sorted.sort((a, b) => {
        if (a.category === b.category) {
          return a.code.localeCompare(b.code);
        }
        return 0;
      });
    }
    
    return sorted;
  }, [shiftCodes, searchTerm, sortField, sortDirection]);

  // Pagination calculations
  const totalItems = filteredAndSortedShiftCodes.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedShiftCodes = filteredAndSortedShiftCodes.slice(startIndex, endIndex);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <span className="ml-1 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">
          <ChevronUp className="w-3 h-3 -mb-0.5" />
          <ChevronDown className="w-3 h-3 -mt-0.5" />
        </span>
      );
    }
    return (
      <span className="ml-1">
        {sortDirection === 'asc' ? (
          <ChevronUp className="w-3 h-3 text-blue-600 dark:text-blue-400" />
        ) : (
          <ChevronDown className="w-3 h-3 text-blue-600 dark:text-blue-400" />
        )}
      </span>
    );
  };

  const createMutation = useMutation({
    mutationFn: async (data: Partial<ShiftCode>) => {
      const res = await fetch('/api/shift-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create shift code');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftCodes'] });
      setIsModalOpen(false);
      setEditingCode(null);
      toast.success(t('admin.shiftCodeCreated'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<ShiftCode> & { id: string }) => {
      const res = await fetch(`/api/shift-codes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update shift code');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftCodes'] });
      setIsModalOpen(false);
      setEditingCode(null);
      toast.success(t('admin.shiftCodeUpdated'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/shift-codes/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete shift code');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftCodes'] });
      toast.success(t('admin.shiftCodeDeleted'));
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      code: formData.get('code') as string,
      beginTime: formData.get('beginTime') as string,
      endTime: formData.get('endTime') as string,
      category: formData.get('category') as string,
      hoursLength: parseFloat(formData.get('hoursLength') as string),
      isActive: formData.get('isActive') === 'true',
    };

    if (editingCode) {
      updateMutation.mutate({ id: editingCode.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openModal = (code?: ShiftCode) => {
    setEditingCode(code || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCode(null);
  };

  const handleExport = () => {
    if (!shiftCodes || shiftCodes.length === 0) {
      toast.error(t('admin.noShiftCodesToExport'));
      return;
    }

    const csvHeaders = ['Code', 'Category', 'Begin Time', 'End Time', 'Hours Length', 'Active'];
    const csvRows = filteredAndSortedShiftCodes.map(code => [
      code.code,
      code.category,
      code.beginTime,
      code.endTime,
      code.hoursLength,
      code.isActive ? 'true' : 'false'
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `shift-codes-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(t('admin.exportedShiftCodes', { count: String(filteredAndSortedShiftCodes.length) }));
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error(t('admin.selectCSVFile'));
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error(t('admin.csvMustContainData'));
      }

      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
      const expectedHeaders = ['code', 'category', 'begin time', 'end time', 'hours length', 'active'];
      
      const headerMap: { [key: string]: number } = {};
      expectedHeaders.forEach(expectedHeader => {
        const index = headers.findIndex(h => h === expectedHeader || h.replace(/\s+/g, '') === expectedHeader.replace(/\s+/g, ''));
        if (index === -1) {
          throw new Error(t('admin.missingColumn', { column: expectedHeader }));
        }
        headerMap[expectedHeader] = index;
      });

      const shiftCodesToImport = [];
      const errors = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
        
        try {
          const shiftCode = {
            code: values[headerMap['code']],
            category: values[headerMap['category']],
            beginTime: values[headerMap['begin time']],
            endTime: values[headerMap['end time']],
            hoursLength: parseFloat(values[headerMap['hours length']]) || 0,
            isActive: values[headerMap['active']].toLowerCase() === 'true'
          };

          if (!shiftCode.code || !shiftCode.category) {
            errors.push(t('admin.rowError', { row: String(i + 1), message: t('admin.codeAndCategoryRequired') }));
            continue;
          }

          shiftCodesToImport.push(shiftCode);
        } catch (error) {
          errors.push(t('admin.rowError', { row: String(i + 1), message: String(error) }));
        }
      }

      if (shiftCodesToImport.length === 0) {
        throw new Error(t('admin.noValidShiftCodes'));
      }

      // Import the shift codes
      const res = await fetch('/api/shift-codes/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shiftCodes: shiftCodesToImport }),
      });

      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || t('admin.importFailed'));
      }

      queryClient.invalidateQueries({ queryKey: ['shiftCodes'] });
      
      const { created, updated, unchanged, totalChanges } = result;
      let message = '';
      
      if (totalChanges === 0) {
        message = t('admin.noChanges', { unchanged });
        toast(message, {
          icon: 'ℹ️',
          style: {
            background: '#3b82f6',
            color: 'white',
          },
        });
      } else {
        const parts = [];
        if (created > 0) parts.push(t('admin.created', { count: created }));
        if (updated > 0) parts.push(t('admin.updated', { count: updated }));
        if (unchanged > 0) parts.push(t('admin.unchanged', { count: unchanged }));
        message = `${t('admin.importCompleted')}: ${parts.join(', ')}`;
        toast.success(message);
      }
      
      setImportResult({
        success: true,
        message,
        details: { created, updated, unchanged, totalChanges, errors: [...errors, ...(result.errors || [])] }
      });
      
    } catch (error: any) {
      setImportResult({
        success: false,
        message: error.message || t('admin.importFailed'),
        details: error
      });
      toast.error(error.message || t('admin.importFailed'));
    } finally {
      setImporting(false);
      // Reset file input
      e.target.value = '';
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('admin.shiftCodesManagement')}</h2>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
          >
            <Download className="w-4 h-4" />
            {t('admin.exportCSV')}
          </button>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 cursor-pointer">
            <Upload className="w-4 h-4" />
            {t('admin.importCSV')}
            <input
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="hidden"
              disabled={importing}
            />
          </label>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            {t('admin.addShiftCode')}
          </button>
        </div>
      </div>

      {/* Import Status */}
      {importing && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-blue-700 dark:text-blue-300 font-medium">{t('admin.importingShiftCodes')}</span>
          </div>
        </div>
      )}
      
      {importResult && (
        <div className={`border rounded-xl p-4 ${
          importResult.success 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-start gap-2">
            <div className={`mt-0.5 ${
              importResult.success ? 'text-green-500' : 'text-red-500'
            }`}>
              {importResult.success ? (
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
              <p className={`font-medium ${
                importResult.success ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'
              }`}>
                {importResult.message}
              </p>
              {importResult.success && importResult.details && (
                <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  {importResult.details.totalChanges > 0 ? (
                    <div>
                      {importResult.details.created > 0 && (
                        <p>✓ {t('admin.newShiftCodesCreated', { count: importResult.details.created })}</p>
                      )}
                      {importResult.details.updated > 0 && (
                        <p>✓ {t('admin.existingShiftCodesUpdated', { count: importResult.details.updated })}</p>
                      )}
                      {importResult.details.unchanged > 0 && (
                        <p>• {t('admin.shiftCodesAlreadyCurrent', { count: importResult.details.unchanged })}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-blue-700 dark:text-blue-300">ℹ {t('admin.allShiftCodesMatched')}</p>
                  )}
                </div>
              )}
              {importResult.details?.errors && importResult.details.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">{t('admin.warningsErrors')}:</p>
                  <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300">
                    {importResult.details.errors.slice(0, 5).map((error: string, idx: number) => (
                      <li key={idx}>{error}</li>
                    ))}
                    {importResult.details.errors.length > 5 && (
                      <li>{t('admin.andMore', { count: String(importResult.details.errors.length - 5) })}</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            <button
              onClick={() => setImportResult(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* CSV Format Help */}
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('admin.csvImportFormat')}</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {t('admin.requiredColumns')}: <strong>Code, Category, Begin Time, End Time, Hours Length, Active</strong>
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {t('admin.example')}: "D1", "Days", "07:00", "19:00", "12", "true"
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={t('admin.searchShiftCodes')}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('admin.showingResults', { showing: String(paginatedShiftCodes.length), total: String(totalItems) })}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {t('admin.itemsPerPage', { count: String(itemsPerPage) })}
          </p>
        </div>
      </div>

      {/* Top Pagination */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between sm:px-6 rounded-t-xl shadow border border-gray-200 dark:border-gray-700">
          <div className="flex-1 flex justify-between sm:hidden">
            {/* Mobile pagination */}
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.previous')}
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
              {t('common.page')} {currentPage} {t('common.of')} {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.next')}
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {t('common.showing')} <span className="font-medium">{startIndex + 1}</span> {t('common.to')}{' '}
                <span className="font-medium">{Math.min(endIndex, totalItems)}</span> {t('common.of')}{' '}
                <span className="font-medium">{totalItems}</span> {t('common.results')}
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                {/* First page button */}
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">{t('common.firstPage')}</span>
                  <ChevronsLeft className="w-5 h-5" aria-hidden="true" />
                </button>
                {/* Previous page button */}
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">{t('common.previous')}</span>
                  <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                </button>

                {/* Page numbers */}
                {(() => {
                  const maxVisiblePages = 5;
                  const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                  const pages = [];

                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          i === currentPage
                            ? 'z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-300'
                            : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }

                  return pages;
                })()}

                {/* Next page button */}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">{t('common.next')}</span>
                  <ChevronRight className="w-5 h-5" aria-hidden="true" />
                </button>
                {/* Last page button */}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">{t('common.lastPage')}</span>
                  <ChevronsRight className="w-5 h-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      <div className={`bg-white dark:bg-gray-800 shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 ${
        totalPages > 1 ? 'rounded-b-xl border-t-0' : 'rounded-xl'
      }`}>
        <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                onClick={() => handleSort('code')}
              >
                <div className="flex items-center">
                  {t('admin.code')}
                  <SortIndicator field="code" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center">
                  {t('admin.category')}
                  <SortIndicator field="category" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                onClick={() => handleSort('beginTime')}
              >
                <div className="flex items-center">
                  {t('admin.time')}
                  <SortIndicator field="beginTime" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                onClick={() => handleSort('hoursLength')}
              >
                <div className="flex items-center">
                  {t('admin.paidHours')}
                  <SortIndicator field="hoursLength" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                onClick={() => handleSort('isActive')}
              >
                <div className="flex items-center">
                  {t('admin.status')}
                  <SortIndicator field="isActive" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t('admin.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedShiftCodes?.map((code) => (
              <tr key={code.id} className={code.beginTime === '????' ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                  <div className="flex items-center gap-2">
                    {code.code}
                    {code.beginTime === '????' && (
                      <span className="flex items-center gap-1 px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded-full font-medium">
                        <AlertTriangle className="w-3 h-3" />
                        {t('admin.needsConfig')}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getCategoryColorClasses(code.category)}`}>
                    {(() => {
                      const Icon = getCategoryIcon(code.category);
                      return <Icon className="w-3 h-3" />;
                    })()}
                    {getCategoryTranslation(code.category)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {code.beginTime === '????' ? (
                    <span className="text-yellow-600 dark:text-yellow-400 font-medium">{t('admin.undefined')}</span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {code.beginTime} - {code.endTime}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {code.hoursLength > 0 ? `${code.hoursLength}h` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    code.isActive 
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                      : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                  }`}>
                    {code.isActive ? t('admin.active') : t('admin.inactive')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(code)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 hover:scale-105"
                      title={t('admin.editShiftCode')}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(t('admin.confirmDeleteShiftCode'))) {
                          deleteMutation.mutate(code.id);
                        }
                      }}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 hover:scale-105"
                      title={t('admin.deleteShiftCode')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6 rounded-b-xl">
          <div className="flex-1 flex justify-between sm:hidden">
            {/* Mobile pagination */}
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.previous')}
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
              {t('common.page')} {currentPage} {t('common.of')} {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.next')}
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {t('common.showing')} <span className="font-medium">{startIndex + 1}</span> {t('common.to')}{' '}
                <span className="font-medium">{Math.min(endIndex, totalItems)}</span> {t('common.of')}{' '}
                <span className="font-medium">{totalItems}</span> {t('common.results')}
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                {/* First page button */}
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">{t('common.firstPage')}</span>
                  <ChevronsLeft className="w-5 h-5" aria-hidden="true" />
                </button>
                {/* Previous page button */}
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">{t('common.previous')}</span>
                  <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                </button>

                {/* Page numbers */}
                {(() => {
                  const maxVisiblePages = 5;
                  const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                  const pages = [];

                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          i === currentPage
                            ? 'z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-300'
                            : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }

                  return pages;
                })()}

                {/* Next page button */}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">{t('common.next')}</span>
                  <ChevronRight className="w-5 h-5" aria-hidden="true" />
                </button>
                {/* Last page button */}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">{t('common.lastPage')}</span>
                  <ChevronsRight className="w-5 h-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {editingCode ? t('admin.editShiftCode') : t('admin.addNewShiftCode')}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('admin.code')}</label>
                <input
                  name="code"
                  type="text"
                  defaultValue={editingCode?.code || ''}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('admin.category')}</label>
                <select
                  name="category"
                  defaultValue={editingCode?.category || ''}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">{t('admin.selectCategory')}</option>
                  {availableCategories.map(category => (
                    <option key={category} value={category} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                      {getCategoryTranslation(category)}
                    </option>
                  ))}
                  {editingCode?.category === 'UNKNOWN' && (
                    <option value="UNKNOWN" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">{t('admin.unknownNeedsConfig')}</option>
                  )}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('admin.beginTime')}</label>
                  <input
                    name="beginTime"
                    type="time"
                    defaultValue={editingCode?.beginTime || ''}
                    onChange={(e) => setFormTimes(prev => ({ ...prev, beginTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('admin.endTime')}</label>
                  <input
                    name="endTime"
                    type="time"
                    defaultValue={editingCode?.endTime || ''}
                    onChange={(e) => setFormTimes(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('admin.paidHoursLength')}</label>
                <div className="space-y-1">
                  <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="font-medium">
                          {formTimes.beginTime && formTimes.endTime 
                            ? `${calculateHours(formTimes.beginTime, formTimes.endTime)}h`
                            : editingCode?.beginTime && editingCode?.endTime
                            ? `${calculateHours(editingCode.beginTime, editingCode.endTime)}h`
                            : t('admin.autoCalculated')
                          }
                        </span>
                      </div>
                      {((formTimes.beginTime && formTimes.endTime && calculateHours(formTimes.beginTime, formTimes.endTime, false) >= 6) ||
                        (editingCode?.beginTime && editingCode?.endTime && calculateHours(editingCode.beginTime, editingCode.endTime, false) >= 6)) && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({calculateHours(formTimes.beginTime || editingCode?.beginTime || '', formTimes.endTime || editingCode?.endTime || '', false)}h - 0.5h {t('admin.lunch')})
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 px-3">{t('admin.lunchDeductionNote')}</p>
                </div>
                <input
                  name="hoursLength"
                  type="hidden"
                  value={formTimes.beginTime && formTimes.endTime 
                    ? calculateHours(formTimes.beginTime, formTimes.endTime)
                    : editingCode?.beginTime && editingCode?.endTime
                    ? calculateHours(editingCode.beginTime, editingCode.endTime)
                    : 0
                  }
                />
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    name="isActive"
                    type="checkbox"
                    value="true"
                    defaultChecked={editingCode?.isActive ?? true}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-800 dark:text-gray-200">{t('common.active')}</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {editingCode ? t('admin.updating') : t('admin.creating')}
                    </div>
                  ) : (
                    editingCode ? t('admin.update') : t('admin.create')
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