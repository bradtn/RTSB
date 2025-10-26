import { useState, useCallback } from 'react';
import { usePersistentState } from './usePersistentState';

interface UIState {
  isFavoritesExpanded: boolean;
  favoritesSearchTerm: string;
  isFiltersExpanded: boolean;
}

/**
 * Custom hook for managing UI state (expandable sections, etc.) with persistence
 */
export const useBidLineUI = () => {
  // Use persistent state for UI preferences
  const [uiState, setUiState, clearPersistedUI] = usePersistentState<UIState>(
    {
      isFavoritesExpanded: false,
      favoritesSearchTerm: '',
      isFiltersExpanded: false,
    },
    {
      storageKey: 'bidlines-ui-state-v1',
      debounceMs: 300,
    }
  );

  // Individual setters for UI state
  const setIsFavoritesExpanded = useCallback((value: boolean) => {
    setUiState(prev => ({ ...prev, isFavoritesExpanded: value }));
  }, [setUiState]);

  const setFavoritesSearchTerm = useCallback((value: string) => {
    setUiState(prev => ({ ...prev, favoritesSearchTerm: value }));
  }, [setUiState]);

  const setIsFiltersExpanded = useCallback((value: boolean) => {
    setUiState(prev => ({ ...prev, isFiltersExpanded: value }));
  }, [setUiState]);

  return {
    isFavoritesExpanded: uiState.isFavoritesExpanded,
    setIsFavoritesExpanded,
    favoritesSearchTerm: uiState.favoritesSearchTerm,
    setFavoritesSearchTerm,
    isFiltersExpanded: uiState.isFiltersExpanded,
    setIsFiltersExpanded,
    clearPersistedUI,
  };
};