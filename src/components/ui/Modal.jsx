import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * Modal — diálogo del sistema.
 *
 * Reemplaza los 11 overlays escritos a mano, ninguno de los cuales tenia:
 *   - role="dialog" / aria-modal (solo 5 de 17 modales lo tenian)
 *   - trampa de foco: se podia tabular hacia el contenido de atras
 *   - cierre con Escape
 *   - devolucion del foco al elemento que lo abrio
 *
 * En movil (hasta `sm`) se comporta como bottom sheet; en escritorio, como
 * dialogo centrado. Esa intencion ya existia en index.css pero las clases
 * no existian en el DOM, asi que nunca se aplico.
 */

const TAMANOS = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-2xl',
  lg: 'sm:max-w-4xl',
  xl: 'sm:max-w-6xl',
  full: 'sm:max-w-[95vw]'
};

const FOCUSABLES =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({
  abierto,
  onCerrar,
  titulo,
  descripcion,
  icono,
  tamano = 'md',
  pie,
  children,
  className = '',
  cerrarAlPulsarFuera = true,
  etiquetaCerrar = 'Cerrar'
}) {
  const panelRef = useRef(null);
  const devolverFocoRef = useRef(null);

  // Escape cierra y el foco queda atrapado dentro del dialogo.
  const onTecla = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (onCerrar) onCerrar();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focalizables = Array.from(panelRef.current.querySelectorAll(FOCUSABLES)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
      if (!focalizables.length) return;
      const primero = focalizables[0];
      const ultimo = focalizables[focalizables.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    },
    [onCerrar]
  );

  useEffect(() => {
    if (!abierto) return undefined;
    devolverFocoRef.current = document.activeElement;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // El primer control util recibe el foco.
    const t = setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const primer = panel.querySelector(FOCUSABLES);
      (primer || panel).focus();
    }, 40);

    return () => {
      clearTimeout(t);
      document.body.style.overflow = overflowAnterior;
      const devolver = devolverFocoRef.current;
      if (devolver && typeof devolver.focus === 'function') devolver.focus();
    };
  }, [abierto]);

  if (!abierto) return null;
  if (typeof document === 'undefined' || !document.body) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in-fast"
      onMouseDown={(e) => {
        if (cerrarAlPulsarFuera && e.target === e.currentTarget && onCerrar) onCerrar();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof titulo === 'string' ? titulo : undefined}
        tabIndex={-1}
        onKeyDown={onTecla}
        className={`w-full ${TAMANOS[tamano] || TAMANOS.md} bg-surface-1 text-content-1 rounded-t-panel sm:rounded-panel border border-line shadow-pop flex flex-col max-h-[92dvh] outline-none animate-scale-in ${className}`}
      >
        {(titulo || onCerrar) && (
          <div className="flex items-start justify-between gap-4 px-5 sm:px-6 py-4 border-b border-line bg-surface-1 shrink-0">
            <div className="flex items-start gap-3 min-w-0">
              {icono ? (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-brand-soft text-brand-text" aria-hidden="true">
                  <i className={`fa-solid ${icono}`} />
                </span>
              ) : null}
              <div className="min-w-0">
                {titulo ? <h2 className="text-title font-bold text-content-1 truncate">{titulo}</h2> : null}
                {descripcion ? <p className="text-label text-content-2 mt-0.5">{descripcion}</p> : null}
              </div>
            </div>
            {onCerrar ? (
              <button
                type="button"
                onClick={onCerrar}
                aria-label={etiquetaCerrar}
                className="h-8 w-8 shrink-0 rounded-control flex items-center justify-center text-content-3 hover:bg-surface-3 hover:text-content-1 transition-[background-color,color,transform] duration-[var(--dur-fast)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <i className="fa-solid fa-xmark text-xs" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar">{children}</div>

        {pie ? (
          <div className="flex flex-wrap items-center justify-end gap-2 px-5 sm:px-6 py-4 border-t border-line bg-surface-2 shrink-0">
            {pie}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}

/** Panel lateral. En escritorio entra por la derecha; en movil, a pantalla completa. */
export function Drawer({ abierto, onCerrar, titulo, descripcion, ancho = 'sm:max-w-xl', children, pie }) {
  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={titulo}
      descripcion={descripcion}
      tamano="full"
      className={`sm:!max-w-none sm:!w-full ${ancho} sm:ml-auto sm:rounded-none sm:rounded-l-panel`}
      pie={pie}
    >
      {children}
    </Modal>
  );
}
