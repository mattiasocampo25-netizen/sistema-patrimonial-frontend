import { useEffect, useState } from 'react';

/**
 * useReducirMovimiento — hay que quitar el movimiento?
 *
 * Contempla las DOS fuentes que existen en el sistema:
 *   1. la preferencia del sistema operativo (`prefers-reduced-motion`),
 *   2. el interruptor "Reducir animaciones" del menu de apariencia, que
 *      pone la clase `reduce-motion` en <html>.
 *
 * El CSS ya respeta las dos (tokens.css y el bloque `.reduce-motion` de
 * index.css), pero las animaciones escritas en JS no las cubre: el contador
 * de numeros y el tour se mueven igual. Por eso preguntan aqui.
 *
 * Se vigila la clase del <html> con un MutationObserver porque la aplica
 * otro componente (AppTopbar) y no hay un contexto que los una.
 */
function detectar() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  try {
    if (document.documentElement.classList.contains('reduce-motion')) return true;
  } catch { /* ignore */ }
  try {
    return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function useReducirMovimiento() {
  const [reducir, setReducir] = useState(detectar);

  useEffect(() => {
    const alCambiar = () => setReducir(detectar());

    const consulta = typeof window !== 'undefined' ? window.matchMedia?.('(prefers-reduced-motion: reduce)') : null;
    consulta?.addEventListener?.('change', alCambiar);

    let observador = null;
    if (typeof MutationObserver !== 'undefined') {
      observador = new MutationObserver(alCambiar);
      observador.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }

    return () => {
      consulta?.removeEventListener?.('change', alCambiar);
      observador?.disconnect();
    };
  }, []);

  return reducir;
}

export default useReducirMovimiento;
