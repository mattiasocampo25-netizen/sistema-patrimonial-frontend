import React, { useState } from 'react';
import { useDraft, serializarForm } from '../hooks/useDraft';
import Dialogo from './ui/Dialogo';
import FiltroCombo from './FiltroCombo';

export default function FC11Modal({
    setIsFC11ModalOpen,
    fc11TargetBien,
    fc11Editing,
    saveFC11,
    todasDependencias,
    dependenciaActual,
    formatCurrency,
    STYLES
}) {
    const esNuevoFC = !fc11Editing;
    const { borrador: borradorFC, hayBorrador: hayBorradorFC, guardarBorrador: guardarBorradorFC, limpiarBorrador: limpiarBorradorFC } = useDraft('borrador_fc11_nuevo', esNuevoFC);
    const [restauradoFC, setRestauradoFC] = useState(null);
    const [formKeyFC, setFormKeyFC] = useState(0);
    const defectoFC = (campo, fb) => (restauradoFC && restauradoFC[campo] !== undefined && restauradoFC[campo] !== null ? restauradoFC[campo] : fb);
    const continuarBorradorFC = () => {
        if (!borradorFC) return;
        setRestauradoFC(borradorFC);
        setFormKeyFC(k => k + 1);
    };
    const [step, setStep] = useState(1);

    if (!fc11TargetBien) return null;

    // Función para validar el paso actual antes de avanzar
    const nextStep = () => {
        const currentSection = document.getElementById(`step-${step}-fc11`);
        if (currentSection) {
            const inputs = currentSection.querySelectorAll('input[required], select[required]');
            for (let input of inputs) {
                if (!input.value) {
                    input.reportValidity();
                    return; 
                }
            }
        }
        setStep(prev => Math.min(prev + 1, 2));
    };

    return (
        <Dialogo className={STYLES.modalOverlay}>
            <div className={STYLES.modalContent + " max-w-4xl"}>
                
                {/* CABECERA */}
                <div className="px-8 py-6 border-b border-line dark:border-line bg-surface-1 dark:bg-surface-1 shrink-0 z-10 flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-card bg-surface-3 dark:bg-surface-1/10 text-content-1 dark:text-white shrink-0">
                            <i className="fa-solid fa-truck-fast text-lg"></i>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold tracking-tight text-content-1 dark:text-white">
                                {fc11Editing ? 'Editar Traslado FC-11' : 'Nuevo Traslado FC-11'}
                            </h2>
                            <p className="text-xs text-content-3 dark:text-content-3 mt-0.5">Movilidad interna institucional de bienes entre dependencias</p>
                        </div>
                    </div>

                    <button type="button" title="Cerrar" aria-label="Cerrar" onClick={() => setIsFC11ModalOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-control text-content-3 hover:text-content-1 dark:hover:text-white hover:bg-surface-3 dark:hover:bg-surface-1/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand transition-colors cursor-pointer shrink-0">
                        <i className="fa-solid fa-xmark text-base"></i>
                    </button>
                </div>
                
{esNuevoFC && hayBorradorFC && !restauradoFC && (
                  <div className="mx-8 mt-6 flex flex-wrap items-center gap-2 rounded-card bg-amber-500/10 border border-amber-500/20 px-4 py-3 animate-fade-in">
                    <i className="fa-solid fa-history text-amber-600 dark:text-amber-400 text-sm"></i>
                    <p className="flex-1 min-w-[200px] text-xs font-bold text-amber-700 dark:text-amber-300">Tienes un borrador sin guardar.</p>
                    <button type="button" onClick={continuarBorradorFC} className="h-8 px-3.5 rounded-control text-[11px] font-black bg-zinc-900 dark:bg-surface-1 text-white dark:text-content-1 hover:bg-zinc-700 dark:hover:bg-surface-3 motion cursor-pointer">Continuar</button>
                    <button type="button" onClick={limpiarBorradorFC} className="h-8 px-3.5 rounded-control text-[11px] font-bold text-content-3 hover:text-content-1 dark:hover:text-zinc-200 transition-colors cursor-pointer">Descartar</button>
                  </div>
                )}<form key={formKeyFC} onSubmit={async (e) => { const ok = await saveFC11(e); if (ok) limpiarBorradorFC(); }} onChange={(e) => guardarBorradorFC(serializarForm(e.currentTarget))} className="flex flex-col h-full overflow-hidden bg-surface-2/30 dark:bg-surface-2/50">
                    <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                        
                        {/* BARRA DE PROGRESO WIZARD */}
                        <div className="flex gap-2">
                            {[1, 2].map(i => (
                                <div key={i} className={`h-2 flex-1 rounded-full motion duration-[var(--dur-slow)] ${step >= i ? 'bg-zinc-900 dark:bg-surface-1' : 'bg-surface-3 dark:bg-surface-3'}`}></div>
                            ))}
                        </div>

                        {/* RESUMEN DEL BIEN (Visible siempre) */}
                        <div className="bg-surface-1 dark:bg-surface-1 border border-line/60 dark:border-line rounded-[20px] p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500"></div>
                            <div className="pl-3">
                                <p className="text-[10px] text-content-3 font-black uppercase tracking-widest mb-1.5">Bien a trasladar</p>
                                <p className="font-black text-content-1 dark:text-zinc-100 text-sm">
                                    {fc11TargetBien.rotulo} <span className="font-medium text-content-3 dark:text-content-3 ml-1">- {fc11TargetBien.descripcion}</span>
                                </p>
                            </div>
                            <div className="sm:text-right pl-3 sm:pl-0">
                                <p className="text-[10px] text-content-3 font-black uppercase tracking-widest mb-1.5">Valor Patrimonial</p>
                                <p className="font-black text-emerald-600 dark:text-emerald-400 text-sm tabular-nums">Gs. {formatCurrency(fc11TargetBien.valorUnitario)}</p>
                            </div>
                        </div>

                        {/* PASO 1: ORIGEN Y DESTINO */}
                        <div id="step-1-fc11" className={step === 1 ? "block animate-fade-in" : "hidden"}>
                            <div className="bg-surface-1 dark:bg-surface-1 p-7 rounded-[24px] border border-line/60 dark:border-line shadow-sm relative group/section">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 rounded-l-[24px]"></div>
                                <h3 className="text-sm font-black text-content-1 dark:text-white flex items-center gap-3 mb-6 uppercase tracking-wider">
                                    <div className="h-8 w-8 rounded-control bg-indigo-50 text-indigo-500 dark:bg-indigo-900/20 flex items-center justify-center border border-indigo-100 dark:border-indigo-800"><i className="fa-solid fa-route"></i></div>
                                    Paso 1: Ruta del Traslado
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5 pb-5 border-b border-line dark:border-line">
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-content-3 dark:text-content-3 mb-2">Nº Formulario (Opcional)</label>
                                        <input name="numeroFormulario" defaultValue={defectoFC('numeroFormulario', (fc11Editing?.numeroFormulario))} className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} placeholder="Ej. 001-2026" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-content-3 dark:text-content-3 mb-2">Fecha de Traslado</label>
                                        <input type="date" name="fecha" required defaultValue={defectoFC('fecha', (fc11Editing?.fecha || new Date().toISOString().split('T')[0]))} className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary cursor-pointer tabular-nums`} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-content-3 dark:text-content-3 mb-2">Dependencia Remitente</label>
                                        <input value={dependenciaActual} disabled className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary bg-surface-3 dark:bg-surface-2 text-content-3 cursor-not-allowed`} />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-content-3 dark:text-content-3 mb-2">Área Remitente</label>
                                        <input name="areaRemitente" required defaultValue={defectoFC('areaRemitente', (fc11Editing?.areaRemitente))} className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} placeholder="Área o Dpto. de origen" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-content-3 dark:text-content-3 mb-2">Dependencia Destinataria</label>
                                        <FiltroCombo
                                            name="dependenciaDestinataria"
                                            required
                                            valor={defectoFC('dependenciaDestinataria', (fc11Editing?.dependenciaDestinataria || ''))}
                                            opciones={todasDependencias}
                                            etiquetaTodos="Seleccione destino..."
                                            titulo="Dependencia destinataria"
                                            errorMsg="Seleccione la dependencia destinataria."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-content-3 dark:text-content-3 mb-2">Área Destinataria</label>
                                        <input name="areaDestinataria" required defaultValue={defectoFC('areaDestinataria', (fc11Editing?.areaDestinataria))} className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} placeholder="Área o Dpto. de destino" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PASO 2: DETALLES ADICIONALES */}
                        <div id="step-2-fc11" className={step === 2 ? "block animate-fade-in" : "hidden"}>
                            <div className="bg-surface-1 dark:bg-surface-1 p-7 rounded-[24px] border border-line/60 dark:border-line shadow-sm relative group/section">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 rounded-l-[24px]"></div>
                                <h3 className="text-sm font-black text-content-1 dark:text-white flex items-center gap-3 mb-6 uppercase tracking-wider">
                                    <div className="h-8 w-8 rounded-control bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20 flex items-center justify-center border border-emerald-100 dark:border-emerald-800"><i className="fa-solid fa-clipboard-check"></i></div>
                                    Paso 2: Condiciones del Traslado
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-content-3 dark:text-content-3 mb-2">Motivo del Traslado</label>
                                        <FiltroCombo
                                            name="motivo"
                                            required
                                            valor={defectoFC('motivo', (fc11Editing?.motivo || 'Traspaso'))}
                                            opciones={['Traspaso', 'Préstamo', 'Inservible', 'Faltante']}
                                            etiquetaTodos="Motivo"
                                            titulo="Motivo del traslado"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-content-3 dark:text-content-3 mb-2">Estado de Conservación Actual</label>
                                        <FiltroCombo
                                            name="estadoConservacion"
                                            required
                                            valor={defectoFC('estadoConservacion', (fc11Editing?.estadoConservacion || fc11TargetBien.estadoConservacion || 'Bueno'))}
                                            opciones={['Muy bueno', 'Bueno', 'Regular', 'Malo', 'Inutilizable']}
                                            etiquetaTodos="Estado"
                                            titulo="Estado de conservación"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-content-3 dark:text-content-3 mb-2">Observaciones</label>
                                        <input name="observaciones" defaultValue={defectoFC('observaciones', (fc11Editing?.observaciones))} className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary`} placeholder="Anotaciones adicionales..." />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                    
                    <div className="flex justify-end gap-3 px-8 py-6 border-t border-line dark:border-line bg-surface-1 dark:bg-surface-1 shrink-0 z-10">
                        {step === 1 ? (
                            <button type="button" onClick={() => setIsFC11ModalOpen(false)} className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-control text-[13px] font-semibold text-content-2 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-1/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand motion active:scale-95 cursor-pointer">Cancelar</button>
                        ) : (
                            <button type="button" onClick={() => setStep(step - 1)} className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-control text-[13px] font-semibold text-content-2 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-1/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand motion active:scale-95 cursor-pointer">Anterior</button>
                        )}
                        
                        {step < 2 ? (
                            <button type="button" onClick={nextStep} className="inline-flex items-center justify-center gap-2 bg-zinc-900 dark:bg-surface-1 text-white dark:text-content-1 font-bold text-[13px] h-10 px-5 rounded-control hover:bg-zinc-800 dark:hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand motion active:scale-95 cursor-pointer">
                                Siguiente Paso <i className="fa-solid fa-arrow-right text-xs ml-1"></i>
                            </button>
                        ) : (
                            <button type="submit" className="inline-flex items-center justify-center gap-2 bg-zinc-900 dark:bg-surface-1 text-white dark:text-content-1 font-bold text-[13px] h-10 px-5 rounded-control hover:bg-zinc-800 dark:hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand motion active:scale-95 cursor-pointer">
                                <i className="fa-solid fa-paper-plane text-xs mr-1"></i> Confirmar Traslado
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </Dialogo>
    );
}