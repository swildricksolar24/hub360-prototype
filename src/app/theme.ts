import { useEffect, useState } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';
const KEY = 'hub360.theme';

function read(): ThemePreference {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

/** Applies a theme to <html> (see src/design-system.md). "system" removes the attribute so tokens follow the OS. */
export function applyTheme(pref: ThemePreference) {
  if (pref === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', pref);
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemePreference>(read);
  useEffect(() => {
    applyTheme(theme);
    try {
      if (theme === 'system') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, theme);
    } catch {
      /* preference not persisted */
    }
  }, [theme]);
  return [theme, setTheme] as const;
}

// Apply the saved preference before first paint.
applyTheme(read());
