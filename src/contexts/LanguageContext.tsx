import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language, AVAILABLE_LANGUAGES, LanguageOption, translations } from '../i18n/translations';
import { auth, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

export type { Language, LanguageOption };
export { AVAILABLE_LANGUAGES };
export const SUPPORTED_LANGUAGES = AVAILABLE_LANGUAGES;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, fallback?: string, params?: Record<string, string | number>) => string;
  availableLanguages: LanguageOption[];
  currentLanguageOption: LanguageOption;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'es',
  setLanguage: () => {},
  t: (path: string, fallback?: string) => fallback || path,
  availableLanguages: AVAILABLE_LANGUAGES,
  currentLanguageOption: AVAILABLE_LANGUAGES[0],
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('kaivincia_language') as Language;
      if (saved && ['es', 'en', 'pt'].includes(saved)) {
        return saved;
      }
      // Check browser language
      const browserLang = navigator.language?.slice(0, 2);
      if (browserLang === 'pt') return 'pt';
      if (browserLang === 'en') return 'en';
      return 'es';
    } catch {
      return 'es';
    }
  });

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem('kaivincia_language', newLang);
      document.documentElement.lang = newLang;

      // Sync preference to user profile in Firestore if logged in
      if (auth.currentUser?.uid) {
        updateDoc(doc(db, 'users', auth.currentUser.uid), {
          preferredLanguage: newLang
        }).catch((err) => console.warn('Could not sync language preference to Firestore:', err));
      }
    } catch (e) {
      console.warn('Error saving language preference:', e);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Robust nested translation retriever with interpolation and fallback
  const t = useCallback((path: string, fallback?: string, params?: Record<string, string | number>): string => {
    const getNested = (obj: any, keys: string[]): any => {
      let current = obj;
      for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
          current = current[k];
        } else {
          return undefined;
        }
      }
      return current;
    };

    const keys = path.split('.');
    let value = getNested(translations[language], keys);

    // If not found in current language, fallback to Spanish
    if (value === undefined && language !== 'es') {
      value = getNested(translations['es'], keys);
    }

    // If still not found, use fallback or path
    if (value === undefined || typeof value !== 'string') {
      value = fallback !== undefined ? fallback : path;
    }

    // Interpolate parameters {key}
    if (params && typeof value === 'string') {
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        value = (value as string).replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
      });
    }

    return String(value);
  }, [language]);

  const currentLanguageOption = AVAILABLE_LANGUAGES.find(l => l.code === language) || AVAILABLE_LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      t,
      availableLanguages: AVAILABLE_LANGUAGES,
      currentLanguageOption
    }}>
      {children}
    </LanguageContext.Provider>
  );
};
