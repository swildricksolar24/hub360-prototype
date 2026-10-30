import { useSyncExternalStore } from 'react';

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

// One shared preference, so the account menu and the theme toggle stay in sync.
let current = read();
const listeners = new Set<() => void>();

function setTheme(pref: ThemePreference) {
  current = pref;
  applyTheme(pref);
  try {
    if (pref === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, pref);
  } catch {
    /* preference not persisted */
  }
  listeners.forEach(notify => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, () => current);
  return [theme, setTheme] as const;
}

// Apply the saved preference before first paint.
applyTheme(current);
