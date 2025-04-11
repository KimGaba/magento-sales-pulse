
import React, { createContext, useContext, useState, useEffect } from 'react';
import en from './locales/en';
import { da } from './locales/da';

type Locale = 'en' | 'da';
type Translations = typeof en;

interface LanguageContextType {
  locale: Locale;
  translations: Translations;
  setLocale: (locale: Locale) => void;
}

const locales: Record<Locale, Translations> = {
  en,
  da
};

const defaultLocale: Locale = 'en';

const LanguageContext = createContext<LanguageContextType>({
  locale: defaultLocale,
  translations: locales[defaultLocale],
  setLocale: () => {}
});

export const useLanguage = () => useContext(LanguageContext);

// Add the useTranslation hook (ensure it's properly exported)
export const useTranslation = () => {
  const { translations } = useLanguage();
  return { t: translations };
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState<Locale>(() => {
    // Try to get language from localStorage or use browser language
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale && locales[savedLocale]) {
      return savedLocale;
    }
    
    // Check browser language
    const browserLocale = navigator.language.split('-')[0] as Locale;
    return locales[browserLocale] ? browserLocale : defaultLocale;
  });

  const [translations, setTranslations] = useState<Translations>(locales[locale]);

  useEffect(() => {
    setTranslations(locales[locale]);
    localStorage.setItem('locale', locale);
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, translations, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
};
