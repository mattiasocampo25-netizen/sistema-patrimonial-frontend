import React, { useState, useEffect, useRef } from 'react';
import { useReducirMovimiento } from '../hooks/useReducirMovimiento';

/**
 * Número con animación de conteo suave al cambiar de valor.
 *
 * Si el usuario pidio menos movimiento (por el sistema o por el interruptor
 * de la app), el numero aparece directamente en su valor final: contar hacia
 * arriba es justo el tipo de movimiento que molesta.
 */
export default function AnimatedNumber({ value, className }) {
  const [shown, setShown] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef(0);
  const reducir = useReducirMovimiento();

  useEffect(() => {
    const target = Number(value) || 0;
    const from = fromRef.current;
    if (from === target) {
      setShown(target);
      return undefined;
    }

    if (reducir) {
      fromRef.current = target;
      setShown(target);
      return undefined;
    }

    const start = performance.now();
    const dur = 600;
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = Math.round(from + (target - from) * eased);
      setShown(current);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, reducir]);

  return (
    <span className={className}>
      {Number(shown).toLocaleString('es-PY')}
    </span>
  );
}
