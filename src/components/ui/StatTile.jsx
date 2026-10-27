import React from 'react';
import AnimatedNumber from '../AnimatedNumber';

/**
 * StatTile — indicador numerico.
 *
 * Reemplaza a los StatCard/DonutChart sueltos: cada vista se escribia su
 * propia version de "tarjeta con un numero grande" y los colores se elegian
 * comparando el NOMBRE de la clase (`colorClass.includes("green")`), que se
 * rompe en cuanto Tailwind renombra una utilidad.
 */

const TONOS = {
  neutral: { valor: 'text-content-1', fondo: 'bg-surface-3', icono: 'text-content-3' },
  brand: { valor: 'text-brand-text', fondo: 'bg-brand-soft', icono: 'text-brand-text' },
  ok: { valor: 'text-ok', fondo: 'bg-ok-soft', icono: 'text-ok' },
  warn: { valor: 'text-warn', fondo: 'bg-warn-soft', icono: 'text-warn' },
  danger: { valor: 'text-danger', fondo: 'bg-danger-soft', icono: 'text-danger' },
  info: { valor: 'text-info', fondo: 'bg-info-soft', icono: 'text-info' }
};

export default function StatTile({
  etiqueta,
  valor,
  sub,
  icono,
  tono = 'neutral',
  animado = true,
  className = '',
  onClick,
  progress,        // 0-100, opcional: barra delgada bajo el valor
  progressColor,   // token de color para la barra (brand, ok, warn, info, danger)
}) {
  const t = TONOS[tono] || TONOS.neutral;
  const Contenedor = onClick ? 'button' : 'div';
  const pct = progress != null ? Math.max(0, Math.min(100, Number(progress))) : 0;

  return (
    <Contenedor
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`flex flex-col gap-2 p-4 rounded-panel bg-surface-1 border border-line shadow-card text-left w-full ${ onClick ? 'hover:-translate-y-0.5 hover:shadow-panel motion cursor-pointer focus-visible:ring-2 focus-visible:ring-brand' : '' } ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        {icono ? (
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-control ${t.fondo} ${t.icono}`} aria-hidden="true">
            <i className={`fa-solid ${icono}`} />
          </span>
        ) : null}
        {onClick ? <i className="fa-solid fa-chevron-right text-[10px] text-content-3 group-hover:text-brand group-hover:translate-x-0.5 motion" aria-hidden="true" /> : null}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-label font-semibold text-content-2 uppercase tracking-wide truncate">{etiqueta}</p>
        <p className={`text-display font-black tabular-nums leading-tight mt-0.5 ${t.valor}`}>
          {animado && typeof valor === 'number' ? <AnimatedNumber value={valor} /> : valor}
        </p>
        {sub ? <p className="text-label text-content-3 truncate">{sub}</p> : null}
        {pct > 0 ? (
          <div className="mt-1.5 h-1.5 w-full bg-surface-3 dark:bg-surface-1/5 rounded-full overflow-hidden">
            <div className={`h-full rounded-full motion duration-[var(--dur-slow)] ${ progressColor ? 'bg-' + progressColor : 'bg-brand' } shadow-xs shadow-${ progressColor ? progressColor + '/40' : 'brand/30' }`} style={{ width: pct + '%' }}></div>
          </div>
        ) : null}
      </div>
    </Contenedor>
  );
}

/** Rejilla de indicadores. */
export function KpiGrid({ columnas = 4, className = '', children }) {
  const cols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4'
  };
  return (
    <div className={`grid gap-3 ${cols[columnas] || cols[4]} ${className}`}>
      {children}
    </div>
  );
}
