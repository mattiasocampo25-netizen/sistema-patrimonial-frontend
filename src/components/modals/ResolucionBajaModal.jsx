// src/components/modals/ResolucionBajaModal.jsx
import React from 'react';
import { Modal } from '../ui';

/**
 * Confirmacion de una resolucion de solicitud de baja.
 *
 * El mismo dialogo resuelve dos cosas distintas: dar de baja un bien del
 * inventario o eliminar a un funcionario del padron. El texto cambia segun
 * el tipo para no prometer una cosa y hacer otra.
 */
export default function ResolucionBajaModal({ resolucionBaja, setResolucionBaja, submitResolucionBaja, motivoResolucion, setMotivoResolucion, STYLES }) {
    if (!resolucionBaja) return null;

    const esFuncionario = resolucionBaja.notifOrigen?.tipo === 'BAJA_FUNCIONARIO';
    const esAprobar = resolucionBaja.accion === 'aprobar';
    const solicitante = resolucionBaja.notifOrigen?.solicitante || resolucionBaja.bien.bajaSolicitadaPor || 'Desconocido';

    return (
        <Modal
            abierto
            onCerrar={() => setResolucionBaja(null)}
            titulo={esAprobar ? (esFuncionario ? 'Aprobar Eliminación' : 'Aprobar Baja Definitiva') : 'Rechazar Solicitud'}
            descripcion={resolucionBaja.bien.rotulo}
            icono={esFuncionario ? 'fa-user-minus' : (esAprobar ? 'fa-check-double' : 'fa-xmark')}
            tamano="sm"
            pie={(
                <>
                    <button type="button" onClick={() => setResolucionBaja(null)} className="h-10 px-4 rounded-control text-[13px] font-semibold text-content-1 hover:bg-surface-3 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                        Cancelar
                    </button>
                    <button type="submit" form="form-resolucion-baja" className={`inline-flex items-center justify-center h-10 px-5 rounded-control text-[13px] font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${esAprobar ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-zinc-900 dark:bg-surface-1 text-white dark:text-content-1'}`}>
                        Confirmar {esAprobar ? (esFuncionario ? 'Eliminación' : 'Baja Definitiva') : 'Rechazo'}
                    </button>
                </>
            )}
        >
            <form id="form-resolucion-baja" onSubmit={submitResolucionBaja} className="p-5 sm:p-6 bg-surface-2/50 space-y-6">
                <div className="bg-surface-1 p-5 rounded-panel border border-line/60 shadow-sm relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand"></div>
                    <p className="text-[10px] font-black text-content-3 uppercase tracking-widest mb-1.5">
                        {esFuncionario ? 'Funcionario solicitado:' : 'Bien Solicitado:'}
                    </p>
                    <p className="text-sm font-black text-content-1">{resolucionBaja.bien.rotulo}</p>
                    <p className="text-xs text-content-3 mt-1 font-medium leading-relaxed">{resolucionBaja.bien.descripcion}</p>
                    <div className="mt-4 pt-4 border-t border-line">
                        <p className="text-[11px] font-bold text-brand-text flex items-center gap-1.5">
                            <i className="fa-solid fa-user-clock"></i> Solicitado por: {solicitante}
                        </p>
                    </div>
                </div>

                <div className="group relative">
                    <label className={STYLES.label} htmlFor="motivo-resolucion">
                        Motivo / Observación {esAprobar && <span className="text-content-3 font-normal lowercase">(Opcional)</span>}
                    </label>
                    <div className={`absolute -inset-0.5 rounded-card blur opacity-0 group-focus-within:opacity-20 transition duration-[var(--dur-slow)] ${esAprobar ? 'bg-gradient-to-r from-red-500 to-rose-500' : 'bg-gradient-to-r from-zinc-500 to-zinc-700'}`}></div>
                    <textarea
                        id="motivo-resolucion"
                        required={!esAprobar}
                        value={motivoResolucion}
                        onChange={e => setMotivoResolucion(e.target.value)}
                        className={`${STYLES.input} relative !rounded-card bg-surface-1 shadow-inner min-h-[110px] text-sm leading-relaxed resize-none p-4`}
                        placeholder="Escribe un mensaje explicativo para el usuario que solicitó la baja..."
                    ></textarea>
                    {esAprobar && (
                        <p className="text-[11px] text-red-500 font-bold mt-3 flex items-start gap-1.5">
                            <i className="fa-solid fa-triangle-exclamation mt-0.5"></i>
                            {esFuncionario
                                ? 'Al aprobar, el funcionario se eliminará del padrón. Esta acción es irreversible.'
                                : 'Al aprobar, el bien pasará a estado "De Baja" en todo el sistema. Esta acción es irreversible.'}
                        </p>
                    )}
                </div>
            </form>
        </Modal>
    );
}