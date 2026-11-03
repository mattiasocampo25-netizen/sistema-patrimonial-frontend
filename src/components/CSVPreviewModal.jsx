import React, { useState } from 'react';
import Dialogo from './ui/Dialogo';

const FIELD_LABELS = {
  rotulo: 'Rótulo', descripcion: 'Descripción', fechaAdquisicion: 'Fecha adquisición',
  valorUnitario: 'Valor unitario', vidaUtil: 'Vida útil',
};
const sizeLabel = (bytes = 0) => bytes < 1024 * 1024
  ? `${Math.max(1, Math.round(bytes / 1024))} KB`
  : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export default function CSVPreviewModal({ isOpen, onClose, onConfirm, onDownloadReport, onRetryFailed, data, STYLES }) {
  const [correcciones, setCorrecciones] = useState(() => data?.correcciones || {});
  const [modo, setModo] = useState(() => data?.modo || 'agregar');
  const [omitirErrores, setOmitirErrores] = useState(false);

  if (!isOpen) return null;
  const esResultado = data?.tipo === 'resultado';
  const validos = data?.validos || [];
  const duplicados = data?.duplicados || [];
  const errores = data?.errores || [];
  const erroresParseo = data?.parseErrors || [];
  const problemasEncabezado = data?.problemasEncabezado || [];
  const actualizables = duplicados.filter(d => d.existenteId && !d.repetidoEnArchivo).length;
  const groups = new Map();
  for (const err of [...errores, ...erroresParseo]) {
    const list = groups.get(err.linea) || [];
    list.push(err);
    groups.set(err.linea, list);
  }
  const lineasError = [...groups.entries()].sort((a, b) => a[0] - b[0]);
  const esFatalEncabezado = problemasEncabezado.length > 0;
  const pendientesDeCorregir = errores.length + erroresParseo.length;
  const bloqueo = !esResultado && (esFatalEncabezado || (!validos.length && !(modo === 'actualizar' && actualizables)));

  const cambiarCorreccion = (linea, campo, valor) => setCorrecciones(prev => ({
    ...prev,
    [linea]: { ...(prev[linea] || {}), [campo]: valor }
  }));

  return (
    <Dialogo className={STYLES.modalOverlay}>
      <div className={`${STYLES.modalContent} max-w-3xl overflow-hidden`}>
        <div className="flex justify-between items-center px-6 py-5 border-b border-line dark:border-zinc-800/80 shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-surface-3 dark:bg-surface-1/10 text-content-1 dark:text-white">
              <i className={`fa-solid ${esResultado ? 'fa-clipboard-check' : 'fa-file-shield'} text-base`} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-content-1 dark:text-white tracking-tight">
                {esResultado ? 'Resultado de importación' : 'Revisión del CSV de bienes'}
              </h2>
              <p className="text-xs text-content-3 truncate">{data?.fileName || data?.file?.name || 'Archivo CSV'}{data?.fileSize ? ` · ${sizeLabel(data.fileSize)}` : ''}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} title="Cerrar" aria-label="Cerrar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-content-3 hover:text-content-1 dark:hover:text-zinc-200 hover:bg-surface-3 dark:hover:bg-surface-1/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
            <i className="fa-solid fa-xmark text-base" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[68vh] overflow-y-auto custom-scrollbar">
          {esResultado ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  ['Creados', data.creados, 'text-ok'], ['Actualizados', data.actualizados, 'text-info'],
                  ['Omitidos', data.omitidos, 'text-warn'], ['Fallidos', data.fallidos, 'text-danger']
                ].map(([label, value, color]) => <div key={label} className="p-4 rounded-card border border-line bg-surface-2 dark:bg-surface-3/50 text-center"><p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p><p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-content-3">{label}</p></div>)}
              </div>
              <div className="rounded-card border border-line overflow-hidden">
                <div className="grid grid-cols-[70px_1fr_90px] gap-2 px-3 py-2 bg-surface-2 dark:bg-surface-3/50 text-[10px] font-bold uppercase text-content-3"><span>Fila</span><span>Rótulo · detalle</span><span>Resultado</span></div>
                <div className="max-h-64 overflow-y-auto divide-y divide-line">
                  {(data.resultados || []).slice(0, 200).map((row, index) => <div key={`${row.linea}-${index}`} className="grid grid-cols-[70px_1fr_90px] gap-2 px-3 py-2 text-xs"><span className="font-mono text-content-3">{row.linea}</span><span className="min-w-0"><b className="mr-1">{row.rotulo || '—'}</b><span className="text-content-3">{row.detalle}</span></span><span className={row.resultado === 'Fallido' || row.resultado === 'Error' ? 'text-danger font-semibold' : 'text-content-2'}>{row.resultado}</span></div>)}
                  {(data.resultados || []).length > 200 && <p className="p-3 text-center text-xs text-content-3">Se muestran 200 filas; el informe descargable incluye todas.</p>}
                </div>
              </div>
              <p className="text-xs text-content-3">Separador detectado: <b>{data.delimiter === '\t' ? 'tabulación' : data.delimiter || 'desconocido'}</b> · Codificación: <b>{data.encoding || 'UTF-8'}</b></p>
            </>
          ) : (
            <>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-content-3">
                <span>{(data.rows || []).length.toLocaleString('es-PY')} filas leídas</span>
                <span>Separador: <b>{data.delimiter === '\t' ? 'tabulación' : data.delimiter || '—'}</b></span>
                <span>Codificación: <b>{data.encoding || 'UTF-8'}</b></span>
              </div>
              <div className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-3">
                {[
                  ['Listos para agregar', validos.length, 'text-ok'],
                  ['Rótulos duplicados', duplicados.length, 'text-warn'],
                  ['Filas con errores', lineasError.length, 'text-danger']
                ].map(([label, value, color]) => <div key={label} className="p-3 rounded-card border border-line bg-surface-2 dark:bg-surface-3/50 text-center"><p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-content-3">{label}</p></div>)}
              </div>

              {Object.keys(data.columnasMapeadas || {}).length > 0 && <div className="text-xs text-content-3"><b className="text-content-2">Columnas detectadas:</b> {Object.entries(data.columnasMapeadas).map(([campo, columna]) => `${FIELD_LABELS[campo] || campo} ← ${columna}`).join(' · ')}</div>}
              {problemasEncabezado.length > 0 && <div className="rounded-card border border-rose-300 bg-danger-soft p-3 text-xs text-danger"><b>Corrige los encabezados del archivo:</b>{problemasEncabezado.map((issue, i) => <p key={i} className="mt-1">• {issue.motivo}</p>)}</div>}

              {duplicados.length > 0 && <section className="space-y-2"><h3 className="text-xs font-bold text-warn">Rótulos duplicados</h3><div className="rounded-card border border-amber-200 dark:border-amber-900/40 bg-warn-soft/40 p-3 max-h-28 overflow-y-auto">{duplicados.slice(0, 50).map((bien, idx) => <p key={`${bien.linea}-${idx}`} className="text-xs py-0.5"><b className="font-mono">Fila {bien.linea} · {bien.rotulo}</b><span className="text-content-3"> — {bien.motivo}</span></p>)}{duplicados.length > 50 && <p className="text-xs text-content-3">Y {duplicados.length - 50} más.</p>}</div></section>}

              {lineasError.length > 0 && <section className="space-y-2"><h3 className="text-xs font-bold text-danger">Filas para corregir o excluir</h3><div className="space-y-2 max-h-56 overflow-y-auto pr-1">{lineasError.slice(0, 200).map(([linea, issues]) => <div key={linea} className="rounded-card border border-rose-200 dark:border-rose-900/40 bg-danger-soft/30 p-3"><div className="mb-2 text-xs font-bold text-danger">Fila {linea}</div>{issues.map((issue, i) => {
                const editable = FIELD_LABELS[issue.campo];
                return <div key={`${issue.campo}-${i}`} className="flex flex-wrap items-center gap-2 py-1 text-xs"><span className="text-content-2">{issue.motivo}</span>{editable && <label className="flex items-center gap-2 ml-auto"><span className="text-content-3">Corregir {editable.toLowerCase()}</span><input value={correcciones[linea]?.[issue.campo] ?? issue.valor ?? ''} onChange={e => cambiarCorreccion(linea, issue.campo, e.target.value)} className="w-40 h-8 px-2 rounded-control border border-line bg-surface-1 text-content-1" /></label>}</div>;
              })}</div>)}{lineasError.length > 200 && <p className="text-center text-xs text-content-3">Se muestran 200 filas con errores.</p>}</div></section>}

              {validos.length > 0 && <section className="space-y-2"><h3 className="text-xs font-bold text-content-2">Vista previa de registros</h3><div className="rounded-card border border-line bg-surface-2 dark:bg-surface-3/40 p-3 max-h-32 overflow-y-auto">{validos.slice(0, 15).map((bien, i) => <p key={`${bien.linea}-${i}`} className="text-xs py-0.5"><span className="font-mono font-bold">Fila {bien.linea} · {bien.rotulo}</span><span className="text-content-3"> — {bien.descripcion}</span></p>)}{validos.length > 15 && <p className="text-center text-xs text-content-3">Y {validos.length - 15} registros más.</p>}</div></section>}

              {actualizables > 0 && <fieldset className="rounded-card border border-line p-3 space-y-2"><legend className="px-1 text-xs font-bold text-content-2">¿Cómo tratar rótulos ya existentes?</legend><label className="flex items-start gap-2 text-xs cursor-pointer"><input type="radio" checked={modo === 'agregar'} onChange={() => setModo('agregar')} /><span><b>Omitir duplicados</b><span className="block text-content-3">Solo agregar los registros nuevos.</span></span></label><label className="flex items-start gap-2 text-xs cursor-pointer"><input type="radio" checked={modo === 'actualizar'} onChange={() => setModo('actualizar')} /><span><b>Actualizar coincidencias ({actualizables})</b><span className="block text-content-3">Reemplaza los campos presentes en el CSV; conserva asignación, fotos y otros datos que no estén en sus columnas.</span></span></label></fieldset>}

              {pendientesDeCorregir > 0 && <label className="flex items-start gap-2 rounded-card border border-amber-200 dark:border-amber-900/40 bg-warn-soft/40 p-3 text-xs cursor-pointer"><input type="checkbox" checked={omitirErrores} onChange={e => setOmitirErrores(e.target.checked)} /><span><b>Importar registros válidos y excluir las filas problemáticas</b><span className="block text-content-3">Se listarán en el informe para corregirlas después.</span></span></label>}
            </>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 px-6 py-4 border-t border-line dark:border-zinc-800/80 shrink-0 z-10">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-control text-[13px] font-semibold text-content-2 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-1/10">{esResultado ? 'Cerrar' : 'Cancelar'}</button>
          {esResultado && data.fallidos > 0 && <button type="button" onClick={onRetryFailed} className="inline-flex items-center gap-2 h-10 px-4 rounded-control border border-line text-content-2 font-semibold text-[13px]"><i className="fa-solid fa-rotate-right" /> Reintentar fallidos ({data.fallidos})</button>}
          {esResultado ? <button type="button" onClick={onDownloadReport} className="inline-flex items-center gap-2 h-10 px-5 rounded-control bg-zinc-900 dark:bg-surface-1 text-white font-bold text-[13px]"><i className="fa-solid fa-download" /> Descargar informe CSV</button> : <button type="button" onClick={() => onConfirm({ modo, correcciones, omitirErrores })} disabled={bloqueo} className="inline-flex items-center gap-2 h-10 px-5 rounded-control bg-zinc-900 dark:bg-surface-1 text-white font-bold text-[13px] disabled:opacity-50">{pendientesDeCorregir && !omitirErrores ? 'Validar correcciones' : `Importar ${validos.length + (modo === 'actualizar' ? actualizables : 0)} registros`}</button>}
        </div>
      </div>
    </Dialogo>
  );
}
