"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useIsMobile from "@/utils/useIsMobile";
import useInterfaceMode from "@/utils/useInterfaceMode";
import MobileWhosWorkingWizard from '@/components/mobile/whos-working/MobileWhosWorkingWizard';
import DesktopWhosWorking from "@/components/desktop/whos-working/DesktopWhosWorking";
import ProtectedLayout from "@/components/layout/ProtectedLayout";

export default function WhosWorkingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { mode, setMode } = useInterfaceMode();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/whos-working");
    } else if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/");
    }
  }, [status, session, router]);

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

  if (!session || session?.user?.role !== "admin") {
    return null;
  }

  // Mobile view
  if (isMobile) {
    return <MobileWhosWorkingWizard />;
  }

  // Desktop view
  return (
    <ProtectedLayout fullscreen>
      <DesktopWhosWorking 
        onModeChange={setMode}
        currentMode={mode}
      />
    </ProtectedLayout>
  );
}