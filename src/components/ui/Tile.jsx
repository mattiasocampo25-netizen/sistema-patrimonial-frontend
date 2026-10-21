import React from 'react';
import ProgressRing from './ProgressRing';

/**
 * Tile — tarjeta pastel con logo, estado y anillo de progreso.
 *
 * Es la pieza central de la referencia: una tarjeta de color suave con la
 * ilustracion (aqui, el logo de la dependencia), el nombre, el estado y un
 * anillo con el porcentaje. La paleta pastel se asigna por indice para que
 * las ocho dependencias siempre salgan distintas.
 */

const PALETA = [
  'bg-pastel-1',
  'bg-pastel-2',
  'bg-pastel-3',
  'bg-pastel-4',
  'bg-pastel-5',
  'bg-pastel-6',
  'bg-pastel-7',
  'bg-pastel-8'
];

export default function Tile({
  titulo,
  subtitulo,
  estado,
  porcentaje,
  indice = 0,
  logo,
  onClick,
  accion,
  className = ''
}) {
  const fondo = PALETA[indice % PALETA.length];
  const Etiqueta = onClick ? 'button' : 'div';

  return (
    <Etiqueta
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`group flex flex-col gap-3 rounded-card ${fondo} p-4 text-left border border-black/[0.04] dark:border-white/[0.06] shadow-sm transition-[transform,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-out)] ${
        onClick ? 'hover:-translate-y-1 hover:shadow-panel cursor-pointer' : ''
      } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-content-1 truncate" title={titulo}>
            {titulo}
          </p>
          {subtitulo ? (
            <p className="text-label text-content-2 truncate mt-0.5">{subtitulo}</p>
          ) : null}
        </div>
        {porcentaje !== undefined && porcentaje !== null ? (
          <ProgressRing
            valor={porcentaje}
            etiqueta={`${titulo}: ${Math.round(porcentaje)}%`}
          />
        ) : null}
      </div>

      {logo ? (
        <div className="h-16 flex items-center justify-center">
          <img
            src={logo}
            alt=""
            className="max-h-14 max-w-[80%] object-contain opacity-90 transition-transform duration-[var(--dur-base)] group-hover:scale-105"
            loading="lazy"
          />
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2 mt-auto">
        {estado ? (
          <span className="text-label font-semibold text-content-2">{estado}</span>
        ) : (
          <span />
        )}
        {accion ? (
          <span className="inline-flex items-center gap-1 text-label font-bold text-content-1">
            {accion}
            <i className="fa-solid fa-arrow-up-right-from-square text-[9px]" aria-hidden="true" />
          </span>
        ) : null}
      </div>
    </Etiqueta>
  );
}
