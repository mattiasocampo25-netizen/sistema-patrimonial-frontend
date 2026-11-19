import React, { useMemo } from 'react';
import { formatCurrency, formatDateText } from '../utils/helpers';
import { Card, PageHeader, Button } from '../components/ui';

const formatNumber = value => Number(value || 0).toLocaleString('es-PY');

// Resumen operativo de solo lectura, con accesos a las tareas de la dependencia activa.
export default function ResumenView({
  dependenciaActual, stats = {}, pendientes = [], fc10List = [], timeStats = {}, solicitudesBaja = [], currentUser,
  setActiveTab, setFiltroQR, setFiltroFC10, setFiltroPendiente, setCurrentPage,
  clearAllFilters, setFc10Year, setFc10Month
}) {
  const ultimasActas = useMemo(() => (fc10List || [])
    .filter(fc => fc.dependencia === dependenciaActual)
    .slice()
    .sort((a, b) => String(b.entregadoFecha || b.fechaGeneracion || '').localeCompare(String(a.entregadoFecha || a.fechaGeneracion || '')))
    .slice(0, 5), [fc10List, dependenciaActual]);

  const misSolicitudesBaja = useMemo(() => {
    const usuario = String(currentUser?.username || currentUser?.id || '').trim().toLocaleLowerCase('es');
    if (!usuario) return [];
    return (solicitudesBaja || [])
      .filter(s => String(s.solicitante || '').trim().toLocaleLowerCase('es') === usuario)
      .sort((a, b) => String(b.created_at || b.fecha || '').localeCompare(String(a.created_at || a.fecha || '')));
  }, [solicitudesBaja, currentUser]);

  const irInventario = preparar => {
    clearAllFilters?.();
    preparar?.();
    setCurrentPage?.(1);
    setActiveTab?.('inventario');
  };
  const irActas = periodo => {
    if (periodo?.year) setFc10Year?.(periodo.year);
    if (periodo?.month) setFc10Month?.(periodo.month);
    setActiveTab?.('fc10');
  };

  const estados = stats.estados || {};
  const totalEstados = Object.values(estados).reduce((total, n) => total + Number(n || 0), 0) || 1;
  const coloresEstado = { bueno: 'bg-emerald-500', regular: 'bg-amber-500', malo: 'bg-rose-500' };
  const nombresEstado = { bueno: 'Bueno', regular: 'Regular', malo: 'Requiere atención' };
  const metricas = [
    { etiqueta: 'Bienes activos', valor: formatNumber(stats.totalItems), icono: 'fa-boxes-stacked', tono: 'text-brand-text bg-brand-soft', accion: () => irInventario() },
    { etiqueta: 'Valor patrimonial', valor: `Gs. ${formatCurrency(stats.totalValue || 0)}`, icono: 'fa-coins', tono: 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40', accion: () => irInventario() },
    { etiqueta: 'Pendientes de QR', valor: formatNumber(stats.withoutQR), icono: 'fa-qrcode', tono: 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/40', accion: () => irInventario(() => setFiltroQR?.('NO')) },
    { etiqueta: 'Sin acta FC-10', valor: formatNumber(stats.withoutFc10), icono: 'fa-file-signature', tono: 'text-orange-700 bg-orange-50 dark:text-orange-300 dark:bg-orange-950/40', accion: () => irInventario(() => setFiltroFC10?.('NO')) }
  ];

  return (
    <div className="module-screen space-y-5 pb-12">
      <section className="summary-hero rounded-2xl border border-line bg-surface-1 p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-0 flex-1">
            <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-text">
              <i className="fa-solid fa-building-user" aria-hidden="true" /> Vista de dependencia
            </p>
            <PageHeader
              titulo={dependenciaActual || 'Mi Dependencia'}
              descripcion="Bienes, tareas de regularización y actividad administrativa en un solo lugar."
              icono="fa-house-user"
              className="!mb-0"
            />
          </div>
          <Button variante="primary" icono="fa-boxes-stacked" onClick={() => irInventario()}>Consultar inventario</Button>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
          {metricas.map(item => (
            <button key={item.etiqueta} type="button" onClick={item.accion} className="group flex min-h-[92px] items-center gap-3 bg-surface-1 px-4 py-4 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.tono}`}><i className={`fa-solid ${item.icono}`} aria-hidden="true" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold text-content-3">{item.etiqueta}</span>
                <span className="mt-1 block truncate text-lg font-extrabold tabular-nums text-content-1">{item.valor}</span>
              </span>
              <i className="fa-solid fa-arrow-up-right-from-square text-[10px] text-content-3 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card tamaño="sm" className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-sm font-bold text-content-1"><i className="fa-solid fa-list-check mr-2 text-brand-text" aria-hidden="true" />Revisión operativa</h2>
              <p className="mt-1 text-xs text-content-3">Abre una fila para ver los bienes que requieren atención.</p>
            </div>
            <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-content-2">{pendientes.reduce((n, p) => n + Number(p.count || 0), 0).toLocaleString('es-PY')} pendientes</span>
          </div>
          <div className="divide-y divide-line px-4 sm:px-5">
            {pendientes.map(p => (
              <button key={p.id} type="button" onClick={() => irInventario(() => setFiltroPendiente?.(p.id))} className="flex min-h-[62px] w-full items-center gap-3 py-3 text-left transition-colors hover:bg-surface-2/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${p.box}`}><i className={`fa-solid ${p.icon} text-xs`} aria-hidden="true" /></span>
                <span className="min-w-0 flex-1 text-[13px] font-semibold text-content-2">{p.label}</span>
                <span className="min-w-[3rem] rounded-lg bg-surface-2 px-2 py-1 text-right text-sm font-bold tabular-nums text-content-1">{formatNumber(p.count)}</span>
                <i className="fa-solid fa-chevron-right text-[10px] text-content-3" aria-hidden="true" />
              </button>
            ))}
            {pendientes.length === 0 && <p className="py-8 text-center text-xs text-content-3">No hay alertas pendientes en esta dependencia.</p>}
          </div>
        </Card>

        <Card tamaño="sm" className="p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-content-1"><i className="fa-solid fa-chart-simple mr-2 text-brand-text" aria-hidden="true" />Conservación de bienes</h2>
              <p className="mt-1 text-xs text-content-3">Distribución por estado registrado en el inventario.</p>
            </div>
            <Button variante="ghost" tamano="sm" onClick={() => irInventario()}>Ver bienes</Button>
          </div>
          <div className="space-y-5">
            {Object.entries(estados).map(([clave, cantidad]) => {
              const porcentaje = Math.round((Number(cantidad || 0) / totalEstados) * 100);
              return <div key={clave}>
                <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                  <span className="font-semibold text-content-2">{nombresEstado[clave] || clave}</span>
                  <span className="font-semibold tabular-nums text-content-3">{formatNumber(cantidad)} <span className="ml-1 text-content-4">· {porcentaje}%</span></span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-3"><div className={`h-full rounded-full transition-[width] duration-700 ${coloresEstado[clave] || 'bg-brand'}`} style={{ width: `${Math.min(100, porcentaje)}%` }} /></div>
              </div>;
            })}
            {Object.keys(estados).length === 0 && <p className="py-6 text-center text-xs text-content-3">No hay estados de conservación registrados.</p>}
          </div>
        </Card>
      </section>

      <Card tamaño="sm" className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-sm font-bold text-content-1"><i className="fa-solid fa-file-circle-check mr-2 text-brand-text" aria-hidden="true" />Seguimiento de solicitudes de baja</h2>
            <p className="mt-1 text-xs text-content-3">Consulta el avance y las observaciones de tus trámites.</p>
          </div>
          <span className="rounded-full border border-line bg-surface-2 px-3 py-1 text-xs font-semibold text-content-2">{misSolicitudesBaja.length} solicitudes</span>
        </div>
        {misSolicitudesBaja.length === 0 ? (
          <p className="px-5 py-8 text-center text-xs text-content-3">Todavía no tienes solicitudes de baja registradas.</p>
        ) : (
          <ul className="divide-y divide-line">
            {misSolicitudesBaja.map(solicitud => {
              const historial = Array.isArray(solicitud.historial) && solicitud.historial.length
                ? solicitud.historial
                : [{ estado: solicitud.estado || 'PENDIENTE', usuario: solicitud.solicitante, fecha: solicitud.created_at || solicitud.fecha, motivo: solicitud.motivo }];
              const ultimo = historial[historial.length - 1] || {};
              const estado = String(solicitud.estado || ultimo.estado || 'PENDIENTE').toUpperCase();
              const estadoTexto = ({ PENDIENTE: 'Recibida', EN_REVISION: 'En revisión', APROBADO: 'Aprobada', RECHAZADO: 'Rechazada', RESUELTO: 'Resuelta' })[estado] || estado.replaceAll('_', ' ');
              const esFinal = ['APROBADO', 'RECHAZADO', 'RESUELTO'].includes(estado);
              return <li key={solicitud.id} className="px-5 py-5 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-content-1">{solicitud.tipo === 'BAJA_FUNCIONARIO' ? 'Solicitud de baja de funcionario' : 'Solicitud de baja de bien'}{solicitud.rotulo ? ` · Rótulo ${solicitud.rotulo}` : ''}</p>
                    <p className="mt-1 text-xs text-content-2">{solicitud.descripcion || solicitud.funcionario || solicitud.motivo || 'Sin detalle adicional'}</p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${estado === 'RECHAZADO' ? 'border-danger/20 bg-danger-soft text-danger' : esFinal ? 'border-ok/20 bg-ok-soft text-ok' : 'border-warn/20 bg-warn-soft text-warn'}`}>{estadoTexto}</span>
                </div>
                <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {historial.map((evento, indice) => <li key={`${solicitud.id}-${indice}`} className="rounded-xl border border-line bg-surface-2/70 p-3">
                    <p className="text-xs font-bold text-content-1">{({ PENDIENTE: 'Solicitud enviada', EN_REVISION: 'En revisión', APROBADO: 'Aprobada', RECHAZADO: 'Rechazada', RESUELTO: 'Resuelta' })[String(evento.estado || '').toUpperCase()] || String(evento.estado || 'Actualización').replaceAll('_', ' ')}</p>
                    <p className="mt-1 text-[10px] text-content-3">{evento.fecha ? formatDateText(evento.fecha) : 'Fecha no registrada'}{evento.usuario ? ` · ${evento.usuario}` : ''}</p>
                    {evento.motivo && <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-content-2">{evento.motivo}</p>}
                  </li>)}
                </ol>
                {!esFinal && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">El trámite sigue en gestión. Su aprobación no da de baja el bien del inventario; ese proceso requiere un expediente administrativo separado.</p>}
              </li>;
            })}
          </ul>
        )}
      </Card>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card tamaño="sm" className="p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-sm font-bold text-content-1"><i className="fa-solid fa-arrow-right-arrow-left mr-2 text-brand-text" aria-hidden="true" />Movimientos FC-10</h2><p className="mt-1 text-xs text-content-3">Compara las asignaciones del período.</p></div>
            <Button variante="ghost" tamano="sm" onClick={() => irActas()}>Historial FC-10</Button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { label: `Este mes · ${timeStats.currentMonthName || ''}`, n: timeStats.asigCurrentMonth || 0, periodo: timeStats.asigCurrent },
              { label: `Mes anterior · ${timeStats.prevMonthName || ''}`, n: timeStats.asigPreviousMonth || 0, periodo: timeStats.asigPrev }
            ].map(item => <button key={item.label} type="button" onClick={() => irActas(item.periodo)} className="group rounded-xl border border-line bg-surface-2/60 p-4 text-left transition-colors hover:border-brand/40 hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
              <span className="block text-[10px] font-bold uppercase tracking-wide text-content-3">{item.label}</span>
              <span className="mt-2 block text-2xl font-black tabular-nums text-content-1">{formatNumber(item.n)}</span>
              <span className="mt-1 block text-[10px] font-semibold text-brand-text">Consultar actas <i className="fa-solid fa-arrow-right ml-1 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
            </button>)}
          </div>
        </Card>

        <Card tamaño="sm" className="overflow-hidden p-0">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
            <div><h2 className="text-sm font-bold text-content-1"><i className="fa-solid fa-clock-rotate-left mr-2 text-brand-text" aria-hidden="true" />Asignaciones recientes</h2><p className="mt-1 text-xs text-content-3">Últimas actas generadas en esta dependencia.</p></div>
            <Button variante="ghost" tamano="sm" onClick={() => irActas()}>Ver todas</Button>
          </div>
          <div className="px-4 sm:px-5">
            {ultimasActas.map(fc => <button key={fc.id} type="button" onClick={() => irActas({ year: String(fc.entregadoFecha || fc.fechaGeneracion || '').slice(0, 4), month: String(fc.entregadoFecha || fc.fechaGeneracion || '').slice(5, 7) })} className="flex min-h-[60px] w-full items-center gap-3 border-b border-line py-2 text-left transition-colors last:border-0 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-sm font-bold text-brand-text">{(fc.funcionarioNombre || '?').charAt(0)}</span>
              <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-bold text-content-1">{fc.funcionarioNombre || 'Sin responsable'}</span><span className="block truncate text-[11px] text-content-3">{fc.entregadoFecha ? formatDateText(fc.entregadoFecha) : (fc.fechaGeneracion ? formatDateText(fc.fechaGeneracion) : 'Fecha no registrada')}</span></span>
              <i className="fa-solid fa-chevron-right text-[10px] text-content-3" aria-hidden="true" />
            </button>)}
            {ultimasActas.length === 0 && <p className="py-8 text-center text-xs font-semibold text-content-3">Sin asignaciones registradas.</p>}
          </div>
        </Card>
      </section>

      <Card tamaño="sm" className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[10px] font-bold uppercase tracking-widest text-content-3">Ir directamente a</span>
          <Button variante="secondary" tamano="sm" icono="fa-boxes-stacked" onClick={() => irInventario()}>Inventario</Button>
          <Button variante="secondary" tamano="sm" icono="fa-file-signature" onClick={() => irActas()}>Actas FC-10</Button>
          <Button variante="secondary" tamano="sm" icono="fa-address-book" onClick={() => setActiveTab?.('funcionarios')}>Funcionarios</Button>
        </div>
      </Card>
    </div>
  );
}
