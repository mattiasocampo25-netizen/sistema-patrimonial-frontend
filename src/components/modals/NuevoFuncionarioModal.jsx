// src/components/modals/NuevoFuncionarioModal.jsx
import FiltroCombo from '../FiltroCombo';
import React, { useState } from 'react';
import { formatearMiles } from '../../utils/helpers';

export default function NuevoFuncionarioModal({ isOpen, onClose, onSave, dependenciaActual, ubicaciones = [], STYLES }) {
    const [ciAviso, setCiAviso] = useState('');
    if (!isOpen) return null;

    const validarCI = (valor) => {
        const digitos = String(valor || '').replace(/\D/g, '');
        if (!digitos) { setCiAviso(''); return true; }
        const ok = digitos.length >= 6 && digitos.length <= 8;
        setCiAviso(ok ? '' : 'La CI paraguaya suele tener 6 a 8 dígitos.');
        return ok;
    };

    return (
        <div className={STYLES.modalOverlay}>
            <div className={STYLES.modalContent + " max-w-lg overflow-hidden"}>
                <div className="flex justify-between items-center px-6 py-5 border-b border-line dark:border-zinc-800/80 shrink-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-surface-3 dark:bg-surface-1/10 text-content-1 dark:text-white">
                            <i className="fa-solid fa-user-plus text-base"></i>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-content-1 dark:text-white tracking-tight">Nuevo Funcionario</h2>
                            <p className="text-xs text-content-3 dark:text-content-3 mt-0.5">Registro manual en el padrón de {dependenciaActual}</p>
                        </div>
                    </div>
                    <button onClick={onClose} title="Cerrar" aria-label="Cerrar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-content-3 hover:text-content-1 dark:hover:text-zinc-200 hover:bg-surface-3 dark:hover:bg-surface-1/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"><i className="fa-solid fa-xmark text-base"></i></button>
                </div>

                <form onSubmit={onSave} className="flex flex-col">
                    <div className={STYLES.modalBody}>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-[0.05em] text-content-3 dark:text-content-3 mb-2 whitespace-normal">Cédula de Identidad</label>
                                <div className="relative">
                                    <i className="fa-solid fa-id-card absolute left-4 top-1/2 -translate-y-1/2 text-content-3 text-sm"></i>
                                    <input type="text" name="cedula" required inputMode="numeric" onInput={(e) => { e.target.value = formatearMiles(e.target.value); validarCI(e.target.value); }} onBlur={(e) => validarCI(e.target.value)} className={`${STYLES.input} pl-11 tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} placeholder="Ej. 1.234.567" />
                                </div>
                                {ciAviso && (
                                  <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                    <i className="fa-solid fa-triangle-exclamation text-[10px]"></i>{ciAviso}
                                  </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-[0.05em] text-content-3 dark:text-content-3 mb-2 whitespace-normal">Nombre Completo</label>
                                <div className="relative">
                                    <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-content-3 text-sm"></i>
                                    <input type="text" name="nombre" required className={`${STYLES.input} pl-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} placeholder="Ej. Juan Pérez" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-[0.05em] text-content-3 dark:text-content-3 mb-2 whitespace-normal">Cargo Institucional</label>
                                <div className="relative">
                                    <i className="fa-solid fa-briefcase absolute left-4 top-1/2 -translate-y-1/2 text-content-3 text-sm"></i>
                                    <input type="text" name="cargo" className={`${STYLES.input} pl-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} placeholder="Ej. Administrador" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-[0.05em] text-content-3 dark:text-content-3 mb-2 whitespace-normal">Ubicación asignada</label>
                                <FiltroCombo
                                    name="ubicacion"
                                    valor=""
                                    opciones={ubicaciones}
                                    etiquetaTodos="Sin ubicación asignada"
                                    titulo="Seleccionar ubicación"
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 px-6 py-4 border-t border-line dark:border-zinc-800/80 shrink-0 z-10">
                        <button type="button" onClick={onClose} className="inline-flex items-center justify-center h-10 px-4 rounded-control text-[13px] font-semibold text-content-2 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-1/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">Cancelar</button>
                        <button type="submit" className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-control bg-zinc-900 dark:bg-surface-1 text-white dark:text-content-1 font-bold text-[13px] hover:bg-zinc-800 dark:hover:bg-surface-3 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:opacity-50"><i className="fa-solid fa-floppy-disk text-xs"></i> Guardar Funcionario</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
