import { useState, useMemo } from 'react';

interface SearchAndFilterResult<T> {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredItems: T[];
  resultCount: number;
  clearSearch: () => void;
  hasActiveFilters: boolean;
}

type SearchFunction<T> = (item: T, searchTerm: string) => boolean;
type FilterFunction<T> = (item: T) => boolean;

export function useSearchAndFilter<T>(
  items: T[],
  searchFunction: SearchFunction<T>,
  filterFunctions: FilterFunction<T>[] = []
): SearchAndFilterResult<T> {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    let result = items;

    // Apply search
    if (searchTerm) {
      result = result.filter(item => 
        searchFunction(item, searchTerm.toLowerCase())
      );
    }

    // Apply all filter functions
    filterFunctions.forEach(filterFn => {
      result = result.filter(filterFn);
    });

    return result;
  }, [items, searchTerm, filterFunctions]);

  const clearSearch = () => setSearchTerm('');

  return {
    searchTerm,
    setSearchTerm,
    filteredItems,
    resultCount: filteredItems.length,
    clearSearch,
    hasActiveFilters: searchTerm !== '' || filterFunctions.length > 0,
  };
}

// Common search function for officers
export function createOfficerSearchFunction(
  nameField: string = 'name',
  badgeField: string = 'badge'
) {
  return (officer: any, searchTerm: string) => {
    const name = officer[nameField]?.toLowerCase() || '';
    const badge = officer[badgeField]?.toLowerCase() || '';
    return name.includes(searchTerm) || badge.includes(searchTerm);
  };
}