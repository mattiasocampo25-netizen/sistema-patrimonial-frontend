import React, { useState } from 'react';
import SkeletonLoader from '../components/SkeletonLoader';
import { PeriodSelector } from '../components/FilterComponents';
import {
  Card, PageHeader, Toolbar, ToolbarDivider,
  Button, Badge, Chip, ChipGroup
} from '../components/ui';
import { formatDateText, formatCI } from '../utils/helpers';
import { ESTADOS_FC10, ESTADO_INFO, estadoInicialFC10, pendienteDeFirma, esFC10Legado } from '../utils/fc10Firmas';

// Vista de actas de responsabilidad FC-10 (extraída de App.jsx, Fase 4).
export default function Fc10View({
  filteredFC10, fc10Year, setFc10Year, fc10Month, setFc10Month,
  setIsConsolidatedFC10ModalOpen, handleExportFC10CSV,
  isLoading, bienes, handleGenerateFC10PDF, openFC10Modal,
  isAdmin, setItemToDelete, setActiveTab, registrarFirmaFC10, registrarAmbasFirmas, firmandoId,
  ponerFC10EnTramite, poniendoEnTramite,
  actualizarEstadoFirma, currentUser
}) {
  // Cuántas hay en cada etapa: el trabajo real que falta por hacer.
  const conteo = { pendientes: 0, cerradas: 0, esperaFuncionario: 0, esperaJefe: 0 };
  (filteredFC10 || []).forEach(fc => {
    const e = estadoInicialFC10(fc);
    if (e === ESTADOS_FC10.CERRADO) { conteo.cerradas++; return; }
    conteo.pendientes++;
    if (e === ESTADOS_FC10.ESPERA_FIRMA_1) conteo.esperaFuncionario++;
    if (e === ESTADOS_FC10.ESPERA_FIRMA_2) conteo.esperaJefe++;
  });

  // Filtro de etapa.
  const [filtroEtapa, setFiltroEtapa] = useState('todas');
  const ETAPAS = [
    { id: 'todas', label: 'Todas', n: filteredFC10.length },
    { id: 'espera1', label: 'Falta funcionario', n: conteo.esperaFuncionario, activo: conteo.esperaFuncionario > 0 },
    { id: 'espera2', label: 'Falta jefe', n: conteo.esperaJefe, activo: conteo.esperaJefe > 0 },
    { id: 'cerradas', label: 'Cerradas', n: conteo.cerradas }
  ];
  const coincideEtapa = (fc) => {
    if (filtroEtapa === 'todas') return true;
    const e = estadoInicialFC10(fc);
    if (filtroEtapa === 'cerradas') return e === ESTADOS_FC10.CERRADO;
    if (filtroEtapa === 'espera1') return e === ESTADOS_FC10.ESPERA_FIRMA_1;
    if (filtroEtapa === 'espera2') return e === ESTADOS_FC10.ESPERA_FIRMA_2;
    return true;
  };
  const listaVisible = (filteredFC10 || []).filter(coincideEtapa);

  // =========================================================================
  // ESTADO DE FIRMAS FC-10 (solo administrador)
  // Checklist / switch manual para marcar el estado de firma cuando se recibe
  // el documento físico o digital devuelto. Solo el rol admin puede cambiarlo.
  // =========================================================================
  const [cambiandoEstado, setCambiandoEstado] = useState({});
  const puedeGestionarFirmas = isAdmin && typeof actualizarEstadoFirma === 'function';

  const ESTADOS_FIRMA_OPCIONES = [
    { valor: 'BORRADOR', label: 'Borrador', icon: 'fa-pen-ruler', color: 'text-content-2 dark:text-content-3' },
    { valor: 'ESPERA_FIRMA_1', label: 'Espera funcionario', icon: 'fa-user', color: 'text-warn dark:text-amber-400' },
    { valor: 'ESPERA_FIRMA_2', label: 'Espera jefe', icon: 'fa-user-tie', color: 'text-sky-600 dark:text-sky-400' },
    { valor: 'CERRADO', label: 'Firmado (ambas)', icon: 'fa-circle-check', color: 'text-ok dark:text-emerald-400' }
  ];

  const handleCambiarEstadoFirma = async (fc, nuevoEstado) => {
    if (!puedeGestionarFirmas) return;
    setCambiandoEstado(prev => ({ ...prev, [fc.id]: true }));
    try {
      await actualizarEstadoFirma(fc.id, { estadoFirma: nuevoEstado, registradoPor: currentUser?.username || 'admin' });
      // Refrescar localmente si se recibe el acta actualizada desde el padre vía filteredFC10.
      // Se emite evento global para que otras vistas se actualicen.
      window.dispatchEvent(new CustomEvent('fc10-estado-cambiado', { detail: { id: fc.id, estadoFirma: nuevoEstado } }));
    } catch (e) {
      console.error('No se pudo cambiar el estado de firma:', e);
    } finally {
      setCambiandoEstado(prev => { const { [fc.id]: _, ...resto } = prev; return resto; });
    }
  };

  return (
    <div className="flex flex-col flex-1 space-y-6">
      {/* ===== PANEL DE ESTADO DE FIRMAS (solo admin) ===== */}
      {isAdmin && (
        <div className="bg-surface-1 dark:bg-surface-1 border border-line/70 dark:border-line rounded-panel shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-card bg-blue-50 dark:bg-blue-900/10 text-brand dark:text-blue-400 shadow-sm shadow-blue-500/20">
                <i className="fa-solid fa-clipboard-check text-lg"></i>
              </div>
              <div>
                <h3 className="text-lg font-black text-content-1 dark:text-white tracking-tight">Estado de las Firmas FC-10</h3>
                <p className="text-xs text-content-3 dark:text-content-3 mt-0.5">
                  Marque manualmente el estado cuando reciba el documento físico o digital devuelto. Solo administrador.
                </p>
              </div>
            </div>
            {puedeGestionarFirmas ? (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-ok-soft dark:bg-emerald-900/20 text-ok dark:text-emerald-400 border border-ok/25 dark:border-emerald-900/30 shadow-sm shadow-emerald-500/20`}>
                <i className="fa-solid fa-shield-halved text-[9px]"></i> Modo administrador activo
              </span>
            ) : (
              <span className="text-[10px] font-bold text-danger">Control restringido a administrador</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(filteredFC10 || []).map(fc => {
              const bien = bienes.find(b => b.id === fc.bienId) || {};
              const estadoActual = fc.estadoFirma || (esFC10Legado(fc) ? 'CERRADO' : 'BORRADOR');
              const estaCambiando = cambiandoEstado[fc.id];
              const _estadoInfo = ESTADOS_FIRMA_OPCIONES.find(o => o.valor === estadoActual);
              return (
                <div key={fc.id} className="flex flex-col gap-3 p-4 rounded-card border border-line dark:border-line/50 bg-surface-2 dark:bg-surface-2/50 hover:border-brand/50 hover:shadow-md motion duration-[var(--dur-base)] group">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-content-1 dark:text-white truncate" title={fc.funcionarioNombre || 'Sin responsable'}>
                        {fc.funcionarioNombre || 'Sin responsable'}
                      </p>
                      <p className="text-[10px] text-content-3 dark:text-content-3 mt-0.5 truncate flex items-center gap-1.5" title={bien.rotulo || 'S/R'}>
                        <i className="fa-solid fa-tag text-[9px]"></i>{bien.rotulo || 'S/R'}
                      </p>
                    </div>
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${ estadoActual === 'CERRADO' ? 'bg-emerald-100 text-ok dark:bg-emerald-900/30 dark:text-emerald-400' : estadoActual === 'ESPERA_FIRMA_1' || estadoActual === 'ESPERA_FIRMA_2' ? 'bg-amber-100 text-warn dark:bg-amber-900/30 dark:text-amber-400' : 'bg-surface-3 text-content-1 dark:bg-surface-1/10 dark:text-content-3' }`}>
                      {estadoActual === 'CERRADO' ? '✓' : estadoActual === 'BORRADOR' ? 'B' : 'P'}
                    </div>
                  </div>

                  <div className="mt-2 space-y-1">
                    {ESTADOS_FIRMA_OPCIONES.map(op => {
                      const seleccionado = estadoActual === op.valor;
                      return (
                        <button
                          key={op.valor}
                          onClick={() => !estaCambiando && handleCambiarEstadoFirma(fc, op.valor)}
                          disabled={estaCambiando || !puedeGestionarFirmas}
                          className={`flex items-center gap-2 w-full px-3 py-2 rounded-control text-[11px] font-medium motion duration-[var(--dur-base)] ${ seleccionado ? 'bg-brand text-content-inverse shadow-sm shadow-brand/30' : 'bg-transparent text-content-2 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-1/5 border border-transparent hover:border-line dark:hover:border-white/10' } ${!puedeGestionarFirmas ? 'opacity-60 cursor-not-allowed' : ''}`}
                          title={!puedeGestionarFirmas ? 'Solo el administrador puede cambiar este estado' : `Marcar como ${op.label}`}
                        >
                          <i className={`fa-solid ${op.icon} text-[10px] ${seleccionado ? 'text-white' : op.color}`}></i>
                          <span className={seleccionado ? 'text-white' : 'text-content-1 dark:text-content-3'}>{op.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {estaCambiando && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-brand-text">
                      <i className="fa-solid fa-circle-notch fa-spin"></i>
                      <span>Actualizando…</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {!puedeGestionarFirmas && (
            <p className="mt-4 text-[11px] text-danger text-center">
              <i className="fa-solid fa-triangle-exclamation mr-1.5"></i>
              Esta sección solo está disponible para el rol Administrador.
            </p>
          )}
        </div>
      )}

      <Card className="p-0">
        <div className="p-5 sm:p-6">
          {/* Cabecera: identidad a la izquierda, acciones a la derecha.
              Los filtros (etapas + periodo) van en una Toolbar aparte: antes
              todo estaba en una sola fila con `sm:flex-row`, `justify-between`
              y los hijos con `shrink-0`, y con cinco bloques en linea el
              ultimo (Exportar año) se salia de la tarjeta. */}
          <PageHeader
            titulo="Actas de Responsabilidad (FC-10)"
            descripcion="Delegación y custodia legal de los bienes institucionales"
            icono="fa-file-signature"
            contador={
              conteo.pendientes > 0 ? (
                <Badge tono="warn" icono="fa-hourglass-half">
                  {conteo.pendientes} sin cerrar
                </Badge>
              ) : null
            }
            acciones={
              <>
                <Button
                  variante="secondary"
                  icono="fa-file-lines"
                  onClick={() => setIsConsolidatedFC10ModalOpen(true)}
                >
                  FC-10 Consolidado
                </Button>
                <Button
                  variante="secondary"
                  icono="fa-file-csv"
                  onClick={handleExportFC10CSV}
                  title={`Exportar actas del año ${fc10Year} a CSV`}
                >
                  Exportar año
                </Button>
              </>
            }
          />

          <Toolbar className="mt-4">
            <ChipGroup>
              {ETAPAS.map((et) => (
                <Chip
                  key={et.id}
                  activo={filtroEtapa === et.id}
                  conteo={et.n}
                  onClick={() => setFiltroEtapa(et.id)}
                >
                  {et.label}
                </Chip>
              ))}
            </ChipGroup>
            <ToolbarDivider />
            <PeriodSelector
              selectedYear={fc10Year}
              setSelectedYear={setFc10Year}
              selectedMonth={fc10Month}
              setSelectedMonth={setFc10Month}
            />
          </Toolbar>
        </div>
      </Card>
      <div className="bg-surface-1 dark:bg-surface-1 p-6 sm:p-8 rounded-card border border-line/80 dark:border-line shadow-2xs min-h-[400px]">
        {isLoading ? (
          <SkeletonLoader />
        ) : listaVisible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-surface-2/50 dark:bg-surface-2/50 rounded-card border border-dashed border-line-strong dark:border-line">
            <div className="flex h-16 w-16 items-center justify-center rounded-card bg-surface-3 dark:bg-surface-2 text-content-3 mb-4 shadow-2xs">
              <i className={`fa-solid ${filtroEtapa === 'todas' ? 'fa-folder-open' : 'fa-circle-check'} text-2xl`}></i>
            </div>
            {filtroEtapa === 'todas' ? (
              <>
                <h3 className="text-base font-black text-content-1 dark:text-zinc-200">Sin asignaciones en el ciclo</h3>
                <p className="text-xs font-medium text-content-3 max-w-xs mt-1">No existen actas FC-10 generadas en el periodo seleccionado.</p>
                {setActiveTab && (
                  <button
                    onClick={() => setActiveTab('inventario')}
                    className="mt-4 inline-flex items-center gap-2 h-10 px-5 rounded-control text-[13px] font-bold bg-zinc-900 dark:bg-surface-1 text-white dark:text-content-1 hover:bg-zinc-700 dark:hover:bg-surface-3 motion cursor-pointer active:scale-95"
                  >
                    <i className="fa-solid fa-boxes-stacked text-xs"></i> Asignar desde inventario
                  </button>
                )}
              </>
            ) : (
              <>
                <h3 className="text-base font-black text-content-1 dark:text-zinc-200">
                  Nada en esta etapa
                </h3>
                <p className="text-xs font-medium text-content-3 max-w-xs mt-1">
                  {ETAPAS.find(e => e.id === filtroEtapa)?.label === 'Cerradas'
                    ? 'Ningun acta de este periodo tiene las dos firmas registradas.'
                    : 'Ningun acta espera esta firma en el periodo seleccionado.'}
                </p>
                <button
                  onClick={() => setFiltroEtapa('todas')}
                  className="mt-4 inline-flex items-center gap-2 h-9 px-4 rounded-control text-[12px] font-bold text-content-2 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-1/10 motion cursor-pointer"
                >
                  <i className="fa-solid fa-arrow-left text-[10px]"></i> Ver todas las actas
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {listaVisible.map(fc => {
              const bien = bienes.find(b=>b.id === fc.bienId) || {};
              const isDevuelto = !!fc.devolucionFecha;
              const estado = estadoInicialFC10(fc);
              const info = ESTADO_INFO[estado] || ESTADO_INFO[ESTADOS_FC10.CERRADO];
              const pendiente = pendienteDeFirma(fc);
              const f1 = fc.firmas?.firma1;
              const f2 = fc.firmas?.firma2;
              const estaFirmando = firmandoId === fc.id;
              const esLegada = esFC10Legado(fc);
              const ponerEnTramite = ponerFC10EnTramite;
              return (
                <div key={fc.id} className="bg-surface-1 dark:bg-surface-1/[0.04] rounded-panel border border-line/70 dark:border-white/10 shadow-sm hover:shadow-md motion flex flex-col relative overflow-hidden group">
                  <div className={`h-1 w-full ${info.dot}`}></div>
                  <div className="p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start gap-2 mb-4">
                          <div className="flex flex-col gap-1.5 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                  {isDevuelto ? (
                                      <span className="inline-flex w-fit items-center rounded-lg bg-surface-3 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-content-3 dark:bg-surface-1/10 dark:text-content-3">
                                          Devuelto
                                      </span>
                                  ) : (
                                      <span className={`inline-flex w-fit items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${info.badge}`} title={info.descripcion}>
                                          <i className={`fa-solid ${info.icon} text-[9px]`}></i>
                                          {info.corto}
                                      </span>
                                  )}
                              </div>
                              <span className="text-xs font-medium tabular-nums text-content-3 dark:text-content-3 flex items-center gap-1.5">
                                  <i className="fa-regular fa-calendar"></i> {formatDateText(fc.entregadoFecha || fc.fechaGeneracion)}
                              </span>
                          </div>
                          <div className="flex gap-1 shrink-0 rounded-control bg-surface-2 dark:bg-surface-1/5 border border-line/70 dark:border-white/10 p-1">
                              <button onClick={()=>handleGenerateFC10PDF([fc], [bien])} className="flex h-8 w-8 items-center justify-center rounded-lg text-content-3 hover:text-content-1 hover:bg-surface-1 dark:hover:text-white dark:hover:bg-surface-1/10 shadow-sm motion cursor-pointer focus-visible:ring-2 focus-visible:ring-brand outline-none" title="Imprimir acta" aria-label="Imprimir acta"><i className="fa-solid fa-print text-xs"></i></button>
                              <button onClick={() => openFC10Modal(bien, fc)} className="flex h-8 w-8 items-center justify-center rounded-lg text-content-3 hover:text-content-1 hover:bg-surface-1 dark:hover:text-white dark:hover:bg-surface-1/10 shadow-sm motion cursor-pointer focus-visible:ring-2 focus-visible:ring-brand outline-none" title="Editar acta" aria-label="Editar acta"><i className="fa-solid fa-pen-to-square text-xs"></i></button>
                              {isAdmin && (
                                  <button onClick={()=>setItemToDelete({type:'fc10', id:fc.id, bienId:bien.id, item: { ...fc, bienRotulo: bien?.rotulo, bienDescripcion: bien?.descripcion }})} className="flex h-8 w-8 items-center justify-center rounded-lg text-content-3 hover:text-danger hover:bg-danger-soft dark:hover:text-rose-400 dark:hover:bg-rose-500/10 motion cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 outline-none" title="Eliminar acta" aria-label="Eliminar acta"><i className="fa-solid fa-trash-can text-xs"></i></button>
                              )}
                          </div>
                      </div>
                      <div className="mt-1 flex flex-col flex-1">
                      <h4 className="font-bold text-content-1 dark:text-white text-sm tracking-tight truncate" title={fc.funcionarioNombre}>{fc.funcionarioNombre}</h4>
                      <p className="text-xs text-content-3 dark:text-content-3 mt-0.5 font-medium truncate">{fc.funcionarioCargo}{fc.funcionarioDoc ? ` · CI ${formatCI(fc.funcionarioDoc)}` : ''}</p>

                  {!isDevuelto && (
                    (fc.estadoFirma || pendiente) ? (
                      <div className="mt-4 space-y-1.5" aria-label="Estado de las firmas">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-content-3 dark:text-content-3 mb-1.5">
                          Firmas del acta
                        </p>
                        {[
                          { n: 1, puesto: 'Funcionario Responsable', nombre: fc.funcionarioNombre, f: f1 },
                          { n: 2, puesto: 'Jefe Inmediato', nombre: fc.jefeInmediatoNombre, f: f2 }
                        ].map(({ n, puesto, nombre, f }) => (
                          <div key={n} className="flex items-center gap-2 text-[11px]">
                            <i className={`fa-solid ${f ? 'fa-circle-check text-ok' : 'fa-circle text-content-3 dark:text-content-2'} text-[11px] shrink-0`}></i>
                            <span className="font-semibold text-content-2 dark:text-content-3 shrink-0">{puesto}:</span>
                            <span className="truncate text-content-3 dark:text-content-3">
                              {f ? (
                                <span title={`Registrado por ${f.registradoPorNombre || f.registradoPor} · ${new Date(f.fecha).toLocaleString('es-PY', { dateStyle: 'short', timeStyle: 'short' })}`}>
                                  {f.nombre || nombre} · firmado el {new Date(f.fecha).toLocaleDateString('es-PY')}
                                </span>
                              ) : (
                                <span className="text-content-3 dark:text-content-3 italic">sin firmar</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null
                  )}

                  {!isDevuelto && esLegada && ponerEnTramite && (
                    <div className="mt-4 rounded-control border border-line-strong/70 dark:border-white/10 bg-surface-2 dark:bg-surface-1/[0.03] p-3">
                      <p className="text-[11px] font-semibold text-content-2 dark:text-content-3 leading-snug mb-2.5">
                        Esta acta se creó antes del control de firmas. Si quedó a medio camino, ponela en trámite para registrar las firmas.
                      </p>
                      <button
                        onClick={() => ponerEnTramite(fc)}
                        disabled={poniendoEnTramite === fc.id}
                        className="w-full inline-flex items-center justify-center gap-2 h-9 rounded-lg bg-zinc-800 dark:bg-surface-1 text-white dark:text-content-1 text-[11px] font-black uppercase tracking-wider motion active:scale-95 cursor-pointer disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
                      >
                        {poniendoEnTramite === fc.id
                          ? <><i className="fa-solid fa-circle-notch fa-spin text-[10px]"></i> Activando...</>
                          : <><i className="fa-solid fa-arrows-rotate text-[10px]"></i> Poner en trámite</>}
                      </button>
                    </div>
                  )}
                  {pendiente && (registrarFirmaFC10 || registrarAmbasFirmas) && (
                    <div className="mt-4 rounded-control border border-emerald-500/25 bg-emerald-500/[0.08] p-3 space-y-2">
                      {registrarAmbasFirmas && (
                        <>
                          <p className="text-[11px] font-semibold text-emerald-900 dark:text-emerald-200 leading-snug">
                            ¿El PDF ya volvió con las <strong>dos firmas</strong>?
                          </p>
                          <button
                            onClick={() => registrarAmbasFirmas(fc)}
                            disabled={estaFirmando}
                            title="Registrar las dos firmas y cerrar el ciclo de una vez"
                            className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-black uppercase tracking-wider motion active:scale-95 cursor-pointer disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-sm shadow-emerald-500/25"
                          >
                            {estaFirmando
                              ? <><i className="fa-solid fa-circle-notch fa-spin text-[10px]"></i> Cerrando...</>
                              : <><i className="fa-solid fa-circle-check text-[11px]"></i> Ya firmaron ambos</>}
                          </button>
                          <p className="text-[10px] text-ok/80 dark:text-emerald-400/70 text-center">o registralas de a poco:</p>
                        </>
                      )}
                      {registrarFirmaFC10 && (
                        <button
                          onClick={() => registrarFirmaFC10(fc)}
                          disabled={estaFirmando}
                          title={`Registrar solo la firma ${pendiente.orden} de ${pendiente.nombre || pendiente.puesto}`}
                          className="w-full inline-flex items-center justify-center gap-2 h-8 rounded-lg text-content-1 dark:text-zinc-100 bg-surface-3 dark:bg-surface-1/10 hover:bg-surface-3 dark:hover:bg-surface-1/5 text-[10px] font-bold uppercase tracking-wider motion active:scale-95 cursor-pointer disabled:opacity-60 border border-line dark:border-white/10"
                        >
                          <i className="fa-solid fa-signature text-[10px]"></i>
                          Solo {pendiente.puesto}
                        </button>
                      )}
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-line dark:border-white/10">
                  <p className="text-xs font-semibold text-content-1 dark:text-zinc-200 line-clamp-2 leading-relaxed" title={bien.descripcion || 'Descripción no disponible'}>
                  {bien.descripcion || 'Descripción no disponible'}
                  </p>
                  <p className="text-[11px] text-content-3 dark:text-content-3 mt-1.5 font-semibold tabular-nums">
                  <i className="fa-solid fa-tag mr-1.5"></i>{bien.rotulo || 'S/Rótulo'}
                  </p>
                  </div>
                  </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
