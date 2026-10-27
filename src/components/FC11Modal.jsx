import React, { useState } from 'react';
import { useDraft, serializarForm } from '../hooks/useDraft';
import Dialogo from './ui/Dialogo';
import { Button, IconButton } from './ui';
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
    const { borrador: borradorFC, hayBorrador: hayBorradorFC, estadoGuardado, guardarBorrador: guardarBorradorFC, limpiarBorrador: limpiarBorradorFC } = useDraft('borrador_fc11_nuevo', esNuevoFC);
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

                    <IconButton titulo="Cerrar" icono="fa-xmark" variante="ghost" tamano="sm" onClick={() => setIsFC11ModalOpen(false)} />
                </div>
                
{esNuevoFC && hayBorradorFC && !restauradoFC && (
                  <div className="mx-8 mt-6 flex flex-wrap items-center gap-2 rounded-card bg-warn-soft border border-warn/25 px-4 py-3 animate-fade-in">
                    <i className="fa-solid fa-history text-warn dark:text-warn text-sm"></i>
                    <p className="flex-1 min-w-[200px] text-xs font-bold text-warn dark:text-warn">Tienes un borrador sin guardar.</p>
                    <Button variante="subtle" tamano="sm" icono="fa-rotate-right" onClick={continuarBorradorFC}>
                      Continuar
                    </Button>
                    <Button variante="ghost" tamano="sm" onClick={limpiarBorradorFC}>
                      Descartar
                    </Button>
                  </div>
                )}<form key={formKeyFC} onSubmit={async (e) => { const ok = await saveFC11(e); if (ok) limpiarBorradorFC(); }} onChange={(e) => guardarBorradorFC(serializarForm(e.currentTarget))} className="flex flex-col h-full overflow-hidden bg-surface-2/30 dark:bg-surface-2/50">
                    <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                        {estadoGuardado && <p role="status" className="text-label font-semibold text-ok"><i className="fa-solid fa-cloud-arrow-up mr-1.5" aria-hidden="true" />{estadoGuardado}</p>}
                        
                        {/* BARRA DE PROGRESO WIZARD */}
                        <div className="flex gap-2">
                            {[1, 2].map(i => (
                                <div key={i} className={`h-2 flex-1 rounded-full motion duration-[var(--dur-slow)] ${step >= i ? 'bg-surface-1 dark:bg-surface-2' : 'bg-surface-3 dark:bg-surface-1/5'}`}></div>
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
                                <p className="font-black text-ok dark:text-emerald-400 text-sm tabular-nums">Gs. {formatCurrency(fc11TargetBien.valorUnitario)}</p>
                            </div>
                        </div>

                        {/* PASO 1: ORIGEN Y DESTINO */}
                        <div id="step-1-fc11" className={step === 1 ? "block animate-fade-in" : "hidden"}>
                            <div className="bg-surface-1 dark:bg-surface-1 p-7 rounded-[24px] border border-line/60 dark:border-line shadow-sm relative group/section">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-brand rounded-l-[24px]"></div>
                                <h3 className="text-sm font-black text-content-1 dark:text-white flex items-center gap-3 mb-6 uppercase tracking-wider">
                                    <div className="h-8 w-8 rounded-control bg-brand-soft text-brand-text dark:bg-brand/20 flex items-center justify-center border border-brand/25 dark:border-brand/40"><i className="fa-solid fa-route"></i></div>
                                    Paso 1: Ruta del Traslado
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5 pb-5 border-b border-line dark:border-line">
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-content-3 dark:text-content-3 mb-2">Nº Formulario (Opcional)</label>
                                        <input name="numeroFormulario" defaultValue={defectoFC('numeroFormulario', (fc11Editing?.numeroFormulario))} className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand`} placeholder="Ej. 001-2026" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-content-3 dark:text-content-3 mb-2">Fecha de Traslado</label>
                                        <input type="date" name="fecha" required defaultValue={defectoFC('fecha', (fc11Editing?.fecha || new Date().toISOString().split('T')[0]))} className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer tabular-nums`} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-content-3 dark:text-content-3 mb-2">Dependencia Remitente</label>
                                        <input value={dependenciaActual} disabled className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand bg-surface-3 dark:bg-surface-2 text-content-3 cursor-not-allowed`} />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-content-3 dark:text-content-3 mb-2">Área Remitente</label>
                                        <input name="areaRemitente" required defaultValue={defectoFC('areaRemitente', (fc11Editing?.areaRemitente))} className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand`} placeholder="Área o Dpto. de origen" />
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
                                        <input name="areaDestinataria" required defaultValue={defectoFC('areaDestinataria', (fc11Editing?.areaDestinataria))} className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand`} placeholder="Área o Dpto. de destino" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PASO 2: DETALLES ADICIONALES */}
                        <div id="step-2-fc11" className={step === 2 ? "block animate-fade-in" : "hidden"}>
                            <div className="bg-surface-1 dark:bg-surface-1 p-7 rounded-[24px] border border-line/60 dark:border-line shadow-sm relative group/section">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-ok rounded-l-[24px]"></div>
                                <h3 className="text-sm font-black text-content-1 dark:text-white flex items-center gap-3 mb-6 uppercase tracking-wider">
                                    <div className="h-8 w-8 rounded-control bg-ok-soft text-ok dark:bg-ok/20 flex items-center justify-center border border-ok/25 dark:border-ok/40"><i className="fa-solid fa-clipboard-check"></i></div>
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
                                        <input name="observaciones" defaultValue={defectoFC('observaciones', (fc11Editing?.observaciones))} className={`${STYLES.input} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand`} placeholder="Anotaciones adicionales..." />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                    
                    <div className="flex justify-end gap-3 px-8 py-6 border-t border-line dark:border-line bg-surface-1 dark:bg-surface-1 shrink-0 z-10">
                        {step === 1 ? (
                            <Button variante="ghost" tamano="md" onClick={() => setIsFC11ModalOpen(false)}>
                              Cancelar
                            </Button>
                        ) : (
                            <Button variante="subtle" tamano="md" onClick={() => setStep(step - 1)}>
                              Anterior
                            </Button>
                        )}
                        
                        {step < 2 ? (
                            <Button variante="primary" tamano="md" onClick={nextStep}>
                              Siguiente Paso <i className="fa-solid fa-arrow-right text-xs ml-1"></i>
                            </Button>
                        ) : (
                            <Button variante="primary" tamano="md" type="submit">
                                <i className="fa-solid fa-paper-plane text-xs mr-1"></i> Confirmar Traslado
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </Dialogo>
    );
}
