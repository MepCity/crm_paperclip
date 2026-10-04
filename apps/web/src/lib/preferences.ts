import {
  createContext,
  createElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
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
const listeners = new Map<string, Set<() => void>>();

function getMemoryValue<T extends PreferenceValue>(storageKey: string, defaultValue: T): T {
  const stored = memoryValues.get(storageKey);
  if (stored === undefined) {
    return defaultValue;
  }
  if (!matchesPreferenceType(stored, defaultValue)) {
    return defaultValue;
  }
  return stored as T;
}

function setMemoryValue(storageKey: string, value: PreferenceValue): void {
  memoryValues.set(storageKey, value);
}

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

function loadPersistedValue<T extends PreferenceValue>(storageKey: string, defaultValue: T): T {
  const raw = safeGetItem(storageKey);
  if (raw === null) {
    return defaultValue;
  }
  const parsed = parseStoredValue(raw, defaultValue);
  return parsed ?? defaultValue;
}

/** Clears in-memory preference state between tests. */
export function resetPreferenceStoreForTests(): void {
  memoryValues.clear();
  listeners.clear();
}

export function usePreference<T extends PreferenceValue>(
  key: string,
  defaultValue: T,
): readonly [value: T, setValue: (next: T) => void] {
  const scope = useContext(PreferenceContext);
  const storageKey = buildStorageKey(scope, key);
  const canPersist = scope !== null;

  const [value, setValueState] = useState<T>(defaultValue);

  useEffect(() => {
    const hydrated = canPersist
      ? loadPersistedValue(storageKey, defaultValue)
      : getMemoryValue(storageKey, defaultValue);
    setMemoryValue(storageKey, hydrated);
    setValueState(hydrated);

    return subscribe(storageKey, () => {
      setValueState(getMemoryValue(storageKey, defaultValue));
    });
  }, [storageKey, defaultValue, canPersist]);

  const setValue = useCallback(
    (next: T) => {
      setMemoryValue(storageKey, next);
      setValueState(next);
      if (canPersist) {
        safeSetItem(storageKey, next);
      }
      notify(storageKey);
    },
    [storageKey, canPersist],
  );

  return [value, setValue];
}
