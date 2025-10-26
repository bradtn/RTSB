import React, { useMemo } from 'react';
import { SortByOption } from '@/types/BidLinesClient.types';
import { naturalSort } from '@/utils/sorting';

interface UseGroupedBidLinesProps {
  bidLines: any[];
  sortBy: SortByOption;
  dayOffMatches: Record<string, any>;
  expandedOperations: Set<string>;
  setExpandedOperations: (operations: Set<string>) => void;
  operationSearchTerms: Record<string, string>;
  selectedStatus?: string;
}

/**
 * Custom hook for managing grouped bid lines and operation controls
 */
export const useGroupedBidLines = ({
  bidLines,
  sortBy,
  dayOffMatches,
  expandedOperations,
  setExpandedOperations,
  operationSearchTerms,
  selectedStatus = 'all',
}: UseGroupedBidLinesProps) => {
  
  // Group and sort bid lines by operation
  const groupedBidLines = useMemo(() => {
    if (!bidLines) return {};
    
    const grouped: { [operationName: string]: any[] } = {};
    
    bidLines.forEach((bidLine: any) => {
      const operationName = bidLine.operation?.name || 'Unknown Operation';
      if (!grouped[operationName]) {
        grouped[operationName] = [];
      }
      grouped[operationName].push(bidLine);
    });
    
    // Sort each operation's lines based on selected sort option
    Object.keys(grouped).forEach(operationName => {
      grouped[operationName].sort((a: any, b: any) => {
        if (sortBy === 'dayOffMatch') {
          // Sort by day-off match percentage (highest first)
          const aMatch = dayOffMatches[a.id];
          const bMatch = dayOffMatches[b.id];
          
          // Lines with day-off requests come first
          if (aMatch && !bMatch) return -1;
          if (!aMatch && bMatch) return 1;
          
          // If both have matches, sort by percentage (highest first)
          if (aMatch && bMatch) {
            const diff = bMatch.matchPercentage - aMatch.matchPercentage;
            if (diff !== 0) return diff;
          }
          
          // Fall back to status then line number
          if (a.status !== b.status) {
            if (a.status === 'AVAILABLE') return -1;
            if (b.status === 'AVAILABLE') return 1;
            return a.status.localeCompare(b.status);
          }
          return naturalSort(a.lineNumber, b.lineNumber);
        } else {
          // When viewing all statuses ('all' filter), sort only by line number
          // Otherwise, sort by status first, then line number
          if (selectedStatus === 'all') {
            return naturalSort(a.lineNumber, b.lineNumber);
          } else {
            // Default sorting: status first, then line number
            if (a.status !== b.status) {
              if (a.status === 'AVAILABLE') return -1;
              if (b.status === 'AVAILABLE') return 1;
              return a.status.localeCompare(b.status);
            }
            return naturalSort(a.lineNumber, b.lineNumber);
          }
        }
      });
    });
    
    return grouped;
  }, [bidLines, sortBy, dayOffMatches, selectedStatus]);

  // Operation controls
  const toggleOperation = (operationName: string) => {
    const newSet = new Set(expandedOperations);
    if (newSet.has(operationName)) {
      newSet.delete(operationName);
    } else {
      newSet.add(operationName);
    }
    setExpandedOperations(newSet);
  };

  const expandAll = () => {
    setExpandedOperations(new Set(Object.keys(groupedBidLines)));
  };

  const collapseAll = () => {
    setExpandedOperations(new Set());
  };

  // Filter operation lines based on search terms
  const filterOperationLines = (operationBidLines: any[], operationName: string) => {
    const searchTerm = operationSearchTerms?.[operationName]?.toLowerCase() || '';
    if (!searchTerm) return operationBidLines;

    return operationBidLines.filter((line: any) => 
      line.lineNumber.toLowerCase().includes(searchTerm) ||
      line.location?.toLowerCase().includes(searchTerm) ||
      line.description?.toLowerCase().includes(searchTerm) ||
      line.takenBy?.toLowerCase().includes(searchTerm)
    );
  };

  return {
    groupedBidLines,
    toggleOperation,
    expandAll,
    collapseAll,
    filterOperationLines,
  };
};