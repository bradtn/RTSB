// src/app/theme-test/page.tsx
"use client";

import StandaloneThemeToggle from "@/components/theme/StandaloneThemeToggle";

export default function ThemeTestPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white p-8">
      <h1 className="text-3xl font-bold mb-4">Theme Test Page</h1>
      <p>This page demonstrates the theme toggle functionality.</p>
      <p className="mt-4">The background should change when you toggle the theme.</p>
      <StandaloneThemeToggle />
    </div>
  );
}