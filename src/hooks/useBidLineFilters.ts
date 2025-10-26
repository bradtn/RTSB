import { useState, useEffect, useCallback } from 'react';
import { CategoryFilterMode, SortByOption, BidLineStatus } from '@/types/BidLinesClient.types';
import { usePersistentState } from './usePersistentState';

interface FilterState {
  selectedOperation: string;
  searchTerm: string;
  selectedCategories: string[];
  categoryFilterMode: CategoryFilterMode;
  selectedStatus: BidLineStatus;
  sortBy: SortByOption;
  expandedOperations: string[];
  operationSearchTerms: Record<string, string>;
}

/**
 * Custom hook for managing bid line filter state with persistence
 */
export const useBidLineFilters = () => {
  // Use persistent state for filters
  const [filterState, setFilterState, clearPersistedFilters] = usePersistentState<FilterState>(
    {
      selectedOperation: 'all',
      searchTerm: '',
      selectedCategories: [],
      categoryFilterMode: 'OR' as CategoryFilterMode,
      selectedStatus: 'all' as BidLineStatus,
      sortBy: 'default' as SortByOption,
      expandedOperations: [],
      operationSearchTerms: {},
    },
    {
      storageKey: 'bidlines-filter-state-v1',
      debounceMs: 300,
    }
  );

  // Cache unfiltered counts (not persisted as this is derived from server data)
  const [unfilteredCounts, setUnfilteredCounts] = useState<{[operation: string]: {available: number, taken: number, blackedOut: number, total: number}}>({});

  // Convert expanded operations array to Set for backward compatibility
  const expandedOperations = new Set(filterState.expandedOperations);
  const setExpandedOperations = useCallback((value: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    setFilterState(prev => {
      const newSet = typeof value === 'function' ? value(new Set(prev.expandedOperations)) : value;
      return {
        ...prev,
        expandedOperations: Array.from(newSet),
      };
    });
  }, [setFilterState]);

  // Individual setters for each filter property
  const setSelectedOperation = useCallback((value: string) => {
    setFilterState(prev => ({ ...prev, selectedOperation: value }));
  }, [setFilterState]);

  const setSearchTerm = useCallback((value: string) => {
    setFilterState(prev => ({ ...prev, searchTerm: value }));
  }, [setFilterState]);

  const setSelectedCategories = useCallback((value: string[]) => {
    setFilterState(prev => ({ ...prev, selectedCategories: value }));
  }, [setFilterState]);

  const setCategoryFilterMode = useCallback((value: CategoryFilterMode) => {
    setFilterState(prev => ({ ...prev, categoryFilterMode: value }));
  }, [setFilterState]);

  const setSelectedStatus = useCallback((value: BidLineStatus) => {
    setFilterState(prev => ({ ...prev, selectedStatus: value }));
  }, [setFilterState]);

  const setSortBy = useCallback((value: SortByOption) => {
    setFilterState(prev => ({ ...prev, sortBy: value }));
  }, [setFilterState]);

  const setOperationSearchTerms = useCallback((value: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => {
    setFilterState(prev => ({ 
      ...prev, 
      operationSearchTerms: typeof value === 'function' ? value(prev.operationSearchTerms) : value 
    }));
  }, [setFilterState]);

  /**
   * Clear all filters and reset to default state
   */
  const clearFilters = useCallback(() => {
    setFilterState(prev => ({
      ...prev,
      searchTerm: '',
      selectedCategories: [],
      selectedStatus: 'all' as BidLineStatus,
      sortBy: 'default' as SortByOption,
      operationSearchTerms: {},
    }));
  }, [setFilterState]);

  /**
   * Clear all persisted state (filters and expanded operations)
   */
  const clearAllPersistedState = useCallback(() => {
    clearPersistedFilters();
  }, [clearPersistedFilters]);

  return {
    // Filter state
    selectedOperation: filterState.selectedOperation,
    setSelectedOperation,
    searchTerm: filterState.searchTerm,
    setSearchTerm,
    selectedCategories: filterState.selectedCategories,
    setSelectedCategories,
    categoryFilterMode: filterState.categoryFilterMode,
    setCategoryFilterMode,
    selectedStatus: filterState.selectedStatus,
    setSelectedStatus,
    sortBy: filterState.sortBy,
    setSortBy,
    unfilteredCounts,
    setUnfilteredCounts,
    expandedOperations,
    setExpandedOperations,
    operationSearchTerms: filterState.operationSearchTerms,
    setOperationSearchTerms,
    
    // Actions
    clearFilters,
    clearAllPersistedState,
  };
};