// src/app/shift-calculator/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import useIsMobile from '@/utils/useIsMobile';
import useInterfaceMode from '@/utils/useInterfaceMode';
import MobileFilterFlow from '@/components/mobile/MobileFilterFlow';
import DesktopWizardLayout from '@/components/wizard/DesktopWizardLayout';
import { FilterProvider } from '@/contexts/FilterContext';
import { WizardStateProvider } from '@/contexts/WizardStateContext';
import ProtectedLayout from '@/components/layout/ProtectedLayout';

export default function ShiftCalculatorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { mode, setMode } = useInterfaceMode();
  const [mounted, setMounted] = useState(false);
  const [shiftCodes, setShiftCodes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/shift-calculator');
    }
  }, [status, router]);
  
  // Remove the redirect - we now support desktop
  
  // Fetch data needed for both mobile and desktop views
  useEffect(() => {
    if (status === 'authenticated') {
      const fetchData = async () => {
        try {
          // Fetch shift codes
          const codesResponse = await fetch('/api/shift-codes');
          const codesData = await codesResponse.json();
          
          // Fetch groups
          const groupsResponse = await fetch('/api/groups');
          const groupsData = await groupsResponse.json();
          
          setShiftCodes(codesData);
          setGroups(groupsData);
        } catch (error) {
          console.error('Error fetching initial data:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    }
  }, [status]);
  
  // Show a minimal loading state while checking device type and auth
  if (!mounted || status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Don't show content if not authenticated
  if (status === 'unauthenticated') {
    return null;
  }
  
  // Mobile view - render the mobile filter flow
  if (isMobile) {
    return (
      <div className="h-screen flex flex-col">
        <WizardStateProvider>
          <FilterProvider shiftCodes={shiftCodes} allGroups={groups}>
            <MobileFilterFlow 
              shiftCodes={shiftCodes} 
              allGroups={groups} 
            />
          </FilterProvider>
        </WizardStateProvider>
      </div>
    );
  }
  
  // Desktop view - render the desktop wizard within ProtectedLayout
  return (
    <ProtectedLayout fullscreen>
      <WizardStateProvider>
        <FilterProvider shiftCodes={shiftCodes} allGroups={groups}>
          <DesktopWizardLayout 
            onModeChange={setMode}
            currentMode={mode}
          />
        </FilterProvider>
      </WizardStateProvider>
    </ProtectedLayout>
  );
}