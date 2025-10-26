const holidayTranslations: Record<string, Record<string, string>> = {
  en: {
    // Public Holidays
    "New Year's Day": "New Year's Day",
    "Family Day": "Family Day",
    "Good Friday": "Good Friday",
    "Victoria Day": "Victoria Day",
    "Canada Day": "Canada Day",
    "Civic Holiday": "Civic Holiday",
    "Labour Day": "Labour Day",
    "Thanksgiving": "Thanksgiving",
    "Remembrance Day": "Remembrance Day",
    "Christmas Day": "Christmas Day",
    "Boxing Day": "Boxing Day",
    
    // Observances
    "Christmas Eve": "Christmas Eve",
    "New Year's Eve": "New Year's Eve",
    "Halloween": "Halloween",
    "Valentine's Day": "Valentine's Day",
    "St. Patrick's Day": "St. Patrick's Day",
    "Groundhog Day": "Groundhog Day",
    "Easter Monday": "Easter Monday",
    "Easter Sunday": "Easter Sunday",
    "Mother's Day": "Mother's Day",
    "Father's Day": "Father's Day",
  },
  fr: {
    // Public Holidays
    "New Year's Day": "Jour de l'An",
    "Family Day": "Jour de la famille",
    "Good Friday": "Vendredi saint",
    "Victoria Day": "Fête de Victoria",
    "Canada Day": "Fête du Canada",
    "Civic Holiday": "Congé civique",
    "Labour Day": "Fête du travail",
    "Thanksgiving": "Action de grâce",
    "Remembrance Day": "Jour du Souvenir",
    "Christmas Day": "Noël",
    "Boxing Day": "Lendemain de Noël",
    
    // Observances
    "Christmas Eve": "Veille de Noël",
    "New Year's Eve": "Veille du Jour de l'An",
    "Halloween": "Halloween",
    "Valentine's Day": "Saint-Valentin",
    "St. Patrick's Day": "Saint-Patrick",
    "Groundhog Day": "Jour de la marmotte",
    "Easter Monday": "Lundi de Pâques",
    "Easter Sunday": "Dimanche de Pâques",
    "Mother's Day": "Fête des mères",
    "Father's Day": "Fête des pères",
  }
};

export function translateHolidayName(name: string, locale: string = 'en'): string {
  const translations = holidayTranslations[locale] || holidayTranslations.en;
  return translations[name] || name;
}

export function translateHolidays(
  holidays: Array<{ name: string; date: Date }>,
  locale: string = 'en'
): Array<{ name: string; date: Date }> {
  return holidays.map(holiday => ({
    ...holiday,
    name: translateHolidayName(holiday.name, locale)
  }));
}