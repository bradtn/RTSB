// src/app/ical-download/page.tsx
"use client";

import { Suspense, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useIsMobile from "@/utils/useIsMobile";
import useInterfaceMode from "@/utils/useInterfaceMode";
import MobileICalDownloadWizard from "@/components/mobile/ical-download/MobileICalDownloadWizard";
import DesktopICalDownload from "@/components/desktop/ical-download/DesktopICalDownload";
import ProtectedLayout from "@/components/layout/ProtectedLayout";

function ICalDownloadContent() {
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
      router.push("/login?callbackUrl=/ical-download");
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
    return <MobileICalDownloadWizard />;
  }

  // Desktop view
  return (
    <ProtectedLayout fullscreen>
      <DesktopICalDownload 
        onModeChange={setMode}
        currentMode={mode}
      />
    </ProtectedLayout>
  );
}

export default function ICalDownloadPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>
    }>
      <ICalDownloadContent />
    </Suspense>
  );
}