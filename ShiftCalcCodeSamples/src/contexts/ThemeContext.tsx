// src/contexts/ThemeContext.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// Add this import at the top
import { themes } from "../styles/theme";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  // Add the styles property
  styles: typeof themes.dark | typeof themes.light;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  // Function to update the DOM and localStorage
  const applyTheme = (newTheme: Theme) => {
    if (typeof window === "undefined") return;
    
    // Handle localStorage
    localStorage.setItem("theme", newTheme);
    
    // Always remove the class first to ensure clean state
    document.documentElement.classList.remove('dark');
    
    // Then add it if needed
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
    
    console.log(`Applied theme: ${newTheme}, dark class:`, 
      document.documentElement.classList.contains('dark'));
  };

  // Initial setup on first render
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Load from localStorage or use default
    let savedTheme: Theme = "dark";
    try {
      const stored = localStorage.getItem("theme") as Theme;
      if (stored === "light" || stored === "dark") {
        savedTheme = stored;
      }
    } catch (e) {
      console.error("Error reading theme from localStorage:", e);
    }
    
    // Set state
    setTheme(savedTheme);
    
    // Apply to DOM
    applyTheme(savedTheme);
  }, []);

  // Handle theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Toggle function
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme,
      // Add the styles property
      styles: themes[theme] 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Provide a fallback instead of throwing an error
    console.warn("useTheme used outside of ThemeProvider, using fallback");
    return {
      theme: 'dark' as Theme,
      toggleTheme: () => console.warn("toggleTheme called outside provider"),
      styles: themes.dark
    };
  }
  return context;
}