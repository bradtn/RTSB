import React from 'react';
import { Pagination } from './Pagination';

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (value: any, item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface TableAction<T> {
  label: string;
  onClick: (item: T) => void;
  className?: string;
  icon?: React.ReactNode;
  disabled?: (item: T) => boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
}

interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  actions?: TableAction<T>[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  
  // Pagination
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    startIndex: number;
    endIndex: number;
    onPageChange: (page: number) => void;
    onNext: () => void;
    onPrevious: () => void;
    pageNumbers: number[];
    itemsPerPage: number;
  };
  
  // Selection
  selectable?: boolean;
  selectedItems?: T[];
  onSelectionChange?: (selectedItems: T[]) => void;
  itemKey?: keyof T | ((item: T) => string);
  
  // Row styling
  rowClassName?: (item: T, index: number) => string;
  highlightCondition?: (item: T) => boolean;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  actions,
  loading = false,
  emptyMessage = 'No data available',
  className = '',
  pagination,
  selectable = false,
  selectedItems = [],
  onSelectionChange,
  itemKey = 'id',
  rowClassName,
  highlightCondition,
}: DataTableProps<T>) {
  
  const getItemKey = (item: T): string => {
    if (typeof itemKey === 'function') {
      return itemKey(item);
    }
    return String(item[itemKey]);
  };

  const isSelected = (item: T): boolean => {
    const key = getItemKey(item);
    return selectedItems.some(selected => getItemKey(selected) === key);
  };

  const handleSelectItem = (item: T) => {
    if (!onSelectionChange) return;
    
    const key = getItemKey(item);
    const isCurrentlySelected = isSelected(item);
    
    if (isCurrentlySelected) {
      onSelectionChange(selectedItems.filter(selected => getItemKey(selected) !== key));
    } else {
      onSelectionChange([...selectedItems, item]);
    }
  };

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    
    if (selectedItems.length === data.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange([...data]);
    }
  };

  const getActionButtonClasses = (variant: string = 'primary') => {
    const baseClasses = 'px-2 py-1 text-xs rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
    
    switch (variant) {
      case 'danger':
        return `${baseClasses} bg-red-600 text-white hover:bg-red-700`;
      case 'success':
        return `${baseClasses} bg-green-600 text-white hover:bg-green-700`;
      case 'secondary':
        return `${baseClasses} bg-gray-600 text-white hover:bg-gray-700`;
      default:
        return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700`;
    }
  };

  const getCellValue = (item: T, column: TableColumn<T>) => {
    if (typeof column.key === 'string' && column.key.includes('.')) {
      // Handle nested keys like 'user.name'
      return column.key.split('.').reduce((obj, key) => obj?.[key], item);
    }
    return item[column.key as keyof T];
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
        <div className="flex flex-col items-center justify-center p-8">
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          <p className="mt-2 text-gray-700 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      {data.length === 0 ? (
        <div className="p-8 text-center text-gray-700 dark:text-gray-400">
          {emptyMessage}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {selectable && (
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === data.length && data.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                  )}
                  {columns.map((column, index) => (
                    <th
                      key={String(column.key) + index}
                      className={`px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wider ${column.className || ''}`}
                    >
                      {column.header}
                    </th>
                  ))}
                  {actions && actions.length > 0 && (
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data.map((item, index) => {
                  const isHighlighted = highlightCondition?.(item) || false;
                  const customRowClass = rowClassName?.(item, index) || '';
                  const rowClass = `${isHighlighted ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'} ${customRowClass}`;
                  
                  return (
                    <tr key={getItemKey(item)} className={rowClass}>
                      {selectable && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected(item)}
                            onChange={() => handleSelectItem(item)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                      )}
                      {columns.map((column, colIndex) => (
                        <td
                          key={String(column.key) + colIndex}
                          className={`px-4 py-3 text-sm ${column.className || ''}`}
                        >
                          {column.render 
                            ? column.render(getCellValue(item, column), item, index)
                            : String(getCellValue(item, column) || '')
                          }
                        </td>
                      ))}
                      {actions && actions.length > 0 && (
                        <td className="px-4 py-3 text-right text-sm">
                          <div className="flex justify-end gap-2">
                            {actions.map((action, actionIndex) => (
                              <button
                                key={actionIndex}
                                onClick={() => action.onClick(item)}
                                disabled={action.disabled?.(item)}
                                className={getActionButtonClasses(action.variant)}
                                title={action.label}
                              >
                                {action.icon && <span className="mr-1">{action.icon}</span>}
                                {action.label}
                              </button>
                            ))}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {pagination && pagination.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <Pagination {...pagination} />
            </div>
          )}
        </>
      )}
    </div>
  );
}