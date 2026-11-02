import { useSyncExternalStore } from 'react';

export type Contrast = 'normal' | 'high';
export type TextSize = 'small' | 'regular' | 'large';

export interface Settings {
  contrast: Contrast;
  text: TextSize;
}

const KEY = 'passwordle.settings.v1';

export const DEFAULTS: Settings = { contrast: 'normal', text: 'regular' };

const listeners = new Set<() => void>();

function isContrast(value: unknown): value is Contrast {
  return value === 'normal' || value === 'high';
}

function isTextSize(value: unknown): value is TextSize {
  return value === 'small' || value === 'regular' || value === 'large';
}

function stored(): Partial<Settings> {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? (parsed as Partial<Settings>) : {};
  } catch {
    return {};
  }
}

/**
 * The snippet in index.html has already written both attributes before React
 * boots, so — as with the theme — the document, not storage, is what the rest
 * of the app reads. Storage is only consulted if that snippet never ran.
 */
function read(): Settings {
  const { contrast, text } = document.documentElement.dataset;
  const saved = stored();
  return {
    contrast: isContrast(contrast) ? contrast : isContrast(saved.contrast) ? saved.contrast : DEFAULTS.contrast,
    text: isTextSize(text) ? text : isTextSize(saved.text) ? saved.text : DEFAULTS.text,
  };
}

function apply(settings: Settings) {
  document.documentElement.dataset.contrast = settings.contrast;
  document.documentElement.dataset.text = settings.text;
}

/**
 * useSyncExternalStore compares snapshots by identity, so this has to be one
 * object that only changes when a setting does.
 */
let snapshot: Settings = typeof document === 'undefined' ? DEFAULTS : read();

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  if (snapshot[key] === value) return;

  snapshot = { ...snapshot, [key]: value };
  apply(snapshot);
  try {
    localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    // Private browsing or a full quota: the setting holds for this visit only.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSettings(): Settings {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => DEFAULTS,
  );
}
