import { useCallback, useMemo, useSyncExternalStore } from 'react';

const cache = new Map();
const listeners = new Map();

function leer(key, fallback, normalizar) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return normalizar(JSON.parse(raw));
  } catch {
    return fallback;
  }
}

function obtener(key, fallback, normalizar) {
  if (!cache.has(key)) cache.set(key, leer(key, fallback, normalizar));
  return cache.get(key);
}

function notificar(key) {
  (listeners.get(key) || []).forEach(listener => listener());
}

/** Preferencias visuales locales separadas por usuario, sin sincronización remota. */
export default function useScopedPreference(namespace, identity, fallback, normalizar = value => value) {
  const key = useMemo(() => {
    const usuario = String(identity || 'anon').trim().toLocaleLowerCase('es');
    return namespace + ':' + encodeURIComponent(usuario);
  }, [namespace, identity]);

  const subscribe = useCallback(listener => {
    const subs = listeners.get(key) || new Set();
    subs.add(listener);
    listeners.set(key, subs);
    const alCambiarEnOtraPestana = event => {
      if (event.key !== key) return;
      cache.set(key, event.newValue === null ? fallback : leer(key, fallback, normalizar));
      notificar(key);
    };
    window.addEventListener('storage', alCambiarEnOtraPestana);
    return () => {
      subs.delete(listener);
      if (subs.size === 0) listeners.delete(key);
      window.removeEventListener('storage', alCambiarEnOtraPestana);
    };
  }, [key, fallback, normalizar]);

  const getSnapshot = useCallback(() => obtener(key, fallback, normalizar), [key, fallback, normalizar]);
  const getServerSnapshot = useCallback(() => fallback, [fallback]);
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(nextValue => {
    const actual = obtener(key, fallback, normalizar);
    const siguiente = typeof nextValue === 'function' ? nextValue(actual) : nextValue;
    cache.set(key, siguiente);
    try { localStorage.setItem(key, JSON.stringify(siguiente)); } catch { /* preferencia opcional */ }
    notificar(key);
  }, [key, fallback, normalizar]);

  return [value, setValue];
}
