import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { normalizeStr } from '../utils/helpers';
import { puntuarOpcion } from '../utils/busqueda';

// ============================================================================
// SELECTOR DE PERSONA DEL PADRON
// ============================================================================
// Reemplaza al <input list> + <datalist> nativo que usaba el modal de FC-10.
//
// Por que no el datalist: es un control del sistema operativo. Al elegir una
// opcion, el valor llega al input pero el evento change no siempre se dispara de
// la misma forma que al teclear, y los campos derivados (cedula, cargo) se
// quedaban vacios aunque la persona estuviera en el padron. Este selector es
// un control propio: al elegir, siempre seznsa los tres datos juntos.
//
// Ademas muestra el cargo y la CI de cada opcion, que es justo lo que hace
// falta para distinguir a homonimos sin adivinar.
export default function SelectorPersona({
  valor, funcionarios, onElegir, placeholder = 'Buscar funcionario...',
  altura = 'h-10', requerido = false, autoFocus = false, allowLibre = true
}) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const cajaRef = useRef(null);
  const botonRef = useRef(null);
  const popupRef = useRef(null);
  const [popupStyle, setPopupStyle] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const listboxId = useId();

  // cerrar al click fuera
  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e) => { if (!cajaRef.current?.contains(e.target) && !popupRef.current?.contains(e.target)) setAbierto(false); };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, [abierto]);

  useLayoutEffect(() => {
    if (!abierto) { setPopupStyle(null); return undefined; }
    const posicionar = () => {
      const rect = botonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const margen = 8;
      const ancho = Math.min(Math.max(rect.width, 300), window.innerWidth - margen * 2);
      const izquierda = Math.min(Math.max(margen, rect.left), window.innerWidth - ancho - margen);
      const abajo = window.innerHeight - rect.bottom - margen;
      const arriba = rect.top - margen;
      const desplegarAbajo = abajo >= 180 || abajo >= arriba;
      const alto = Math.max(120, Math.min(340, (desplegarAbajo ? abajo : arriba) - 8));
      setPopupStyle({ position: 'fixed', left: izquierda, width: ancho, maxWidth: `calc(100vw - ${margen * 2}px)`, maxHeight: alto, top: desplegarAbajo ? rect.bottom + 6 : undefined, bottom: desplegarAbajo ? undefined : window.innerHeight - rect.top + 6, zIndex: 1100 });
    };
    posicionar();
    window.addEventListener('resize', posicionar);
    window.addEventListener('scroll', posicionar, true);
    const escapar = (event) => { if (event.key === 'Escape') { setAbierto(false); setTexto(''); botonRef.current?.focus(); } };
    document.addEventListener('keydown', escapar);
    return () => { window.removeEventListener('resize', posicionar); window.removeEventListener('scroll', posicionar, true); document.removeEventListener('keydown', escapar); };
  }, [abierto]);

  // El texto de la caja es el nombre que se busca; se resetea al abrir.
  const q = normalizeStr(texto);

  const lista = useMemo(() => {
    const base = (funcionarios || []).map(f => ({
      nombre: String(f.nombre || '').trim(),
      doc: f.doc || '',
      cargo: f.cargo || '',
      norm: normalizeStr(f.nombre || '')
    })).filter(f => f.nombre);
    const filtrada = q ? base.filter(f => f.norm.includes(q)) : base;
      return filtrada
      .map(f => ({ ...f, score: puntuarOpcion(f.norm, q) }))
      // Los que tienen CI y cargo completos primero: son los que auto completan
      // de verdad y los mas utiles para elegir.
      .sort((a, b) => {
        const completos = (f) => (f.doc && f.cargo ? 0 : 1);
        if (completos(a) !== completos(b)) return completos(a) - completos(b);
        return a.score - b.score || a.nombre.localeCompare(b.nombre, 'es');
      })
      .slice(0, 80);
  }, [funcionarios, q]);
  useEffect(() => setActiveIndex(0), [q]);

  const elegido = (funcionarios || []).find(f => normalizeStr(f.nombre || '') === normalizeStr(valor || ''));
  const tieneDatos = !!(elegido?.doc || elegido?.cargo);

  const seleccionar = (f) => {
    setAbierto(false);
    setTexto('');
    onElegir(f);
  };

  const etiqueta = valor
    ? (elegido ? `${elegido.nombre}${tieneDatos ? ` · ${elegido.doc || 's/cI'}` : ''}` : valor)
    : '';

  return (
    <div ref={cajaRef} className="relative">
      <button
        ref={botonRef}
        type="button"
        onClick={() => { setTexto(''); setActiveIndex(0); setAbierto(v => !v); }}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-required={requerido || undefined}
        className={`w-full ${altura} rounded-control border bg-surface-1 dark:bg-surface-1 px-4 text-left font-medium outline-none motion focus:ring-2 flex items-center gap-2 cursor-pointer ${ requerido && !valor ? 'border-rose-300 dark:border-rose-800' : 'border-line dark:border-white/10' } focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-zinc-900/5 dark:focus:ring-white/10 hover:border-line-strong dark:hover:border-white/20`}
      >
        <span className={`flex-1 min-w-0 truncate ${!etiqueta ? 'text-content-3 dark:text-content-3' : 'text-content-1 dark:text-content-3'}`}>
          {etiqueta || placeholder}
        </span>
        <i className={`fa-solid fa-chevron-down text-[10px] text-content-3 shrink-0 transition-transform ${abierto ? 'rotate-180' : ''}`}></i>
      </button>

      {/* Campo invisible para que FormData siga leyendo el valor real. */}
      <input type="hidden" value={valor || ''} readOnly />

      {abierto && popupStyle && createPortal(
        <div ref={popupRef} style={popupStyle} className="rounded-panel border border-line bg-surface-1 text-content-1 shadow-pop overflow-hidden animate-pop dark:border-line dark:bg-surface-1">
          <div className="relative border-b border-line dark:border-white/10">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-content-3 text-xs pointer-events-none"></i>
            <input
              autoFocus={autoFocus}
              type="text"
              value={texto}
              aria-label="Buscar jefe inmediato en el padrón"
              aria-controls={listboxId}
              aria-activedescendant={lista[activeIndex] ? `${listboxId}-option-${activeIndex}` : undefined}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') { setAbierto(false); setTexto(''); }
                if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(lista.length - 1, i + 1)); }
                if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(0, i - 1)); }
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (lista.length > 0) seleccionar(lista[Math.max(0, activeIndex)]);
                  else if (allowLibre && texto.trim()) seleccionar({ nombre: texto.trim(), doc: '', cargo: '' });
                }
              }}
              placeholder="Escribe el nombre para buscar..."
              className="w-full h-10 pl-10 pr-3 text-[13px] font-medium outline-none bg-transparent text-content-1 dark:text-white placeholder:text-content-3"
            />
          </div>
          <div id={listboxId} role="listbox" aria-label="Resultados del padrón" style={{ maxHeight: Math.max(72, (popupStyle?.maxHeight || 340) - 44) }} className="overflow-y-auto overscroll-contain custom-scrollbar py-1">
            {lista.map(f => (
              <button
                key={`${f.nombre}-${f.doc}`}
                id={`${listboxId}-option-${lista.indexOf(f)}`}
                type="button"
                role="option"
                onClick={() => seleccionar(f)}
                aria-selected={normalizeStr(f.nombre) === normalizeStr(valor || '')}
                onMouseEnter={() => setActiveIndex(lista.indexOf(f))}
                title={f.doc ? `${f.nombre} · CI ${f.doc}` : f.nombre}
                className={`w-full px-3.5 py-2 text-left transition-colors cursor-pointer hover:bg-brand/10 dark:hover:bg-brand/20 ${ lista.indexOf(f) === activeIndex ? 'bg-brand/[0.07] dark:bg-brand/[0.14]' : '' }`}
              >
                <span className="flex items-center gap-2">
                  <i className="fa-solid fa-user text-[9px] text-content-3 shrink-0"></i>
                  <span className="text-[13px] font-semibold text-content-1 dark:text-zinc-200 truncate">{f.nombre}</span>
                  {f.cargo && <span className="text-[11px] text-content-3 dark:text-content-3 truncate">· {f.cargo}</span>}
                  {f.doc && <span className="text-[10px] text-content-3 dark:text-content-3 shrink-0 tabular-nums">CI {f.doc}</span>}
                </span>
              </button>
            ))}
            {lista.length === 0 && allowLibre && texto.trim() && (
              <button
                type="button"
                onClick={() => seleccionar({ nombre: texto.trim(), doc: '', cargo: '' })}
                className="w-full px-3.5 py-2 text-left text-[13px] font-semibold text-content-2 dark:text-content-3 hover:bg-brand/10 dark:hover:bg-brand/20 transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-plus text-[10px] mr-1.5"></i>
                Usar "{texto.trim()}" (no está en el padrón)
              </button>
            )}
            {lista.length === 0 && !allowLibre && (
              <p className="px-3.5 py-3 text-xs font-semibold text-content-3 text-center">Sin coincidencias.</p>
            )}
          </div>
        </div>, document.body
      )}
    </div>
  );
}
