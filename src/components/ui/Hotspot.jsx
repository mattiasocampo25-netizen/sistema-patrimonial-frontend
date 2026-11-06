import React, { useState, useRef, useEffect } from 'react';

/**
 * Hotspot — punto de ayuda contextual (tooltip).
 *
 * Se coloca sobre elementos de la interfaz para explicar su función sin
 * saturar la pantalla. Solo se muestra si el usuario activa
 * "Mostrar consejos" desde el Centro de Ayuda (controlado por
 * `activo`). Al hacer clic o pasar el mouse, aparece un tooltip con el
 * texto de ayuda.
 *
 * Uso:
 *   <Hotspot activo={mostrarConsejos} texto="Crea un bien nuevo en el inventario">
 *     <Button ...>Nuevo bien</Button>
 *   </Hotspot>
 */
export default function Hotspot({ children, texto, activo = false, colocacion = 'arriba' }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const mostrarTooltip = () => { if (activo) setAbierto(true); };
  const ocultarTooltip = () => setAbierto(false);

  const direccion = {
    arriba: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    abajo: 'top-full left-1/2 -translate-x-1/2 mt-2',
    izquierda: 'right-full top-1/2 -translate-y-1/2 mr-2',
    derecha: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[colocacion];

  return (
    <span
      ref={ref}
      className="relative inline-block cursor-help"
      onMouseEnter={mostrarTooltip}
      onMouseLeave={ocultarTooltip}
      onClick={(e) => { e.preventDefault(); if (activo) setAbierto(!abierto); }}
    >
      {activo && (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white shadow-sm animate-pulse">
          <i className="fa-solid fa-circle-info" aria-hidden="true" />
        </span>
      )}
      {!activo && (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-3 dark:bg-surface-1/5 text-[10px] font-medium text-content-3">
          <i className="fa-regular fa-circle-info" aria-hidden="true" />
        </span>
      )}
      {children}

      {activo && abierto && (
        <span
          className={`absolute z-50 ${direccion} whitespace-nowrap rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white shadow-xl animate-fade-in pointer-events-none`}
          style={{ zIndex: 600 }}
          role="tooltip"
        >
          {texto}
        </span>
      )}
    </span>
  );
}
