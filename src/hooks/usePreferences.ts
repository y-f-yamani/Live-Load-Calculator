import { useEffect, useState } from 'react';
import type { Locale } from '../i18n/messages';
export type Theme = 'light' | 'dark' | 'system';

function read(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function usePreferences() {
  const [locale, setLocale] = useState<Locale>(() =>
    read('live-load.language', 'en') === 'ar' ? 'ar' : 'en',
  );
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = read('live-load.theme', 'system');
    return saved === 'light' || saved === 'dark' ? saved : 'system';
  });
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    try {
      localStorage.setItem('live-load.language', locale);
    } catch {
      /* Preferences are optional. */
    }
  }, [locale]);
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      document.documentElement.dataset.theme =
        theme === 'system' ? (query.matches ? 'dark' : 'light') : theme;
    };
    apply();
    query.addEventListener('change', apply);
    try {
      localStorage.setItem('live-load.theme', theme);
    } catch {
      /* Preferences are optional. */
    }
    return () => query.removeEventListener('change', apply);
  }, [theme]);
  return { locale, setLocale, theme, setTheme };
}
