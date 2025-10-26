'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/components/auth/ProtectedPage';
import MirroredLineSelector from '@/components/mirrored-lines/MirroredLineSelector';
import MirroredLineResults from '@/components/mirrored-lines/MirroredLineResults';
import { MirroredLinesProvider } from '@/contexts/MirroredLinesContext';

export default function MirroredLinesClientPage() {
  const router = useRouter();

  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  return (
    <MirroredLinesProvider>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Mirrored Lines</h1>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 space-y-6">
            <MirroredLineSelector />
          </div>
          <div className="md:col-span-8">
            <MirroredLineResults />
          </div>
        </div>
      </div>
    </MirroredLinesProvider>
  );
}