import React from 'react';

/**
 * PageHeader — cabecera de módulo.
 *
 * Este componente reemplaza las 8 cabeceras que cada vista se escribía a mano
 * (y las 5 que usaban otro patrón). El problema que resolvía era concreto:
 * en `sm:flex-row` con `justify-between` y todos los hijos con `shrink-0`,
 * cinco bloques de toolbar (título, filtros, periodo y dos botones) no
 * entraban en el ancho disponible y el último se salía de la tarjeta.
 *
 * Reglas de la cabecera:
 *   - Título + descripción a la izquierda, con `min-w-0` para que trunquen.
 *   - Acciones a la derecha, con `flex-wrap` para que bajen de línea.
 *   - Los FILTROS van en una <Toolbar> aparte, no en la cabecera. La cabecera
 *     es identidad del módulo; los filtros son control.
 */

export default function PageHeader({
  titulo,
  descripcion,
  icono,
  acciones,
  contador,
  children,
  className = ''
}) {
  return (
    <header
      className={`flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6 animate-fade-up ${className}`}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {icono ? (
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-brand-soft text-brand-text border border-brand/10 shadow-xs"
            aria-hidden="true"
          >
            <i className={`fa-solid ${icono}`} />
          </span>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-title font-bold text-content-1 tracking-tight leading-tight">{titulo}</h1>
            {contador}
          </div>
          {descripcion ? (
            <p className="text-label text-content-2 mt-1 leading-relaxed">{descripcion}</p>
          ) : null}
          {children}
        </div>
      </div>

      {acciones ? (
        // flex-wrap + min-w-0: si no entran, bajan de línea en vez de salirse.
        <div className="flex w-full min-w-0 flex-wrap items-center gap-2 lg:w-auto lg:shrink-0 lg:justify-end">
          {acciones}
        </div>
      ) : null}
    </header>
  );
}

/**
 * Toolbar — fila de controles de un módulo (buscador, filtros, acciones).
 * Va DEBAJO del PageHeader, en su propia tarjeta o directamente sobre el fondo.
 */
export function Toolbar({ className = '', children, ...resto }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2 sm:gap-2.5 ${className}`}
      {...resto}
    >
      {children}
    </div>
  );
}

/** Separador vertical entre grupos de controles de la toolbar. */
export function ToolbarDivider({ className = '' }) {
  return <span aria-hidden="true" className={`hidden sm:block w-px h-6 bg-line ${className}`} />;
}
