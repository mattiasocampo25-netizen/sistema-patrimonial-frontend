import SkeletonLoader from '../components/SkeletonLoader';
import { PeriodSelector } from '../components/FilterComponents';
import { Card, PageHeader, Toolbar } from '../components/ui';

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
            <button onClick={() => openFC04Modal(null)} className={STYLES.btnPrimary}>
                <i className="fa-solid fa-plus text-xs"></i> Redactar Planilla
            </button>
          </div>
          </Toolbar>
        </div>
      </Card>

      <div className="bg-surface-1 dark:bg-surface-1/[0.04] p-5 sm:p-6 rounded-panel border border-line/70 dark:border-white/10 shadow-sm min-h-[400px]">
        {isLoading ? ( <SkeletonLoader /> ) : filteredFC04.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-surface-2/50 dark:bg-surface-2/50 rounded-card border border-dashed border-line-strong dark:border-line">
              <div className="flex h-16 w-16 items-center justify-center rounded-card bg-surface-3 dark:bg-surface-2 text-content-3 mb-4 shadow-2xs">
                <i className="fa-solid fa-folder-open text-2xl"></i>
              </div>
              <h3 className="text-base font-black text-content-1 dark:text-zinc-200">Sin expedientes registrados</h3>
              <p className="text-xs font-medium text-content-3 max-w-xs mt-1">No existen formularios FC-04 generados en el ciclo seleccionado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredFC04.map(fc => {
              const origenObj = ORIGENES_FC04.find(o => o.id === fc.origenMovimiento);
              const isAlta = fc.origenMovimiento !== 'B';
              return (
                <div key={fc.id} className={`${STYLES.card} p-6 flex flex-col hover:border-brand-primary/50 motion group`}>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-card text-xl shadow-2xs ${isAlta ? 'bg-surface-3 text-content-1 dark:bg-surface-2 dark:text-content-3' : 'bg-brand-light text-brand-dark dark:bg-brand-primary/20 dark:text-brand-accent'}`}>
                          <i className={`fa-solid ${isAlta ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`}></i>
                      </div>
                      <div>
                          <p className="font-extrabold text-content-1 dark:text-white text-lg leading-snug">{origenObj?.nombre || fc.origenMovimiento}</p>
                          <p className="text-xs text-content-3 font-bold mt-0.5 uppercase tracking-wider">Periodo: {fc.mes} / {fc.anio}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={()=>handleGenerateFC04PDF(fc)} className="flex h-8 w-8 items-center justify-center rounded-control text-content-3 hover:text-content-1 hover:bg-surface-3 dark:hover:bg-darkbg-hover transition cursor-pointer" title="Imprimir PDF" aria-label="Imprimir PDF"><i className="fa-solid fa-print text-xs"></i></button>
                      <button onClick={()=>openFC04Modal(fc)} className="flex h-8 w-8 items-center justify-center rounded-control text-content-3 hover:text-brand-text hover:bg-brand-soft dark:hover:bg-brand/20 transition cursor-pointer" title="Editar" aria-label="Editar"><i className="fa-solid fa-pen-to-square text-xs"></i></button>
                      {isAdmin && (
                          <button onClick={()=>setItemToDelete({type:'fc04', id:fc.id, item: fc})} className="flex h-8 w-8 items-center justify-center rounded-control text-content-3 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition cursor-pointer"><i className="fa-solid fa-trash-can text-xs"></i></button>
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
