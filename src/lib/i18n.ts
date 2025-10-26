import en from '../../public/locales/en/common.json';
import fr from '../../public/locales/fr/common.json';

const translations = {
  en,
  fr,
} as const;

export type Locale = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;

export function getTranslations(locale: Locale) {
  return translations[locale] || translations.en;
}

export function translate(locale: Locale, key: string): string {
  const translations = getTranslations(locale);
  
  // Handle nested keys like 'auth.email'
  const keys = key.split('.');
  let value: any = translations;
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return typeof value === 'string' ? value : key;
}

export function useTranslation(locale: string) {
  const normalizedLocale = (locale === 'fr' ? 'fr' : 'en') as Locale;
  
  const t = (key: string, params?: Record<string, string>) => {
    let translation = translate(normalizedLocale, key);
    
    // Simple parameter replacement
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{{${param}}}`, value);
      });
    }
    
    return translation;
  };

  return { t, locale: normalizedLocale };
}