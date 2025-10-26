import { useState, useMemo, useEffect } from 'react';

interface PaginationResult<T> {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  paginatedItems: T[];
  setCurrentPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  pageNumbers: number[];
}

export function usePagination<T>(
  items: T[],
  itemsPerPage: number = 20,
  deps: any[] = []
): PaginationResult<T> {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to first page when dependencies change
  useEffect(() => {
    setCurrentPage(1);
  }, deps);

  const result = useMemo(() => {
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const paginatedItems = items.slice(startIndex, endIndex);

    // Generate page numbers for pagination UI
    const pageNumbers: number[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pageNumbers.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pageNumbers.push(i);
        }
      }
    }

    return {
      currentPage,
      totalPages,
      totalItems,
      startIndex,
      endIndex,
      paginatedItems,
      canGoNext: currentPage < totalPages,
      canGoPrevious: currentPage > 1,
      pageNumbers,
    };
  }, [items, currentPage, itemsPerPage]);

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, result.totalPages));
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const goToFirstPage = () => {
    setCurrentPage(1);
  };

  const goToLastPage = () => {
    setCurrentPage(result.totalPages);
  };

  return {
    ...result,
    setCurrentPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
  };
}