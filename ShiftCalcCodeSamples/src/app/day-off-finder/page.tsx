// src/app/day-off-finder/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useIsMobile from "@/utils/useIsMobile";
import useInterfaceMode from "@/utils/useInterfaceMode";
import MobileDayOffFinderWizard from "@/components/mobile/day-off-finder/MobileDayOffFinderWizard";
import DesktopDayOffFinder from "@/components/desktop/day-off-finder/DesktopDayOffFinder";
import ProtectedLayout from "@/components/layout/ProtectedLayout";

export default function DayOffFinderPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { mode, setMode } = useInterfaceMode();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/day-off-finder");
    }
  }, [status, router]);

  if (!mounted || status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  // Mobile view
  if (isMobile) {
    return <MobileDayOffFinderWizard />;
  }

  // Desktop view
  return (
    <ProtectedLayout fullscreen>
      <DesktopDayOffFinder 
        onModeChange={setMode}
        currentMode={mode}
      />
    </ProtectedLayout>
  );
}