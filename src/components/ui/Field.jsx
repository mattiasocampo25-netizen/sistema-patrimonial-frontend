import React, { useId } from 'react';

/**
 * Field — campo de formulario con etiqueta, ayuda y error.
 *
 * Antes cada formulario escribia su propio label + input, y el `required` de
 * los FiltroCombo caia en un input hidden (que HTML ignora), asi que se
 * podian guardar actas sin periodo ni responsable.
 */

/** Envoltorio: etiqueta, control, ayuda y error. */
export function Field({ label, hint, error, requerido, htmlFor, className = '', children }) {
  const id = useId();
  const controlId = htmlFor || id;
  const descId = error ? `${controlId}-error` : hint ? `${controlId}-hint` : undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label ? (
        <label htmlFor={controlId} className="text-label font-semibold text-content-2 uppercase tracking-wide">
          {label}
          {requerido ? (
            <span className="text-danger ml-0.5" aria-hidden="true">*</span>
          ) : null}
        </label>
      ) : null}

      {children}

      {error ? (
        <p id={descId} role="alert" className="text-label font-medium text-danger flex items-center gap-1.5">
          <i className="fa-solid fa-circle-exclamation text-[0.8em]" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p id={descId} className="text-label text-content-3">{hint}</p>
      ) : null}
    </div>
  );
}

const CAMPOS =
  'w-full bg-surface-1 text-content-1 border border-line rounded-control px-3.5 text-body ' +
  'placeholder:text-content-3 transition-[border-color,box-shadow,background-color] ' +
  'duration-[var(--dur-fast)] ease-[var(--ease-standard)] ' +
  'focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none ' +
  'disabled:bg-surface-2 disabled:text-content-3 disabled:cursor-not-allowed ' +
  'aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/20';

export function Input({ className = '', error, ...resto }) {
  return (
    <input
      className={`${CAMPOS} h-10 ${className}`}
      aria-invalid={error ? 'true' : undefined}
      {...resto}
    />
  );
}

export function Textarea({ className = '', error, rows = 3, ...resto }) {
  return (
    <textarea
      rows={rows}
      className={`${CAMPOS} py-2.5 resize-y ${className}`}
      aria-invalid={error ? 'true' : undefined}
      {...resto}
    />
  );
}

/** Select nativo. Se usa para listas cortas; para las largas, FiltroCombo. */
export function Select({ className = '', error, children, ...resto }) {
  return (
    <select
      className={`${CAMPOS} h-10 pr-8 appearance-none bg-[length:14px] bg-[right_0.65rem_center] bg-no-repeat ${className}`}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2364748b'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E\")"
      }}
      aria-invalid={error ? 'true' : undefined}
      {...resto}
    >
      {children}
    </select>
  );
}

/** Campo de busqueda con icono y botón de limpiar. */
export function SearchInput({ valor = '', onChange, placeholder = 'Buscar…', className = '', ...resto }) {
  return (
    <div className={`relative ${className}`}>
      <i
        className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-content-3 text-xs pointer-events-none"
        aria-hidden="true"
      />
      <input
        type="search"
        value={valor}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        className={`${CAMPOS} h-10 pl-9 ${valor ? 'pr-9' : ''}`}
        {...resto}
      />
      {valor ? (
        <button
          type="button"
          onClick={() => onChange && onChange('')}
          aria-label="Limpiar busqueda"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full text-content-3 hover:bg-surface-3 hover:text-content-1 flex items-center justify-center"
        >
          <i className="fa-solid fa-xmark text-[0.7em]" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

export default Field;
