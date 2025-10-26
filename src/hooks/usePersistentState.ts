import { useState, useEffect, useRef, useCallback } from 'react';

interface PersistentStateOptions {
  debounceMs?: number;
  storageKey: string;
}

/**
 * Custom hook that persists state to localStorage with debouncing
 * Automatically saves state changes and restores on mount
 */
export function usePersistentState<T>(
  initialValue: T,
  options: PersistentStateOptions
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const { storageKey, debounceMs = 500 } = options;
  const [state, setState] = useState<T>(initialValue);
  const [isInitialized, setIsInitialized] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Load saved state on mount (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        setState(parsed);
      }
      setIsInitialized(true);
    } catch (error) {
      console.error(`Failed to load state from localStorage for key "${storageKey}":`, error);
      setIsInitialized(true);
    }
  }, [storageKey]);

  // Save state to localStorage with debouncing
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout to save state
    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch (error) {
        console.error(`Failed to save state to localStorage for key "${storageKey}":`, error);
      }
    }, debounceMs);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [state, storageKey, debounceMs, isInitialized]);

  // Clear persisted state
  const clearPersistedState = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.error(`Failed to clear localStorage for key "${storageKey}":`, error);
      }
    }
    setState(initialValue);
  }, [storageKey, initialValue]);

  return [state, setState, clearPersistedState];
}

/**
 * Hook to persist scroll position
 */
export function useScrollPersistence(storageKey: string = 'bidlines-scroll-position', isContentReady: boolean = true) {
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const restoreTimeoutRef = useRef<NodeJS.Timeout>();
  const [lastScrollPosition, setLastScrollPosition] = useState(0);
  const [hasRestored, setHasRestored] = useState(false);

  // Restore scroll position once content is ready
  useEffect(() => {
    if (typeof window === 'undefined' || hasRestored || !isContentReady) return;

    const savedPosition = localStorage.getItem(storageKey);
    if (savedPosition) {
      const position = parseInt(savedPosition, 10);
      if (!isNaN(position) && position > 0) {
        let attempts = 0;
        const maxAttempts = 10;
        
        const tryScroll = () => {
          attempts++;
          
          // Check if page has enough height to scroll
          const pageHeight = document.documentElement.scrollHeight;
          const viewHeight = window.innerHeight;
          
          if (pageHeight > viewHeight + position || attempts >= maxAttempts) {
            // Page is tall enough or we've tried enough times
            window.scrollTo(0, position);
            
            // Verify scroll worked
            const actualScroll = window.scrollY || window.pageYOffset;
            if (actualScroll > 0) {
              setLastScrollPosition(actualScroll);
              setHasRestored(true);
              console.log(`Scroll restored to ${actualScroll}px (target: ${position}px) after ${attempts} attempts`);
            } else if (attempts < maxAttempts) {
              // Try again if scroll didn't work
              restoreTimeoutRef.current = setTimeout(tryScroll, 200);
            }
          } else {
            // Page not tall enough yet, try again
            restoreTimeoutRef.current = setTimeout(tryScroll, 200);
          }
        };
        
        // Start trying after initial delay
        restoreTimeoutRef.current = setTimeout(tryScroll, 300);
      }
    } else {
      setHasRestored(true); // No saved position
    }

    return () => {
      if (restoreTimeoutRef.current) {
        clearTimeout(restoreTimeoutRef.current);
      }
    };
  }, [storageKey, hasRestored, isContentReady]);

  // Save scroll position with debouncing
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        const scrollY = window.scrollY;
        localStorage.setItem(storageKey, scrollY.toString());
        setLastScrollPosition(scrollY);
      }, 200);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [storageKey]);

  const clearScrollPosition = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
      setLastScrollPosition(0);
    }
  }, [storageKey]);

  return { lastScrollPosition, clearScrollPosition };
}

/**
 * Combined hook for persisting bid lines page state
 */
export interface BidLinesPageState {
  expandedOperations: string[];
  selectedOperation: string;
  searchTerm: string;
  selectedCategories: string[];
  categoryFilterMode: 'ANY' | 'EXACT';
  selectedStatus: string;
  sortBy: string;
  isFavoritesExpanded: boolean;
  isFiltersExpanded: boolean;
  operationSearchTerms: Record<string, string>;
}

export function useBidLinesPagePersistence() {
  const STORAGE_KEY = 'bidlines-page-state';
  const STORAGE_VERSION = 'v1';
  const FULL_KEY = `${STORAGE_KEY}-${STORAGE_VERSION}`;

  const defaultState: BidLinesPageState = {
    expandedOperations: [],
    selectedOperation: 'all',
    searchTerm: '',
    selectedCategories: [],
    categoryFilterMode: 'ANY',
    selectedStatus: 'all',
    sortBy: 'lineNumber',
    isFavoritesExpanded: false,
    isFiltersExpanded: false,
    operationSearchTerms: {},
  };

  const [pageState, setPageState, clearPageState] = usePersistentState<BidLinesPageState>(
    defaultState,
    { storageKey: FULL_KEY, debounceMs: 300 }
  );

  // Individual setters that update the entire state
  const updatePageState = useCallback((updates: Partial<BidLinesPageState>) => {
    setPageState(prev => ({ ...prev, ...updates }));
  }, [setPageState]);

  // Scroll persistence
  const { lastScrollPosition, clearScrollPosition } = useScrollPersistence();

  // Clear all persisted state
  const clearAll = useCallback(() => {
    clearPageState();
    clearScrollPosition();
  }, [clearPageState, clearScrollPosition]);

  return {
    pageState,
    updatePageState,
    clearAll,
    lastScrollPosition,
  };
}