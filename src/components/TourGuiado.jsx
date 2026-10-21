import React, { useState, useEffect, useCallback } from 'react';

// Tour guiado: spotlight simétrico, posicionado rápido y reactivo.
export default function TourGuiado({ pasos, paso, setPaso, onClose, irTab }) {
  const [rect, setRect] = useState(null);
  const step = pasos[paso];

  const medir = useCallback(() => {
    if (!step?.selector) {
      setRect(null);
      return;
    }
    const el = document.querySelector(step.selector);
    if (!el) {
      setRect(null);
      return;
    }
    try { el.scrollIntoView({ block: 'center', behavior: 'auto' }); } catch {}
    requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) {
        setRect(null);
        return;
      }
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    });
  }, [step]);

  useEffect(() => {
    if (!step) return;
  // `step` es `pasos[paso]`: cambia con `paso`, que ya es dependencia. Se
  // listan los dos por si `pasos` cambiara sin que cambiara `paso`.
    if (step.tab) irTab(step.tab);
    setRect(null);
    const t = setTimeout(medir, 220);
    return () => clearTimeout(t);
  }, [paso, step, medir, irTab]);

  // Reposicionar al mover scroll o redimensionar
  useEffect(() => {
    if (!step?.selector) return;
    let raf = 0;
    const actualizar = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = document.querySelector(step.selector);
        if (!el) return;
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      });
    };
    window.addEventListener('resize', actualizar);
    window.addEventListener('scroll', actualizar, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', actualizar);
      window.removeEventListener('scroll', actualizar, true);
    };
  }, [paso, step]);

  // Teclado: avanzar, retroceder, salir
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setPaso(Math.min(paso + 1, pasos.length - 1));
      if (e.key === 'ArrowLeft') setPaso(Math.max(paso - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paso, pasos.length, onClose, setPaso]);

  if (!step) return null;
  const ultimo = paso === pasos.length - 1;
  const esMovil = typeof window !== 'undefined' && window.innerWidth < 640;
  const PAD = 8;
  const W = 340;

  let cardStyle = undefined;
  let caret = null;
  if (!esMovil && rect) {
    const w = Math.min(W, window.innerWidth - 32);
    const centroX = rect.left + rect.width / 2;
    const left = Math.round(Math.min(Math.max(16, centroX - w / 2), window.innerWidth - w - 16));
    const cabeDebajo = rect.bottom + 16 + 240 < window.innerHeight;
    const top = cabeDebajo
      ? Math.round(rect.bottom + 14)
      : Math.round(Math.max(16, rect.top - 14 - 230));
    cardStyle = { left, top, width: w };
    caret = cabeDebajo ? { abajo: false, x: Math.round(Math.min(Math.max(centroX - left, 20), w - 20)) } : null;
    if (!cabeDebajo) caret = { abajo: true, x: Math.round(Math.min(Math.max(centroX - left, 20), w - 20)) };
  }

  return (
    <div className="fixed inset-0 z-[500]">
      {rect && (
        <div
          className="absolute rounded-card pointer-events-none"
          style={{
            top: rect.top - PAD, left: rect.left - PAD,
            width: rect.width + PAD * 2, height: rect.height + PAD * 2,
            boxShadow: '0 0 0 9999px rgba(5, 8, 20, 0.6)',
            border: '2px solid #60a5fa'
          }}
        />
      )}
      {!rect && <div className="absolute inset-0 bg-[#050814]/70" onClick={onClose} />}

      <div
        className={`absolute z-10 rounded-panel bg-surface-1 dark:bg-zinc-900 border border-line dark:border-zinc-700 shadow-2xl p-5 animate-slide-up ${ esMovil || !rect ? 'inset-x-4 bottom-4' : '' }`}
        style={esMovil || !rect ? { maxHeight: '70vh', overflowY: 'auto' } : { ...cardStyle, maxHeight: '60vh', overflowY: 'auto' }}
        role="dialog" aria-label={`Paso ${paso + 1} de ${pasos.length}`}
      >
        {caret && !caret.abajo && (
          <span className="absolute -top-[7px] h-3.5 w-3.5 rotate-45 bg-surface-1 dark:bg-zinc-900 border-l border-t border-line dark:border-zinc-700" style={{ left: caret.x - 7 }}></span>
        )}
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-text dark:text-brand mb-1.5">
          Paso {paso + 1} de {pasos.length}
        </p>
        <h3 className="text-base font-bold text-content-1 dark:text-white tracking-tight">{step.titulo}</h3>
        <p className="text-[13px] text-content-3 dark:text-content-3 mt-1.5 leading-relaxed">{step.texto}</p>
        <div className="flex items-center gap-1.5 mt-4 mb-4">
          {pasos.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full motion ${i === paso ? 'w-6 bg-brand' : i < paso ? 'w-1.5 bg-brand/50' : 'w-1.5 bg-surface-3 dark:bg-zinc-700'}`}></span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="text-xs font-semibold text-content-3 hover:text-content-2 dark:hover:text-zinc-200 transition-colors cursor-pointer mr-auto">
            Omitir tour
          </button>
          {paso > 0 && (
            <button onClick={() => setPaso(paso - 1)} className="h-10 px-4 rounded-control text-[13px] font-semibold text-content-2 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-1/10 motion cursor-pointer">
              Atrás
            </button>
          )}
          <button
            onClick={() => (ultimo ? onClose(true) : setPaso(paso + 1))}
            className="h-10 px-5 rounded-control text-[13px] font-bold bg-zinc-900 dark:bg-surface-1 text-white dark:text-content-1 hover:bg-zinc-700 dark:hover:bg-surface-3 motion cursor-pointer"
          >
            {ultimo ? 'Finalizar' : 'Siguiente →'}
          </button>
        </div>
        {caret && caret.abajo && (
          <span className="absolute -bottom-[7px] h-3.5 w-3.5 rotate-45 bg-surface-1 dark:bg-zinc-900 border-r border-b border-line dark:border-zinc-700" style={{ left: caret.x - 7 }}></span>
        )}
      </div>
    </div>
  );
}
