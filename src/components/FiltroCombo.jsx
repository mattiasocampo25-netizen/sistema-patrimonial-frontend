import React, { useEffect, useLayoutEffect, useMemo, useRef, useState, useId } from 'react';
import { createPortal } from 'react-dom';
import { normalizeStr } from '../utils/helpers';
import { puntuarOpcion } from '../utils/busqueda';

// Combo con buscador que reemplaza a los <select> nativos. Motivo: el popup del
// <select> lo dibuja el sistema operativo (listado blanco sobre la app oscura,
// con las opciones superpuestas e ilegibles) y no se puede estilar por CSS.
//
// - Búsqueda insensible a tildes/mayúsculas ("victor" encuentra "VÍCTOR").
// - Ordena por cercanía: empieza con > palabra que empieza con > contiene.
// - `opciones` acepta strings o { label, value }.
// - Controlado si se pasa `valor`; si no, guarda el valor internamente y lo
//   expone en un input oculto `name` para que los formularios con FormData
//   sigan leyendo el valor.

export default function FiltroCombo({
  valor, opciones, onElegir, etiquetaTodos, titulo, ancho = 'w-full',
  name, required, disabled, className = '', compacto = false, errorMsg,
  validarNativo = true
}) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [interno, setInterno] = useState(valor ?? '');
  const [error, setError] = useState(false);
  const cajaRef = useRef(null);
  const botonRef = useRef(null);
  const inputRef = useRef(null);
  const popupRef = useRef(null);
  const [popupStyle, setPopupStyle] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const listboxId = useId();
  const mensajeErrorId = name ? `${name}-filtro-error` : undefined;

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e) => {
      if (!cajaRef.current?.contains(e.target) && !popupRef.current?.contains(e.target)) setAbierto(false);
    };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, [abierto]);

  useLayoutEffect(() => {
    if (!abierto) { setPopupStyle(null); return; }
    const posicionar = () => {
      const rect = botonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const margen = 8;
      const ancho = Math.min(Math.max(rect.width, 260), window.innerWidth - margen * 2);
      const izquierda = Math.min(Math.max(margen, rect.left), window.innerWidth - ancho - margen);
      const abajo = window.innerHeight - rect.bottom - margen;
      const arriba = rect.top - margen;
      const desplegarAbajo = abajo >= 190 || abajo >= arriba;
      const alto = Math.max(120, Math.min(320, (desplegarAbajo ? abajo : arriba) - 6));
      setPopupStyle({ position: 'fixed', left: izquierda, width: ancho, maxWidth: `calc(100vw - ${margen * 2}px)`, maxHeight: alto, top: desplegarAbajo ? rect.bottom + 6 : undefined, bottom: desplegarAbajo ? undefined : window.innerHeight - rect.top + 6, zIndex: 1000 });
    };
    posicionar();
    window.addEventListener('resize', posicionar);
    window.addEventListener('scroll', posicionar, true);
    return () => { window.removeEventListener('resize', posicionar); window.removeEventListener('scroll', posicionar, true); };
  }, [abierto]);

  const valorActual = valor !== undefined && valor !== null ? valor : interno;

  // Si el valor llega desde afuera (componente controlado) y pasa a tener
  // contenido, el error de validación deja de aplicar.
  useEffect(() => {
    if (valorActual !== undefined && valorActual !== null && String(valorActual) !== '') {
      setError(false);
    }
  }, [valorActual]);

  const elegir = (v) => {
    setInterno(v);
    setAbierto(false);
    setError(false);
    if (onElegir) onElegir(v);
  };

  const q = normalizeStr(texto);
  const items = useMemo(
    () => (opciones || []).map(o => (typeof o === 'object' && o !== null)
      ? { label: String(o.label ?? ''), value: o.value ?? o.label ?? '' }
      : { label: String(o), value: String(o) }),
    [opciones]
  );

  const lista = useMemo(() => {
    const base = items.map(o => ({ ...o, norm: normalizeStr(o.label) }));
    const filtrada = q ? base.filter(o => o.norm.includes(q)) : base;
    // Sin texto de busqueda NO se reordena: el orden de las opciones es el
    // que tiene sentido (los meses en orden del calendario, las
    // dependencias en el suyo). Antes se ordenaba por localeCompare y la
    // lista de meses salia Abril, Agosto, Diciembre, Enero...
    if (!q) return filtrada.slice(0, 100);
    return filtrada
      .map(o => ({ ...o, score: puntuarOpcion(o.norm, q) }))
      .sort((a, b) => a.score - b.score || a.label.localeCompare(b.label, 'es'))
      .slice(0, 100);
  }, [items, q]);

  const total = useMemo(() => {
    if (!q) return items.length;
    return items.filter(o => normalizeStr(o.label).includes(q)).length;
  }, [items, q]);

  const valorTexto = items.find(o => String(o.value) === String(valorActual))?.label || '';
  const etiqueta = valorTexto || etiquetaTodos;
  const alto = compacto ? 'h-9 text-[12px]' : 'h-10 text-[13px]';

  return (
    <div ref={cajaRef} className={`relative ${ancho}`}>
      {name && (
        /*
         * Input oculto pero VALIDABLE.
         *
         * Antes era type="hidden", y HTML ignora `required` en los inputs
         * hidden: la validación nativa no lo tenía en cuenta y el formulario
         * se enviaba con el campo vacío. Ahora es type="text" con tamaño 1px
         * y opacidad 0 (nunca display:none, que sí lo saca de la validación):
         * el navegador bloquea el envío si el valor está vacío.
         *
         * Al invalidarse se cancela el globo nativo (para no mostrar el
         * mensaje del navegador en un idioma que no controlamos) y se lleva
         * el foco al botón visible, que es el control real.
         *
         * `validarNativo={false}` desactiva este input: es para los campos
         * que viven en un paso de un wizard que todavía no está visible al
         * guardar. En ese caso el navegador no puede enfocar un control
         * inválido dentro de un contenedor `display:none` y BLOQUEA el envío
         * en silencio; esos campos se validan al avanzar de paso.
         */
        <input
          ref={inputRef}
          type="text"
          name={name}
          value={valorActual ?? ''}
          required={required && validarNativo}
          tabIndex={-1}
          aria-label={titulo || 'Campo obligatorio'}
          className="pointer-events-none absolute h-px w-px overflow-hidden border-0 p-0 opacity-0"
          onInvalid={(e) => {
            // Se cancela el globo nativo (para no mostrar el mensaje del
            // navegador, en un idioma que no controlamos) y se lleva el foco
            // al botón visible, que es el control real para el usuario.
            // El foco se mueve en el siguiente frame porque el navegador
            // enfoca el campo inválido DESPUÉS de disparar este evento.
            e.preventDefault();
            setError(true);
            requestAnimationFrame(() => botonRef.current?.focus());
          }}
        />
      )}
      <button
        ref={botonRef}
        type="button"
        onClick={() => {
          if (disabled) return;
          setTexto('');
          const seleccionado = lista.findIndex(o => String(o.value) === String(valorActual));
          setActiveIndex(seleccionado >= 0 ? seleccionado + 1 : 0);
          setAbierto(v => !v);
        }}
        title={titulo}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={abierto ? listboxId : undefined}
        aria-required={required || undefined}
        aria-invalid={error || undefined}
        aria-describedby={error && mensajeErrorId ? mensajeErrorId : undefined}
        className={`w-full ${alto} rounded-control border ${error ? 'border-rose-400 dark:border-rose-500' : 'border-line dark:border-white/10'} bg-surface-1 dark:bg-surface-1/5 px-4 font-medium text-content-1 dark:text-content-3 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 motion focus-visible:ring-2 cursor-pointer hover:border-line-strong dark:hover:border-white/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 ${className}`}
      >
        <span className={`flex-1 min-w-0 truncate text-left ${!valorTexto ? 'text-content-3 dark:text-content-3' : ''}`} title={etiqueta}>
          {etiqueta}
        </span>
        <i className={`fa-solid fa-chevron-down text-[10px] text-content-3 shrink-0 transition-transform ${abierto ? 'rotate-180' : ''}`}></i>
      </button>
      {error && (
        <p id={mensajeErrorId} role="alert" className="mt-1 text-[11px] font-semibold text-danger dark:text-rose-400">
          {errorMsg || 'Este campo es obligatorio.'}
        </p>
      )}
      {abierto && popupStyle && createPortal(
        <div ref={popupRef} style={popupStyle} className="rounded-panel border border-line bg-surface-1 shadow-pop overflow-hidden animate-pop">
          <div className="relative border-b border-line dark:border-white/10">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-content-3 text-xs pointer-events-none"></i>
            <input
              autoFocus
              type="text"
              value={texto}
              aria-label={`Buscar ${titulo || etiquetaTodos || 'opciones'}`}
              aria-controls={listboxId}
              aria-activedescendant={`${listboxId}-option-${activeIndex}`}
              onChange={(e) => { setTexto(e.target.value); setActiveIndex(0); }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') { e.preventDefault(); setAbierto(false); botonRef.current?.focus(); }
                if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(lista.length, i + 1)); }
                if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(0, i - 1)); }
                if (e.key === 'Home') { e.preventDefault(); setActiveIndex(0); }
                if (e.key === 'End') { e.preventDefault(); setActiveIndex(lista.length); }
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (activeIndex === 0) elegir('');
                  else if (lista[activeIndex - 1]) elegir(lista[activeIndex - 1].value);
                }
              }}
              placeholder="Escribe para buscar..."
              className="w-full h-10 pl-10 pr-3 text-[13px] font-medium outline-none bg-transparent text-content-1 dark:text-white placeholder:text-content-3 placeholder:font-normal"
            />
          </div>
          {/* Reserva espacio para el buscador y el pie. Antes la lista podía
              ocupar más que el popup y quedar cortada contra el footer del modal. */}
          <div id={listboxId} role="listbox" aria-label={titulo || etiquetaTodos || 'Opciones'} style={{ maxHeight: Math.max(48, popupStyle.maxHeight - 68) }} className="overflow-y-auto custom-scrollbar py-1">
            <button
              id={`${listboxId}-option-0`}
              type="button"
              tabIndex={-1}
              role="option"
              aria-selected={!valorActual}
              onMouseEnter={() => setActiveIndex(0)}
              onClick={() => elegir('')}
              className={`w-full px-3.5 py-2 text-left text-[13px] transition-colors cursor-pointer ${activeIndex === 0 ? 'bg-brand/10 dark:bg-brand/20' : 'hover:bg-brand/10 dark:hover:bg-brand/20'} ${!valorActual ? 'font-black text-brand-text dark:text-brand' : 'font-semibold text-content-3 dark:text-content-3'}`}
              title={etiquetaTodos}
            >
              <span className="block truncate">{etiquetaTodos}</span>
            </button>
            {lista.map((o, index) => (
              <button
                key={o.value}
                id={`${listboxId}-option-${index + 1}`}
                type="button"
                tabIndex={-1}
                role="option"
                aria-selected={String(o.value) === String(valorActual)}
                onMouseEnter={() => setActiveIndex(index + 1)}
                onClick={() => elegir(o.value)}
                title={o.label}
                className={`w-full px-3.5 py-2 text-left text-[13px] transition-colors cursor-pointer ${activeIndex === index + 1 ? 'bg-brand/10 dark:bg-brand/20' : 'hover:bg-brand/10 dark:hover:bg-brand/20'} ${String(o.value) === String(valorActual) ? 'font-black text-brand-text dark:text-brand' : 'font-semibold text-content-1 dark:text-zinc-200'}`}
              >
                <span className="block truncate" title={o.label}>{o.label}</span>
              </button>
            ))}
            {lista.length === 0 && (
              <p role="status" className="px-3.5 py-3 text-xs font-semibold text-content-3 text-center">Sin coincidencias.</p>
            )}
          </div>
          <div aria-live="polite" className="border-t border-line px-3.5 py-1.5 text-center text-[10px] font-semibold text-content-3">
            {total > 100 ? `${total - 100} más; afina la búsqueda.` : `${total} ${total === 1 ? 'opción' : 'opciones'}. Usa ↑ y ↓ para elegir.`}
          </div>
        </div>, document.body
      )}
    </div>
  );
}
