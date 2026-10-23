import React from 'react';

/**
 * Card — contenedor de superficie del sistema.
 *
 * Reemplaza las ~200 apariciones de "tarjeta" escritas a mano
 * (`bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 ...`),
 * que mezclaban `rounded-2xl` y `rounded-3xl` y usaban bordes con alpha
 * distintos en claro y en oscuro.
 */

export function Card({ className = '', children, como: Tag = 'div', ...resto }) {
  return (
    <Tag
      className={`bg-surface-1 border border-line rounded-panel shadow-card ${className}`}
      {...resto}
    >
      {children}
    </Tag>
  );
}

/** Cabecera de tarjeta: título, descripción y acciones a la derecha. */
export function CardHeader({ titulo, descripcion, acciones, icono, className = '', children }) {
  return (
    <div className={`flex items-start justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5 border-b border-line ${className}`}>
      <div className="flex items-start gap-3 min-w-0">
        {icono ? (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-brand-soft text-brand-text" aria-hidden="true">
            <i className={`fa-solid ${icono}`} />
          </span>
        ) : null}
        <div className="min-w-0">
          {titulo ? (
            <h2 className="text-title font-bold text-content-1 tracking-tight truncate">{titulo}</h2>
          ) : null}
          {descripcion ? (
            <p className="text-body text-content-2 mt-0.5 leading-relaxed">{descripcion}</p>
          ) : null}
          {children}
        </div>
      </div>
      {acciones ? <div className="flex items-center gap-2 shrink-0">{acciones}</div> : null}
    </div>
  );
}

export function CardBody({ className = '', children, ...resto }) {
  return (
    <div className={`p-5 sm:p-6 ${className}`} {...resto}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...resto }) {
  return (
    <div className={`px-5 sm:px-6 py-4 border-t border-line bg-surface-2 ${className}`} {...resto}>
      {children}
    </div>
  );
}

/** Zona clicable dentro de una tarjeta (fila, item de lista). */
export function CardInteractive({ className = '', children, ...resto }) {
  return (
    <div
      className={`transition-[background-color,border-color,transform,box-shadow] duration-[var(--dur-base)] hover:bg-surface-2 ${className}`}
      {...resto}
    >
      {children}
    </div>
  );
}

export default Card;
