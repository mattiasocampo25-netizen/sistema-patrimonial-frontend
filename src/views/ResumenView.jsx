import React, { useMemo } from 'react';
import { formatCurrency, formatDateText } from '../utils/helpers';
import { Card, PageHeader, StatTile, KpiGrid, Button } from '../components/ui';

// Resumen de solo lectura, con accesos contextuales a las tareas pendientes.
export default function ResumenView({
  dependenciaActual, stats = {}, pendientes = [], fc10List = [], timeStats = {},
  setActiveTab, setFiltroQR, setFiltroFC10, setFiltroPendiente, setCurrentPage,
  clearAllFilters, setFc10Year, setFc10Month
}) {
  const ultimasActas = useMemo(() => (fc10List || [])
    .filter(fc => fc.dependencia === dependenciaActual)
    .slice()
    .sort((a, b) => String(b.entregadoFecha || b.fechaGeneracion || '').localeCompare(String(a.entregadoFecha || a.fechaGeneracion || '')))
    .slice(0, 5), [fc10List, dependenciaActual]);

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
    <div className="space-y-6 pb-12">
      <Card className="p-0">
        <div className="p-5 sm:p-6">
          <PageHeader
            titulo={<>Mi Dependencia · {dependenciaActual}</>}
            descripcion="Resumen de bienes, regularización y movimientos recientes. Selecciona una tarjeta para abrir su detalle."
            icono="fa-house-user"
            acciones={<Button variante="secondary" icono="fa-boxes-stacked" onClick={() => irInventario()}>Abrir inventario</Button>}
          />
        </div>
      </Card>

      <KpiGrid columnas={4} className="gap-3">
        <StatTile etiqueta="Bienes activos" valor={stats.totalItems || 0} icono="fa-boxes-stacked" tono="brand" animado onClick={() => irInventario()} />
        <StatTile etiqueta="Valor patrimonial" valor={`Gs. ${formatCurrency(stats.totalValue || 0)}`} icono="fa-coins" tono="ok" onClick={() => irInventario()} />
        <StatTile etiqueta="Pendientes de QR" valor={stats.withoutQR || 0} icono="fa-qrcode" tono="warn" animado onClick={() => irInventario(() => setFiltroQR?.('NO'))} />
        <StatTile etiqueta="Sin acta FC-10" valor={stats.withoutFc10 || 0} icono="fa-file-signature" tono="warn" animado onClick={() => irInventario(() => setFiltroFC10?.('NO'))} />
      </KpiGrid>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
