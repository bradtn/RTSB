// src/hooks/useThemeStyles.ts
import { useTheme } from '../contexts/ThemeContext';

export function useThemeStyles() {
  const { theme, styles } = useTheme();
  return styles || themes[theme] || themes.dark;
}