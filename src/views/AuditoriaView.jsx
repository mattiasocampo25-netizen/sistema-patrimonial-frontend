import { useState } from 'react';
import { normalizeStr } from '../utils/helpers';
import FiltroCombo from '../components/FiltroCombo';
import { Card, PageHeader, Button, StatTile } from '../components/ui';
import { LIMITE_DB, LIMITE_STORAGE } from '../services/supabaseFreeTier';
import { etiquetaAccionAuditoria, obtenerCambiosAuditoria, tituloEventoAuditoria, valorAuditoriaLegible } from '../utils/auditoriaPresentacion';

// Vista de auditoría -solo admin- (extraída de App.jsx, Fase 5).
export default function AuditoriaView({
  fetchAuditoria, isLoadingAud, kpisAud, evolucionValor, maxEvolucion, formatoCortoGs,
  clearAllFilters, setFiltroAnio, setFiltroMes, setActiveTab,
  saludDatos, usoDb, alertaDb, errorUsoDb, setSearchTerm, setSearchInput, setCurrentPage,
  setSearchFuncionarioInput, setCurrentPaginaFuncionarios,
  conteoUbicacion, setConteoUbicacion, bienes, dependenciaActual,
  ubicacionesUnicas, conteoCodigos, conteoInput, setConteoInput, agregarCodigoConteo,
  resultadoConteo, setScanParaConteo, setIsScannerOpen, setConteoCodigos,
  exportarConteoCSV, descargarActaConteoPDF, guardarActaConteo,
  muestraN, setMuestraN, muestraUbicacion, setMuestraUbicacion,
  muestra, verificadosMuestra, setVerificadosMuestra, generarMuestra,
  guardarActaMuestreo, descargarActaMuestreoPDF,
  totalAud, paginaAud, alcanceAud, setAlcanceAud, searchAud, setSearchAud,
  filtroAccionAud, setFiltroAccionAud, filtroUsuarioAud, setFiltroUsuarioAud, tipoEntidadAud, setTipoEntidadAud, campoAud, setCampoAud, usuariosAud, desdeAud, setDesdeAud, hastaAud, setHastaAud, accionesUnicasAud, auditoriaList,
  actorAud, tonoAccionAud, detalleAudCorto, ultimoBackup, handleExportBackupGeneral
}) {
  const [eventoExpandido, setEventoExpandido] = useState(null);
  const [seccionAuditoria, setSeccionAuditoria] = useState('actividad');
  const [hallazgoActivo, setHallazgoActivo] = useState('');
  const [filtrosGuardados, setFiltrosGuardados] = useState(() => { try { return JSON.parse(localStorage.getItem('auditoria_filtros_guardados') || 'null'); } catch { return null; } });
  const guardarFiltrosAuditoria = () => { const filtros = { searchAud, filtroAccionAud, filtroUsuarioAud, tipoEntidadAud, campoAud, desdeAud, hastaAud }; try { localStorage.setItem('auditoria_filtros_guardados', JSON.stringify(filtros)); setFiltrosGuardados(filtros); } catch {} };
  const aplicarFiltrosAuditoria = () => { if (!filtrosGuardados) return; setSearchAud(filtrosGuardados.searchAud || ''); setFiltroAccionAud(filtrosGuardados.filtroAccionAud || ''); setFiltroUsuarioAud(filtrosGuardados.filtroUsuarioAud || ''); setTipoEntidadAud(filtrosGuardados.tipoEntidadAud || ''); setCampoAud(filtrosGuardados.campoAud || ''); setDesdeAud(filtrosGuardados.desdeAud || ''); setHastaAud(filtrosGuardados.hastaAud || ''); };
  const exportarEventosCSV = () => {
    if (!auditoriaList.length) return;
    const filas = [['Fecha', 'Usuario', 'Acción', 'Registro', 'Detalle', 'Identificador'], ...auditoriaList.map(row => [row.fecha ? new Date(row.fecha).toLocaleString('es-PY') : '', actorAud(row), etiquetaAccionAuditoria(row.accion), tituloEventoAuditoria(row), detalleAudCorto(row), row.id])];
    const csv = '\uFEFF' + filas.map(fila => fila.map(valor => `"${String(valor ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const enlace = document.createElement('a'); enlace.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); enlace.download = `auditoria_pagina_${paginaAud}.csv`; enlace.click(); setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
  };
  const exportarEventosPDF = () => {
    if (!auditoriaList.length || !window.jspdf || typeof window.jspdf.jsPDF.API.autoTable !== 'function') return;
    const { jsPDF } = window.jspdf; const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.text('Historial de auditoría', 14, 15);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.text(`Dependencia: ${alcanceAud === 'todas' ? 'Todas' : 'Esta dependencia'} · Página ${paginaAud} · ${auditoriaList.length} eventos`, 14, 22);
    doc.autoTable({ startY: 28, head: [['Fecha', 'Usuario', 'Acción', 'Registro', 'Detalle']], body: auditoriaList.map(row => [row.fecha ? new Date(row.fecha).toLocaleString('es-PY') : 'Sin fecha', actorAud(row), etiquetaAccionAuditoria(row.accion), tituloEventoAuditoria(row), detalleAudCorto(row)]), styles: { font: 'helvetica', fontSize: 7, cellPadding: 2.2, overflow: 'linebreak' }, headStyles: { fillColor: [30, 64, 75] }, columnStyles: { 0: { cellWidth: 34 }, 1: { cellWidth: 28 }, 2: { cellWidth: 24 }, 3: { cellWidth: 38 } } });
    doc.save(`auditoria_pagina_${paginaAud}.pdf`);
  };
  const aplicarRangoRapido = (dias) => {
    const fin = new Date();
    const inicio = new Date(fin);
    inicio.setDate(fin.getDate() - dias + 1);
    const aFecha = fecha => `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
    setDesdeAud(aFecha(inicio));
    setHastaAud(aFecha(fin));
  };
  const descargarInformeSalud = () => {
    const filas = [['Tipo de revisión', 'Cantidad detectada', 'Identificador', 'Rótulo o nombre', 'Dependencia', 'Detalle']];
    saludDatos.forEach((grupo) => {
      if (!grupo.detalle.length) filas.push([grupo.label, grupo.count, '', '', '', 'Sin ejemplos disponibles']);
      grupo.detalle.forEach((item) => filas.push([
        grupo.label, grupo.count, item.id || '', item.rotulo || item.nombre || item.descripcion || '',
        item.dependencia || '', item.cedula ? `Documento ${item.cedula}` : item.funcionario || item.motivo || '',
      ]));
    });
    const csv = '\uFEFF' + filas.map((fila) => fila.map((valor) => `"${String(valor ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'revision_calidad_datos.csv'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const gruposEventos = auditoriaList.reduce((grupos, evento) => {
    const fecha = evento.fecha ? new Date(evento.fecha) : null;
    const clave = fecha && Number.isFinite(fecha.getTime()) ? fecha.toLocaleDateString('es-PY', { dateStyle: 'full' }) : 'Fecha no registrada';
    const ultimo = grupos[grupos.length - 1];
    if (ultimo?.clave === clave) ultimo.eventos.push(evento);
    else grupos.push({ clave, eventos: [evento] });
    return grupos;
  }, []);
  return (
    <div className="flex flex-col flex-1 space-y-6 pb-12">
      <Card className="p-5 sm:p-6">
      <PageHeader
        titulo="Auditoría"
        descripcion="Consulta quién hizo cada cambio y compara los valores anteriores con los nuevos."
        icono="fa-magnifying-glass-chart"
        contador={<span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-[10px] font-bold text-violet-700 dark:text-violet-300">Solo administradores</span>}
        acciones={<Button variante="secondary" tamano="md" icono="fa-rotate" onClick={() => fetchAuditoria(1)} title="Actualizar historial">{isLoadingAud ? 'Actualizando…' : 'Actualizar'}</Button>}
      />
      </Card>

      <nav className="grid grid-cols-3 gap-2 rounded-2xl border border-line bg-surface-1 p-2 shadow-sm" role="tablist" aria-label="Secciones de auditoría">
        {[
          { id: 'actividad', titulo: 'Actividad', descripcion: 'Historial de cambios', icono: 'fa-clock-rotate-left' },
          { id: 'calidad', titulo: 'Calidad de datos', descripcion: 'Alertas y recursos', icono: 'fa-shield-halved' },
          { id: 'conteo', titulo: 'Verificación física', descripcion: 'Conteo y muestreo', icono: 'fa-clipboard-check' },
        ].map(tab => (
          <button key={tab.id} type="button" role="tab" aria-selected={seccionAuditoria === tab.id} onClick={() => setSeccionAuditoria(tab.id)} className={`flex min-h-[66px] items-center gap-2 rounded-xl px-2.5 text-left transition sm:gap-3 sm:px-4 ${seccionAuditoria === tab.id ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-950' : 'text-content-2 hover:bg-surface-2'}`}>
            <span className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:flex ${seccionAuditoria === tab.id ? 'bg-white/15 dark:bg-slate-900/10' : 'bg-brand-soft text-brand-text'}`}><i className={`fa-solid ${tab.icono}`} aria-hidden="true" /></span>
            <span className="min-w-0"><span className="block truncate text-xs font-bold sm:text-sm">{tab.titulo}</span><span className={`mt-0.5 hidden truncate text-[10px] sm:block ${seccionAuditoria === tab.id ? 'text-white/70 dark:text-slate-600' : 'text-content-3'}`}>{tab.descripcion}</span></span>
          </button>
        ))}
      </nav>

      {seccionAuditoria === 'actividad' && <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-tour="aud-kpis">
        <StatTile etiqueta="Eventos (30 días)" valor={kpisAud.total} icono="fa-bolt" tono="brand" animado />
        <StatTile etiqueta="Altas registradas" valor={kpisAud.altas} icono="fa-plus" tono="ok" animado />
        <StatTile etiqueta="Modificaciones" valor={kpisAud.mods} icono="fa-pen-to-square" tono="neutral" animado />
        <StatTile etiqueta="Bajas y eliminaciones" valor={kpisAud.bajas} icono="fa-flag" tono="danger" animado />
      </div>

      <div className="bg-surface-1 dark:bg-surface-1/[0.04] rounded-panel border border-line/70 dark:border-white/10 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-1">
              <h3 className="text-sm font-bold text-content-1 dark:text-white flex items-center gap-2">
                  <i className="fa-solid fa-chart-line text-ok"></i> Evolución del valor patrimonial
              </h3>
              <span className="text-[11px] font-bold text-content-3 dark:text-content-3 uppercase tracking-wider">Últimos 12 meses</span>
          </div>
          <p className="text-xs text-content-3 dark:text-content-3 mb-5">Valor incorporado por mes · clic en una barra para filtrar el inventario.</p>
          <div className="flex items-end gap-1.5 sm:gap-2 h-40">
              {evolucionValor.map(e => (
                  <button
                      key={e.key}
                      onClick={() => { clearAllFilters(); setFiltroAnio(e.year); setFiltroMes(e.month); setActiveTab('inventario'); }}
                      title={`${e.etiqueta}: Gs. ${Number(e.valor).toLocaleString('es-PY')} — clic para filtrar`}
                      className="flex-1 h-full flex flex-col items-center justify-end gap-1.5 rounded-lg group/bar focus-visible:ring-2 focus-visible:ring-brand outline-none cursor-pointer"
                  >
                      <span className="text-[10px] font-bold tabular-nums text-content-3 opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
                          {e.valor > 0 ? formatoCortoGs(e.valor) : ''}
                      </span>
                      <span
                          className={`w-full rounded-t-lg transition-all ${e.valor > 0 ? 'bg-emerald-500 group-hover/bar:bg-emerald-400' : 'bg-surface-3 dark:bg-surface-1/10'}`}
                          style={{ height: e.valor > 0 ? `${Math.max(6, (e.valor / maxEvolucion) * 100)}%` : '4px' }}
                      ></span>
                      <span className="text-[9px] font-bold text-content-3 dark:text-content-3 uppercase">{e.etiqueta}</span>
                  </button>
              ))}
          </div>
      </div>
      </>}

      {seccionAuditoria === 'calidad' && <>
        <div className="flex flex-col gap-3 rounded-panel border border-line bg-surface-1 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-sm font-extrabold text-content-1">Revisión de integridad del inventario</h2><p className="mt-1 max-w-3xl text-xs leading-relaxed text-content-3">Revisión de solo lectura. Las alertas no modifican datos y algunas pueden ser válidas; abre cada grupo y verifica los registros antes de corregirlos.</p></div>
          <Button variante="secondary" tamano="sm" icono="fa-file-csv" onClick={descargarInformeSalud}>Descargar informe</Button>
        </div>
      <div className="bg-surface-1 dark:bg-surface-1/[0.04] rounded-panel border border-line/70 dark:border-white/10 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-1">
              <h3 className="text-sm font-bold text-content-1 dark:text-white flex items-center gap-2">
                  <i className="fa-solid fa-heart-pulse text-danger"></i> Salud de datos
              </h3>
              <span className="text-[11px] font-bold text-content-3 dark:text-content-3 uppercase tracking-wider">Solo lectura</span>
          </div>
          <p className="text-xs text-content-3 dark:text-content-3 mb-4">Detecta inconsistencias sin modificar nada. Toca un duplicado para revisarlo.</p>

          {/* Tamaños medidos en Postgres; no son estimaciones por cantidad de filas. */}
          {usoDb && (
            <div className="mb-4 rounded-card border border-line/70 dark:border-white/10 bg-surface-2/50 dark:bg-surface-1/[0.02] p-3.5 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-content-3 flex items-center gap-1.5"><i className="fa-solid fa-gauge-high text-[10px]" aria-hidden="true" /> Uso de recursos de Supabase</span>
                <span className="text-[10px] text-content-3">Medido {usoDb.medidoEn ? new Date(usoDb.medidoEn).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' }) : 'ahora'}</span>
              </div>
              {[
                { id: 'db', label: 'Base de datos', bytes: usoDb.bytesEstimados, limite: LIMITE_DB, pct: usoDb.pctUso, icono: 'fa-database' },
                { id: 'storage', label: 'Archivos y fotos', bytes: usoDb.storageBytes, limite: LIMITE_STORAGE, pct: usoDb.pctStorage, icono: 'fa-images' }
              ].map(recurso => (
                <div key={recurso.id} className="mb-3 last:mb-0">
                  <div className="mb-1 flex items-center justify-between gap-2 text-[10px]">
                    <span className="font-semibold text-content-2"><i className={`fa-solid ${recurso.icono} mr-1.5 text-content-3`} aria-hidden="true" />{recurso.label}</span>
                    <span className="font-bold tabular-nums text-content-2">{(recurso.bytes / 1024 / 1024).toFixed(1)} / {(recurso.limite / 1024 / 1024).toFixed(0)} MB · {recurso.pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-3/60 dark:bg-surface-1/10" role="progressbar" aria-label={`Uso de ${recurso.label}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round(recurso.pct))}>
                    <div className={`h-full rounded-full transition-all duration-700 ${recurso.pct >= 95 ? 'bg-rose-500' : recurso.pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, Math.max(recurso.bytes > 0 ? 1.5 : 0, recurso.pct))}%` }} />
                  </div>
                </div>
              ))}
              <p className="mt-2 text-[10px] text-content-3">{usoDb.objetosStorage.toLocaleString('es-PY')} archivos en Storage{alertaDb ? ` · ${alertaDb.texto}` : ' · Sin alertas de capacidad.'}</p>
            </div>
          )}
          {errorUsoDb && !usoDb && (
            <p role="status" className="mb-4 rounded-control border border-warn/25 bg-warn-soft/60 px-3 py-2 text-[11px] leading-relaxed text-content-2">
              <i className="fa-solid fa-circle-exclamation mr-1.5 text-warn" aria-hidden="true" />No se pudieron medir los recursos. Actualiza la página o pide al administrador que aplique la migración de métricas.
            </p>
          )}
          <section className="mb-4 flex flex-col gap-3 rounded-card border border-line/70 bg-surface-2/40 p-3.5 sm:flex-row sm:items-center sm:justify-between" aria-label="Respaldo del sistema">
            <div className="min-w-0">
              <p className="text-xs font-bold text-content-1"><i className="fa-solid fa-shield-halved mr-2 text-brand-text" aria-hidden="true" />Respaldo externo</p>
              <p className="mt-1 text-[10px] leading-relaxed text-content-3">
                {ultimoBackup ? `Último archivo descargado: ${new Date(ultimoBackup).toLocaleDateString('es-PY')}. Guarda una copia fuera de este dispositivo.` : 'No hay un respaldo reciente registrado. Descarga y guarda una copia en un lugar seguro.'}
                {' '}El plan Free no incluye copias automáticas descargables.
              </p>
            </div>
            <Button variante="secondary" tamano="sm" icono="fa-download" onClick={handleExportBackupGeneral} className="shrink-0">Crear respaldo</Button>
          </section>
          <p className="mb-4 rounded-control border border-info/20 bg-info-soft/50 px-3 py-2 text-[10px] leading-relaxed text-content-2">
            <i className="fa-solid fa-circle-info mr-1.5 text-info" aria-hidden="true" />Los proyectos Free pueden pausarse tras 7 días de poca actividad. Revisa el panel de uso de Supabase si el sistema deja de responder.
            {' '}<a href="https://supabase.com/docs/guides/deployment/going-into-prod" target="_blank" rel="noreferrer" className="font-bold text-brand-text underline underline-offset-2">Ver disponibilidad y límites</a>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 mb-4">
              {saludDatos.map(s => (
                  <button key={s.id} type="button" aria-pressed={hallazgoActivo === s.id} onClick={() => setHallazgoActivo(actual => actual === s.id ? '' : s.id)} className={`rounded-card border px-3 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${hallazgoActivo === s.id ? 'border-brand bg-brand-soft/60' : 'border-line/70 dark:border-white/10'}`}>
                      <span className="flex items-center justify-between gap-2"><i className={`fa-solid ${s.icon} text-sm text-content-3`} aria-hidden="true"/><span className={`text-xl sm:text-2xl font-black tabular-nums ${s.count ? 'text-content-1 dark:text-white' : 'text-content-3'}`}>{s.count.toLocaleString('es-PY')}</span></span>
                      <span className="mt-2 block text-[10px] font-bold uppercase tracking-wider text-content-3 leading-tight">{s.label}</span>
                      <span className="mt-1 block text-[10px] text-brand-text">{s.count ? 'Ver registros' : 'Sin hallazgos'} <i className="fa-solid fa-chevron-right ml-1" aria-hidden="true"/></span>
                  </button>
              ))}
          </div>
          {hallazgoActivo && (() => {
            const grupo = saludDatos.find((s) => s.id === hallazgoActivo);
            if (!grupo) return null;
            return <section className="mt-4 overflow-hidden rounded-card border border-line/70" aria-live="polite">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-2/50 px-3.5 py-3"><div><h3 className="text-xs font-bold text-content-1">{grupo.label}</h3><p className="mt-0.5 text-[10px] text-content-3">{grupo.count.toLocaleString('es-PY')} registros detectados · se muestran hasta {grupo.detalle.length}</p></div><button type="button" onClick={() => setHallazgoActivo('')} className="rounded-control px-2.5 py-1.5 text-xs font-semibold text-content-3 hover:bg-surface-2">Cerrar</button></div>
              {grupo.detalle.length ? <div className="max-h-72 divide-y divide-line/60 overflow-y-auto custom-scrollbar">{grupo.detalle.map((item, idx) => {
                const nombre = item.rotulo || item.nombre || item.descripcion || `Registro ${item.id || idx + 1}`;
                const descripcion = [item.dependencia, item.funcionario, item.cedula ? `CI ${item.cedula}` : '', item.motivo].filter(Boolean).join(' · ');
                const inspeccionar = () => {
                  if (grupo.entidad === 'funcionario') { setSearchFuncionarioInput(item.nombre || item.cedula || ''); setCurrentPaginaFuncionarios(1); setActiveTab('funcionarios'); }
                  else if (grupo.entidad === 'bien') { clearAllFilters(); setSearchTerm(item.rotulo || item.descripcion || ''); setSearchInput(item.rotulo || item.descripcion || ''); setCurrentPage(1); setActiveTab('inventario'); }
                };
                return <div key={`${item.id || nombre}-${idx}`} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                  <div className="min-w-0"><p className="truncate text-xs font-semibold text-content-1">{nombre}</p><p className="mt-0.5 truncate text-[10px] text-content-3">{descripcion || `Identificador: ${item.id || 'no disponible'}`}</p></div>
                  {grupo.entidad !== 'fc10' && grupo.entidad !== 'fc11' && <button type="button" onClick={inspeccionar} className="shrink-0 rounded-control border border-line px-2.5 py-1.5 text-[10px] font-bold text-brand-text hover:bg-brand-soft">Revisar</button>}
                </div>;
              })}</div> : <p className="px-3.5 py-5 text-center text-xs text-content-3">No se encontraron registros para esta revisión.</p>}
            </section>;
          })()}
      </div>
      </>}

      {seccionAuditoria === 'conteo' && <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface-1 dark:bg-surface-1/[0.04] rounded-panel border border-line/70 dark:border-white/10 p-5 sm:p-6 shadow-sm">
          <h3 className="text-sm font-bold text-content-1 dark:text-white flex items-center gap-2 mb-1">
            <i className="fa-solid fa-clipboard-check text-ok"></i> Conciliación física
          </h3>
          <p className="text-xs text-content-3 dark:text-content-3 mb-4">Escanea o escribe rótulos y compara contra el inventario activo del alcance elegido.</p>
          {conteoCodigos.length > 0 && (
            <p role="status" className="mb-3 flex items-center gap-2 text-[11px] font-semibold text-ok dark:text-emerald-400">
              <i className="fa-solid fa-cloud-arrow-down" aria-hidden="true"></i>
              Borrador guardado en este dispositivo · {conteoCodigos.length} códigos
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <FiltroCombo
              valor={conteoUbicacion}
              opciones={ubicacionesUnicas}
              onElegir={setConteoUbicacion}
              etiquetaTodos={`Toda la dependencia (${bienes.filter(b => normalizeStr(b.dependencia) === normalizeStr(dependenciaActual) && b.estadoConservacion !== 'De Baja').length})`}
              titulo="Alcance de la conciliación"
              ancho="max-w-[240px]"
            />
          </div>
          <div className="relative mb-4">
            <i className="fa-solid fa-barcode absolute left-4 top-1/2 -translate-y-1/2 text-content-3 text-sm pointer-events-none"></i>
            <input
              type="text"
              value={conteoInput}
              onChange={(e) => setConteoInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarCodigoConteo(conteoInput); } }}
              placeholder="Rótulo o código QR + Enter..."
              className="w-full rounded-control border border-line dark:border-white/10 bg-surface-2 dark:bg-surface-1/5 h-11 pl-11 pr-10 text-sm font-medium text-content-1 dark:text-white placeholder:text-content-3 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 transition-all"
            />
            {conteoInput && (
              <button onClick={() => agregarCodigoConteo(conteoInput)} title="Agregar" aria-label="Agregar" className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 dark:bg-surface-1 text-white dark:text-content-1 cursor-pointer">
                <i className="fa-solid fa-plus text-[11px]"></i>
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4 text-center">
            <div className="rounded-card bg-surface-2 dark:bg-surface-1/5 border border-line/60 dark:border-white/10 py-3">
              <p className="text-xl font-bold tabular-nums text-content-1 dark:text-white">{resultadoConteo.hallados}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-content-3">Hallados</p>
            </div>
            <div className="rounded-card bg-surface-2 dark:bg-surface-1/5 border border-line/60 dark:border-white/10 py-3">
              <p className="text-xl font-bold tabular-nums text-warn dark:text-amber-400">{resultadoConteo.faltantes.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-content-3">Faltantes</p>
            </div>
            <div className="rounded-card bg-surface-2 dark:bg-surface-1/5 border border-line/60 dark:border-white/10 py-3">
              <p className="text-xl font-bold tabular-nums text-danger dark:text-rose-400">{resultadoConteo.noRegistrados.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-content-3">No registrados</p>
            </div>
          </div>
          {resultadoConteo.faltantes.length > 0 && (
            <div className="mb-3 max-h-36 overflow-y-auto custom-scrollbar rounded-card border border-line/60 dark:border-white/10 divide-y divide-zinc-100 dark:divide-white/5">
              {resultadoConteo.faltantes.slice(0, 50).map(b => (
                <div key={b.id} className="flex items-center justify-between gap-2 px-3.5 py-2 text-xs">
                  <span className="font-mono font-bold text-content-1 dark:text-content-3 truncate">{b.rotulo}</span>
                  <span className="text-content-3 truncate">{b.descripcion}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setScanParaConteo(true); setIsScannerOpen(true); }} title="Escanear etiquetas con la cámara" className="inline-flex items-center gap-2 h-10 px-4 rounded-control text-[13px] font-bold bg-zinc-900 dark:bg-surface-1 text-white dark:text-content-1 hover:bg-zinc-700 dark:hover:bg-surface-3 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand outline-none">
              <i className="fa-solid fa-camera"></i> Escanear con cámara
            </button>
            <button onClick={() => { setConteoCodigos([]); setConteoInput(''); }} className="h-10 px-4 rounded-control text-[13px] font-semibold text-content-2 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-1/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand outline-none">Limpiar</button>
            <button onClick={exportarConteoCSV} disabled={conteoCodigos.length === 0} className="h-10 px-4 rounded-control text-[13px] font-semibold text-content-2 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-1/10 border border-transparent hover:border-line dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand outline-none disabled:opacity-40">Exportar CSV</button>
            <button onClick={descargarActaConteoPDF} disabled={conteoCodigos.length === 0} title="Descargar acta en PDF con estructura oficial" className="h-10 px-4 rounded-control text-[13px] font-semibold text-content-2 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-1/10 border border-transparent hover:border-line dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand outline-none disabled:opacity-40">
              <i className="fa-solid fa-file-pdf mr-1.5 text-danger"></i>Acta PDF
            </button>
            <button onClick={guardarActaConteo} disabled={conteoCodigos.length === 0} className="h-10 px-5 rounded-control text-[13px] font-bold bg-zinc-900 dark:bg-surface-1 text-white dark:text-content-1 hover:bg-zinc-700 dark:hover:bg-surface-3 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand outline-none disabled:opacity-40">Guardar acta</button>
          </div>
        </div>

        <div className="bg-surface-1 dark:bg-surface-1/[0.04] rounded-panel border border-line/70 dark:border-white/10 p-5 sm:p-6 shadow-sm">
          <h3 className="text-sm font-bold text-content-1 dark:text-white flex items-center gap-2 mb-1">
            <i className="fa-solid fa-shuffle text-violet-500"></i> Muestreo aleatorio
          </h3>
          <p className="text-xs text-content-3 dark:text-content-3 mb-4">Selección al azar para verificación física y acta del resultado.</p>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <input
              type="number" min="1" max="200"
              value={muestraN}
              onChange={(e) => setMuestraN(e.target.value)}
              title="Cantidad a muestrear"
              className="w-20 rounded-control border border-line dark:border-white/10 bg-surface-2 dark:bg-surface-1/5 h-10 px-3 text-sm font-bold tabular-nums text-content-1 dark:text-white outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10"
            />
            <FiltroCombo
              valor={muestraUbicacion}
              opciones={ubicacionesUnicas}
              onElegir={setMuestraUbicacion}
              etiquetaTodos="Toda la dependencia"
              titulo="Alcance del muestreo"
              ancho="max-w-[240px]"
            />
            <button onClick={generarMuestra} className="h-10 px-4 rounded-control text-[13px] font-bold bg-zinc-900 dark:bg-surface-1 text-white dark:text-content-1 hover:bg-zinc-700 dark:hover:bg-surface-3 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand outline-none">
              Generar muestra
            </button>
            {muestra.length > 0 && (
              <span className="text-xs font-bold tabular-nums text-content-3">{Object.values(verificadosMuestra).filter(Boolean).length}/{muestra.length} verificados</span>
            )}
          </div>
          {muestra.length > 0 && (
            <>
              <div className="h-1.5 w-full bg-surface-3 dark:bg-surface-1/10 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${muestra.length ? (Object.values(verificadosMuestra).filter(Boolean).length / muestra.length) * 100 : 0}%` }}></div>
              </div>
              <div className="max-h-48 overflow-y-auto custom-scrollbar rounded-card border border-line/60 dark:border-white/10 divide-y divide-zinc-100 dark:divide-white/5 mb-4">
                {muestra.map(b => (
                  <label key={b.id} className="flex items-center gap-3 px-3.5 py-2.5 cursor-pointer hover:bg-surface-2 dark:hover:bg-surface-1/[0.04]">
                    <input
                      type="checkbox"
                      checked={Boolean(verificadosMuestra[b.id])}
                      onChange={() => setVerificadosMuestra(prev => ({ ...prev, [b.id]: !prev[b.id] }))}
                      className="h-4 w-4 rounded accent-violet-600 cursor-pointer"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-xs font-bold text-content-1 dark:text-zinc-200 truncate">{b.rotulo}</span>
                      <span className="block text-[11px] text-content-3 truncate">{b.descripcion} · {b.ubicacion || 'Sin ubicación'}</span>
                    </span>
                  </label>
                ))}
              </div>
              <button onClick={guardarActaMuestreo} className="h-10 px-5 rounded-control text-[13px] font-bold bg-zinc-900 dark:bg-surface-1 text-white dark:text-content-1 hover:bg-zinc-700 dark:hover:bg-surface-3 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand outline-none">
                Guardar acta de muestreo
              </button>
              <button onClick={descargarActaMuestreoPDF} title="Descargar acta en PDF con estructura oficial" className="h-10 px-4 rounded-control text-[13px] font-semibold text-content-2 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-1/10 border border-transparent hover:border-line dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand outline-none">
                <i className="fa-solid fa-file-pdf mr-1.5 text-danger"></i>Acta PDF
              </button>
            </>
          )}
        </div>
      </div>
      </>}

      {seccionAuditoria === 'actividad' &&
      <div className="bg-surface-1 dark:bg-surface-1/[0.04] rounded-panel border border-line/70 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="border-b border-line p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="mr-auto">
              <h2 className="flex items-center gap-2 text-base font-black text-content-1"><i className="fa-solid fa-clock-rotate-left text-brand-text" aria-hidden="true" />Historial de actividad</h2>
              <p className="mt-1 text-xs text-content-3">Cada registro muestra quién hizo el cambio y qué dato pasó de antes a después.</p>
            </div>
            <span className="w-fit rounded-full bg-surface-2 px-3 py-1.5 text-xs font-bold tabular-nums text-content-2">{totalAud.toLocaleString('es-PY')} eventos</span>
            <div className="flex rounded-xl border border-line bg-surface-2 p-1" role="group" aria-label="Alcance de los registros">
              {[
                { id: 'dep', label: 'Esta dependencia' },
                { id: 'todas', label: 'Todas' }
              ].map(opcion => (
                <button key={opcion.id} type="button" onClick={() => setAlcanceAud(opcion.id)} aria-pressed={alcanceAud === opcion.id} className={`min-h-9 rounded-lg px-3 text-[11px] font-bold transition ${alcanceAud === opcion.id ? 'bg-surface-1 text-content-1 shadow-sm' : 'text-content-3 hover:text-content-1'}`}>
                  {opcion.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <label className="relative sm:col-span-2 xl:col-span-1">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-content-3" aria-hidden="true" />
              <input type="search" value={searchAud} onChange={event => setSearchAud(event.target.value)} placeholder="Buscar usuario, bien o cambio realizado" aria-label="Buscar en auditoría; incluye los valores anteriores y nuevos" className="h-11 w-full rounded-xl border border-line bg-surface-1 pl-10 pr-3 text-sm text-content-1 placeholder:text-content-3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15" />
            </label>
            <FiltroCombo valor={filtroAccionAud} opciones={accionesUnicasAud} onElegir={setFiltroAccionAud} etiquetaTodos="Todas las acciones" titulo="Filtrar por acción" ancho="w-full" />
            <FiltroCombo valor={tipoEntidadAud} opciones={[{ label: 'Bienes', value: 'BIEN' }, { label: 'Actas FC-10', value: 'FC10' }, { label: 'Traslados FC-11', value: 'FC11' }, { label: 'Funcionarios', value: 'FUNCIONARIO' }, { label: 'Dependencias', value: 'DEPENDENCIA' }, { label: 'Usuarios', value: 'USUARIO' }, { label: 'Solicitudes', value: 'SOLICITUD' }]} onElegir={setTipoEntidadAud} etiquetaTodos="Todos los registros" titulo="Filtrar por tipo de registro" ancho="w-full" />
            <FiltroCombo valor={campoAud} opciones={[{ label: 'Responsable', value: 'funcionario' }, { label: 'Ubicación', value: 'ubicacion' }, { label: 'Observaciones', value: 'observaciones' }, { label: 'Estado de conservación', value: 'estadoConservacion' }, { label: 'Valor unitario', value: 'valorUnitario' }, { label: 'Fotografías', value: 'fotos' }, { label: 'Dependencia', value: 'dependencia' }]} onElegir={setCampoAud} etiquetaTodos="Todos los campos" titulo="Filtrar por dato modificado" ancho="w-full" />
            <FiltroCombo valor={filtroUsuarioAud} opciones={usuariosAud} onElegir={setFiltroUsuarioAud} etiquetaTodos="Todos los usuarios" titulo="Filtrar por usuario" ancho="w-full" />
            <div className="grid grid-cols-2 gap-2">
              <label className="flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface-1 px-2.5 text-[10px] font-semibold text-content-3">Desde<input type="date" value={desdeAud} max={hastaAud || undefined} onChange={event => setDesdeAud(event.target.value)} aria-label="Desde la fecha" className="min-w-0 w-full bg-transparent text-xs text-content-1" /></label>
              <label className="flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface-1 px-2.5 text-[10px] font-semibold text-content-3">Hasta<input type="date" value={hastaAud} min={desdeAud || undefined} onChange={event => setHastaAud(event.target.value)} aria-label="Hasta la fecha" className="min-w-0 w-full bg-transparent text-xs text-content-1" /></label>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-content-3">Período rápido</span>
            {[7, 30, 90].map(dias => <button key={dias} type="button" onClick={() => aplicarRangoRapido(dias)} className="min-h-8 rounded-lg border border-line bg-surface-1 px-3 text-[11px] font-bold text-content-2 hover:border-brand/40 hover:text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">Últimos {dias} días</button>)}
            <div className="ml-auto flex flex-wrap gap-2">
              <button type="button" onClick={guardarFiltrosAuditoria} className="min-h-8 rounded-lg px-3 text-[11px] font-bold text-brand-text hover:bg-brand-soft">Guardar búsqueda</button>
              {filtrosGuardados && <button type="button" onClick={aplicarFiltrosAuditoria} className="min-h-8 rounded-lg px-3 text-[11px] font-bold text-brand-text hover:bg-brand-soft">Aplicar guardada</button>}
              <button type="button" onClick={exportarEventosCSV} disabled={!auditoriaList.length} className="min-h-8 rounded-lg border border-line px-3 text-[11px] font-bold text-content-2 hover:bg-surface-2 disabled:opacity-40" title="Descarga los eventos de la página visible">CSV de esta página</button>
              <button type="button" onClick={exportarEventosPDF} disabled={!auditoriaList.length} className="min-h-8 rounded-lg border border-line px-3 text-[11px] font-bold text-content-2 hover:bg-surface-2 disabled:opacity-40" title="Descarga los eventos de la página visible">PDF de esta página</button>
              {(desdeAud || hastaAud || filtroAccionAud || filtroUsuarioAud || searchAud || tipoEntidadAud || campoAud) && <button type="button" onClick={() => { setDesdeAud(''); setHastaAud(''); setFiltroAccionAud(''); setFiltroUsuarioAud(''); setSearchAud(''); setTipoEntidadAud(''); setCampoAud(''); }} className="min-h-8 rounded-lg px-3 text-[11px] font-bold text-content-3 hover:bg-surface-2 hover:text-content-1">Limpiar filtros</button>}
            </div>
          </div>
        </div>
        <div className="space-y-3 p-3 sm:p-5">
          {isLoadingAud ? (
            <div role="status" className="rounded-2xl border border-line bg-surface-2/50 px-4 py-12 text-center text-sm font-semibold text-content-3"><i className="fa-solid fa-circle-notch fa-spin mr-2" aria-hidden="true" />Cargando actividad…</div>
          ) : auditoriaList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line px-4 py-12 text-center"><i className="fa-solid fa-magnifying-glass-minus mb-3 text-2xl text-content-3" aria-hidden="true" /><p className="text-sm font-bold text-content-1">No encontramos eventos</p><p className="mt-1 text-xs text-content-3">Prueba con otro período o limpia los filtros.</p></div>
          ) : gruposEventos.map(grupo => <section key={grupo.clave} aria-label={`Eventos del ${grupo.clave}`}>
          <h3 className="sticky top-0 z-[1] mb-2 mt-2 flex items-center gap-2 rounded-lg bg-surface-2/90 px-3 py-2 text-[11px] font-extrabold capitalize text-content-2 backdrop-blur"><i className="fa-regular fa-calendar text-brand-text" aria-hidden="true" />{grupo.clave}<span className="ml-auto font-semibold text-content-3">{grupo.eventos.length} {grupo.eventos.length === 1 ? 'evento' : 'eventos'}</span></h3>
          <div className="space-y-3">{grupo.eventos.map(r => {
            const campos = obtenerCambiosAuditoria(r);
            const mostrarTodos = eventoExpandido === r.id;
            const camposVisibles = mostrarTodos ? campos : campos.slice(0, 3);
            const existeBien = bienes.some(b => String(b.id) === String(r.bienid));
            const fechaEvento = r.fecha ? new Date(r.fecha) : null;
            return (
              <article key={r.id} className="rounded-2xl border border-line bg-surface-1 p-4 shadow-sm transition-colors hover:border-line-strong sm:p-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line/70 pb-3">
                  <span className="inline-flex items-center gap-2 text-xs font-bold tabular-nums text-content-2"><i className="fa-regular fa-clock text-content-3" aria-hidden="true" />{fechaEvento ? fechaEvento.toLocaleString('es-PY', { dateStyle: 'medium', timeStyle: 'short' }) : 'Fecha no registrada'}</span>
                  <span className="hidden h-4 w-px bg-line sm:block" aria-hidden="true" />
                  <span className="inline-flex min-w-0 items-center gap-2 text-xs font-semibold text-content-2"><i className="fa-regular fa-user text-content-3" aria-hidden="true" /><span className="truncate">{actorAud(r)}</span></span>
                  <button type="button" onClick={() => navigator.clipboard?.writeText(String(r.id || '')).catch(() => {})} className="rounded-md px-2 py-1 text-[10px] font-semibold text-content-3 hover:bg-surface-2 hover:text-content-1" title={`Copiar identificador ${r.id}`}>ID · {String(r.id || '').slice(0, 8)} <i className="fa-regular fa-copy ml-1" aria-hidden="true" /></button>
                  <span className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${tonoAccionAud(r.accion)}`}><i className={`fa-solid ${String(r.accion).includes('ALTA') ? 'fa-plus' : String(r.accion).includes('BAJA') ? 'fa-trash-can' : 'fa-pen'}`} aria-hidden="true" />{etiquetaAccionAuditoria(r.accion)}</span>
                </div>

                <div className="flex flex-wrap items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-content-1">{tituloEventoAuditoria(r)}</h3>
                    <p className="mt-1 text-xs text-content-3">{detalleAudCorto(r)}</p>
                  </div>
                  {r.bienid && /BIEN/i.test(r.titulo || '') && (
                    <button type="button" onClick={() => {
                      if (!existeBien) return;
                      clearAllFilters();
                      setSearchTerm(String(r.bienid));
                      setSearchInput(String(r.bienid));
                      setCurrentPage(1);
                      setActiveTab('inventario');
                    }} disabled={!existeBien} className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-xl border border-line px-3 text-[11px] font-bold text-brand-text transition hover:border-brand/30 hover:bg-brand-soft disabled:cursor-not-allowed disabled:text-content-3" title={existeBien ? 'Ir al bien en Inventario' : 'El bien ya no está en Inventario'}>
                      <i className={`fa-solid ${existeBien ? 'fa-box-open' : 'fa-circle-exclamation'}`} aria-hidden="true" />{existeBien ? 'Ver bien' : 'Bien no disponible'}
                    </button>
                  )}
                </div>

                {campos.length > 0 && (
                  <section aria-label={`Cambios realizados: ${campos.length}`} className="rounded-xl bg-surface-2/60 p-3 sm:p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <h4 className="flex items-center gap-2 text-xs font-black text-content-1"><i className="fa-solid fa-code-compare text-brand-text" aria-hidden="true" />Qué cambió</h4>
                      <span className="text-[10px] font-semibold text-content-3">{campos.length} {campos.length === 1 ? 'dato modificado' : 'datos modificados'}</span>
                    </div>
                    <div className="space-y-2">
                      {camposVisibles.map(({ campo, etiqueta, antes, despues }) => (
                        <div key={campo} className="grid gap-2 rounded-xl border border-line/70 bg-surface-1 p-3 sm:grid-cols-[minmax(130px,0.7fr)_minmax(0,1fr)_28px_minmax(0,1fr)] sm:items-center">
                          <p className="text-xs font-bold text-content-1">{etiqueta}</p>
                          <div className="min-w-0 rounded-lg bg-danger-soft/70 px-3 py-2"><span className="mb-1 block text-[9px] font-extrabold uppercase tracking-wider text-danger">Antes</span><span className="block break-words text-xs text-content-2">{valorAuditoriaLegible(antes, campo)}</span></div>
                          <i className="fa-solid fa-arrow-right hidden text-center text-xs text-content-3 sm:block" aria-hidden="true" />
                          <div className="min-w-0 rounded-lg bg-ok-soft/70 px-3 py-2"><span className="mb-1 block text-[9px] font-extrabold uppercase tracking-wider text-ok">Después</span><span className="block break-words text-xs font-semibold text-content-1">{valorAuditoriaLegible(despues, campo)}</span></div>
                        </div>
                      ))}
                    </div>
                    {campos.length > 3 && <button type="button" onClick={() => setEventoExpandido(mostrarTodos ? null : r.id)} aria-expanded={mostrarTodos} className="mt-3 rounded-lg px-2 py-1 text-[11px] font-bold text-brand-text hover:bg-brand-soft">{mostrarTodos ? 'Mostrar menos' : `Ver los ${campos.length - 3} cambios restantes`}</button>}
                  </section>
                )}
              </article>
            );
          })}</div></section>)}
        </div>
        <div className="flex flex-wrap gap-2 justify-between items-center px-4 sm:px-6 py-3.5 border-t border-line dark:border-white/10">
          <span className="text-xs text-content-3 font-medium">
            Página <span className="font-bold text-content-1 dark:text-white tabular-nums">{totalAud === 0 ? 0 : paginaAud}</span> de <span className="font-bold text-content-1 dark:text-white tabular-nums">{Math.max(1, Math.ceil(totalAud / 50))}</span>
          </span>
          <div className="flex gap-2">
            <button
              disabled={paginaAud <= 1 || isLoadingAud}
              onClick={() => fetchAuditoria(paginaAud - 1)}
              className="rounded-control bg-surface-1 dark:bg-surface-1/5 px-4 py-2 text-xs font-bold text-content-1 dark:text-content-3 border border-line dark:border-white/10 hover:bg-surface-2 dark:hover:bg-surface-1/10 disabled:opacity-50 transition-all cursor-pointer"
            >
              Anterior
            </button>
            <button
              disabled={paginaAud >= Math.ceil(totalAud / 50) || isLoadingAud}
              onClick={() => fetchAuditoria(paginaAud + 1)}
              className="rounded-control bg-surface-1 dark:bg-surface-1/5 px-4 py-2 text-xs font-bold text-content-1 dark:text-content-3 border border-line dark:border-white/10 hover:bg-surface-2 dark:hover:bg-surface-1/10 disabled:opacity-50 transition-all cursor-pointer"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
      }
    </div>
  );
}
