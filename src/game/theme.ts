import { useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

const KEY = 'passwordle.theme.v1';

/** Kept in sync with the colours at the top of index.css. */
const BAR: Record<Theme, string> = { light: '#ffffff', dark: '#121214' };

const listeners = new Set<() => void>();

function systemTheme(): Theme {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function stored(): Theme | null {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

/**
 * The snippet in index.html has already written this before React boots, so
 * the attribute — not storage — is the source of truth from here on.
 */
function current(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BAR[theme]);
}

export function setTheme(theme: Theme) {
  apply(theme);
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // It will follow the system again next visit, which is a fair fallback.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  // Follow the system until they pick a side themselves.
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const onSystemChange = () => {
    if (stored()) return;
    apply(systemTheme());
    listener();
  };
  media.addEventListener('change', onSystemChange);

  return () => {
    listeners.delete(listener);
    media.removeEventListener('change', onSystemChange);
  };
}

export function useTheme(): [Theme, () => void] {
  const theme = useSyncExternalStore(subscribe, current, () => 'light' as const);
  return [theme, () => setTheme(theme === 'dark' ? 'light' : 'dark')];
}
