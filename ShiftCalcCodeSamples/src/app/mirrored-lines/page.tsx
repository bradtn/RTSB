// src/app/mirrored-lines/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useIsMobile from "@/utils/useIsMobile";
import useInterfaceMode from "@/utils/useInterfaceMode";
import { MirroredLinesProvider } from "@/contexts/MirroredLinesContext";
import MirroredLinesStepNavigator from "@/components/mobile/MirroredLinesStepNavigator";
import DesktopMirroredLines from "@/components/desktop/mirrored-lines/DesktopMirroredLines";
import ProtectedLayout from "@/components/layout/ProtectedLayout";

function MirroredLinesContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { mode, setMode } = useInterfaceMode();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Check for authentication
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/mirrored-lines");
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
    return (
      <MirroredLinesProvider>
        <div className="flex flex-col h-screen">
          <MirroredLinesStepNavigator />
        </div>
      </MirroredLinesProvider>
    );
  }

  // Desktop view
  return (
    <ProtectedLayout fullscreen>
      <MirroredLinesProvider>
        <DesktopMirroredLines />
      </MirroredLinesProvider>
    </ProtectedLayout>
  );
}

export default function MirroredLinesPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>
    }>
      <MirroredLinesContent />
    </Suspense>
  );
}