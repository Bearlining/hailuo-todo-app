import React, { createContext, useContext, useCallback } from 'react';
import { translations, type TranslationKey, type Translations } from './translations';

/**
 * English-only i18n.
 *
 * The app targets overseas users, so we hard-code English and
 * drop the language-switch machinery entirely. Kept the I18nProvider
 * shape so existing components using `useTranslation` / `t()` keep
 * working — but `language` is always 'en' and `setLanguage` is a no-op.
 *
 * If we ever need another language, we'd extend this module rather
 * than fan-out language files everywhere.
 */

type Language = 'en';

interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => void; // kept for API compat, no-op
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);
export { I18nContext };

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => {
    const v = vars[k];
    return v === undefined || v === null ? `{${k}}` : String(v);
  });
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Language is fixed to English — no switching, no localStorage dance.
  const language: Language = 'en';

  const setLanguage = useCallback((_lang: Language) => {
    // no-op — kept for source compatibility with existing components
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      const dict: Translations = translations;
      const raw = dict[key];
      if (raw === undefined) {
        if (import.meta.env.DEV) {
          console.warn(`[i18n] Missing translation for key "${key}"`);
        }
        return key;
      }
      return interpolate(raw, vars);
    },
    []
  );

  // Set html lang so screen readers and browsers know
  if (typeof document !== 'undefined') {
    document.documentElement.lang = language;
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return ctx;
}

/**
 * Kept as no-op for backward compatibility — main.tsx calls this.
 * With a single language, there's nothing to assert against.
 */
export function assertTranslationsComplete(): void {
  if (import.meta.env.DEV) {
    console.info(`[i18n] ✓ ${Object.keys(translations).length} keys loaded (English only)`);
  }
}