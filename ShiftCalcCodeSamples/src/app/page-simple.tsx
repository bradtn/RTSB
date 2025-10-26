'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    console.log('Landing page - Auth status:', status, 'Session:', session);
  }, [status, session]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div className="p-8">Loading auth...</div>;
  }

  if (status === 'unauthenticated') {
    return <div className="p-8">Redirecting to login...</div>;
  }

  return (
    <div className="p-8 bg-yellow-100 min-h-screen">
      <div className="bg-red-500 text-white p-4 mb-4 text-2xl">
        THIS IS THE ROOT LANDING PAGE - NOT SHIFT CALCULATOR
      </div>
      <h1 className="text-4xl font-bold mb-4">ShiftCalc Desktop Landing Page</h1>
      <p className="mb-4">Welcome, {session?.user?.name || session?.user?.username || 'User'}!</p>
      <p className="mb-4 text-red-600">Current URL: {typeof window !== 'undefined' ? window.location.pathname : 'loading...'}</p>
      
      <div className="grid grid-cols-2 gap-4 max-w-2xl">
        <Link href="/shift-calculator" className="p-4 bg-blue-500 text-white rounded hover:bg-blue-600">
          Shift Calculator
        </Link>
        <Link href="/mirrored-lines" className="p-4 bg-purple-500 text-white rounded hover:bg-purple-600">
          Shift Trade Finder
        </Link>
        <Link href="/ical-download" className="p-4 bg-green-500 text-white rounded hover:bg-green-600">
          Download Schedule
        </Link>
        <Link href="/day-off-finder" className="p-4 bg-yellow-500 text-white rounded hover:bg-yellow-600">
          Day Off Finder
        </Link>
        <Link href="/schedule-comparison" className="p-4 bg-indigo-500 text-white rounded hover:bg-indigo-600">
          Schedule Comparison
        </Link>
        <Link href="/whos-working" className="p-4 bg-red-500 text-white rounded hover:bg-red-600">
          Who&apos;s Working
        </Link>
      </div>
      
      <div className="mt-8">
        <a href="/test-landing" className="text-blue-500 underline">Go to test page</a>
      </div>
    </div>
  );
}