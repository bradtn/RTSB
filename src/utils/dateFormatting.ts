import { format as dateFnsFormat } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

/**
 * Capitalizes the first letter of a string
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format a date with proper capitalization for month names
 * French months are lowercase by default, this ensures they're capitalized
 */
export function formatDate(
  date: Date,
  formatStr: string,
  locale: string = 'en'
): string {
  const dateLocale = locale === 'fr' ? fr : enUS;
  const formatted = dateFnsFormat(date, formatStr, { locale: dateLocale });
  
  // For French, capitalize the first letter of months
  if (locale === 'fr') {
    // Handle full month names (MMMM)
    if (formatStr.includes('MMMM')) {
      return formatted.replace(/\b(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\b/gi, 
        match => capitalizeFirst(match));
    }
    // Handle abbreviated month names (MMM)
    if (formatStr.includes('MMM')) {
      return formatted.replace(/\b(janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc)\b/gi,
        match => capitalizeFirst(match));
    }
  }
  
  return formatted;
}

/**
 * Get the appropriate date locale
 */
export function getDateLocale(locale: string = 'en') {
  return locale === 'fr' ? fr : enUS;
}

/**
 * Format month and year with proper capitalization
 */
export function formatMonthYear(date: Date, locale: string = 'en'): string {
  const formatted = date.toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-US', {
    month: 'long',
    year: 'numeric'
  });
  
  // Capitalize first letter for French months
  if (locale === 'fr') {
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }
  
  return formatted;
}