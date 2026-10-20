import { useState, useCallback, useRef, useEffect } from 'react';

// Sistema de notificaciones flotantes (extraído de App.jsx, Fase 1).
// Misma API que el código original: [toasts, addToast].
// opts: { duration, action: { label, onClick } } para toasts con acción.
export function useToasts() {
  const [toasts, setToasts] = useState([]);
  // Los timers se guardan para poder cancelarlos: antes el setTimeout de
  // auto-descarte no se limpiaba nunca, disparaba contra toasts ya quitados
  // y sobrevivia al desmontaje del componente.
  const timersRef = useRef(new Map());

  const quitarToast = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'success', opts = {}) => {
    const id = Date.now() + Math.random().toString(36).slice(2, 11);
    setToasts(prev => [...prev, { id, message, type, action: opts.action || null }]);
    const timer = setTimeout(() => {
      timersRef.current.delete(id);
      setToasts(prev => prev.filter(t => t.id !== id));
    }, opts.duration || 4500);
    timersRef.current.set(id, timer);
    return id;
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(timer => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  return { toasts, addToast, quitarToast };
}
