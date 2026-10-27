import { formatCurrency, formatDateText } from '../utils/helpers';
import { Card, PageHeader, StatTile, KpiGrid } from '../components/ui';

// Vista "Mi Dependencia" de solo lectura (extraída de App.jsx, Fase 4).
export default function ResumenView({ dependenciaActual, stats, pendientes, fc10List }) {
  return (
    <div className="space-y-6 pb-12">
        <Card className="p-0">
          <div className="p-5 sm:p-6">
            <PageHeader
              titulo={<>Mi Dependencia · {dependenciaActual}</>}
              descripcion={'Vista de solo lectura'}
              icono="fa-house-user"
            />
          </div>
        </Card>

      <KpiGrid columnas={4} className="gap-3">
        <StatTile etiqueta="Bienes activos" valor={stats.totalItems} icono="fa-boxes-stacked" tono="brand" animado />
        <StatTile etiqueta="Valor patrimonial" valor={`Gs. ${formatCurrency(stats.totalValue)}`} icono="fa-coins" tono="ok" animado={false} />
        <StatTile etiqueta="Pendientes de QR" valor={stats.withoutQR} icono="fa-qrcode" tono="warn" animado />
        <StatTile etiqueta="Sin acta FC-10" valor={stats.withoutFc10} icono="fa-file-signature" tono="warn" animado />
      </KpiGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card tamaño="sm" className="p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-bold text-content-1 dark:text-white">
              <i className="fa-solid fa-list-check text-content-3 mr-2"></i> Estado de regularización
            </h3>
          </div>
          <div className="space-y-3">
            {pendientes.map(p => (
              <div key={p.id} className="flex items-center gap-3">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-control border ${p.box}`}>
                  <i className={`fa-solid ${p.icon} text-xs`}></i>
                </span>
                <span className="flex-1 text-[13px] font-semibold text-content-2 dark:text-content-3">{p.label}</span>
                <span className="text-sm font-bold tabular-nums text-content-1 dark:text-white">{p.count}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card tamaño="sm" className="p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-bold text-content-1 dark:text-white">
              <i className="fa-solid fa-clock-rotate-left text-content-3 mr-2"></i> Últimas asignaciones
            </h3>
          </div>
          <div className="space-y-1">
            {fc10List.filter(fc => fc.dependencia === dependenciaActual).sort((a, b) => String(b.fechaGeneracion || b.entregadoFecha || '').localeCompare(String(a.fechaGeneracion || a.entregadoFecha || ''))).slice(0, 5).map(fc => (
              <div key={fc.id} className="flex items-center gap-3 py-2 border-b border-line dark:border-white/5 last:border-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-surface-3 dark:bg-surface-1/10 text-content-3 dark:text-content-3 text-xs font-bold">
                  {(fc.funcionarioNombre || '?').charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-bold text-content-1 dark:text-zinc-200 truncate">{fc.funcionarioNombre || 'Sin responsable'}</span>
                  <span className="block text-[11px] text-content-3 truncate">{fc.entregadoFecha ? formatDateText(fc.entregadoFecha) : (fc.fechaGeneracion ? formatDateText(fc.fechaGeneracion) : '')}</span>
                </span>
              </div>
            ))}
            {fc10List.filter(fc => fc.dependencia === dependenciaActual).length === 0 && (
              <p className="text-xs font-semibold text-content-3 py-4 text-center">Sin asignaciones registradas.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
