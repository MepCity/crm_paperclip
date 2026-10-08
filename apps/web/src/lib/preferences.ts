"use client";

import {
  createContext,
  createElement,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

export type PreferenceValue = string | number | boolean;

export type PreferenceScope = {
  orgSlug: string;
  userId: string;
};

const PreferenceContext = createContext<PreferenceScope | null>(null);

export type PreferenceProviderProps = PreferenceScope & {
  children: ReactNode;
};

export function PreferenceProvider({ orgSlug, userId, children }: PreferenceProviderProps) {
  const scope = useMemo(() => ({ orgSlug, userId }), [orgSlug, userId]);
  return createElement(PreferenceContext.Provider, { value: scope }, children);
}

function buildStorageKey(scope: PreferenceScope | null, preferenceKey: string): string {
  if (!scope) {
    return `crm:pref:__memory__:${preferenceKey}`;
  }
  return `crm:pref:${scope.orgSlug}:${scope.userId}:${preferenceKey}`;
}

function matchesPreferenceType(value: unknown, defaultValue: PreferenceValue): boolean {
  return typeof value === typeof defaultValue;
}

function parseStoredValue<T extends PreferenceValue>(raw: string, defaultValue: T): T | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!matchesPreferenceType(parsed, defaultValue)) {
      return null;
    }
    return parsed as T;
  } catch {
    return null;
  }
}

function safeGetItem(storageKey: string): string | null {
  try {
    return localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function safeSetItem(storageKey: string, value: PreferenceValue): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // Quota, private mode, or disabled storage — memory-only fallback.
  }
}

const memoryValues = new Map<string, PreferenceValue>();
/** Keys read from storage with no valid persisted value (per-consumer defaults apply). */
const storageReadWithoutValue = new Set<string>();
const listeners = new Map<string, Set<() => void>>();

function subscribe(storageKey: string, listener: () => void): () => void {
  let set = listeners.get(storageKey);
  if (!set) {
    set = new Set();
    listeners.set(storageKey, set);
  }
  set.add(listener);
  return () => {
    set?.delete(listener);
    if (set?.size === 0) {
      listeners.delete(storageKey);
    }
  };
}

function notify(storageKey: string): void {
  for (const listener of listeners.get(storageKey) ?? []) {
    listener();
  }
}

function readSnapshot<T extends PreferenceValue>(
  storageKey: string,
  defaultValue: T,
  canPersist: boolean,
): T {
  if (memoryValues.has(storageKey)) {
    const stored = memoryValues.get(storageKey);
    if (stored !== undefined && matchesPreferenceType(stored, defaultValue)) {
      return stored as T;
    }
    return defaultValue;
  }
  if (storageReadWithoutValue.has(storageKey)) {
    return defaultValue;
  }
  if (canPersist) {
    const raw = safeGetItem(storageKey);
    if (raw === null) {
      storageReadWithoutValue.add(storageKey);
      return defaultValue;
    }
    const parsed = parseStoredValue(raw, defaultValue);
    if (parsed === null) {
      storageReadWithoutValue.add(storageKey);
      return defaultValue;
    }
    memoryValues.set(storageKey, parsed);
    return parsed;
  }
  return defaultValue;
}

/** Clears in-memory preference state between tests. */
export function resetPreferenceStoreForTests(): void {
  memoryValues.clear();
  storageReadWithoutValue.clear();
  listeners.clear();
}

export function usePreference(
  key: string,
  defaultValue: boolean,
): readonly [value: boolean, setValue: (next: boolean) => void];
export function usePreference(
  key: string,
  defaultValue: number,
): readonly [value: number, setValue: (next: number) => void];
export function usePreference(
  key: string,
  defaultValue: string,
): readonly [value: string, setValue: (next: string) => void];
export function usePreference<T extends PreferenceValue>(
  key: string,
  defaultValue: T,
): readonly [value: T, setValue: (next: T) => void];
export function usePreference<T extends PreferenceValue>(
  key: string,
  defaultValue: T,
): readonly [value: T, setValue: (next: T) => void] {
  const scope = useContext(PreferenceContext);
  const storageKey = buildStorageKey(scope, key);
  const canPersist = scope !== null;

  const subscribeToStore = useCallback(
    (onStoreChange: () => void) => subscribe(storageKey, onStoreChange),
    [storageKey],
  );

  const value = useSyncExternalStore(
    subscribeToStore,
    () => readSnapshot(storageKey, defaultValue, canPersist),
    () => defaultValue,
  );

  const setValue = useCallback(
    (next: T) => {
      storageReadWithoutValue.delete(storageKey);
      memoryValues.set(storageKey, next);
      if (canPersist) {
        safeSetItem(storageKey, next);
      }
      notify(storageKey);
    },
    [storageKey, canPersist],
  );

  return [value, setValue];
}
