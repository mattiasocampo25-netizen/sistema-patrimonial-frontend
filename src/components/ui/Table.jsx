import React from 'react';

/**
 * Table — tabla del sistema.
 *
 * Hoy hay 8 tablas escritas cada una a su medida. Esta da lo comun:
 * cabecera pegajosa, celda truncada con tooltip, y las clases de la tabla
 * ("anim-rows", "min-w-[900px]", scroll horizontal) en un solo lugar.
 */

export function Table({
  className = '',
  contenedorClassName = '',
  children,
  minWidth = 900,
  // Las vistas que ya traen su propio contenedor con scroll pasan
  // sinContenedor: si no, habria dos barras de desplazamiento.
  sinContenedor = false,
  ...resto
}) {
  const tabla = (
    <table
      className={`w-full text-left border-collapse ${minWidth ? 'min-w-[900px]' : ''} ${className}`}
      style={minWidth ? { minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth } : undefined}
      {...resto}
    >
      {children}
    </table>
  );

  if (sinContenedor) return tabla;

  return (
    <div className={`overflow-x-auto custom-scrollbar ${contenedorClassName}`}>
      {tabla}
    </div>
  );
}

export function THead({ className = '', children, ...resto }) {
  return (
    <thead
      className={`sticky top-0 z-10 bg-surface-2/95 backdrop-blur-md border-b border-line text-label font-bold text-content-2 uppercase tracking-wide ${className}`}
      {...resto}
    >
      {children}
    </thead>
  );
}

export function TRow({ className = '', children, ...resto }) {
  return (
    <tr
      className={`border-b border-line/60 transition-colors duration-[var(--dur-fast)] hover:bg-surface-2 ${className}`}
      {...resto}
    >
      {children}
    </tr>
  );
}

export function TH({ className = '', children, ...resto }) {
  // Sin text-left: hay tablas con la ultima columna a la derecha y esa
  // alineacion tiene que ganarle a la del sistema.
  return (
    <th className={`px-3 py-3 font-bold whitespace-nowrap ${className}`} {...resto}>
      {children}
    </th>
  );
}

export function TD({ className = '', children, mono = false, truncate = false, ...resto }) {
  // Sin align-middle: el inventario alinea sus celdas arriba y eso tiene que
  // ganarle al valor del sistema.
  return (
    <td
      className={`px-3 py-2 text-body text-content-1 ${mono ? 'font-mono tabular-nums' : ''} ${
        truncate ? 'max-w-0 truncate' : ''
      } ${className}`}
      {...resto}
    >
      {children}
    </td>
  );
}

export function TBody({ className = '', children, ...resto }) {
  // Sin divide-y: la linea la pone TRow con border-b. Las dos a la vez
  // dibujaban una linea de 2px.
  return (
    <tbody className={`${className}`} {...resto}>
      {children}
    </tbody>
  );
}

/** Paginación. Reemplaza a las 3 implementaciones distintas que hay. */
export function Pagination({ pagina, totalPaginas, totalElementos, porPagina, onCambioPagina, className = '' }) {
  if (!totalPaginas || totalPaginas < 1) return null;
  const desde = (pagina - 1) * porPagina + 1;
  const hasta = Math.min(pagina * porPagina, totalElementos);

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 ${className}`}>
      <p className="text-label text-content-3">
        Mostrando <span className="tabular-nums font-semibold text-content-2">{desde}</span>–
        <span className="tabular-nums font-semibold text-content-2">{hasta}</span> de{' '}
        <span className="tabular-nums font-semibold text-content-2">{totalElementos}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onCambioPagina && onCambioPagina(pagina - 1)}
          disabled={pagina <= 1}
          aria-label="Pagina anterior"
          className="h-8 w-8 rounded-control flex items-center justify-center text-content-2 hover:bg-surface-3 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
        >
          <i className="fa-solid fa-chevron-left text-[0.7em]" aria-hidden="true" />
        </button>

        <span className="text-label text-content-2 px-2 tabular-nums">
          {pagina} / {totalPaginas}
        </span>

        <button
          type="button"
          onClick={() => onCambioPagina && onCambioPagina(pagina + 1)}
          disabled={pagina >= totalPaginas}
          aria-label="Pagina siguiente"
          className="h-8 w-8 rounded-control flex items-center justify-center text-content-2 hover:bg-surface-3 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
        >
          <i className="fa-solid fa-chevron-right text-[0.7em]" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
