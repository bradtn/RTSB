import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Custom hook for managing day-off match data
 */
export const useDayOffMatches = (bidLines: any[]) => {
  const { data: session } = useSession();
  
  // Store day-off match data for all lines
  const [dayOffMatches, setDayOffMatches] = useState<Record<string, any>>(() => {
    // Try to load from localStorage on initial mount
    if (typeof window !== 'undefined' && session?.user?.id) {
      const cached = localStorage.getItem('dayOffMatches');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          // Check if cache is still valid (24 hours) and for the same user
          if (parsed.timestamp && 
              Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000 &&
              parsed.userId === session.user.id) {
            return parsed.data || {};
          }
        } catch (e) {
          console.error('Failed to parse cached day-off matches:', e);
        }
      }
    }
    return {};
  });
  
  const [isLoadingDayOffMatches, setIsLoadingDayOffMatches] = useState(false);
  const [userHasDayOffRequests, setUserHasDayOffRequests] = useState<boolean | null>(null);

  // Check once if user has day-off requests
  useEffect(() => {
    const checkUserDayOffRequests = async () => {
      if (!session?.user) {
        setUserHasDayOffRequests(false);
        return;
      }

      try {
        const res = await fetch('/api/day-off-requests/check');
        if (res.ok) {
          const data = await res.json();
          setUserHasDayOffRequests(data.hasRequests);
        } else {
          setUserHasDayOffRequests(false);
        }
      } catch (error) {
        console.error('Failed to check day-off requests:', error);
        setUserHasDayOffRequests(false);
      }
    };

    checkUserDayOffRequests();
  }, [session?.user]);

  // Fetch day-off match data for all bid lines (only if user has day-off requests)
  useEffect(() => {
    // Skip if we haven't checked yet whether user has day-off requests
    if (userHasDayOffRequests === null) {
      return;
    }
    
    // Skip if user doesn't have day-off requests
    if (userHasDayOffRequests === false) {
      return;
    }
    
    // Skip if no bidLines or session
    if (!bidLines || bidLines.length === 0 || !session?.user) {
      return;
    }
    
    // Skip if we already have cached data (it was loaded from localStorage)
    if (Object.keys(dayOffMatches).length > 0) {
      return;
    }
    
    const fetchAllDayOffMatches = async () => {
      
      setIsLoadingDayOffMatches(true);
      try {
        const matches: Record<string, any> = {};
        
        // Fetch matches for all bid lines in smaller batches for better performance
        const batchSize = 10;
        for (let i = 0; i < bidLines.length; i += batchSize) {
          const batch = bidLines.slice(i, i + batchSize);
          
          await Promise.all(
            batch.map(async (bidLine: any) => {
              try {
                const res = await fetch('/api/day-off-requests/calculate-matches', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ bidLineId: bidLine.id }),
                });
                
                if (res.ok) {
                  const data = await res.json();
                  if (data.hasRequests) {
                    matches[bidLine.id] = data;
                  }
                }
              } catch (error) {
                console.error(`Failed to fetch day-off match for line ${bidLine.lineNumber}:`, error);
              }
            })
          );
          
          // Update state after each batch for progressive loading
          setDayOffMatches(prev => ({ ...prev, ...matches }));
        }
        
        // After all batches, save final result to localStorage
        if (typeof window !== 'undefined' && session?.user?.id) {
          try {
            localStorage.setItem('dayOffMatches', JSON.stringify({
              data: matches,
              timestamp: Date.now(),
              userId: session.user.id
            }));
          } catch (e) {
            console.error('Failed to cache day-off matches:', e);
          }
        }
      } catch (error) {
        console.error('Failed to fetch day-off matches:', error);
      } finally {
        setIsLoadingDayOffMatches(false);
      }
    };

    fetchAllDayOffMatches();
  }, [bidLines?.length, session?.user?.id, userHasDayOffRequests]);

  // Listen for day-off requests updates to refresh match data
  useEffect(() => {
    const handleDayOffUpdate = () => {
      // First, re-check if user has day-off requests
      const checkAndFetchMatches = async () => {
        if (!session?.user) return;

        // Clear localStorage cache when day-off requests are updated
        if (typeof window !== 'undefined') {
          localStorage.removeItem('dayOffMatches');
        }

        // Re-check user's day-off request status
        try {
          const res = await fetch('/api/day-off-requests/check');
          if (res.ok) {
            const data = await res.json();
            setUserHasDayOffRequests(data.hasRequests);
            
            // If user no longer has requests, clear matches and return
            if (!data.hasRequests) {
              setDayOffMatches({});
              setIsLoadingDayOffMatches(false);
              return;
            }
          }
        } catch (error) {
          console.error('Failed to check day-off requests:', error);
          return;
        }

        // Re-fetch day-off match data when requests are updated (using same batched approach)
        if (!bidLines) return;
        
        setIsLoadingDayOffMatches(true);
        try {
          const matches: Record<string, any> = {};
          
          // Use same batched approach for consistency
          const batchSize = 10;
          for (let i = 0; i < bidLines.length; i += batchSize) {
            const batch = bidLines.slice(i, i + batchSize);
            
            await Promise.all(
              batch.map(async (bidLine: any) => {
                try {
                  const res = await fetch('/api/day-off-requests/calculate-matches', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ bidLineId: bidLine.id }),
                  });
                  
                  if (res.ok) {
                    const data = await res.json();
                    if (data.hasRequests) {
                      matches[bidLine.id] = data;
                    }
                    // Note: if !data.hasRequests, we intentionally don't add to matches
                    // which will effectively clear that bid line's match data
                  }
                } catch (error) {
                  console.error(`Failed to fetch day-off match for line ${bidLine.lineNumber}:`, error);
                }
              })
            );
          }
          
          // Replace entire matches state instead of merging to clear removed matches
          setDayOffMatches(matches);
          
          // Save updated matches to localStorage
          if (typeof window !== 'undefined' && session?.user?.id) {
            try {
              localStorage.setItem('dayOffMatches', JSON.stringify({
                data: matches,
                timestamp: Date.now(),
                userId: session.user.id
              }));
            } catch (e) {
              console.error('Failed to cache updated day-off matches:', e);
            }
          }
        } catch (error) {
          console.error('Failed to fetch day-off matches:', error);
        } finally {
          setIsLoadingDayOffMatches(false);
        }
      };

      checkAndFetchMatches();
    };

    // Add event listener
    window.addEventListener('dayOffRequestsUpdated', handleDayOffUpdate);

    // Cleanup
    return () => {
      window.removeEventListener('dayOffRequestsUpdated', handleDayOffUpdate);
    };
  }, [bidLines, session?.user]);

  return {
    dayOffMatches,
    isLoadingDayOffMatches,
    userHasDayOffRequests,
  };
};