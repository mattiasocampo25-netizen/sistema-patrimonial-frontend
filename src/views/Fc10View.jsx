import React, { useState } from 'react';
import SkeletonLoader from '../components/SkeletonLoader';
import { PeriodSelector } from '../components/FilterComponents';
import {
  Card, EmptyState, PageHeader, Toolbar,
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
  const [busqueda, setBusqueda] = useState('');
  const nombreMes = new Date(Number(fc10Year), Number(fc10Month) - 1, 1).toLocaleDateString('es-PY', { month: 'long' });
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
    { id: 'espera2', label: 'Falta jefatura', n: conteo.esperaJefe, activo: conteo.esperaJefe > 0 },
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
  const listaVisible = (filteredFC10 || []).filter(coincideEtapa).filter(fc => {
    const consulta = busqueda.trim().toLocaleLowerCase('es');
    if (!consulta) return true;
    const bien = bienes.find(b => b.id === fc.bienId) || {};
    return [fc.funcionarioNombre, fc.funcionarioDoc, fc.id, bien.rotulo, bien.descripcion]
      .filter(Boolean).some(valor => String(valor).toLocaleLowerCase('es').includes(consulta));
  });

  // =========================================================================
  // ESTADO DE FIRMAS FC-10 (solo administrador)
  // Checklist / switch manual para marcar el estado de firma cuando se recibe
  // el documento físico o digital devuelto. Solo el rol admin puede cambiarlo.
  // =========================================================================
  const [cambiandoEstado, setCambiandoEstado] = useState({});
  const puedeGestionarFirmas = isAdmin && typeof actualizarEstadoFirma === 'function';

  const ESTADOS_FIRMA_OPCIONES = [
    { valor: 'BORRADOR', label: 'Borrador' },
    { valor: 'ESPERA_FIRMA_1', label: 'Espera firma del funcionario' },
    { valor: 'ESPERA_FIRMA_2', label: 'Espera firma del jefe' },
    { valor: 'CERRADO', label: 'Firmada y cerrada' }
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
      <Card className="p-0">
        <div className="p-5 sm:p-6">
          {/* Cabecera: identidad a la izquierda, acciones a la derecha.
              Los filtros (etapas + periodo) van en una Toolbar aparte: antes
              todo estaba en una sola fila con `sm:flex-row`, `justify-between`
              y los hijos con `shrink-0`, y con cinco bloques en linea el
              ultimo (Exportar año) se salia de la tarjeta. */}
          <PageHeader
            titulo="Historial de actas (FC-10)"
            descripcion="Consulta las actas por fecha de entrega o devolución y revisa qué firmas faltan."
            icono="fa-file-signature"
            contador={
              conteo.pendientes > 0 ? (
                <Badge tono="warn" icono="fa-hourglass-half">
                  {conteo.pendientes} pendientes de firma
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

          <Toolbar className="mt-5 items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-content-3">Mostrar actas</span>
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
            </div>
            <PeriodSelector
              selectedYear={fc10Year}
              setSelectedYear={setFc10Year}
              selectedMonth={fc10Month}
              setSelectedMonth={setFc10Month}
              descripcion="Periodo del historial"
              ayuda="Se incluyen actas entregadas o devueltas durante el mes seleccionado."
            />
          </Toolbar>
        </div>
      </Card>
      <section className="overflow-hidden rounded-panel border border-line bg-surface-1 shadow-card" aria-label="Resultados del historial FC-10">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-2/70 px-4 py-3 sm:px-5">
          <div>
            <h2 className="text-body font-bold text-content-1">Actas de {nombreMes} {fc10Year}</h2>
            <p className="mt-0.5 text-label text-content-3">El periodo incluye la fecha de entrega o la de devolución.</p>
          </div>
          <label className="relative w-full sm:w-80">
            <span className="sr-only">Buscar en el historial FC-10</span>
            <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-content-3" aria-hidden="true" />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar funcionario, rótulo o bien…" className="h-10 w-full rounded-control border border-line bg-surface-1 pl-9 pr-3 text-body text-content-1 placeholder:text-content-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" />
          </label>
          <span className="w-full text-label font-semibold text-content-3 sm:w-auto">{listaVisible.length} {listaVisible.length === 1 ? 'acta' : 'actas'}</span>
        </div>
      <div className="min-h-[280px] p-4 sm:p-6">
        {isLoading ? (
          <SkeletonLoader />
        ) : listaVisible.length === 0 ? (
          <EmptyState
            tipo={filtroEtapa === 'todas' ? 'vacio' : 'filtro'}
            icono={filtroEtapa === 'todas' ? 'fa-folder-open' : 'fa-circle-check'}
            titulo={filtroEtapa === 'todas' ? 'Sin asignaciones en el ciclo' : 'Nada en esta etapa'}
            descripcion={filtroEtapa === 'todas'
              ? busqueda ? `No hay actas de ${nombreMes} ${fc10Year} que coincidan con “${busqueda}”.` : 'No hay actas entregadas ni devueltas durante el periodo seleccionado.'
              : ETAPAS.find(e => e.id === filtroEtapa)?.label === 'Cerradas'
                ? 'Ningún acta de este periodo tiene las dos firmas registradas.'
                : 'Ningún acta espera esta firma en el periodo seleccionado.'}
            accion={busqueda ? 'Limpiar búsqueda' : filtroEtapa === 'todas' ? (setActiveTab ? 'Asignar desde inventario' : undefined) : 'Ver todas las actas'}
            onAccion={busqueda ? () => setBusqueda('') : filtroEtapa === 'todas' ? (setActiveTab ? () => setActiveTab('inventario') : undefined) : () => setFiltroEtapa('todas')}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {listaVisible.map(fc => {
              const bien = bienes.find(b=>b.id === fc.bienId) || {};
              const isDevuelto = !!fc.devolucionFecha;
              const estado = estadoInicialFC10(fc);
              const info = ESTADO_INFO[estado] || ESTADO_INFO[ESTADOS_FC10.CERRADO];
              const pendiente = pendienteDeFirma(fc);
              const f1 = fc.firmas?.firma1;
              const f2 = fc.firmas?.firma2;
              const firmasRegistradas = Number(Boolean(f1)) + Number(Boolean(f2));
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
                              <span className="flex flex-col gap-0.5 text-[10px] font-medium tabular-nums text-content-3">
                                  <span><i className="fa-regular fa-calendar mr-1.5"></i>Entregada: {formatDateText(fc.entregadoFecha || fc.fechaGeneracion)}</span>
                                  {isDevuelto && <span className="text-warn"><i className="fa-solid fa-rotate-left mr-1.5"></i>Devuelta: {formatDateText(fc.devolucionFecha)}</span>}
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
                      <h4 className="font-bold text-content-1 dark:text-white text-sm tracking-tight truncate" title={fc.funcionarioNombre}>{fc.funcionarioNombre || 'Sin responsable'}</h4>
                      <p className="text-xs text-content-3 dark:text-content-3 mt-0.5 font-medium truncate">{fc.funcionarioCargo}{fc.funcionarioDoc ? ` · CI ${formatCI(fc.funcionarioDoc)}` : ''}</p>
                      <p className="mt-2 rounded-lg bg-surface-2 px-2.5 py-1.5 text-[11px] font-semibold text-content-2 truncate" title={bien.descripcion || bien.rotulo || 'Bien sin rótulo'}>
                        <i className="fa-solid fa-box mr-1.5 text-content-3" aria-hidden="true"></i>{bien.rotulo || 'Bien sin rótulo'}
                      </p>

                  {!isDevuelto && (
                    (fc.estadoFirma || pendiente) ? (
                      <div className="mt-4 rounded-control border border-line bg-surface-2/70 p-3" aria-label="Estado de las firmas">
                        <div className="mb-2.5 flex items-center justify-between gap-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-content-3">Estado de las firmas</p>
                          <Badge tono={firmasRegistradas === 2 ? 'ok' : 'warn'}>{firmasRegistradas}/2</Badge>
                        </div>
                        {[
                          { n: 1, puesto: 'Funcionario responsable', nombre: fc.funcionarioNombre, f: f1 },
                          { n: 2, puesto: 'Jefatura inmediata', nombre: fc.jefeInmediatoNombre, f: f2 }
                        ].map(({ n, puesto, nombre, f }) => (
                          <div key={n} className="flex items-start gap-2.5 py-1 text-[11px]">
                            <i className={`fa-solid ${f ? 'fa-circle-check text-ok' : 'fa-circle text-content-3'} mt-0.5 text-[11px] shrink-0`}></i>
                            <span className="min-w-0 flex-1">
                              <span className="block font-semibold text-content-2">{puesto}</span>
                              {f ? (
                                <span className="block truncate text-content-3" title={`Registrado por ${f.registradoPorNombre || f.registradoPor} · ${new Date(f.fecha).toLocaleString('es-PY', { dateStyle: 'short', timeStyle: 'short' })}`}>
                                  {f.nombre || nombre} · {new Date(f.fecha).toLocaleDateString('es-PY')}
                                </span>
                              ) : (
                                <span className="block text-content-3 italic">Pendiente</span>
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
                        Acta anterior al control de firmas. Si aún falta completar el circuito, activá el seguimiento.
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
                            Si recibiste el PDF con las dos firmas, confirma aquí su recepción.
                          </p>
                          <button
                            onClick={() => registrarAmbasFirmas(fc)}
                            disabled={estaFirmando}
                            title="Confirmar que el PDF regresó con ambas firmas"
                            className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-black uppercase tracking-wider motion active:scale-95 cursor-pointer disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-sm shadow-emerald-500/25"
                          >
                            {estaFirmando
                              ? <><i className="fa-solid fa-circle-notch fa-spin text-[10px]"></i> Cerrando...</>
                              : <><i className="fa-solid fa-circle-check text-[11px]"></i> Confirmar ambas firmas recibidas</>}
                          </button>
                        </>
                      )}
                      {registrarFirmaFC10 && (
                        <details className="rounded-control border border-line bg-surface-1/70 p-2.5">
                          <summary className="cursor-pointer text-[10px] font-bold text-content-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-sm">
                            Registrar una sola firma pendiente
                          </summary>
                          <p className="mt-2 text-[10px] text-content-3">Firma de {pendiente.puesto}: {pendiente.nombre || 'sin nombre registrado'}</p>
                          <button
                            onClick={() => registrarFirmaFC10(fc)}
                            disabled={estaFirmando}
                            title={`Registrar la firma pendiente de ${pendiente.nombre || pendiente.puesto}`}
                            className="mt-2 w-full inline-flex items-center justify-center gap-2 h-9 rounded-control text-body font-semibold text-content-2 bg-surface-2 hover:bg-surface-3 motion active:scale-[0.98] cursor-pointer disabled:opacity-60 border border-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                          >
                            <i className="fa-solid fa-signature text-[10px]"></i>
                            Confirmar firma de {pendiente.puesto}
                          </button>
                        </details>
                      )}
                    </div>
                  )}

                  {puedeGestionarFirmas && (
                    <details className="mt-3 rounded-control border border-line bg-surface-2/50 px-3 py-2.5">
                      <summary className="cursor-pointer text-[10px] font-bold text-content-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-sm">
                        Ajuste administrativo del estado
                      </summary>
                      <label className="mt-2 block text-[10px] font-semibold text-content-2" htmlFor={`estado-firma-${fc.id}`}>Etapa registrada</label>
                      <select
                        id={`estado-firma-${fc.id}`}
                        value={fc.estadoFirma || (esLegada ? 'CERRADO' : 'BORRADOR')}
                        onChange={(event) => handleCambiarEstadoFirma(fc, event.target.value)}
                        disabled={Boolean(cambiandoEstado[fc.id])}
                        className="mt-1.5 h-9 w-full rounded-control border border-line bg-surface-1 px-2.5 text-[11px] font-semibold text-content-1 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-60"
                      >
                        {ESTADOS_FIRMA_OPCIONES.map((op) => <option key={op.valor} value={op.valor}>{op.label}</option>)}
                      </select>
                      {cambiandoEstado[fc.id] && <p className="mt-1.5 text-[10px] text-brand-text"><i className="fa-solid fa-circle-notch fa-spin mr-1.5"></i>Guardando estado…</p>}
                    </details>
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
      </section>
    </div>
  );
}
