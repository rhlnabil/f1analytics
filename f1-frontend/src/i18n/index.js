import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import fr from './locales/fr.json';
import en from './locales/en.json';
import es from './locales/es.json';
import it from './locales/it.json';
import ar from './locales/ar.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      es: { translation: es },
      it: { translation: it },
      ar: { translation: ar },
    },
    fallbackLng: 'fr',
    supportedLngs: ['fr', 'en', 'es', 'it', 'ar'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'f1apex-lang',
    },
  });

/* ✅ Gestion automatique du sens (LTR / RTL) */
const applyDirection = (lng) => {
  const isRTL = lng === 'ar';
  document.documentElement.setAttribute('lang', lng);
  document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
};

i18n.on('languageChanged', applyDirection);
applyDirection(i18n.language);

export default i18n;