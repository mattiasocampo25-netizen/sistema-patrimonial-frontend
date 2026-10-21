import Dialogo from '../ui/Dialogo';
import React, { useState, useEffect } from 'react';

export default function MantenimientoModal({ isOpen, onClose, initial, onSave, isSaving, STYLES }) {
  const [activo, setActivo] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [mejoras, setMejoras] = useState('');

  useEffect(() => {
    if (isOpen) {
      setActivo(Boolean(initial?.en_mantenimiento));
      setTitulo(initial?.titulo || '');
      setMensaje(initial?.mensaje || '');
      const m = Array.isArray(initial?.mejoras) ? initial.mejoras.join('\n') : (initial?.mejoras || '');
      setMejoras(m);
    }
  }, [isOpen, initial]);

  if (!isOpen) return null;

  return (
    <Dialogo className={STYLES.modalOverlay} onCerrar={onClose}>
      <div className={STYLES.modalContent + " max-w-md"} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-5 border-b border-line dark:border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-surface-3 dark:bg-surface-1/10 text-content-1 dark:text-white">
              <i className="fa-solid fa-screwdriver-wrench text-base"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold text-content-1 dark:text-white tracking-tight">Modo Mantenimiento</h2>
              <p className="text-xs text-content-3 dark:text-content-3 mt-0.5">Bloquea el acceso y muestra el aviso a todos</p>
            </div>
          </div>
          <button onClick={onClose} title="Cerrar" aria-label="Cerrar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-content-3 hover:text-content-1 dark:hover:text-zinc-200 hover:bg-surface-3 dark:hover:bg-surface-1/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
            <i className="fa-solid fa-xmark text-base"></i>
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          <button
            type="button"
            onClick={() => setActivo(!activo)}
            className="flex w-full items-center justify-between rounded-card border border-line dark:border-zinc-800 bg-surface-2 dark:bg-zinc-950 px-4 py-3.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            <span className="flex items-center gap-3">
              <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${activo ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-surface-1 shadow transition-transform ${activo ? 'translate-x-6' : 'translate-x-1'}`}></span>
              </span>
              <span className="text-sm font-bold text-content-1 dark:text-white">
                {activo ? 'Mantenimiento activado' : 'Mantenimiento desactivado'}
              </span>
            </span>
          </button>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-content-3 dark:text-content-3">Título del aviso</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Estamos mejorando el sistema"
              className="block w-full rounded-control border border-line dark:border-zinc-800 bg-surface-2 dark:bg-zinc-950 px-4 py-3 text-sm font-medium text-content-1 dark:text-white placeholder:text-content-3 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 motion"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-content-3 dark:text-content-3">Mensaje</label>
            <textarea
              rows={3}
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Ej: El acceso está pausado por trabajos programados..."
              className="block w-full rounded-control border border-line dark:border-zinc-800 bg-surface-2 dark:bg-zinc-950 px-4 py-3 text-sm font-medium text-content-1 dark:text-white placeholder:text-content-3 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 motion resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-content-3 dark:text-content-3">Mejoras en curso (una por línea)</label>
            <textarea
              rows={4}
              value={mejoras}
              onChange={(e) => setMejoras(e.target.value)}
              placeholder={"Ej:\nNuevo buscador con tildes\nReportes FC más rápidos"}
              className="block w-full rounded-control border border-line dark:border-zinc-800 bg-surface-2 dark:bg-zinc-950 px-4 py-3 text-sm font-medium text-content-1 dark:text-white placeholder:text-content-3 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 motion resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-5 border-t border-line dark:border-zinc-800/80 shrink-0">
          <button onClick={onClose} className="h-10 px-4 rounded-control text-[13px] font-semibold text-content-2 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-1/10 motion cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
            Cancelar
          </button>
          <button
            onClick={() => onSave({ en_mantenimiento: activo, titulo: titulo.trim(), mensaje: mensaje.trim(), mejoras: mejoras.split('\n').map(s => s.trim()).filter(Boolean) })}
            disabled={isSaving}
            className="h-10 px-5 rounded-control bg-zinc-900 dark:bg-surface-1 text-white dark:text-content-1 font-bold text-[13px] hover:bg-zinc-700 dark:hover:bg-surface-3 motion cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : 'Publicar aviso'}
          </button>
        </div>
      </div>
    </Dialogo>
  );
}
