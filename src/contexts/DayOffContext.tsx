'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface DayOffContextType {
  hasDayOffRequests: boolean;
  dayOffDates: Date[];
  isLoading: boolean;
  refetch: () => void;
}

const DayOffContext = createContext<DayOffContextType>({
  hasDayOffRequests: false,
  dayOffDates: [],
  isLoading: true,
  refetch: () => {},
});

export function DayOffProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [hasDayOffRequests, setHasDayOffRequests] = useState(false);
  const [dayOffDates, setDayOffDates] = useState<Date[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDayOffRequests = async () => {
    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/day-off-requests');
      if (res.ok) {
        const data = await res.json();
        const dates = data?.dates || [];
        setDayOffDates(dates.map((d: string) => new Date(d)));
        setHasDayOffRequests(dates.length > 0);
      }
    } catch (error) {
      console.error('Failed to fetch day-off requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDayOffRequests();
  }, [session]);

  return (
    <DayOffContext.Provider value={{
      hasDayOffRequests,
      dayOffDates,
      isLoading,
      refetch: fetchDayOffRequests,
    }}>
      {children}
    </DayOffContext.Provider>
  );
}

export const useDayOff = () => useContext(DayOffContext);