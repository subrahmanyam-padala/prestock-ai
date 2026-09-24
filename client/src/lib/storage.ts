import { useCallback, useEffect, useRef, useState } from 'react';

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable or full: the app keeps working in memory */
  }
}

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readJson(key, initial));
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    writeJson(key, value);
  }, [key, value]);
  const set = useCallback((v: T | ((p: T) => T)) => setValue(v), []);
  return [value, set] as const;
}
