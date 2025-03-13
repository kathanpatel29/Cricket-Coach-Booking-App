import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import translation files
import translationEN from './locales/en/translation.json';
import translationHI from './locales/hi/translation.json';

// Resources object with translations
const resources = {
  en: {
    translation: translationEN
  },
  hi: {
    translation: translationHI
  }
};

// Get environment variables
const defaultLanguage = import.meta.env.VITE_DEFAULT_LANGUAGE || 'en';
const availableLanguages = (import.meta.env.VITE_AVAILABLE_LANGUAGES || 'en,hi').split(',');

i18n
  // Load translations from backend
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    fallbackLng: 'en',
    lng: defaultLanguage,
    supportedLngs: availableLanguages,
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    
    react: {
      useSuspense: true,
    },
  });

export default i18n; 