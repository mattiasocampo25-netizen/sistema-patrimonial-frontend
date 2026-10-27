import SkeletonLoader from '../components/SkeletonLoader';
import { PeriodSelector } from '../components/FilterComponents';
import { Card, EmptyState, PageHeader, Toolbar, Button, IconButton } from '../components/ui';

// Vista del registro mensual FC-04 (extraída de App.jsx, Fase 4).
export default function Fc04View({
  filteredFC04, fc10Year, setFc10Year, fc10Month, setFc10Month,
  openFC04Modal, STYLES, isLoading, ORIGENES_FC04,
  handleGenerateFC04PDF, isAdmin, setItemToDelete
}) {
  return (
    <div className="flex flex-col flex-1 space-y-6">
      <Card className="p-0">
        <div className="p-5 sm:p-6">
          <PageHeader
            titulo={'Registro Mensual FC-04'}
            descripcion={'Gestión contable de altas y bajas patrimoniales'}
            icono="fa-file-invoice"
            contador={(
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums bg-surface-3 dark:bg-surface-1/10 text-content-2 dark:text-content-3 border border-line dark:border-white/10">
                {filteredFC04.length}
              </span>
            )}
          />
          <Toolbar className="mt-4">
          <div className="flex flex-wrap gap-2 items-center">
            <PeriodSelector selectedYear={fc10Year} setSelectedYear={setFc10Year} selectedMonth={fc10Month} setSelectedMonth={setFc10Month} />
            <Button variante="primary" tamano="md" icono="fa-plus" onClick={() => openFC04Modal(null)}>
              Redactar Planilla
            </Button>
          </div>
          </Toolbar>
        </div>
      </Card>

      <div className="bg-surface-1 dark:bg-surface-1/[0.04] p-5 sm:p-6 rounded-panel border border-line/70 dark:border-white/10 shadow-sm min-h-[400px]">
        {isLoading ? ( <SkeletonLoader /> ) : filteredFC04.length === 0 ? (
          <EmptyState tipo="busqueda" icono="fa-folder-open" titulo="Sin expedientes registrados" descripcion="No existen formularios FC-04 generados en el ciclo seleccionado." />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredFC04.map(fc => {
              const origenObj = ORIGENES_FC04.find(o => o.id === fc.origenMovimiento);
              const isAlta = fc.origenMovimiento !== 'B';
              return (
                <div key={fc.id} className={`${STYLES.card} p-6 flex flex-col hover:border-brand/50 motion group`}>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-card text-xl shadow-2xs ${isAlta ? 'bg-surface-3 text-content-1 dark:bg-surface-2 dark:text-content-3' : 'bg-brand-soft text-brand-dark dark:bg-brand/20 dark:text-brand'}`}>
                          <i className={`fa-solid ${isAlta ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`}></i>
                      </div>
                      <div>
                          <p className="font-extrabold text-content-1 dark:text-white text-lg leading-snug">{origenObj?.nombre || fc.origenMovimiento}</p>
                          <p className="text-xs text-content-3 font-bold mt-0.5 uppercase tracking-wider">Periodo: {fc.mes} / {fc.anio}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <IconButton titulo="Imprimir PDF" icono="fa-print" variante="ghost" tamano="sm" onClick={()=>handleGenerateFC04PDF(fc)} />
                      <IconButton titulo="Editar" icono="fa-pen-to-square" variante="ghost" tamano="sm" onClick={()=>openFC04Modal(fc)} />
                      {isAdmin && (
                        <IconButton titulo="Eliminar" icono="fa-trash-can" variante="danger" tamano="sm" onClick={()=>setItemToDelete({type:'fc04', id:fc.id, item: fc})} />
                      )}
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-line dark:border-line">
                    {fc.sinMovimiento ? (
                      <span className="inline-flex items-center rounded-control bg-surface-3 px-3 py-1 text-xs font-bold text-content-2 dark:bg-surface-2 dark:text-content-3 border border-line dark:border-line">Sin Movimiento</span>
                    ) : (
                      <div>
                          <p className="text-xs font-bold text-content-3 mb-2 uppercase tracking-wider">Activos ({fc.bienesSnapshot?.length || 0})</p>
                          <div className="flex flex-wrap gap-1.5">
                            {fc.bienesSnapshot?.slice(0, 3).map(b => ( <span key={b.id} className="inline-flex items-center rounded-lg bg-surface-3 px-2.5 py-1 text-xs font-mono font-bold text-content-1 dark:bg-surface-2 dark:text-content-3 border border-line/60 dark:border-line">{b.rotulo}</span> ))}
                            {fc.bienesSnapshot?.length > 3 && <span className="text-xs font-bold text-brand-text self-center ml-1">+{fc.bienesSnapshot.length - 3}</span>}
                          </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
}
