import AnimatedNumber from '../components/AnimatedNumber';
import { formatCurrency, formatDateText } from '../utils/helpers';
import { Card, PageHeader } from '../components/ui';

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-1 dark:bg-surface-1/[0.04] rounded-panel border border-line/70 dark:border-white/10 p-5 shadow-sm">
          <p className="text-3xl font-bold tabular-nums text-content-1 dark:text-white tracking-tight"><AnimatedNumber value={stats.totalItems} /></p>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-content-3 dark:text-content-3 mt-1">Bienes activos</p>
        </div>
        <div className="bg-surface-1 dark:bg-surface-1/[0.04] rounded-panel border border-line/70 dark:border-white/10 p-5 shadow-sm">
          <p className="text-2xl sm:text-3xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 tracking-tight">Gs. {formatCurrency(stats.totalValue)}</p>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-content-3 dark:text-content-3 mt-1">Valor patrimonial</p>
        </div>
        <div className="bg-surface-1 dark:bg-surface-1/[0.04] rounded-panel border border-line/70 dark:border-white/10 p-5 shadow-sm">
          <p className="text-3xl font-bold tabular-nums text-content-1 dark:text-white tracking-tight"><AnimatedNumber value={stats.withoutQR} /></p>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-content-3 dark:text-content-3 mt-1">Pendientes de QR</p>
        </div>
        <div className="bg-surface-1 dark:bg-surface-1/[0.04] rounded-panel border border-line/70 dark:border-white/10 p-5 shadow-sm">
          <p className="text-3xl font-bold tabular-nums text-content-1 dark:text-white tracking-tight"><AnimatedNumber value={stats.withoutFc10} /></p>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-content-3 dark:text-content-3 mt-1">Sin acta FC-10</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface-1 dark:bg-surface-1/[0.04] rounded-panel border border-line/70 dark:border-white/10 p-5 sm:p-6 shadow-sm">
          <h3 className="text-sm font-bold text-content-1 dark:text-white flex items-center gap-2 mb-4">
            <i className="fa-solid fa-list-check text-content-3"></i> Estado de regularización
          </h3>
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
        </div>
        <div className="bg-surface-1 dark:bg-surface-1/[0.04] rounded-panel border border-line/70 dark:border-white/10 p-5 sm:p-6 shadow-sm">
          <h3 className="text-sm font-bold text-content-1 dark:text-white flex items-center gap-2 mb-4">
            <i className="fa-solid fa-clock-rotate-left text-content-3"></i> Últimas asignaciones
          </h3>
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
        </div>
      </div>
    </div>
  );
}
