// src/components/modals/FuncionarioModal.jsx
import FiltroCombo from '../FiltroCombo';
import React from 'react';
import Dialogo from '../ui/Dialogo';
import { formatCI } from '../../utils/helpers';

export default function FuncionarioModal({ isOpen, onClose, funcionarioToEdit, saveFuncionarioEdit, ubicaciones = [], STYLES }) {
    if (!isOpen || !funcionarioToEdit) return null;

    return (
        <Dialogo className={STYLES.modalOverlay}>
            <div className={STYLES.modalContent + " max-w-md overflow-hidden"}>
                <div className="flex justify-between items-center px-6 py-5 border-b border-line dark:border-zinc-800/80 shrink-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-surface-3 dark:bg-surface-1/10 text-content-1 dark:text-white">
                            <i className="fa-solid fa-user-pen text-base"></i>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-content-1 dark:text-white tracking-tight">Editar Funcionario</h2>
                            <p className="text-xs text-content-3 dark:text-content-3 mt-0.5">Modifique los datos del padrón</p>
                        </div>
                    </div>
                    <button onClick={onClose} title="Cerrar" aria-label="Cerrar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-content-3 hover:text-content-1 dark:hover:text-zinc-200 hover:bg-surface-3 dark:hover:bg-surface-1/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                        <i className="fa-solid fa-xmark text-base"></i>
                    </button>
                </div>

                <form onSubmit={saveFuncionarioEdit}>
                    <div className="p-6 space-y-5">
                        <div className="space-y-2">
                            <label className="block text-[11px] font-bold text-content-3 dark:text-content-3 uppercase tracking-wider">Cédula de Identidad</label>
                            <input
                                type="text"
                                disabled
                                value={formatCI(funcionarioToEdit.cedula)}
                                className="block w-full rounded-control border border-line dark:border-zinc-800 bg-surface-3 dark:bg-zinc-950 px-4 py-3 text-sm font-bold tabular-nums text-content-3 cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[11px] font-bold text-content-3 dark:text-content-3 uppercase tracking-wider">Nombre y Apellido</label>
                            <input
                                type="text"
                                name="nombre"
                                defaultValue={funcionarioToEdit.nombre}
                                required
                                className="block w-full rounded-control border border-line dark:border-zinc-800 bg-surface-2/50 dark:bg-zinc-950 px-4 py-3 text-sm font-bold text-content-1 dark:text-white focus:bg-surface-1 dark:focus:bg-zinc-900 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand motion"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[11px] font-bold text-content-3 dark:text-content-3 uppercase tracking-wider">Ubicación asignada</label>
                            <FiltroCombo
                                name="ubicacion"
                                valor={funcionarioToEdit.ubicacion || ''}
                                opciones={[
                                    ...ubicaciones,
                                    ...(funcionarioToEdit.ubicacion && !ubicaciones.includes(funcionarioToEdit.ubicacion)
                                        ? [{ label: `${funcionarioToEdit.ubicacion} (actual)`, value: funcionarioToEdit.ubicacion }]
                                        : []),
                                ]}
                                etiquetaTodos="Sin ubicación asignada"
                                titulo="Ubicación asignada"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[11px] font-bold text-content-3 dark:text-content-3 uppercase tracking-wider">Cargo Institucional</label>
                            <input
                                type="text"
                                name="cargo"
                                defaultValue={funcionarioToEdit.cargo || ''}
                                placeholder="Ej: Asistente Administrativo"
                                className="block w-full rounded-control border border-line dark:border-zinc-800 bg-surface-2/50 dark:bg-zinc-950 px-4 py-3 text-sm font-bold text-content-1 dark:text-white focus:bg-surface-1 dark:focus:bg-zinc-900 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand motion"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 px-6 py-4 border-t border-line dark:border-zinc-800/80 shrink-0 z-10">
                        <button type="button" onClick={onClose} className="inline-flex items-center justify-center h-10 px-4 rounded-control text-[13px] font-semibold text-content-2 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-1/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">Cancelar</button>
                        <button type="submit" className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-control bg-zinc-900 dark:bg-surface-1 text-white dark:text-content-1 font-bold text-[13px] hover:bg-zinc-800 dark:hover:bg-surface-3 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50">
                            <i className="fa-solid fa-floppy-disk text-xs"></i> Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </Dialogo>
    );
}
