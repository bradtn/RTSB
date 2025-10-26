// src/components/schedules/detail/utils/colorUtils.ts
// Color-related utility functions

// Improved pie chart color function with higher contrast colors for consistent palette
export function getShiftTypeColor(type: string, theme: string): string {
  const map: Record<string, string> = {
    Days: theme === 'dark' ? 'bg-emerald-600' : 'bg-emerald-500',
    Afternoons: theme === 'dark' ? 'bg-sky-600' : 'bg-sky-500',
    'Mid Days': theme === 'dark' ? 'bg-indigo-600' : 'bg-indigo-500',
    'Late Days': theme === 'dark' ? 'bg-purple-600' : 'bg-purple-500',
    Midnights: theme === 'dark' ? 'bg-blue-800' : 'bg-blue-700',
    'Days Off': theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200',
    Holidays: theme === 'dark' ? 'bg-rose-600' : 'bg-rose-500',
    Selected: theme === 'dark' ? 'bg-green-600' : 'bg-green-500',
    Other: theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300',
  };
  
  return map[type] || (theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300');
}

// Chart color function without the bg- prefix
export function getChartColor(type: string, theme: string): string {
  switch(type) {
    case 'Days':
      return theme === 'dark' ? '#059669' : '#10b981'; // Emerald
    case 'Afternoons':
      return theme === 'dark' ? '#0284c7' : '#0ea5e9'; // Sky
    case 'Mid Days':
      return theme === 'dark' ? '#4f46e5' : '#6366f1'; // Indigo
    case 'Late Days':
      return theme === 'dark' ? '#9333ea' : '#a855f7'; // Purple 
    case 'Midnights':
      return theme === 'dark' ? '#1e40af' : '#3b82f6'; // Blue
    case 'Days Off':
      return theme === 'dark' ? '#374151' : '#9ca3af'; // Gray
    case 'Holidays':
      return theme === 'dark' ? '#be123c' : '#f43f5e'; // Rose
    default:
      return theme === 'dark' ? '#4b5563' : '#6b7280'; // Gray
  }
}

// Get print-friendly color instead of theme-based colors
export function getPrintColor(type: string): string {
  switch(type) {
    case 'Days': return '#000000'; // Black
    case 'Afternoons': return '#333333'; // Dark Gray
    case 'Mid Days': return '#555555'; // Medium Gray
    case 'Late Days': return '#777777'; // Gray
    case 'Midnights': return '#999999'; // Light Gray
    case 'Days Off': return '#FFFFFF'; // White
    case 'Holidays': return '#444444'; // Dark Gray
    case 'Selected': return '#222222'; // Almost Black
    default: return '#666666'; // Medium Gray
  }
}
