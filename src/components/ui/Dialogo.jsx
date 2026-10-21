import React, { useCallback, useEffect, useRef } from 'react';

/**
 * Dialogo — el overlay de los modales que todavia no usan el primitive <Modal>.
 *
 * No cambia el DOM: los modales siguen escribiendo su overlay y su contenido
 * igual que antes, pero este componente les anade lo que les faltaba:
 *   - role="dialog" + aria-modal (solo 5 de 29 modales lo tenian)
 *   - trampa de foco: se podia tabular hacia el contenido de atras
 *   - cierre con Escape
 *   - devolucion del foco al elemento que abrio el modal
 *
 * Para cerrar con Escape busca el boton de cerrar del propio modal
 * (`[aria-label="Cerrar"]` o `[data-modal-close]`) y lo pulsa. Asi cada modal
 * sigue usando su propia logica de cierre, sin duplicarla aqui.
 *
 * Sobre el clic en el fondo: el overlay hacia `onClick={cerrar}`, y como el
 * contenido esta DENTRO del overlay, el clic se propagaba y el modal se
 * cerraba tambien al pulsar dentro (tocar un campo de un formulario lo
 * cerraba). Aqui el clic solo se reenvia cuando el objetivo es el propio
 * overlay: pulsar el fondo cierra, pulsar dentro no.
 */

const FOCALIZABLES =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Dialogo({ className = '', children, onCerrar, onClick, ...resto }) {
  const ref = useRef(null);
  const openerRef = useRef(null);

  // Si el modal ya trae su propio role="dialog" en el contenido, el overlay
  // no lo repite (dos dialogos anidados en el arbol de accesibilidad).
  const setRef = useCallback((el) => {
    ref.current = el;
    if (!el) return;
    if (!el.querySelector('[role="dialog"]')) {
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'true');
    }
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    openerRef.current = document.activeElement;
    const panel = el.querySelector('[role="dialog"]') || el.firstElementChild || el;

    const cerrar = () => {
      const boton =
        el.querySelector('[aria-label="Cerrar"], [data-modal-close]') ||
        // Respaldo: un boton cuyo texto sea claramente de dismissive.
        Array.from(el.querySelectorAll('button')).find((b) =>
          /^(cancelar|continuar editando|cerrar sesi[oó]n|volver|no)$/i.test((b.textContent || '').trim())
        );
      if (boton) {
        boton.click();
        return;
      }
      if (onCerrar) {
        onCerrar();
        return;
      }
      // Ultimo recurso: pulsar el fondo, que en estos modales cierra.
      el.click();
    };

    const alTecla = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        cerrar();
        return;
      }
      if (e.key !== 'Tab') return;

      const focales = Array.from(panel.querySelectorAll(FOCALIZABLES)).filter(
        (x) => x.offsetParent !== null || x === document.activeElement
      );
      if (!focales.length) return;
      const primero = focales[0];
      const ultimo = focales[focales.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };

    document.addEventListener('keydown', alTecla, true);

    // El primer control util recibe el foco.
    const t = setTimeout(() => {
      const primero = panel.querySelector(FOCALIZABLES);
      if (primero && typeof primero.focus === 'function') primero.focus();
      else if (typeof panel.focus === 'function') panel.focus();
    }, 40);

    return () => {
      document.removeEventListener('keydown', alTecla, true);
      clearTimeout(t);
      const devolver = openerRef.current;
      if (devolver && typeof devolver.focus === 'function') devolver.focus();
    };
  }, [onCerrar]);

  return (
    <div
      ref={setRef}
      className={className}
      onClick={(e) => {
        // El clic del fondo se reenvia; el del contenido, no.
        if (e.target === e.currentTarget) {
          if (onClick) onClick(e);
          else if (onCerrar) onCerrar();
        } else {
          e.stopPropagation();
        }
      }}
      {...resto}
    >
      {children}
    </div>
  );
}
