import { useState } from 'react';
import SkeletonLoader from '../components/SkeletonLoader';
import { PeriodSelector } from '../components/FilterComponents';
import { Card, EmptyState, PageHeader, Toolbar, Button, IconButton } from '../components/ui';
import Dialogo from '../components/ui/Dialogo';

// Vista de autorizaciones de traslado FC-11 (extraída de App.jsx, Fase 4).
export default function Fc11View({
  filteredFC11, fc10Year, setFc10Year, fc10Month, setFc10Month,
  STYLES, handleExportFC11CSV, isLoading, dependenciaActual,
  handleGenerateFC11PDF, openFC11Modal, bienes, isAdmin, setItemToDelete,
  registrarFirmasFC11, registrandoFirmasFC11 = false
}) {
  const [movimientoParaCerrar, setMovimientoParaCerrar] = useState(null);
  const [fechaRegistro, setFechaRegistro] = useState(() => new Date().toISOString().slice(0, 10));
  const [errorRegistro, setErrorRegistro] = useState('');
  const enviarRegistro = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const ok = await registrarFirmasFC11(movimientoParaCerrar, {
      fechaFirma: f.get('fechaFirma'),
      referenciaArchivo: f.get('referenciaArchivo')
    });
    if (ok) setMovimientoParaCerrar(null);
    else setErrorRegistro('No se pudo registrar. Revisa los datos o vuelve a intentar.');
  };
  return (
    <div className="flex flex-col flex-1 space-y-6">
      <Card className="p-0">
        <div className="p-5 sm:p-6">
          <PageHeader
            titulo={'Autorizaciones de Traslado (FC-11)'}
            descripcion={'Movimientos y devoluciones. Los FC-11 pendientes de firma se mantienen visibles aunque cambies el periodo.'}
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
            <Button variante="subtle" tamano="md" icono="fa-file-csv" onClick={handleExportFC11CSV}>
              Exportar CSV
            </Button>
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
              const esPendiente = fc.estado === 'PENDIENTE_FIRMAS';
              const esLegado = !fc.estado;
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
                          <p className="text-xs font-mono font-bold text-content-1 dark:text-zinc-100 mt-1 uppercase">Nº {fc.numeroFormulario || 'S/N'}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {fc.estado !== 'COMPLETADO' && <IconButton titulo="Descargar PDF FC-11" icono="fa-file-pdf" variante="ghost" tamano="sm" onClick={()=>handleGenerateFC11PDF([fc])} />}
                      {isAdmin && fc.estado === 'PENDIENTE_FIRMAS' && <IconButton titulo="Editar" icono="fa-pen-to-square" variante="ghost" tamano="sm" onClick={()=>openFC11Modal(fc.bienesSnapshot?.length ? fc.bienesSnapshot : [bienes.find(b => b.id === fc.bienId) || fc.bienSnapshot], fc)} />}
                      {isAdmin && fc.estado !== 'COMPLETADO' && (
                        <IconButton titulo="Eliminar" icono="fa-trash-can" variante="danger" tamano="sm" onClick={()=>setItemToDelete({type:'fc11', id:fc.id, item: fc})} />
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex-1 flex flex-col">
                    <div className={`mb-3 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${esPendiente ? 'bg-warn-soft text-warn' : 'bg-ok-soft text-ok'}`}>
                      <i className={`fa-solid ${esPendiente ? 'fa-file-signature' : 'fa-circle-check'}`} aria-hidden="true" />
                      {esPendiente ? 'Pendiente de firma de recepción' : esLegado ? 'Registro anterior al seguimiento de firmas' : 'Recepción firmada · archivada'}
                    </div>
                    <div className="flex flex-col gap-1.5 mb-4 border-l-2 border-line dark:border-line pl-3 py-1">
                       <p className="text-xs text-content-3 dark:text-content-3"><span className="font-bold text-content-1 dark:text-zinc-100">{esSalida ? 'Hacia:' : 'Desde:'}</span> {esSalida ? depDestinataria : depRemitente}</p>
                    </div>
                    <div className="mt-auto max-h-40 overflow-y-auto bg-surface-2/80 dark:bg-surface-2/80 p-3.5 rounded-control border border-line/60 dark:border-line">
                      {(fc.bienesSnapshot?.length ? fc.bienesSnapshot : [fc.bienSnapshot]).filter(Boolean).map((bien, index) => <div key={bien.id || index} className="py-1.5">
                        <p className="text-xs font-bold text-content-1 dark:text-zinc-100 mb-1 font-mono"><i className="fa-solid fa-tag text-content-3 mr-1.5"></i> {bien.rotulo || 'Sin rótulo'}</p>
                        <p className="text-xs text-content-3 dark:text-content-3 line-clamp-1">{bien.descripcion || 'Especificación omitida'} · Estado: {bien.estadoConservacion || 'Sin registrar'}</p>
                      </div>)}
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-content-3">{fc.bienesSnapshot?.length || 1} bien{(fc.bienesSnapshot?.length || 1) === 1 ? '' : 'es'} en el expediente</p>
                    </div>
                    {fc.estado === 'COMPLETADO' && fc.firmasExternas?.receptor && <p className="mt-2 text-[11px] text-content-2">Recibió: {fc.firmasExternas.receptor.nombre} · C.I. {fc.firmasExternas.receptor.documento} · {fc.firmasExternas.receptor.cargo} · {fc.firmasExternas.receptor.fecha}</p>}
                    {fc.estado === 'COMPLETADO' && fc.referenciaArchivo && <p className="mt-1 break-words text-[11px] text-content-3">Archivo: {fc.referenciaArchivo}</p>}
                    {isAdmin && esPendiente && fc.receptorNombre && fc.receptorDocumento && fc.receptorCargo && (
                      <Button className="mt-3 w-full" variante="secondary" tamano="sm" icono="fa-folder-check" onClick={() => { setErrorRegistro(''); setFechaRegistro(new Date().toISOString().slice(0, 10)); setMovimientoParaCerrar(fc); }}>
                        Registrar firma y recepción
                      </Button>
                    )}
                    {isAdmin && esPendiente && (!fc.receptorNombre || !fc.receptorDocumento || !fc.receptorCargo) && <p className="mt-3 text-xs text-warn">Completa los datos del responsable receptor y vuelve a descargar el FC-11 antes de registrar la firma.</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      {movimientoParaCerrar && (
        <Dialogo className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-3 sm:p-6" onCerrar={() => setMovimientoParaCerrar(null)}>
          <form noValidate onSubmit={enviarRegistro} onChange={() => setErrorRegistro('')} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-panel border border-line bg-surface-1 p-5 shadow-2xl sm:p-7">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-content-1">Registrar firma de recepción</h2>
              <p className="mt-1 text-sm text-content-2">Descarga el FC-11, gestiona la firma de recepción fuera del sistema y archiva el PDF. Aquí se registra la fecha y referencia del archivo; no se valida el certificado ni el contenido de la firma.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-control border border-line p-3 text-sm text-content-2 sm:col-span-2">
                <p className="font-bold text-content-1">Responsable receptor</p>
                <p>{movimientoParaCerrar.receptorNombre} · C.I. {movimientoParaCerrar.receptorDocumento} · {movimientoParaCerrar.receptorCargo}</p>
              </div>
              <label className="text-xs text-content-3">Fecha de firma de recepción
                <input name="fechaFirma" required type="date" defaultValue={fechaRegistro} className="mt-1 h-10 w-full rounded-control border border-line bg-surface-1 px-3 text-sm text-content-1" />
              </label>
              <label className="sm:col-span-2 text-xs text-content-3">Carpeta o referencia del PDF firmado
                <input name="referenciaArchivo" required maxLength={500} placeholder="Ej.: Patrimonio/FC11/2026/001-2026.pdf" className="mt-1 h-10 w-full rounded-control border border-line bg-surface-1 px-3 text-sm text-content-1" />
              </label>
            </div>
            {errorRegistro && <p role="alert" className="mt-3 text-sm text-danger">{errorRegistro}</p>}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button variante="ghost" onClick={() => setMovimientoParaCerrar(null)}>Cancelar</Button>
              <Button type="submit" variante="primary" cargando={registrandoFirmasFC11}>Confirmar archivo y recepción</Button>
            </div>
          </form>
        </Dialogo>
      )}
    </div>
  );
}
