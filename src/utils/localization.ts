import { Operation } from '@/types/BidLinesClient.types';

/**
 * Returns localized operation name based on current locale
 * @param operation Operation object with multilingual names
 * @param locale Current locale ('en' or 'fr')
 * @returns Localized operation name
 */
export const getLocalizedOperationName = (operation: Operation | null, locale: string): string => {
  if (!operation) return 'Unknown Operation';
  return locale === 'fr' ? operation.nameFr : operation.nameEn;
};

/**
 * Returns localized category names (English to French translations)
 * @param category Category name in English
 * @param locale Current locale ('en' or 'fr')
 * @returns Localized category name
 */
export const getLocalizedCategoryName = (category: string, locale: string): string => {
  if (locale === 'fr') {
    const translations: { [key: string]: string } = {
      'Days': 'Jour',
      'Late Days': 'Jour tard',
      'Mid Days': 'Intermédiaire',
      'Afternoons': 'Soir',
      'Midnights': 'Nuit'
    };
    return translations[category] || category;
  }
  return category;
};