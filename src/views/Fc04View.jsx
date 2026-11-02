import { useMemo, useState } from 'react';
import SkeletonLoader from '../components/SkeletonLoader';
import { PeriodSelector } from '../components/FilterComponents';
import { Card, EmptyState, PageHeader, Toolbar, Button, IconButton } from '../components/ui';

// Vista del registro mensual FC-04 (extraída de App.jsx, Fase 4).
export default function Fc04View({
  filteredFC04, fc10Year, setFc10Year, fc10Month, setFc10Month,
  openFC04Modal, STYLES, isLoading, ORIGENES_FC04,
  handleGenerateFC04PDF, isAdmin, setItemToDelete
}) {
  const [busqueda, setBusqueda] = useState('');
  const listaFC04 = useMemo(() => {
    const q = busqueda.trim().toLocaleLowerCase('es');
    if (!q) return filteredFC04;
    return filteredFC04.filter(fc => [fc.numeroFormulario, fc.origenMovimiento, fc.observaciones, fc.id, ...(fc.bienes || []).map(b => `${b.rotulo || ''} ${b.descripcion || ''}`)].filter(Boolean).join(' ').toLocaleLowerCase('es').includes(q));
  }, [filteredFC04, busqueda]);
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
            <div className="relative min-w-[220px] flex-1">
              <label className="sr-only" htmlFor="fc04-search">Buscar FC-04</label>
              <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-content-3" aria-hidden="true" />
              <input id="fc04-search" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar número, bien u observación…" className="h-10 w-full rounded-control border border-line bg-surface-1 pl-9 pr-9 text-sm text-content-1 outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" />
              {busqueda && <button type="button" onClick={() => setBusqueda('')} aria-label="Limpiar búsqueda FC-04" className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 rounded text-content-3 hover:bg-surface-3"><i className="fa-solid fa-xmark" /></button>}
            </div>
            {isAdmin && <Button variante="primary" tamano="md" icono="fa-plus" onClick={() => openFC04Modal(null)}>
              Redactar Planilla
            </Button>}
          </div>
          </Toolbar>
        </div>
      </Card>

      <div className="bg-surface-1 dark:bg-surface-1/[0.04] p-5 sm:p-6 rounded-panel border border-line/70 dark:border-white/10 shadow-sm min-h-[400px]">
        {isLoading ? ( <SkeletonLoader /> ) : listaFC04.length === 0 ? (
          <EmptyState tipo="busqueda" icono={busqueda ? 'fa-filter-circle-xmark' : 'fa-folder-open'} titulo={busqueda ? 'Sin coincidencias' : 'Sin expedientes registrados'} descripcion={busqueda ? 'Prueba con otro texto o limpia la búsqueda.' : 'No existen formularios FC-04 generados en el ciclo seleccionado.'} accionLabel={busqueda ? 'Limpiar búsqueda' : undefined} onAccion={busqueda ? () => setBusqueda('') : undefined} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {listaFC04.map(fc => {
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
                      {isAdmin && <IconButton titulo="Editar" icono="fa-pen-to-square" variante="ghost" tamano="sm" onClick={()=>openFC04Modal(fc)} />}
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
