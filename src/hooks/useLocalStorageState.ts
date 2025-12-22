import { useState, useEffect, useCallback } from "react";
import { load, save } from "@/lib/storage";

export function useLocalStorageState<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Inicializa com valor do localStorage ou valor inicial
  const [state, setState] = useState<T>(() => {
    return load(key, initialValue);
  });

  // Persiste no localStorage quando o estado muda
  useEffect(() => {
    save(key, state);
  }, [key, state]);

  // Wrapper que permite tanto valor direto quanto função updater
  const setPersistedState = useCallback((value: T | ((prev: T) => T)) => {
    setState((prev) => {
      const newValue = typeof value === "function" ? (value as (prev: T) => T)(prev) : value;
      return newValue;
    });
  }, []);

  return [state, setPersistedState];
}
