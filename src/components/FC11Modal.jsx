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
    const bienesFC11 = Array.isArray(fc11TargetBien) ? fc11TargetBien : [fc11TargetBien].filter(Boolean);
    const { borrador: borradorFC, hayBorrador: hayBorradorFC, estadoGuardado, guardarBorrador: guardarBorradorFC, limpiarBorrador: limpiarBorradorFC } = useDraft('borrador_fc11_nuevo', esNuevoFC);
    const [restauradoFC, setRestauradoFC] = useState(null);
    const [formKeyFC, setFormKeyFC] = useState(0);
    const [errorValidacion, setErrorValidacion] = useState('');
    const defectoFC = (campo, fb) => (restauradoFC && restauradoFC[campo] !== undefined && restauradoFC[campo] !== null ? restauradoFC[campo] : fb);
    const continuarBorradorFC = () => {
        if (!borradorFC) return;
        setRestauradoFC(borradorFC);
        setFormKeyFC(k => k + 1);
    };
    const [step, setStep] = useState(1);

    if (!bienesFC11.length) return null;

    // Función para validar el paso actual antes de avanzar
    const nextStep = () => {
        const currentSection = document.getElementById(`step-${step}-fc11`);
        if (currentSection) {
            const inputs = currentSection.querySelectorAll('input[required], select[required]');
            for (let input of inputs) {
                if (!String(input.value || '').trim()) {
                    setErrorValidacion('Completa los campos requeridos antes de continuar.');
                    input.focus();
                    return; 
                }
            }
        }
        setErrorValidacion('');
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
                                    {fc11Editing ? 'Editar Traslado FC-11' : `Nuevo FC-11 · ${bienesFC11.length} bien${bienesFC11.length === 1 ? '' : 'es'}`}
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
                )}<form key={formKeyFC} noValidate onSubmit={async (e) => { const ok = await saveFC11(e); if (ok) limpiarBorradorFC(); }} onChange={(e) => { setErrorValidacion(''); guardarBorradorFC(serializarForm(e.currentTarget)); }} className="flex flex-col h-full overflow-hidden bg-surface-2/30 dark:bg-surface-2/50">
                    <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                        {estadoGuardado && <p role="status" className="text-label font-semibold text-ok"><i className="fa-solid fa-cloud-arrow-up mr-1.5" aria-hidden="true" />{estadoGuardado}</p>}
                        {errorValidacion && <p role="alert" className="rounded-control border border-danger/20 bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">{errorValidacion}</p>}
                        
                        {/* BARRA DE PROGRESO WIZARD */}
                        <div className="flex gap-2">
                            {[1, 2].map(i => (
                                <div key={i} className={`h-2 flex-1 rounded-full motion duration-[var(--dur-slow)] ${step >= i ? 'bg-surface-1 dark:bg-surface-2' : 'bg-surface-3 dark:bg-surface-1/5'}`}></div>
                            ))}
                        </div>

                        {/* RESUMEN DE BIENES (Visible siempre) */}
                        <div className="bg-surface-1 dark:bg-surface-1 border border-line/60 dark:border-line rounded-[20px] p-5 shadow-sm relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500"></div>
                            <p className="pl-3 text-[10px] text-content-3 font-black uppercase tracking-widest mb-2">Bienes del expediente · verifica el estado de cada uno</p>
                            <ul className="pl-3 divide-y divide-line">
                              {bienesFC11.map(bien => <li key={bien.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
                                <span className="font-semibold text-content-1 dark:text-zinc-100">{bien.rotulo || 'Sin rótulo'} · {bien.descripcion || 'Sin descripción'}</span>
                                <span className="font-bold text-ok tabular-nums">Gs. {formatCurrency(bien.valorUnitario || 0)}</span>
                              </li>)}
                            </ul>
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
                                            opciones={['Traspaso', 'Préstamo', 'Devolución a Patrimonio', 'Inservible', 'Faltante']}
                                            etiquetaTodos="Motivo"
                                            titulo="Motivo del traslado"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-content-3">Estado físico verificado por bien</p>
                                      <div className="grid gap-2 sm:grid-cols-2">
                                        {bienesFC11.map(bien => <label key={bien.id} className="rounded-control border border-line bg-surface-1 p-3 text-xs text-content-2">
                                          <span className="mb-2 block font-semibold">{bien.rotulo || bien.id} · {bien.descripcion || 'Sin descripción'}</span>
                                          <select name={`estadoConservacion_${bien.id}`} required defaultValue={fc11Editing?.bienesSnapshot?.find(item => item.id === bien.id)?.estadoConservacion || bien.estadoConservacion || 'Bueno'} className="h-10 w-full rounded-control border border-line bg-surface-1 px-3 text-sm text-content-1">
                                            {['Muy bueno', 'Bueno', 'Regular', 'Malo', 'Inutilizable'].map(estado => <option key={estado} value={estado}>{estado}</option>)}
                                          </select>
                                        </label>)}
                                      </div>
                                    </div>
                                    <div className="md:col-span-2 rounded-control border border-brand/20 bg-brand-soft/30 p-4">
                                      <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-content-1">Responsable que recibe los bienes</h4>
                                      <div className="grid gap-3 sm:grid-cols-3">
                                        <label className="text-xs text-content-3">Nombre y apellido
                                          <input name="receptorNombre" required maxLength={160} defaultValue={fc11Editing?.receptorNombre || ''} className="mt-1 h-10 w-full rounded-control border border-line bg-surface-1 px-3 text-sm text-content-1" />
                                        </label>
                                        <label className="text-xs text-content-3">Cédula / documento
                                          <input name="receptorDocumento" required maxLength={30} defaultValue={fc11Editing?.receptorDocumento || ''} className="mt-1 h-10 w-full rounded-control border border-line bg-surface-1 px-3 text-sm text-content-1" />
                                        </label>
                                        <label className="text-xs text-content-3">Cargo
                                          <input name="receptorCargo" required maxLength={120} defaultValue={fc11Editing?.receptorCargo || ''} className="mt-1 h-10 w-full rounded-control border border-line bg-surface-1 px-3 text-sm text-content-1" />
                                        </label>
                                      </div>
                                      <p className="mt-2 text-[11px] text-content-3">Esta persona será el único firmante obligatorio de recepción en el PDF FC-11.</p>
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
