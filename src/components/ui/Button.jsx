import React from 'react';

/**
 * Button — botón del sistema.
 *
 * Reemplaza las ~90 apariciones de "botón primario" escritas a mano
 * (`inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 ...`),
 * que además usaban casi negro en vez del color de marca.
 *
 * Variantes:
 *   primary   la acción principal de la pantalla (azul de marca)
 *   secondary acción alternativa, con borde
 *   ghost     acción terciaria, sin fondo (iconos, enlaces)
 *   subtle    acción de baja jerarquía (filtros, chips)
 *   danger    acción destructiva (borrar, dar de baja)
 *
 * Tamaños: sm (32px) · md (40px) · lg (44px)
 */

const VARIANTES = {
  primary:
    'bg-brand text-white shadow-sm hover:bg-brand-hover active:bg-brand-hover ' +
    'focus-visible:outline-brand disabled:bg-brand/40 disabled:shadow-none',
  secondary:
    'bg-surface-1 text-content-1 border border-line hover:bg-surface-2 hover:border-line-strong ' +
    'focus-visible:outline-brand disabled:opacity-45',
  ghost:
    'bg-transparent text-content-2 hover:bg-surface-2 hover:text-content-1 ' +
    'focus-visible:outline-brand disabled:opacity-45',
  subtle:
    'bg-surface-2 text-content-2 border border-transparent hover:bg-surface-3 hover:text-content-1 ' +
    'focus-visible:outline-brand disabled:opacity-45',
  danger:
    'bg-danger text-white shadow-sm hover:brightness-110 active:brightness-95 ' +
    'focus-visible:outline-danger disabled:opacity-45'
};

const TAMANOS = {
  sm: 'h-8 px-3 text-label gap-1.5 rounded-control',
  md: 'h-10 px-4 text-body gap-2 rounded-control',
  lg: 'h-11 px-5 text-body gap-2 rounded-control'
};

const ICONOS = {
  sm: 'h-8 w-8 rounded-control',
  md: 'h-10 w-10 rounded-control',
  lg: 'h-11 w-11 rounded-control'
};

export default function Button({
  variante = 'secondary',
  tamano = 'md',
  icono,
  iconoDerecha,
  cargando = false,
  soloIcono = false,
  className = '',
  children,
  disabled,
  type = 'button',
  ...resto
}) {
  const base =
    'inline-flex items-center justify-center font-semibold whitespace-nowrap ' +
    'transition-[background-color,border-color,color,transform,box-shadow] duration-[var(--dur-fast)] ' +
    'ease-[var(--ease-standard)] active:scale-[0.98] ' +
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
    'disabled:cursor-not-allowed disabled:active:scale-100';

  const clases = [
    base,
    VARIANTES[variante] || VARIANTES.secondary,
    soloIcono ? ICONOS[tamano] : TAMANOS[tamano],
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={clases}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      {...resto}
    >
      {cargando ? (
        <i className="fa-solid fa-circle-notch fa-spin" aria-hidden="true" />
      ) : icono ? (
        <i className={`fa-solid ${icono} text-[0.9em]`} aria-hidden="true" />
      ) : null}
      {!soloIcono && children}
      {iconoDerecha && !cargando ? (
        <i className={`fa-solid ${iconoDerecha} text-[0.9em]`} aria-hidden="true" />
      ) : null}
    </button>
  );
}

/** Botón de una sola icono. Requiere `titulo` para tener nombre accesible. */
export function IconButton({ titulo, icono, tamano = 'md', variante = 'ghost', className = '', ...resto }) {
  return (
    <Button
      variante={variante}
      tamano={tamano}
      soloIcono
      icono={icono}
      title={titulo}
      aria-label={titulo}
      className={className}
      {...resto}
    />
  );
}

/** Grupo de botones pegados (segmentado). */
export function ButtonGroup({ className = '', children, ...resto }) {
  return (
    <div
      role="group"
      className={`inline-flex items-center rounded-control border border-line bg-surface-1 p-0.5 ${className}`}
      {...resto}
    >
      {children}
    </div>
  );
}
