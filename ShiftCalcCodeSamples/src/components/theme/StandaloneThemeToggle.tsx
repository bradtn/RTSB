// src/components/theme/StandaloneThemeToggle.tsx
"use client";

import { useTheme } from "@/contexts/ThemeContext";

export default function StandaloneThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className="flex items-center justify-center p-4">
      <button 
        onClick={toggleTheme}
        className="flex items-center justify-center p-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        {theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      </button>
    </div>
  );
}