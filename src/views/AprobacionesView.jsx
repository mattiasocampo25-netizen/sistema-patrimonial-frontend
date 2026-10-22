// Vista de solicitudes de aprobación (bajas, firmas, etc.) - solo admin/desarrollador.
// Incluye estados claros (Pendiente, Aprobado, Rechazado, En Revisión) y auditoría básica.
import React, { useState } from 'react';
import { Card, EmptyState, PageHeader, Toolbar, Table, THead, TBody, TRow, TH, TD } from '../components/ui';

const ESTADO_INFO = {
  PENDIENTE: { label: 'Pendiente', color: 'bg-warn-soft dark:bg-amber-950/20 text-warn dark:text-amber-400 border border-warn/25 dark:border-amber-900/30', dot: 'bg-amber-500' },
  APROBADO: { label: 'Aprobado', color: 'bg-ok-soft dark:bg-emerald-950/20 text-ok dark:text-emerald-400 border border-ok/25 dark:border-emerald-900/30', dot: 'bg-emerald-500' },
  RECHAZADO: { label: 'Rechazado', color: 'bg-danger-soft dark:bg-rose-950/20 text-danger dark:text-rose-400 border border-danger/25 dark:border-rose-900/30', dot: 'bg-rose-500' },
  EN_REVISION: { label: 'En Revisión', color: 'bg-info-soft dark:bg-sky-950/20 text-info dark:text-sky-400 border border-info/25 dark:border-sky-900/30', dot: 'bg-sky-500' }
};

export default function AprobacionesView({
  dependenciaActual,
  solicitudesBaja, bienes,
  openResolucionModal,
 
}) {
  const [filtroEstado, setFiltroEstado] = useState('todos');

  const conteo = solicitudesBaja.reduce(
    (acc, n) => {
      const e = n.estado || 'PENDIENTE';
      acc[e] = (acc[e] || 0) + 1;
      return acc;
    },
    { PENDIENTE: 0, APROBADO: 0, RECHAZADO: 0, EN_REVISION: 0 }
  );

  const listaFiltrada = filtroEstado === 'todos'
    ? solicitudesBaja
    : solicitudesBaja.filter(n => (n.estado || 'PENDIENTE') === filtroEstado);

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
            {ETAPAS.map(et => (
              <button
                key={et.id}
                onClick={() => setFiltroEstado(et.id)}
                aria-pressed={filtroEstado === et.id}
                className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-control text-label font-bold border transition-[color,background-color,border-color,transform] duration-[var(--dur-fast)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand active:scale-[0.98] ${ filtroEstado === et.id ? 'bg-brand text-content-inverse border-brand shadow-sm' : 'bg-surface-2 border-line text-content-2 hover:bg-surface-3 hover:border-line-strong' }`}
              >
                {et.label}
                <span className={`tabular-nums ${filtroEstado === et.id ? 'opacity-80' : 'text-content-3 dark:text-content-3'}`}>{et.n}</span>
              </button>
            ))}
          </div>
          </Toolbar>
        </div>
      </Card>

      <div className="bg-surface-1 dark:bg-surface-1 border border-line/70 dark:border-line rounded-panel shadow-sm overflow-hidden flex-1 min-h-[400px]">
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
                const estaResuelto = estado !== 'PENDIENTE';

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
                            {notif.resueltoEn && <span className="ml-2">· {new Date(notif.resueltoEn).toLocaleDateString()}</span>}
                          </div>
                        )}
                      </div>
                    </TD>
                    <TD className="px-4 py-4 align-top text-xs font-medium text-content-1 dark:text-content-3">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-user text-content-3"></i>
                        <span>{notif.solicitante || 'Funcionario'}</span>
                      </div>
                    </TD>
                    <TD className="px-4 py-4 align-top text-xs text-content-3 font-mono">
                      {notif.created_at ? new Date(notif.created_at).toLocaleDateString() : 'Reciente'}
                    </TD>
                    <TD className="px-4 py-4 align-top">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${info.color}`}>
                        <span className={`h-2 w-2 rounded-full ${info.dot}`}></span>
                        {info.label}
                      </span>
                    </TD>
                    <TD className="py-4 pl-4 pr-6 sm:pr-8 align-top text-right">
                      {!estaResuelto && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openResolucionModal(bienAsociado, 'rechazar', notif)}
                            className="px-4 h-10 rounded-control text-[13px] font-semibold text-content-2 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-1/[0.05] border border-transparent hover:border-line dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand outline-none"
                          >
                            Rechazar
                          </button>
                          <button
                            onClick={() => openResolucionModal(bienAsociado, 'aprobar', notif)}
                            className="px-4 h-10 rounded-control text-[13px] font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 outline-none"
                          >
                            {esSolicitudFuncionario ? 'Aprobar Eliminación' : 'Aprobar Baja'}
                          </button>
                        </div>
                      )}
                      {estaResuelto && (
                        <span className="text-[10px] font-bold text-content-3 uppercase tracking-wider">
                          {estado.toLowerCase()}
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
