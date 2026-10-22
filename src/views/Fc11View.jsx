import SkeletonLoader from '../components/SkeletonLoader';
import { PeriodSelector } from '../components/FilterComponents';
import { Card, EmptyState, PageHeader, Toolbar } from '../components/ui';

// Vista de autorizaciones de traslado FC-11 (extraída de App.jsx, Fase 4).
export default function Fc11View({
  filteredFC11, fc10Year, setFc10Year, fc10Month, setFc10Month,
  STYLES, handleExportFC11CSV, isLoading, dependenciaActual,
  handleGenerateFC11PDF, openFC11Modal, bienes, isAdmin, setItemToDelete
}) {
  return (
    <div className="flex flex-col flex-1 space-y-6">
      <Card className="p-0">
        <div className="p-5 sm:p-6">
          <PageHeader
            titulo={'Autorizaciones de Traslado (FC-11)'}
            descripcion={'Movilidad interna institucional de bienes entre dependencias'}
            icono="fa-truck-fast"
            contador={(
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums bg-surface-3 dark:bg-surface-1/10 text-content-2 dark:text-content-3 border border-line dark:border-white/10">
                {filteredFC11.length}
              </span>
            )}
          />
          <Toolbar className="mt-4">
          <div className="flex flex-wrap gap-2 items-center">
            <PeriodSelector selectedYear={fc10Year} setSelectedYear={setFc10Year} selectedMonth={fc10Month} setSelectedMonth={setFc10Month} />
            <button onClick={handleExportFC11CSV} className={STYLES.btnSecondary}>
                <i className="fa-solid fa-file-csv text-ok dark:text-emerald-400"></i> Exportar CSV
            </button>
          </div>
          </Toolbar>
        </div>
      </Card>
      <div className="bg-surface-1 dark:bg-surface-1/[0.04] p-5 sm:p-6 rounded-panel border border-line/70 dark:border-white/10 shadow-sm min-h-[400px]">
        {isLoading ? ( <SkeletonLoader /> ) : filteredFC11.length === 0 ? (
          <EmptyState tipo="vacio" icono="fa-truck-fast" titulo="Sin traslados registrados" descripcion="No existen expedientes FC-11 procesados en el periodo seleccionado." />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredFC11.map(fc => {
              const depRemitente = fc.dependenciaRemitente || fc.remitente || '';
              const depDestinataria = fc.dependenciaDestinataria || fc.destinatario || '';
              const esSalida = depRemitente === dependenciaActual;
              return (
                <div key={fc.id} className={`${STYLES.card} p-6 flex flex-col hover:border-brand/50 motion group relative overflow-hidden`}>
                  <div className={`absolute top-0 left-0 w-full h-1 ${esSalida ? 'bg-zinc-500' : 'bg-brand'}`}></div>
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-card text-lg shadow-2xs ${esSalida ? 'bg-surface-3 text-content-1 dark:bg-surface-2 dark:text-content-3' : 'bg-brand-soft text-brand-text dark:bg-brand/20 dark:text-brand'}`}>
                          <i className={`fa-solid ${esSalida ? 'fa-arrow-right-from-bracket' : 'fa-arrow-right-to-bracket'}`}></i>
                      </div>
                      <div className="flex flex-col">
                          {esSalida ? <span className="inline-flex items-center rounded-lg bg-surface-3 px-2.5 py-0.5 text-[10px] font-black text-content-1 border border-line dark:bg-surface-2 dark:text-content-3 dark:border-line uppercase tracking-wider">Despacho</span> : <span className="inline-flex items-center rounded-lg bg-brand-soft px-2.5 py-0.5 text-[10px] font-black text-brand-text border border-brand/20 dark:bg-brand/20 dark:text-brand uppercase tracking-wider">Recepción</span>}
                          <p className="text-xs font-mono font-bold text-content-1 dark:text-zinc-100 mt-1 uppercase">Nº {fc.numeroFormulario}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={()=>handleGenerateFC11PDF([fc])} className="flex h-8 w-8 items-center justify-center rounded-control text-content-3 hover:text-content-1 hover:bg-surface-3 dark:hover:bg-darkbg-hover transition cursor-pointer" title="Re-imprimir" aria-label="Re-imprimir"><i className="fa-solid fa-print text-xs"></i></button>
                      <button onClick={()=>openFC11Modal(bienes.find(b => b.id === fc.bienId) || fc.bienSnapshot, fc)} className="flex h-8 w-8 items-center justify-center rounded-control text-content-3 hover:text-brand-text hover:bg-brand-soft dark:hover:bg-brand/20 transition cursor-pointer" title="Editar" aria-label="Editar"><i className="fa-solid fa-pen-to-square text-xs"></i></button>
                      {isAdmin && (
                          <button onClick={()=>setItemToDelete({type:'fc11', id:fc.id, item: fc})} className="flex h-8 w-8 items-center justify-center rounded-control text-content-3 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition cursor-pointer"><i className="fa-solid fa-trash-can text-xs"></i></button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex-1 flex flex-col">
                    <div className="flex flex-col gap-1.5 mb-4 border-l-2 border-line dark:border-line pl-3 py-1">
                       <p className="text-xs text-content-3 dark:text-content-3"><span className="font-bold text-content-1 dark:text-zinc-100">{esSalida ? 'Hacia:' : 'Desde:'}</span> {esSalida ? depDestinataria : depRemitente}</p>
                    </div>
                    <div className="mt-auto bg-surface-2/80 dark:bg-surface-2/80 p-3.5 rounded-control border border-line/60 dark:border-line">
                      <p className="text-xs font-bold text-content-1 dark:text-zinc-100 mb-1 font-mono"><i className="fa-solid fa-tag text-content-3 mr-1.5"></i> {fc.bienSnapshot?.rotulo}</p>
                      <p className="text-xs text-content-3 dark:text-content-3 line-clamp-1">{fc.bienSnapshot?.descripcion || 'Especificación omitida'}</p>
                    </div>
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
