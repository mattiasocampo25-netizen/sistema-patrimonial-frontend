import React from 'react';
import Button from './Button';

/**
 * EmptyState — estado vacío de un módulo.
 *
 * Hoy solo hay 3 en toda la app y cada vista escribe el suyo. Un estado
 * vacío tiene que distinguir tres cosas que se confunden:
 *   - no hay nada todavia (nunca se cargo)
 *   - no hay resultados (los filtros no coinciden)
 *   - hay un error (no se pudo cargar)
 */

const ICONOS = {
  vacio: 'fa-boxes-packing',
  filtro: 'fa-filter-circle-xmark',
  error: 'fa-triangle-exclamation',
  busqueda: 'fa-magnifying-glass'
};

export default function EmptyState({
  tipo = 'vacio',
  icono,
  icon,
  titulo,
  descripcion,
  accion,
  accionLabel,
  onAccion,
  className = ''
}) {
  const esError = tipo === 'error';

  return (
    <div
      role={esError ? 'alert' : 'status'}
      className={`flex flex-col items-center justify-center text-center py-12 px-6 rounded-panel border border-dashed animate-scale-in ${ esError ? 'border-danger/40 bg-danger-soft' : 'border-line bg-surface-1' } ${className}`}
    >
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-card mb-4 ${ esError ? 'bg-danger/10 text-danger' : 'bg-brand-soft text-brand-text' }`}
        aria-hidden="true"
      >
        <i className={`fa-solid ${icono || icon || ICONOS[tipo] || ICONOS.vacio} text-xl`} />
      </span>

      <p className="text-title font-bold text-content-1">{titulo}</p>
      {descripcion ? (
        <p className="text-body text-content-2 mt-1.5 max-w-md leading-relaxed">{descripcion}</p>
      ) : null}

      {(accion || accionLabel) && onAccion ? (
        <Button variante={esError ? 'primary' : 'secondary'} onClick={onAccion} className="mt-5">
          {accion || accionLabel}
        </Button>
      ) : null}
    </div>
  );
}

/**
 * Skeleton — placeholder de carga. Reemplaza al SkeletonLoader único, que
 * era una sola forma para tablas, tarjetas y paneles.
 */
export function Skeleton({ className = '', variante = 'texto' }) {
  const formas = {
    texto: 'h-3 rounded bg-surface-3',
    linea: 'h-2.5 rounded bg-surface-3',
    bloque: 'rounded-control bg-surface-3',
    circulo: 'rounded-full bg-surface-3'
  };
  return <div aria-hidden="true" className={`${formas[variante] || formas.texto} ${className}`} />;
}

/** Grupo de esqueletos con el pulso (para listas y tablas). */
export function SkeletonGroup({ filas = 5, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`} aria-hidden="true">
      {Array.from({ length: filas }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton variante="circulo" className="h-9 w-9 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton variante="texto" className="w-1/3" />
            <Skeleton variante="linea" className="w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
