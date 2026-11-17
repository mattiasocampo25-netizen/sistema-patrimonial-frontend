import React, { useMemo } from 'react';
import { formatCurrency, formatDateText } from '../utils/helpers';
import { Card, PageHeader, StatTile, KpiGrid, Button } from '../components/ui';

// Resumen de solo lectura, con accesos contextuales a las tareas pendientes.
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

  const irInventario = (preparar) => {
    clearAllFilters?.();
    preparar?.();
    setCurrentPage?.(1);
    setActiveTab?.('inventario');
  };
  const irActas = (periodo) => {
    if (periodo?.year) setFc10Year?.(periodo.year);
    if (periodo?.month) setFc10Month?.(periodo.month);
    setActiveTab?.('fc10');
  };
  const totalEstados = Object.values(stats.estados || {}).reduce((total, n) => total + Number(n || 0), 0) || 1;
  const coloresEstado = { bueno: 'bg-emerald-500', regular: 'bg-amber-500', malo: 'bg-rose-500' };
  const nombresEstado = { bueno: 'Bueno', regular: 'Regular', malo: 'Requiere atención' };

  return (
    <div className="module-screen dependency-workspace space-y-5 pb-12">
      <section className="dependency-hero rounded-panel p-4 sm:p-6">
        <div className="dependency-hero-content">
          <p className="mb-2 text-label font-extrabold uppercase tracking-[0.18em] text-brand-text">Resumen operativo · Dependencia activa</p>
          <PageHeader
            titulo={<>Mi Dependencia · {dependenciaActual}</>}
            descripcion="Resumen de bienes, regularización y movimientos recientes. Selecciona una tarjeta para abrir su detalle."
            icono="fa-house-user"
            acciones={<Button variante="secondary" icono="fa-boxes-stacked" onClick={() => irInventario()}>Abrir inventario</Button>}
            className="dependency-page-header"
          />
        </div>
      </section>

      <KpiGrid columnas={4} className="dependency-kpis gap-3">
        <StatTile etiqueta="Bienes activos" valor={stats.totalItems || 0} icono="fa-boxes-stacked" tono="brand" animado onClick={() => irInventario()} />
        <StatTile etiqueta="Valor patrimonial" valor={`Gs. ${formatCurrency(stats.totalValue || 0)}`} icono="fa-coins" tono="ok" onClick={() => irInventario()} />
        <StatTile etiqueta="Pendientes de QR" valor={stats.withoutQR || 0} icono="fa-qrcode" tono="warn" animado onClick={() => irInventario(() => setFiltroQR?.('NO'))} />
        <StatTile etiqueta="Sin acta FC-10" valor={stats.withoutFc10 || 0} icono="fa-file-signature" tono="warn" animado onClick={() => irInventario(() => setFiltroFC10?.('NO'))} />
      </KpiGrid>

      <Card tamaño="sm" className="dependency-requests overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-sm font-bold text-content-1"><i className="fa-solid fa-file-circle-check mr-2 text-brand-text" aria-hidden="true" />Seguimiento de mis solicitudes de baja</h2>
            <p className="mt-1 text-xs text-content-3">Consulta aquí los cambios de estado y observaciones de la gestión administrativa.</p>
          </div>
          <span className="rounded-full border border-line bg-surface-2 px-3 py-1 text-xs font-semibold text-content-2">{misSolicitudesBaja.length} solicitudes</span>
        </div>
        {misSolicitudesBaja.length === 0 ? (
          <p className="px-5 py-6 text-center text-xs text-content-3 sm:px-6">Todavía no tienes solicitudes de baja registradas.</p>
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
              return (
                <li key={solicitud.id} className="px-5 py-4 sm:px-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-content-1">{solicitud.tipo === 'BAJA_FUNCIONARIO' ? 'Solicitud de baja de funcionario' : 'Solicitud de baja de bien'}{solicitud.rotulo ? ` · Rótulo ${solicitud.rotulo}` : ''}</p>
                      <p className="mt-1 text-xs text-content-2">{solicitud.descripcion || solicitud.funcionario || solicitud.motivo || 'Sin detalle adicional'}</p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${estado === 'RECHAZADO' ? 'border-danger/20 bg-danger-soft text-danger' : esFinal ? 'border-ok/20 bg-ok-soft text-ok' : 'border-warn/20 bg-warn-soft text-warn'}`}>{estadoTexto}</span>
                  </div>
                  <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {historial.map((evento, indice) => (
                      <li key={`${solicitud.id}-${indice}`} className="relative rounded-control border border-line bg-surface-2 p-3">
                        <p className="text-xs font-bold text-content-1">{({ PENDIENTE: 'Solicitud enviada', EN_REVISION: 'En revisión', APROBADO: 'Aprobada', RECHAZADO: 'Rechazada', RESUELTO: 'Resuelta' })[String(evento.estado || '').toUpperCase()] || String(evento.estado || 'Actualización').replaceAll('_', ' ')}</p>
                        <p className="mt-1 text-[10px] text-content-3">{evento.fecha ? formatDateText(evento.fecha) : 'Fecha no registrada'}{evento.usuario ? ` · ${evento.usuario}` : ''}</p>
                        {evento.motivo && <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-content-2">{evento.motivo}</p>}
                      </li>
                    ))}
                  </ol>
                  {!esFinal && <p className="mt-3 text-[10px] text-content-3">El trámite sigue en gestión. La aprobación de la solicitud no da de baja el bien del inventario; ese proceso requiere un expediente administrativo separado.</p>}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <div className="dependency-panels grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card tamaño="sm" className="p-5 sm:p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-content-1 dark:text-white"><i className="fa-solid fa-list-check text-content-3 mr-2" aria-hidden="true" />Estado de regularización</h3>
            <span className="text-[10px] font-semibold text-content-3">Pulsa una fila para revisar</span>
          </div>
          <div className="space-y-2">
            {pendientes.map(p => (
              <button key={p.id} type="button" onClick={() => irInventario(() => setFiltroPendiente?.(p.id))} className="flex min-h-11 w-full items-center gap-3 rounded-control px-2 text-left hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-control border ${p.box}`}><i className={`fa-solid ${p.icon} text-xs`} aria-hidden="true" /></span>
                <span className="flex-1 text-[13px] font-semibold text-content-2 dark:text-content-3">{p.label}</span>
                <span className="text-sm font-bold tabular-nums text-content-1 dark:text-white">{p.count}</span>
                <i className="fa-solid fa-chevron-right text-[10px] text-content-3" aria-hidden="true" />
              </button>
            ))}
            {pendientes.length === 0 && <p className="py-4 text-center text-xs text-content-3">No hay alertas pendientes.</p>}
          </div>
        </Card>

        <Card tamaño="sm" className="p-5 sm:p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-content-1 dark:text-white"><i className="fa-solid fa-chart-pie text-content-3 mr-2" aria-hidden="true" />Estado de conservación</h3>
            <Button variante="ghost" tamano="sm" onClick={() => irInventario()}>Ver inventario</Button>
          </div>
          <div className="space-y-4">
            {Object.entries(stats.estados || {}).map(([clave, cantidad]) => (
              <div key={clave}>
                <div className="mb-1 flex justify-between gap-3 text-xs"><span className="font-semibold text-content-2">{nombresEstado[clave] || clave}</span><span className="tabular-nums text-content-3">{Number(cantidad || 0).toLocaleString('es-PY')} · {Math.round((Number(cantidad || 0) / totalEstados) * 100)}%</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-3"><div className={`h-full rounded-full ${coloresEstado[clave] || 'bg-brand'}`} style={{ width: `${Math.min(100, (Number(cantidad || 0) / totalEstados) * 100)}%` }} /></div>
              </div>
            ))}
            <p className="text-[10px] text-content-3">Las proporciones se calculan sobre bienes activos de esta dependencia.</p>
          </div>
        </Card>
      </div>

      <div className="dependency-panels grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card tamaño="sm" className="p-5 sm:p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-content-1 dark:text-white"><i className="fa-solid fa-chart-line text-brand-text mr-2" aria-hidden="true" />Movimientos FC-10</h3>
            <Button variante="ghost" tamano="sm" onClick={() => irActas()}>Ver historial</Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: `Este mes · ${timeStats.currentMonthName || ''}`, n: timeStats.asigCurrentMonth || 0, periodo: timeStats.asigCurrent },
              { label: `Mes anterior · ${timeStats.prevMonthName || ''}`, n: timeStats.asigPreviousMonth || 0, periodo: timeStats.asigPrev }
            ].map(item => <button key={item.label} type="button" onClick={() => irActas(item.periodo)} className="rounded-xl border border-line bg-surface-2/70 p-4 text-left hover:border-brand/30 hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
              <span className="block text-[10px] font-bold uppercase tracking-wide text-content-3">{item.label}</span>
              <span className="mt-1 block text-2xl font-black tabular-nums text-content-1">{item.n}</span>
              <span className="text-[10px] font-semibold text-brand-text">Ver actas <i className="fa-solid fa-arrow-right ml-1" aria-hidden="true" /></span>
            </button>)}
          </div>
        </Card>

        <Card tamaño="sm" className="p-5 sm:p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-content-1 dark:text-white"><i className="fa-solid fa-clock-rotate-left text-content-3 mr-2" aria-hidden="true" />Últimas asignaciones</h3>
            <Button variante="ghost" tamano="sm" onClick={() => irActas()}>Abrir FC-10</Button>
          </div>
          <div className="space-y-1">
            {ultimasActas.map(fc => <button key={fc.id} type="button" onClick={() => irActas({ year: String(fc.entregadoFecha || fc.fechaGeneracion || '').slice(0, 4), month: String(fc.entregadoFecha || fc.fechaGeneracion || '').slice(5, 7) })} className="flex min-h-12 w-full items-center gap-3 border-b border-line py-2 text-left last:border-0 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-surface-3 text-content-3 text-xs font-bold">{(fc.funcionarioNombre || '?').charAt(0)}</span>
              <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-bold text-content-1">{fc.funcionarioNombre || 'Sin responsable'}</span><span className="block truncate text-[11px] text-content-3">{fc.entregadoFecha ? formatDateText(fc.entregadoFecha) : (fc.fechaGeneracion ? formatDateText(fc.fechaGeneracion) : 'Fecha no registrada')}</span></span>
              <i className="fa-solid fa-chevron-right text-[10px] text-content-3" aria-hidden="true" />
            </button>)}
            {ultimasActas.length === 0 && <p className="py-4 text-center text-xs font-semibold text-content-3">Sin asignaciones registradas.</p>}
          </div>
        </Card>
      </div>

      <Card tamaño="sm" className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[10px] font-bold uppercase tracking-widest text-content-3">Accesos rápidos</span>
          <Button variante="secondary" tamano="sm" icono="fa-boxes-stacked" onClick={() => irInventario()}>Inventario</Button>
          <Button variante="secondary" tamano="sm" icono="fa-file-signature" onClick={() => irActas()}>Actas FC-10</Button>
          <Button variante="secondary" tamano="sm" icono="fa-address-book" onClick={() => setActiveTab?.('funcionarios')}>Funcionarios</Button>
        </div>
      </Card>
    </div>
  );
}
