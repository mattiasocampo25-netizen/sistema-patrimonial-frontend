import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
        onClick={() => { if (disabled) return; setTexto(''); setAbierto(v => !v); }}
        title={titulo}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={abierto}
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
        <div ref={popupRef} style={popupStyle} className="rounded-card border border-line dark:border-zinc-700 bg-surface-1 dark:bg-zinc-900 shadow-2xl overflow-hidden animate-pop">
          <div className="relative border-b border-line dark:border-white/10">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-content-3 text-xs pointer-events-none"></i>
            <input
              autoFocus
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setAbierto(false);
                if (e.key === 'Enter' && lista.length > 0) elegir(lista[0].value);
              }}
              placeholder="Escribe para buscar..."
              className="w-full h-10 pl-10 pr-3 text-[13px] font-medium outline-none bg-transparent text-content-1 dark:text-white placeholder:text-content-3 placeholder:font-normal"
            />
          </div>
          <div style={{ maxHeight: Math.max(72, popupStyle.maxHeight - 44) }} className="overflow-y-auto custom-scrollbar py-1">
            <button
              type="button"
              onClick={() => elegir('')}
              className={`w-full px-3.5 py-2 text-left text-[13px] transition-colors cursor-pointer hover:bg-brand/10 dark:hover:bg-brand/20 ${!valorActual ? 'font-black text-brand-text dark:text-brand' : 'font-semibold text-content-3 dark:text-content-3'}`}
              title={etiquetaTodos}
            >
              <span className="block truncate">{etiquetaTodos}</span>
            </button>
            {lista.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => elegir(o.value)}
                title={o.label}
                className={`w-full px-3.5 py-2 text-left text-[13px] transition-colors cursor-pointer hover:bg-brand/10 dark:hover:bg-brand/20 ${String(o.value) === String(valorActual) ? 'font-black text-brand-text dark:text-brand' : 'font-semibold text-content-1 dark:text-zinc-200'}`}
              >
                <span className="block truncate" title={o.label}>{o.label}</span>
              </button>
            ))}
            {lista.length > 0 && (
              <div className="px-3.5 py-1 text-[10px] font-semibold text-content-3 text-center border-t border-line dark:border-white/10">
                Pulse sobre una opción para seleccionarla
              </div>
            )}
            {lista.length === 0 && (
              <p className="px-3.5 py-3 text-xs font-semibold text-content-3 text-center">Sin coincidencias.</p>
            )}
            {total > 100 && (
              <p className="px-3.5 py-1.5 text-[10px] font-semibold text-content-3 border-t border-line dark:border-white/10">
                {total - 100} más… afina la búsqueda.
              </p>
            )}
          </div>
        </div>, document.body
      )}
    </div>
  );
}
