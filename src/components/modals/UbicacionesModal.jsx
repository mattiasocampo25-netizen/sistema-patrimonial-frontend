import Dialogo from '../ui/Dialogo';
import React, { useState, useEffect } from 'react';

// Gestor del catálogo de ubicaciones de la dependencia (solo admin).
export default function UbicacionesModal({ isOpen, onClose, ubicaciones, conteos, onSave, onDelete, isSaving, dependenciaActual, STYLES }) {
  const [nuevo, setNuevo] = useState('');
  const [editId, setEditId] = useState(null);
  const [editNombre, setEditNombre] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNuevo('');
      setEditId(null);
      setEditNombre('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const empezarEdicion = (u) => {
    setEditId(u.id);
    setEditNombre(u.nombre);
  };

  return (
    <Dialogo className={STYLES.modalOverlay} onCerrar={onClose}>
      <div className={STYLES.modalContent + " max-w-lg"} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-5 border-b border-line dark:border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-surface-3 dark:bg-surface-1/10 text-content-1 dark:text-white">
              <i className="fa-solid fa-location-dot text-base"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold text-content-1 dark:text-white tracking-tight">Ubicaciones</h2>
              <p className="text-xs text-content-3 dark:text-content-3 mt-0.5">{dependenciaActual} · {ubicaciones.length} registradas</p>
            </div>
          </div>
          <button onClick={onClose} title="Cerrar" aria-label="Cerrar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-content-3 hover:text-content-1 dark:hover:text-zinc-200 hover:bg-surface-3 dark:hover:bg-surface-1/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
            <i className="fa-solid fa-xmark text-base"></i>
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={nuevo}
              onChange={(e) => setNuevo(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && nuevo.trim()) { onSave(null, nuevo.trim()); setNuevo(''); } }}
              placeholder="Nueva ubicación... Ej: Dirección General TIC"
              className="flex-1 rounded-control border border-line dark:border-zinc-800 bg-surface-2 dark:bg-zinc-950 px-4 h-11 text-sm font-medium text-content-1 dark:text-white placeholder:text-content-3 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 motion"
            />
            <button
              onClick={() => { if (nuevo.trim()) { onSave(null, nuevo.trim()); setNuevo(''); } }}
              disabled={isSaving || !nuevo.trim()}
              title="Agregar ubicación"
              className="h-11 px-4 rounded-control bg-zinc-900 dark:bg-surface-1 text-white dark:text-content-1 font-bold text-[13px] hover:bg-zinc-700 dark:hover:bg-surface-3 motion cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:opacity-40 shrink-0"
            >
              <i className="fa-solid fa-plus text-xs mr-1.5"></i>Agregar
            </button>
          </div>

          <div className="rounded-card border border-line/70 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800/60 overflow-hidden">
            {ubicaciones.length === 0 && (
              <p className="p-5 text-center text-xs font-semibold text-content-3">Sin ubicaciones. Agrega la primera arriba.</p>
            )}
            {ubicaciones.map(u => {
              const c = conteos[u.nombre] || { bienes: 0, funcionarios: 0 };
              const enUso = c.bienes > 0 || c.funcionarios > 0;
              return (
                <div key={u.id} className="flex items-center gap-2 px-4 py-2.5">
                  {editId === u.id ? (
                    <>
                      <input
                        type="text"
                        value={editNombre}
                        autoFocus
                        onChange={(e) => setEditNombre(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && editNombre.trim()) { onSave(u.id, editNombre.trim()); setEditId(null); }
                          if (e.key === 'Escape') setEditId(null);
                        }}
                        className="flex-1 rounded-control border border-line-strong dark:border-zinc-700 bg-surface-1 dark:bg-zinc-950 px-3 h-9 text-sm font-medium text-content-1 dark:text-white outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                      />
                      <button
                        onClick={() => { if (editNombre.trim()) { onSave(u.id, editNombre.trim()); setEditId(null); } }}
                        title="Guardar" aria-label="Guardar"
                        className="flex h-9 w-9 items-center justify-center rounded-control bg-zinc-900 dark:bg-surface-1 text-white dark:text-content-1 cursor-pointer shrink-0"
                      >
                        <i className="fa-solid fa-check text-xs"></i>
                      </button>
                      <button onClick={() => setEditId(null)} title="Cancelar" aria-label="Cancelar" className="flex h-9 w-9 items-center justify-center rounded-control hover:bg-surface-3 dark:hover:bg-surface-1/10 text-content-3 cursor-pointer shrink-0">
                        <i className="fa-solid fa-xmark text-xs"></i>
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-bold text-content-1 dark:text-zinc-200 truncate" title={u.nombre}>{u.nombre}</span>
                        <span className="block text-[11px] text-content-3 tabular-nums">{c.bienes} bienes · {c.funcionarios} funcionarios</span>
                      </span>
                      <button onClick={() => empezarEdicion(u)} title="Renombrar" aria-label="Renombrar" className="flex h-8 w-8 items-center justify-center rounded-lg text-content-3 hover:text-content-1 hover:bg-surface-3 dark:hover:text-white dark:hover:bg-surface-1/10 motion cursor-pointer shrink-0">
                        <i className="fa-solid fa-pen text-xs"></i>
                      </button>
                      <button
                        onClick={() => onDelete(u.id, u.nombre)}
                        title={enUso ? 'En uso: no se puede eliminar' : 'Eliminar ubicación'}
                        disabled={enUso}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-content-3 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 motion cursor-pointer shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <i className="fa-solid fa-trash-can text-xs"></i>
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-content-3 leading-relaxed">Solo se puede eliminar una ubicación sin bienes ni funcionarios asignados. Renombrar no altera los registros existentes.</p>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-line dark:border-zinc-800/80 shrink-0">
          <button onClick={onClose} className="h-10 px-5 rounded-control bg-zinc-900 dark:bg-surface-1 text-white dark:text-content-1 font-bold text-[13px] hover:bg-zinc-700 dark:hover:bg-surface-3 motion cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
            Listo
          </button>
        </div>
      </div>
    </Dialogo>
  );
}
