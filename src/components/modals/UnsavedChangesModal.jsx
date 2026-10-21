import Dialogo from '../ui/Dialogo';
import React from 'react';

export default function UnsavedChangesModal({ isOpen, onConfirmClose, onCancel, STYLES }) {
  if (!isOpen) return null;

  return (
    <Dialogo className={STYLES.modalOverlay}>
      <div className={STYLES.modalContent + " max-w-sm rounded-[24px] p-6 text-center bg-surface-1 dark:bg-zinc-900 border border-line dark:border-zinc-800 shadow-2xl animate-slide-up"}>
        
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-card bg-amber-100 dark:bg-amber-500/10 text-warn dark:text-amber-400 mb-4">
          <i className="fa-solid fa-triangle-exclamation text-xl"></i>
        </div>

        <h3 className="text-lg font-bold tracking-tight text-content-1 dark:text-white mb-1.5">
          ¿Descartar cambios?
        </h3>

        <p className="text-xs font-medium text-content-3 dark:text-content-3 mb-6 leading-relaxed">
          Tienes datos modificados en el formulario. Si cierras ahora, se perderán las ediciones no guardadas.
        </p>

        <div className="flex gap-2.5 justify-end">
          <button 
            data-modal-close
            onClick={onCancel}
            className="flex-1 h-10 px-4 rounded-control text-[13px] font-semibold text-content-1 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-1/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            Continuar editando
          </button>
          <button 
            onClick={onConfirmClose}
            className="flex-1 h-10 px-5 rounded-control text-[13px] font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            Sí, descartar
          </button>
        </div>

      </div>
    </Dialogo>
  );
}