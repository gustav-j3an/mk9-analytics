'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Theme } from '@/components/providers/ThemeProvider';

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next: Theme = dark ? 'light' : 'dark';
    setDark(!dark);
    window.dispatchEvent(new CustomEvent('mk9-theme', { detail: next }));
  }

  return <button type="button" onClick={toggle} aria-label={dark ? 'Ativar tema claro' : 'Ativar tema escuro'} className="icon-button">{dark ? <Sun /> : <Moon />}</button>;
}
