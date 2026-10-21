import React from 'react';

/**
 * Badge — etiqueta de estado (contadores, estados de firma, tipos).
 * Reemplaza los ~9 `rounded-full text-[10px] font-bold bg-*-50 ...` sueltos.
 */

const TONOS = {
  neutral: 'bg-surface-3 text-content-2 border-line',
  brand: 'bg-brand-soft text-brand-text border-brand/25',
  ok: 'bg-ok-soft text-ok border-ok/25',
  warn: 'bg-warn-soft text-warn border-warn/25',
  danger: 'bg-danger-soft text-danger border-danger/25',
  info: 'bg-info-soft text-info border-info/25'
};

export default function Badge({ tono = 'neutral', icono, children, className = '', ...resto }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-label font-semibold border whitespace-nowrap ${TONOS[tono] || TONOS.neutral} ${className}`}
      {...resto}
    >
      {icono ? <i className={`fa-solid ${icono} text-[0.85em]`} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

/**
 * Chip — filtro activable. Sustituye a los botones de etapa que vivian
 * pegados al titulo (que era parte de lo que desbordaba la cabecera).
 */
export function Chip({ activo = false, conteo, onClick, children, className = '', ...resto }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-control text-label font-semibold border transition-colors duration-[var(--dur-fast)] ${ activo ? 'bg-brand text-content-inverse border-brand shadow-sm' : 'bg-surface-1 text-content-2 border-line hover:bg-surface-2 hover:text-content-1' } ${className}`}
      {...resto}
    >
      {children}
      {conteo !== undefined && conteo !== null ? (
        <span className={`tabular-nums ${activo ? 'opacity-90' : 'text-content-3'}`}>{conteo}</span>
      ) : null}
    </button>
  );
}

/** Grupo de chips (control segmentado). */
export function ChipGroup({ className = '', children, ...resto }) {
  return (
    <div role="group" className={`inline-flex flex-wrap items-center gap-1.5 ${className}`} {...resto}>
      {children}
    </div>
  );
}
