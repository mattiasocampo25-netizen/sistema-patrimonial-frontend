// src/components/modals/ScannerModal.jsx
import React from 'react';

export default function ScannerModal({ isOpen, onClose, modoConteo, conteoActual, modoCampo, setModoCampo, STYLES }) {
    if (!isOpen) return null;

    const alternarModoCampo = () => {
      const v = !modoCampo;
      setModoCampo(v);
      try { localStorage.setItem('qr_modo_campo', v ? '1' : '0'); } catch {}
    };

    return (
        <div className={STYLES.modalOverlay}>
          <div className={STYLES.modalContent + " max-w-md !p-0 overflow-hidden rounded-[24px]"}>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-line dark:border-white/10">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-surface-3 text-content-1 dark:bg-surface-1/10 dark:text-white">
                <i className="fa-solid fa-camera text-base"></i>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold tracking-tight text-content-1 dark:text-white leading-tight">
                  {modoConteo ? 'Escaneo de conciliación' : 'Escanear Código QR'}
                </h2>
                <p className="text-xs text-content-3 dark:text-content-3">
                  {modoConteo ? `${conteoActual || 0} bienes contados · apunta al siguiente` : 'Apunte al código de la etiqueta'}
                </p>
              </div>
              <button
                onClick={alternarModoCampo}
                title={modoCampo ? 'Salir del modo campo' : 'Modo campo: resultado grande tras escanear'}
                className={`flex h-9 shrink-0 items-center gap-2 rounded-control px-3 text-[11px] font-black uppercase tracking-wider motion cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${modoCampo ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25' : 'text-content-3 hover:bg-surface-3 dark:hover:bg-surface-1/10'}`}
              >
                <i className="fa-solid fa-person-walking text-xs"></i>
                <span className="hidden sm:inline">Campo</span>
              </button>
              <button
                onClick={onClose}
                title="Cerrar" aria-label="Cerrar"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-content-3 hover:bg-surface-3 dark:text-content-3 dark:hover:bg-surface-1/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
              
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <div className="p-6 bg-black flex flex-col items-center justify-center relative">
                <div id="reader" className="w-full rounded-card overflow-hidden"></div>
                <p className="text-xs text-content-3 mt-4 text-center">Enfoque el código QR de la etiqueta patrimonial dentro del recuadro.</p>
            </div>

            <div className={STYLES.modalFooter}>
                <button 
                    onClick={onClose} 
                    className="h-10 px-4 rounded-control text-[13px] font-semibold text-content-1 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-1/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                    Cancelar
                </button>
            </div>
          </div>
        </div>
    );
}