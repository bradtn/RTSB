// src/contexts/MirroredLinesContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Schedule, MirrorScore } from '@/types/scheduleTypes';

// Define the context type
type MirroredLinesContextType = {
  // Step management
  step: number;
  nextStep: () => void;
  prevStep: (targetStep?: number) => void;
  resetSteps: () => void;
  
  // Data
  operations: string[];
  selectedOperation: string | null;
  setSelectedOperation: (operation: string | null) => void;
  
  lineNumber: string;
  setLineNumber: (lineNumber: string) => void;
  
  targetOperations: string[];
  setTargetOperations: (operations: string[]) => void;
  
  loading: boolean;
  setLoading: (loading: boolean) => void;
  
  error: string | null;
  setError: (error: string | null) => void;
  
  // Results
  userLine: Schedule | null;
  setUserLine: (line: Schedule | null) => void;
  
  mirrorResults: MirrorScore[];
  setMirrorResults: (results: MirrorScore[]) => void;
  
  selectedMirror: MirrorScore | null;
  setSelectedMirror: (mirror: MirrorScore | null) => void;
  
  // Sorting
  sortField: string;
  setSortField: (field: string) => void;
  
  sortDirection: 'asc' | 'desc';
  setSortDirection: (direction: 'asc' | 'desc') => void;
  
  // Sub modes for navigation
  subModes: Record<string, any>;
  updateSubModes: (key: string, value: any) => void;
  
  // Fetch mirror lines
  fetchMirrorLines: (lineId: number) => Promise<void>;
};

// Create context with defaults
const MirroredLinesContext = createContext<MirroredLinesContextType | undefined>(undefined);

// Provider component
export function MirroredLinesProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Step management
  const [step, setStep] = useState(1);
  
  // Data state
  const [operations, setOperations] = useState<string[]>([]);
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [lineNumber, setLineNumber] = useState<string>('');
  const [targetOperations, setTargetOperations] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Results state
  const [userLine, setUserLine] = useState<Schedule | null>(null);
  const [mirrorResults, setMirrorResults] = useState<MirrorScore[]>([]);
  const [selectedMirror, setSelectedMirror] = useState<MirrorScore | null>(null);
  
  // Sorting state - changed default sort to prioritize significant differences
  const [sortField, setSortField] = useState<string>("significantDifferenceCount");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Sub modes for navigation state
  const [subModes, setSubModes] = useState<Record<string, any>>({});

  // Define fetchMirrorLines using useCallback
  const fetchMirrorLines = useCallback(async (lineId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      // Add targetOperations to the URL if they are specified
      let url = `/api/schedules/mirrored-lines?lineId=${lineId}`;
      
      // Only apply target operations filter if operations are selected
      if (targetOperations && targetOperations.length > 0) {
        url += `&targetOperations=${targetOperations.join(',')}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        // Log detailed error info
        console.error(`API Error:`, {
          status: response.status,
          statusText: response.statusText
        });
        
        // Try to parse error details
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.message || response.statusText);
        } catch (parseError) {
          throw new Error(`Failed to fetch mirrored lines: ${response.status} ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      
      if (data.userLine && Array.isArray(data.mirrorScores)) {
        setUserLine(data.userLine);
        setMirrorResults(data.mirrorScores);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching mirrored lines:', error);
      setError(error instanceof Error ? error.message : String(error));
      setUserLine(null);
      setMirrorResults([]);
    } finally {
      setLoading(false);
    }
  }, [targetOperations]);
  
  // Update URL with current state
  const updateUrlState = useCallback(() => {
    const params = new URLSearchParams();
    params.set('step', step.toString());
    if (selectedOperation) params.set('operation', selectedOperation);
    if (lineNumber) params.set('line', lineNumber);
    if (targetOperations.length > 0) params.set('targets', targetOperations.join(','));
    
    const newUrl = `/mirrored-lines?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [step, selectedOperation, lineNumber, targetOperations]);

  // Initialize state from URL on mount
  useEffect(() => {
    if (isInitialized) return;
    
    const stepParam = searchParams.get('step');
    const operationParam = searchParams.get('operation');
    const lineParam = searchParams.get('line');
    const targetsParam = searchParams.get('targets');
    
    if (stepParam) setStep(parseInt(stepParam));
    if (operationParam) setSelectedOperation(operationParam);
    if (lineParam) setLineNumber(lineParam);
    if (targetsParam) setTargetOperations(targetsParam.split(','));
    
    setIsInitialized(true);
  }, [searchParams, isInitialized]);

  // Update URL whenever state changes
  useEffect(() => {
    if (isInitialized) {
      updateUrlState();
    }
  }, [step, selectedOperation, lineNumber, targetOperations, updateUrlState, isInitialized]);

  // Fetch mirror lines when refreshing on step 4
  useEffect(() => {
    const fetchDataForStep = async () => {
      if (isInitialized && step === 4 && selectedOperation && lineNumber && !userLine && !loading) {
        // Find the schedule ID for the selected line
        try {
          const response = await fetch('/api/schedules');
          const schedules = await response.json();
          
          const schedule = schedules.find((s: any) => 
            s.GROUP === selectedOperation && s.LINE.toString() === lineNumber
          );
          
          if (schedule) {
            await fetchMirrorLines(schedule.id);
          }
        } catch (error) {
          console.error('Error fetching schedule data:', error);
        }
      }
    };

    fetchDataForStep();
  }, [isInitialized, step, selectedOperation, lineNumber, userLine, loading, fetchMirrorLines]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const stepParam = params.get('step');
      if (stepParam) {
        setStep(parseInt(stepParam));
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
  // Load available operations on mount
  useEffect(() => {
    // Simulating API call to get operations (groups)
    const fetchOperations = async () => {
      setLoading(true);
      try {
        // In a real implementation, this would be an API call
        const response = await fetch('/api/schedules');
        const data = await response.json();
        
        if (Array.isArray(data)) {
          // Extract unique operations/groups
          const uniqueOperations = [...new Set(data.map((s: any) => s.GROUP))];
          setOperations(uniqueOperations);
        }
      } catch (err) {
        console.error('Error fetching operations:', err);
        setError('Failed to load operations. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOperations();
  }, []);
  
  // Step navigation functions
  const nextStep = () => {
    if (step < 4) {
      setStep(prevStep => prevStep + 1);
    }
  };
  
  const prevStep = (targetStep?: number) => {
    if (targetStep !== undefined) {
      setStep(Math.max(1, Math.min(targetStep, 4)));
    } else {
      setStep(prevStep => Math.max(1, prevStep - 1));
    }
  };
  
  const resetSteps = () => {
    setStep(1);
    setSelectedOperation(null);
    setLineNumber('');
    setTargetOperations([]);
    setUserLine(null);
    setMirrorResults([]);
    setSelectedMirror(null);
    setError(null);
  };
  
  // Update sub modes for navigation
  const updateSubModes = (key: string, value: any) => {
    setSubModes(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  
  const contextValue: MirroredLinesContextType = {
    step,
    nextStep,
    prevStep,
    resetSteps,
    operations,
    selectedOperation,
    setSelectedOperation,
    lineNumber,
    setLineNumber,
    targetOperations,
    setTargetOperations,
    loading,
    setLoading,
    error,
    setError,
    userLine,
    setUserLine,
    mirrorResults,
    setMirrorResults,
    selectedMirror,
    setSelectedMirror,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    subModes,
    updateSubModes,
    fetchMirrorLines
  };
  
  return (
    <MirroredLinesContext.Provider value={contextValue}>
      {children}
    </MirroredLinesContext.Provider>
  );
}

// Custom hook for using the context
export function useMirroredLines() {
  const context = useContext(MirroredLinesContext);
  
  if (context === undefined) {
    throw new Error('useMirroredLines must be used within a MirroredLinesProvider');
  }
  
  return context;
}