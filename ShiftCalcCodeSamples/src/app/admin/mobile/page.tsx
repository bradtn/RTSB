"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MobileHeader from "@/components/mobile/MobileHeader";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";

export default function MobileAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    
    if (status === "authenticated") {
      if (session?.user?.role !== "admin") {
        router.push("/");
        return;
      }
      setIsLoading(false);
    }
  }, [status, session, router]);

  if (isLoading || status === "loading") {
    return (
      <div className={`flex min-h-screen flex-col ${styles.bodyBg}`}>
        <MobileHeader isLoading={true} />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (!session || session?.user?.role !== "admin") {
    return null;
  }

  return (
    <div className={`flex min-h-screen flex-col ${styles.bodyBg}`}>
      <MobileHeader />
      <main className="flex-1 p-4">
        <h1 className={`mb-4 text-2xl font-bold ${styles.textPrimary}`}>Admin Panel</h1>
        
        <div className="grid gap-4">
          <AdminCard 
            title="User Management" 
            description="Manage user accounts and roles"
            href="/admin/mobile/users"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
          
          <AdminCard 
            title="Data Management" 
            description="Import and manage schedules"
            href="/admin/mobile/data"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            }
          />
          
          <AdminCard 
            title="System Settings" 
            description="Configure system settings"
            href="/admin/mobile/settings"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
          
          <Link href="/" className={`mt-4 block rounded-lg bg-blue-600 px-4 py-3 text-center font-medium text-white hover:bg-blue-700`}>
            Return to App
          </Link>
        </div>
      </main>
    </div>
  );
}

function AdminCard({ 
  title, 
  description, 
  href, 
  icon 
}: { 
  title: string; 
  description: string; 
  href: string;
  icon: React.ReactNode;
}) {
  const styles = useThemeStyles();
  
  return (
    <Link href={href} className={`flex items-start gap-4 rounded-lg ${styles.cardBg} p-4 shadow transition-shadow hover:shadow-md`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
        {icon}
      </div>
      <div>
        <h2 className={`mb-1 text-lg font-semibold ${styles.textPrimary}`}>{title}</h2>
        <p className={`text-sm ${styles.textMuted}`}>{description}</p>
      </div>
      <div className="ml-auto self-center">
        <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}