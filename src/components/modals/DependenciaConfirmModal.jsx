import React from 'react';

export default function DependenciaConfirmModal({ showDependenciaConfirm, setShowDependenciaConfirm, confirmDependenciaChange, pendingDependencia, STYLES }) {
    if (!showDependenciaConfirm) return null;

    return (
        <div className={STYLES.modalOverlay}>
          <div className={STYLES.modalContent + " max-w-[380px] !p-0 overflow-hidden rounded-[24px] shadow-2xl border border-line/80 dark:border-line animate-slide-up"}>
            <div className="p-8 text-center bg-surface-1 dark:bg-surface-1 relative overflow-hidden">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-card bg-surface-3 text-content-1 dark:bg-surface-1/10 dark:text-white mb-6">
                <i className="fa-solid fa-building-columns text-xl"></i>
              </div>
              <h3 className="text-lg font-bold tracking-tight text-content-1 dark:text-white mb-3">
                  Cambiar Entorno
              </h3>
              <p className="text-xs text-content-3 dark:text-content-3 font-medium leading-relaxed">
                ¿Está seguro que desea cambiar el entorno de trabajo a <strong className="text-content-1 dark:text-zinc-200">{pendingDependencia}</strong>? Esto recargará los datos y limpiará los filtros actuales.
              </p>
            </div>
            <div className="flex items-center gap-3 p-6 bg-surface-2 dark:bg-surface-2 border-t border-line dark:border-line">
              <button onClick={() => setShowDependenciaConfirm(false)} className="flex-1 h-10 px-4 rounded-control text-[13px] font-semibold text-content-1 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-1/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
                  Cancelar
              </button>
              <button onClick={confirmDependenciaChange} className="flex-1 h-10 px-5 rounded-control text-[13px] font-bold bg-zinc-900 dark:bg-surface-1 text-white dark:text-content-1 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
                  Sí, Cambiar
              </button>
            </div>
          </div>
        </div>
    );
}