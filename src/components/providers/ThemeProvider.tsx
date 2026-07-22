'use client';

import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';

export function applyTheme(theme: Theme, prefersDark = false) {
  const dark = theme === 'dark' || (theme === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const saved = (localStorage.getItem('mk9-theme') as Theme | null) ?? 'system';
    setTheme(saved);
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    applyTheme(saved, media.matches);
    const listener = () => saved === 'system' && applyTheme('system', media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const next = (event as CustomEvent<Theme>).detail;
      localStorage.setItem('mk9-theme', next);
      setTheme(next);
      applyTheme(next, window.matchMedia('(prefers-color-scheme: dark)').matches);
    };
    window.addEventListener('mk9-theme', handler);
    return () => window.removeEventListener('mk9-theme', handler);
  }, []);

  return <div data-current-theme={theme}>{children}</div>;
}
