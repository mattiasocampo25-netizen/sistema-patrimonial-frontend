import Dialogo from './ui/Dialogo';
import React from 'react';

export default function CSVPreviewModal({ isOpen, onClose, onConfirm, data, STYLES }) {
  if (!isOpen) return null;

  const { validos = [], duplicados = [], errores = [], tipo = 'bienes' } = data;

  return (
    <Dialogo className={STYLES.modalOverlay}>
      <div className={STYLES.modalContent + " max-w-2xl overflow-hidden"}>
        <div className="flex justify-between items-center px-6 py-5 border-b border-line dark:border-zinc-800/80 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-surface-3 dark:bg-surface-1/10 text-content-1 dark:text-white">
              <i className="fa-solid fa-file-shield text-base"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold text-content-1 dark:text-white tracking-tight">
                Previsualización de Importación ({tipo.toUpperCase()})
              </h2>
            </div>
          </div>
          <button onClick={onClose} title="Cerrar" aria-label="Cerrar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-content-3 hover:text-content-1 dark:hover:text-zinc-200 hover:bg-surface-3 dark:hover:bg-surface-1/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
            <i className="fa-solid fa-xmark text-base"></i>
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {/* Resumen rápido */}
          <div className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/40 rounded-card text-center">
              <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{validos.length}</p>
              <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 mt-1 uppercase tracking-wider">Listos para importar</p>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-card text-center">
              <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">{duplicados.length}</p>
              <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300 mt-1 uppercase tracking-wider">Duplicados (Omitidos)</p>
            </div>
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/40 rounded-card text-center">
              <p className="text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400">{errores.length}</p>
              <p className="text-[11px] font-bold text-rose-700 dark:text-rose-300 mt-1 uppercase tracking-wider">Con Errores</p>
            </div>
          </div>

          {/* Listado de Errores si los hay */}
          {errores.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-content-3 dark:text-content-3 uppercase tracking-wider">Filas con errores (Descartadas):</p>
              <div className="bg-surface-1 dark:bg-zinc-950 border border-rose-200 dark:border-rose-900/40 rounded-card p-4 max-h-40 overflow-y-auto space-y-1">
                {errores.map((err, idx) => (
                  <div key={idx} className="text-xs text-rose-700 dark:text-rose-400 font-mono tabular-nums">
                    • Fila {err.linea}: {err.motivo}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Listado Válidos */}
          {validos.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-content-3 dark:text-content-3 uppercase tracking-wider">Vista previa de registros válidos:</p>
              <div className="bg-surface-1 dark:bg-zinc-950 border border-line dark:border-zinc-800 rounded-card p-4 max-h-40 overflow-y-auto space-y-1">
                {validos.slice(0, 10).map((v, idx) => (
                  <div key={idx} className="text-xs text-content-1 dark:text-content-3 font-medium flex justify-between gap-3">
                    <span className="truncate">{v.rotulo || v.cedula} - {v.descripcion || v.nombre}</span>
                    <span className="text-content-3 tabular-nums shrink-0">{v.valorUnitario ? `Gs. ${v.valorUnitario}` : v.cargo}</span>
                  </div>
                ))}
                {validos.length > 10 && <p className="text-xs text-content-3 text-center italic pt-2 tabular-nums">Y {validos.length - 10} registros más...</p>}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-line dark:border-zinc-800/80 shrink-0 z-10">
          <button onClick={onClose} className="inline-flex items-center justify-center h-10 px-4 rounded-control text-[13px] font-semibold text-content-2 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-1/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">Cancelar</button>
          <button
            onClick={onConfirm}
            disabled={validos.length === 0}
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-control bg-zinc-900 dark:bg-surface-1 text-white dark:text-content-1 font-bold text-[13px] hover:bg-zinc-800 dark:hover:bg-surface-3 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50 tabular-nums"
          >
            <i className="fa-solid fa-cloud-arrow-up text-xs"></i> Confirmar e Importar ({validos.length})
          </button>
        </div>
      </div>
    </Dialogo>
  );
}
