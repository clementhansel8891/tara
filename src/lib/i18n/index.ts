import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import idTranslations from './locales/id.json';

export type SupportedLanguage = 'en' | 'id';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'id'];
export const DEFAULT_LANGUAGE: SupportedLanguage = 'id';

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  id: 'Bahasa Indonesia',
};

export const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = {
  en: '🇬🇧',
  id: '🇮🇩',
};

/**
 * Get stored language from localStorage or fall back to default.
 */
function getStoredLanguage(): SupportedLanguage {
  try {
    const stored = localStorage.getItem('tara_language');
    if (stored && SUPPORTED_LANGUAGES.includes(stored as SupportedLanguage)) {
      return stored as SupportedLanguage;
    }
  } catch {
    // localStorage may be unavailable
  }
  return DEFAULT_LANGUAGE;
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslations },
    id: { translation: idTranslations },
  },
  lng: getStoredLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

/**
 * Change language and persist the choice.
 */
export function changeLanguage(lang: SupportedLanguage): void {
  if (!SUPPORTED_LANGUAGES.includes(lang)) return;
  i18n.changeLanguage(lang);
  try {
    localStorage.setItem('tara_language', lang);
  } catch {
    // silently fail
  }
}

/**
 * Get current active language.
 */
export function getCurrentLanguage(): SupportedLanguage {
  return (i18n.language as SupportedLanguage) || DEFAULT_LANGUAGE;
}

export default i18n;
