"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function AdminLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!session || session?.user?.role !== "admin") {
    return null;
  }

  return (
    <div className="flex">
      <aside className="w-64 bg-gray-800 min-h-screen p-4">
        <h2 className="text-xl font-bold text-white mb-6">Admin Panel</h2>
        <nav className="space-y-2">
          <Link href="/admin" className="block py-2 px-4 rounded hover:bg-gray-700 text-gray-300">
            Dashboard
          </Link>
          <Link href="/admin/users" className="block py-2 px-4 rounded hover:bg-gray-700 text-gray-300">
            User Management
          </Link>
          <Link href="/admin/data" className="block py-2 px-4 rounded hover:bg-gray-700 text-gray-300">
            Data Management
          </Link>
          <Link href="/admin/settings" className="block py-2 px-4 rounded hover:bg-gray-700 text-gray-300">
            System Settings
          </Link>
          <Link href="/" className="block py-2 px-4 rounded hover:bg-gray-700 text-gray-300">
            Return to App
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}