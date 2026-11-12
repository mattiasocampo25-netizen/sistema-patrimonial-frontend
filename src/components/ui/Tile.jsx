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

const ACENTOS = [
  'before:bg-brand', 'before:bg-info', 'before:bg-ok', 'before:bg-warn',
  'before:bg-violet-500', 'before:bg-cyan-500', 'before:bg-emerald-500', 'before:bg-pink-500'
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
  const acento = ACENTOS[indice % ACENTOS.length];
  const Etiqueta = onClick ? 'button' : 'div';

  return (
    <Etiqueta
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-line/80 bg-surface-1 p-4 text-left shadow-sm transition-[border-color,box-shadow] duration-[var(--dur-base)] before:absolute before:inset-x-0 before:top-0 before:h-1 ${acento} ${ onClick ? 'hover:border-brand/30 hover:shadow-md cursor-pointer' : '' } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${className}`}
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
