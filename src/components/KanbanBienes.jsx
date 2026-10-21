// ============================================================================
// KANBAN DE BIENES POR ESTADO DE CONSERVACIÓN
// ============================================================================
// Tablero alternativo al listado: una columna por estado de conservación y
// tarjetas por bien. Permite reorganizar arrastrando una tarjeta a otra columna,
// que actualiza `estadoConservacion` del bien.
//
// Decisión de diseño: el arrastre usa la API nativa de drag & drop (HTML5),
// sin dependencias nuevas. En táctil el flujo funciona igual con los botones
// "mover" de cada tarjeta, porque HTML5 no arrastra bien en móvil.
// ============================================================================
import React, { useMemo, useState } from 'react';
import { ESTADOS_CONSERVACION } from '../constants/appConstants';
import { normalizeStr } from '../utils/helpers';

// Paleta por columna. Los tonos siguen el criterio del resto del sistema
// ( emerald = bueno, sky = muy bueno, amber = regular, rose = malo,
// zinc = inutilizable) para no inventar un código de color nuevo.
const COLUMNAS = [
  { estado: 'Muy bueno', icon: 'fa-circle-check',   chip: 'bg-emerald-500/10 text-ok dark:text-emerald-400 border-emerald-500/25' },
  { estado: 'Bueno',      icon: 'fa-circle',         chip: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25' },
  { estado: 'Regular',    icon: 'fa-circle-half-stroke', chip: 'bg-amber-500/10 text-warn dark:text-amber-400 border-amber-500/25' },
  { estado: 'Malo',       icon: 'fa-circle-exclamation', chip: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25' },
  { estado: 'Inutilizable', icon: 'fa-ban',          chip: 'bg-rose-500/10 text-danger dark:text-rose-400 border-rose-500/25' },
  { estado: 'De Baja',    icon: 'fa-trash-can',      chip: 'bg-zinc-500/10 text-content-2 dark:text-content-3 border-zinc-500/25' }
];

// Agrupa los bienes por estado. Se compara normalizado (sin tildes ni
// mayúsculas) porque en la carga CSV "Regular"/"regular" conviven.
const estadoCanonico = (v) => {
  const n = normalizeStr(v || '');
  return COLUMNAS.find(c => normalizeStr(c.estado) === n)?.estado || 'Regular';
};

export default function KanbanBienes({ bienes, onMover, onOpenFicha, isAdmin }) {
  // Columna sobre la que se está arrastrando (para resaltarla).
  const [colActiva, setColActiva] = useState(null);
  const [dragId, setDragId] = useState(null);

  const porColumna = useMemo(() => {
    const mapa = new Map(COLUMNAS.map(c => [c.estado, []]));
    (bienes || []).forEach(b => {
      const col = estadoCanonico(b.estadoConservacion);
      mapa.get(col).push(b);
    });
    return mapa;
  }, [bienes]);

  const alSoltar = (estadoDestino) => {
    setColActiva(null);
    const id = dragId;
    setDragId(null);
    if (!id || !onMover) return;
    const bien = (bienes || []).find(b => b.id === id);
    if (!bien) return;
    if (estadoCanonico(bien.estadoConservacion) === estadoDestino) return; // sin cambios
    onMover(bien, estadoDestino);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 px-1">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-content-3 dark:text-content-3">
          Arrastra un bien a otra columna para cambiar su estado
        </span>
        <span className="flex-1" />
        <span className="text-[11px] font-semibold text-content-3 dark:text-content-3 tabular-nums">
          {(bienes || []).length} bien(es)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-3 items-start">
        {COLUMNAS.map(col => {
          const lista = porColumna.get(col.estado) || [];
          const resaltada = colActiva === col.estado;
          return (
            <div
              key={col.estado}
              onDragOver={(e) => { e.preventDefault(); setColActiva(col.estado); }}
              onDragLeave={() => setColActiva((a) => (a === col.estado ? null : a))}
              onDrop={() => alSoltar(col.estado)}
              className={`flex flex-col rounded-card border p-2.5 min-h-[140px] motion duration-[var(--dur-base)] ${ resaltada ? 'border-brand bg-brand/[0.06] shadow-md' : 'border-line/70 dark:border-white/10 bg-surface-1 dark:bg-surface-1/[0.03]' }`}
            >
              <div className="flex items-center gap-2 px-1 pb-2.5 mb-2 border-b border-line dark:border-white/5">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${col.chip}`}>
                  <i className={`fa-solid ${col.icon} text-[10px]`}></i>
                </span>
                <span className="text-xs font-black text-content-1 dark:text-zinc-200 truncate">{col.estado}</span>
                <span className="ml-auto text-[11px] font-bold tabular-nums text-content-3 dark:text-content-3">{lista.length}</span>
              </div>

              <div className="flex flex-col gap-2">
                {lista.map(b => (
                  <div
                    key={b.id}
                    draggable={Boolean(onMover)}
                    onDragStart={() => setDragId(b.id)}
                    onDragEnd={() => { setDragId(null); setColActiva(null); }}
                    className={`group rounded-control border border-line/70 dark:border-white/10 bg-surface-1 dark:bg-zinc-900/60 p-2.5 shadow-xs motion ${dragId === b.id ? 'opacity-40' : 'hover:border-brand/40 hover:shadow-sm card-lift'}`}
                  >
                    <div className="flex items-start gap-2">
                      {onOpenFicha && (
                        <button
                          onClick={() => onOpenFicha(b)}
                          title={`Ver ficha 360 de ${b.rotulo || 'el bien'}`}
                          className="flex-1 min-w-0 text-left cursor-pointer"
                        >
                          <span className="font-mono font-semibold text-[10px] text-content-1 dark:text-white bg-surface-3 dark:bg-surface-1/10 px-1.5 py-0.5 rounded-md inline-block">
                            {b.rotulo || 'S/R'}
                          </span>
                          <p className="text-[11px] font-semibold text-content-1 dark:text-zinc-200 leading-snug line-clamp-2 mt-1">
                            {b.descripcion || 'Sin descripción'}
                          </p>
                        </button>
                      )}
                    </div>

                    <p className="text-[10px] text-content-3 dark:text-content-3 truncate mt-1.5">
                      <i className="fa-solid fa-location-dot text-rose-400 text-[9px] mr-1"></i>
                      {b.ubicacion || 'Sin ubicación'}
                    </p>

                    {/* Selector compacto: la alternativa al arrastre en táctil y teclado. */}
                    {onMover && (
                      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-line dark:border-white/5">
                        <label className="sr-only" htmlFor={`kb-est-${b.id}`}>Estado de {b.rotulo || 'bien'}</label>
                        <select
                          id={`kb-est-${b.id}`}
                          value={estadoCanonico(b.estadoConservacion)}
                          onChange={(e) => onMover(b, e.target.value)}
                          disabled={!isAdmin}
                          title={isAdmin ? 'Cambiar estado' : 'Solo el administrador puede cambiar el estado'}
                          className="flex-1 min-w-0 h-7 rounded-lg border border-line dark:border-white/10 bg-surface-2 dark:bg-surface-1/5 px-1.5 text-[10px] font-bold text-content-1 dark:text-zinc-200 outline-none focus:border-brand disabled:opacity-60"
                        >
                          {ESTADOS_CONSERVACION.map(e => (
                            <option key={e} value={e}>{e}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}

                {lista.length === 0 && (
                  <p className="text-[10px] font-semibold text-content-3 dark:text-content-2 text-center py-4">Vacío</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}