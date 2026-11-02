// Vista de solicitudes de aprobación (bajas, firmas, etc.) - solo admin/desarrollador.
// Incluye estados claros (Pendiente, Aprobado, Rechazado, En Revisión) y auditoría básica.
import React, { useState } from 'react';
import { normalizeStr } from '../utils/helpers';
import FiltroCombo from '../components/FiltroCombo';
import { Card, Chip, ChipGroup, EmptyState, PageHeader, Toolbar, Table, THead, TBody, TRow, TH, TD } from '../components/ui';

const ESTADO_INFO = {
  PENDIENTE: { label: 'Pendiente', color: 'bg-warn-soft dark:bg-amber-950/20 text-warn dark:text-amber-400 border border-warn/25 dark:border-amber-900/30', dot: 'bg-amber-500' },
  APROBADO: { label: 'Aprobado', color: 'bg-ok-soft dark:bg-emerald-950/20 text-ok dark:text-emerald-400 border border-ok/25 dark:border-emerald-900/30', dot: 'bg-emerald-500' },
  RECHAZADO: { label: 'Rechazado', color: 'bg-danger-soft dark:bg-rose-950/20 text-danger dark:text-rose-400 border border-danger/25 dark:border-rose-900/30', dot: 'bg-rose-500' },
  EN_REVISION: { label: 'En Revisión', color: 'bg-info-soft dark:bg-sky-950/20 text-info dark:text-sky-400 border border-info/25 dark:border-sky-900/30', dot: 'bg-sky-500' }
};

export default function AprobacionesView({
  dependenciaActual,
  solicitudesBaja, bienes,
  openResolucionModal, marcarSolicitudEnRevision,
 
}) {
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [filtroDependencia, setFiltroDependencia] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [revisandoIds, setRevisandoIds] = useState(() => new Set());

  const iniciarRevision = async (solicitud) => {
    if (revisandoIds.has(solicitud.id)) return;
    setRevisandoIds(prev => new Set(prev).add(solicitud.id));
    try { await marcarSolicitudEnRevision(solicitud); }
    finally {
      setRevisandoIds(prev => {
        const siguiente = new Set(prev);
        siguiente.delete(solicitud.id);
        return siguiente;
      });
    }
  };

  const conteo = solicitudesBaja.reduce(
    (acc, n) => {
      const e = n.estado || 'PENDIENTE';
      acc[e] = (acc[e] || 0) + 1;
      return acc;
    },
    { PENDIENTE: 0, APROBADO: 0, RECHAZADO: 0, EN_REVISION: 0 }
  );

  const listaFiltrada = solicitudesBaja.filter(n => {
    const estadoOK = filtroEstado === 'todos' || (n.estado || 'PENDIENTE') === filtroEstado;
    const tipoOK = filtroTipo === 'todos' || n.tipo === filtroTipo;
    const texto = normalizeStr(`${n.rotulo || ''} ${n.descripcion || ''} ${n.nombre || ''} ${n.cedula || ''} ${n.solicitante || ''} ${n.motivo || ''}`);
    const fecha = String(n.created_at || n.fecha || '').slice(0, 10);
    const dependenciaOK = !filtroDependencia || normalizeStr(n.dependencia) === normalizeStr(filtroDependencia);
    return estadoOK && tipoOK && dependenciaOK && (!desde || fecha >= desde) && (!hasta || fecha <= hasta) && (!busqueda.trim() || texto.includes(normalizeStr(busqueda)));
  }).sort((a, b) => {
    const prioridad = n => n.estado === 'PENDIENTE' ? 0 : n.estado === 'EN_REVISION' ? 1 : 2;
    const porEstado = prioridad(a) - prioridad(b);
    if (porEstado) return porEstado;
    return new Date(b.created_at || b.fecha || 0).getTime() - new Date(a.created_at || a.fecha || 0).getTime();
  });
  const dependenciasSolicitud = [...new Set(solicitudesBaja.map(n => n.dependencia).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));

  const ETAPAS = [
    { id: 'todos', label: 'Todos', n: solicitudesBaja.length },
    { id: 'PENDIENTE', label: 'Pendientes', n: conteo.PENDIENTE },
    { id: 'APROBADO', label: 'Aprobados', n: conteo.APROBADO },
    { id: 'RECHAZADO', label: 'Rechazados', n: conteo.RECHAZADO },
    { id: 'EN_REVISION', label: 'En Revisión', n: conteo.EN_REVISION }
  ];

  return (
    <div className="flex flex-col flex-1 space-y-6">
      <Card className="p-0">
        <div className="p-5 sm:p-6">
          <PageHeader
            titulo={'Centro de Aprobaciones'}
            descripcion={<>Gestión y auditoría de solicitudes de baja en <strong className='text-content-1 dark:text-white font-semibold'>{dependenciaActual}</strong></>}
            icono="fa-check-to-slot"
            contador={(
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums bg-surface-3 dark:bg-surface-1/10 text-content-2 dark:text-content-3 border border-line dark:border-white/10">
                {conteo.PENDIENTE} pendientes
              </span>
            )}
          />
          <Toolbar className="mt-4">
          <div className="flex flex-wrap items-center gap-1.5 -mb-1">
            <ChipGroup>
              {ETAPAS.map(et => (
                <Chip
                  key={et.id}
                  activo={filtroEstado === et.id}
                  conteo={et.n}
                  onClick={() => setFiltroEstado(et.id)}
                >
                  {et.label}
                </Chip>
              ))}
            </ChipGroup>
          </div>
          </Toolbar>
          <div className="mt-3 grid gap-2 lg:grid-cols-[minmax(220px,1fr)_auto_auto_auto_auto]">
            <label htmlFor="aprobaciones-search" className="sr-only">Buscar solicitud</label>
            <input id="aprobaciones-search" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por bien, funcionario, solicitante o motivo…" className="h-10 w-full rounded-control border border-line bg-surface-2 px-3 text-sm text-content-1 outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" />
            <div className="flex gap-1 rounded-control border border-line bg-surface-2 p-1" role="group" aria-label="Tipo de solicitud">
              {[['todos', 'Todos'], ['BAJA_BIEN', 'Bienes'], ['BAJA_FUNCIONARIO', 'Funcionarios']].map(([id, label]) => <button key={id} type="button" aria-pressed={filtroTipo === id} onClick={() => setFiltroTipo(id)} className={`rounded px-3 text-xs font-semibold ${filtroTipo === id ? 'bg-surface-1 text-brand-text shadow-sm' : 'text-content-3 hover:text-content-1'}`}>{label}</button>)}
            </div>
            <FiltroCombo valor={filtroDependencia} opciones={dependenciasSolicitud} onElegir={setFiltroDependencia} etiquetaTodos="Todas las dependencias" titulo="Filtrar por dependencia" ancho="min-w-[210px]" />
            <label className="flex h-10 items-center gap-2 rounded-control border border-line bg-surface-1 px-2 text-[10px] font-semibold text-content-3">Desde<input type="date" value={desde} max={hasta || undefined} onChange={e => setDesde(e.target.value)} aria-label="Solicitudes desde" className="w-[112px] bg-transparent text-xs text-content-1" /></label>
            <label className="flex h-10 items-center gap-2 rounded-control border border-line bg-surface-1 px-2 text-[10px] font-semibold text-content-3">Hasta<input type="date" value={hasta} min={desde || undefined} onChange={e => setHasta(e.target.value)} aria-label="Solicitudes hasta" className="w-[112px] bg-transparent text-xs text-content-1" /></label>
            {(busqueda || filtroDependencia || desde || hasta || filtroTipo !== 'todos') && <button type="button" onClick={() => { setBusqueda(''); setFiltroDependencia(''); setDesde(''); setHasta(''); setFiltroTipo('todos'); }} className="h-10 rounded-control px-3 text-xs font-bold text-content-3 hover:bg-surface-2">Limpiar filtros</button>}
          </div>
        </div>
      </Card>

      <div className={`bg-surface-1 dark:bg-surface-1 border border-line/70 dark:border-line rounded-panel shadow-sm overflow-hidden ${listaFiltrada.length ? 'flex-1 min-h-[400px]' : ''}`}>
        <div className="overflow-x-auto custom-scrollbar">
          <Table sinContenedor minWidth={false} className="w-full text-left border-collapse min-w-[700px]">
            <THead>
              <TRow className="text-[10px] sm:text-[11px] font-semibold text-content-3 dark:text-content-3 uppercase tracking-widest">
                <TH className="py-4 pl-6 sm:pl-8 pr-4">Bien / Solicitud</TH>
                <TH className="px-4 py-4">Solicitante</TH>
                <TH className="px-4 py-4">Fecha</TH>
                <TH className="px-4 py-4">Estado</TH>
                <TH className="py-4 pl-4 pr-6 sm:pr-8 text-right">Decisión</TH>
              </TRow>
            </THead>
            <TBody>
              {listaFiltrada.map((notif) => {
                // Dos tipos de solicitud: la baja de un bien y la eliminacion de
                // un funcionario del padron. Cada una muestra los datos de su
                // entidad, no los del bien (que en el caso del funcionario no
                // existe).
                const esSolicitudFuncionario = notif.tipo === 'BAJA_FUNCIONARIO';
                const bienAsociado = esSolicitudFuncionario
                  ? {
                      id: notif.funcionarioId,
                      rotulo: notif.cedula || 'S/C',
                      descripcion: notif.nombre || 'Funcionario del padrón'
                    }
                  : bienes.find(b => b.id === (notif.bienId || notif.bien_id)) || {
                      id: notif.bienId || notif.bien_id,
                      rotulo: notif.rotulo || 'S/R',
                      descripcion: notif.descripcion || 'Sin descripción'
                    };
                const estado = notif.estado || 'PENDIENTE';
                const info = ESTADO_INFO[estado] || ESTADO_INFO.PENDIENTE;
                const estaResuelto = estado === 'APROBADO' || estado === 'RECHAZADO';
                const fechaSolicitud = notif.created_at || notif.fecha;
                const diasAbierta = fechaSolicitud ? Math.max(0, Math.floor((Date.now() - new Date(fechaSolicitud).getTime()) / 86400000)) : 0;
                const historial = Array.isArray(notif.historial) && notif.historial.length
                  ? notif.historial
                  : [
                      { estado: 'PENDIENTE', usuario: notif.solicitante || 'Usuario', fecha: notif.created_at || notif.fecha || null, motivo: notif.motivo || '' },
                      ...(notif.estado === 'EN_REVISION' ? [{ estado: 'EN_REVISION', usuario: notif.revisionPor, fecha: notif.revisionEn }] : []),
                      ...(estaResuelto ? [{ estado, usuario: notif.resueltoPor, fecha: notif.resueltoEn || notif.resueltoFecha, motivo: notif.motivoResolucion }] : [])
                    ];

                return (
                  <TRow key={notif.id} className={`hover:bg-surface-2/50 dark:hover:bg-surface-1/[0.02] transition-colors ${estaResuelto ? 'opacity-80' : ''}`}>
                    <TD className="py-4 pl-6 sm:pl-8 pr-4 align-top">
                      <div className="space-y-1">
                        <span className="font-mono font-semibold text-xs text-content-1 dark:text-white bg-surface-3 dark:bg-surface-1/10 px-2 py-0.5 rounded-lg">
                          {bienAsociado.rotulo}
                        </span>
                        <p className="font-semibold text-content-1 dark:text-white text-sm line-clamp-2">
                          {bienAsociado.descripcion}
                        </p>
                        {notif.motivo && (
                          <div className="mt-2 flex items-start gap-2 text-xs text-warn dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-control px-3 py-2">
                            <i className="fa-solid fa-comment-dots text-xs mt-0.5 shrink-0 text-warn"></i>
                            <div className="flex-1">
                              <span className="font-bold">Motivo:</span> {notif.motivo}
                            </div>
                          </div>
                        )}
                        {estaResuelto && notif.resueltoPor && (
                          <div className="mt-2 flex items-start gap-2 text-xs text-content-3 dark:text-content-3">
                            <i className="fa-solid fa-user-check text-[10px] shrink-0 text-content-3"></i>
                            <span className="font-semibold">Resuelto por: {notif.resueltoPor}</span>
                            {(notif.resueltoEn || notif.resueltoFecha) && <span className="ml-2">· {new Date(notif.resueltoEn || notif.resueltoFecha).toLocaleDateString('es-PY')}</span>}
                          </div>
                        )}
                        <details className="mt-2 text-xs text-content-2">
                          <summary className="cursor-pointer select-none font-semibold text-brand-text hover:underline">Historial ({historial.length})</summary>
                          <ol className="mt-2 space-y-2 border-l border-line pl-3">
                            {historial.map((evento, indice) => {
                              const infoEvento = ESTADO_INFO[evento.estado] || ESTADO_INFO.PENDIENTE;
                              const fechaEvento = evento.fecha ? new Date(evento.fecha) : null;
                              const fechaValida = fechaEvento && !Number.isNaN(fechaEvento.getTime());
                              return (
                                <li key={`${evento.estado}-${evento.fecha || indice}-${indice}`} className="relative">
                                  <span className={`absolute -left-[17px] top-1.5 h-2 w-2 rounded-full ${infoEvento.dot}`} />
                                  <span className="font-bold">{infoEvento.label}</span>
                                  {evento.usuario && <span> · {evento.usuario}</span>}
                                  {fechaValida && <div className="text-[11px] text-content-3">{fechaEvento.toLocaleString('es-PY')}</div>}
                                  {evento.motivo && <div className="mt-0.5 text-[11px] text-content-2">{evento.motivo}</div>}
                                </li>
                              );
                            })}
                          </ol>
                        </details>
                      </div>
                    </TD>
                    <TD className="px-4 py-4 align-top text-xs font-medium text-content-1 dark:text-content-3">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-user text-content-3"></i>
                        <span>{notif.solicitante || 'Funcionario'}</span>
                      </div>
                    </TD>
                    <TD className="px-4 py-4 align-top text-xs text-content-3 font-mono">
                      {fechaSolicitud ? new Date(fechaSolicitud).toLocaleDateString('es-PY') : 'Reciente'}
                      {!estaResuelto && diasAbierta >= 7 && <span className="mt-1 block rounded bg-warn-soft px-2 py-1 text-[10px] font-bold text-warn">{diasAbierta} días pendiente</span>}
                    </TD>
                    <TD className="px-4 py-4 align-top">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${info.color}`}>
                        <span className={`h-2 w-2 rounded-full ${info.dot}`}></span>
                        {info.label}
                      </span>
                    </TD>
                    <TD className="py-4 pl-4 pr-6 sm:pr-8 align-top text-right">
                      {!estaResuelto && (
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {estado === 'PENDIENTE' && <button
                            type="button"
                            onClick={() => iniciarRevision(notif)}
                            disabled={revisandoIds.has(notif.id)}
                            className="px-3 h-10 rounded-control text-[13px] font-semibold text-info hover:bg-info-soft border border-info/25 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-info outline-none disabled:opacity-60 disabled:cursor-wait"
                          >
                            {revisandoIds.has(notif.id) ? 'Guardando…' : 'Marcar en revisión'}
                          </button>}
                          <button
                            type="button"
                            onClick={() => openResolucionModal(bienAsociado, 'rechazar', notif)}
                            className="px-4 h-10 rounded-control text-[13px] font-semibold text-content-2 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-1/[0.05] border border-transparent hover:border-line dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand outline-none"
                          >
                            Rechazar
                          </button>
                          <button
                            type="button"
                            onClick={() => openResolucionModal(bienAsociado, 'aprobar', notif)}
                            className="px-4 h-10 rounded-control text-[13px] font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 outline-none"
                          >
                            {esSolicitudFuncionario ? 'Aprobar Eliminación' : 'Aprobar Baja'}
                          </button>
                        </div>
                      )}
                      {estaResuelto && (
                        <span className="text-[10px] font-bold text-content-3 uppercase tracking-wider">
                          Decisión registrada
                        </span>
                      )}
                    </TD>
                  </TRow>
                );
              })}

              {listaFiltrada.length === 0 && (
                <TRow>
                  <TD colSpan="5">
                    <EmptyState
                      icon="fa-check-double"
                      titulo="Bandeja de aprobaciones al día"
                      descripcion="No hay solicitudes pendientes con el filtro seleccionado."
                      className="py-8 sm:py-10"
                    />
                  </TD>
                </TRow>
              )}
            </TBody>
          </Table>
        </div>
      </div>

      {/* Leyenda de estados */}
      <div className="flex flex-wrap gap-2 text-[10px] font-bold text-content-3 dark:text-content-3 uppercase tracking-wider">
        {Object.entries(ESTADO_INFO).map(([key, info]) => (
          <span key={key} className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${info.dot}`}></span>
            {info.label}
          </span>
        ))}
      </div>
    </div>
  );
}
