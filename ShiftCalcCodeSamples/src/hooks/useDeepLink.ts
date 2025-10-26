// src/hooks/useDeepLink.ts
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { extractDeepLinkParams, createReturnLink } from '@/utils/deepLinking';
import { decodeState, encodeState } from '@/utils/stateEncoding';

export interface DeepLinkState {
  scheduleId?: string;
  compareId?: string;
  returnPath?: string;
  originalState?: any;
  isLoading: boolean;
}

/**
 * Hook to handle deep link navigation state
 */
export function useDeepLink(): DeepLinkState {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deepLinkState, setDeepLinkState] = useState<DeepLinkState>({
    isLoading: true
  });
  
  useEffect(() => {
    try {
      const params = extractDeepLinkParams(searchParams);
      
      setDeepLinkState({
        scheduleId: params.scheduleId,
        compareId: params.compareId,
        returnPath: params.returnPath || '/dashboard',
        originalState: params.state,
        isLoading: false
      });
    } catch (error) {
      console.error('Error processing deep link:', error);
      setDeepLinkState({
        returnPath: '/dashboard',
        isLoading: false
      });
    }
  }, [searchParams]);
  
  return deepLinkState;
}

/**
 * Hook to navigate back to the previous screen
 */
export function useReturnNavigation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const returnToSource = useCallback(() => {
    try {
      const stateParam = searchParams.get('state');
      if (stateParam) {
        const decodedState = decodeState(stateParam);
        if (decodedState?.returnPath) {
          // Validate URL before navigating
          try {
            new URL(decodedState.returnPath, window.location.origin);
            router.push(decodedState.returnPath);
            return;
          } catch (e) {
            console.error("Invalid returnPath URL:", decodedState.returnPath);
          }
        }
      }
      
      // Default fallback
      router.push('/dashboard');
    } catch (error) {
      console.error('Error navigating back:', error);
      router.push('/dashboard');
    }
  }, [router, searchParams]);
  
  return returnToSource;
}

/**
 * Hook that preserves current state when navigating to other screens
 */
export function useStatePreservation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const navigateWithState = useCallback((path: string, state: any) => {
    try {
      // Extract current state from URL
      const currentStateParam = searchParams.get('state');
      let baseState = {};
      
      if (currentStateParam) {
        const decoded = decodeState(currentStateParam);
        if (decoded) {
          baseState = decoded;
        }
      }
      
      // Merge with provided state
      const mergedState = {
        ...baseState,
        ...state,
        returnPath: window.location.pathname + window.location.search
      };
      
      // Encode for URL
      const encodedState = encodeState(mergedState);
      if (!encodedState) {
        router.push(path);
        return;
      }
      
      // Navigate with state
      router.push(`${path}?state=${encodedState}`);
    } catch (error) {
      console.error('Error in navigateWithState:', error);
      router.push(path);
    }
  }, [router, searchParams]);
  
  return { navigateWithState };
}