// src/components/modals/LogoutModal.jsx
import React from 'react';

export default function LogoutModal({ isOpen, onClose, onConfirm, STYLES }) {
    if (!isOpen) return null;

    return (
        <div className={STYLES.modalOverlay}>
          <div className={STYLES.modalContent + " max-w-[360px] !p-0 overflow-hidden rounded-[24px] shadow-2xl border border-line/80 dark:border-line animate-slide-up"}>
            <div className="p-8 text-center bg-surface-1 dark:bg-surface-1 relative overflow-hidden">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-card bg-surface-3 dark:bg-surface-1/10 mb-6 text-content-1 dark:text-white">
                <i className="fa-solid fa-right-from-bracket text-xl relative left-0.5"></i>
              </div>
              
              <h3 className="text-lg font-bold tracking-tight text-content-1 dark:text-white mb-2">¿Cerrar Sesión?</h3>
              <p className="text-xs text-content-3 dark:text-content-3 font-medium leading-relaxed">
                Está a punto de salir de su cuenta actual. Deberá ingresar sus credenciales nuevamente para acceder.
              </p>
            </div>
            
            <div className="flex items-center gap-3 p-6 bg-surface-2 dark:bg-surface-2 border-t border-line dark:border-line">
              <button onClick={onClose} className="flex-1 h-10 px-4 rounded-control text-[13px] font-semibold text-content-1 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-1/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
                  Cancelar
              </button>
              <button onClick={onConfirm} className="flex-1 h-10 px-5 rounded-control text-[13px] font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
                  Sí, salir
              </button>
            </div>
          </div>
        </div>
    );
}