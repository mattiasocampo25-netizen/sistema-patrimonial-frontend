import React, { useState } from 'react';
import { normalizeStr } from '../utils/helpers';
import FiltroCombo from '../components/FiltroCombo';
import { Card, PageHeader, Toolbar, Table, THead, TBody, TRow, TH, TD, Button, StatTile } from '../components/ui';
import { LIMITE_DB, LIMITE_STORAGE } from '../services/supabaseFreeTier';

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
  filtroAccionAud, setFiltroAccionAud, filtroUsuarioAud, setFiltroUsuarioAud, usuariosAud, desdeAud, setDesdeAud, hastaAud, setHastaAud, accionesUnicasAud, auditoriaList,
  actorAud, tonoAccionAud, detalleAudCorto, ultimoBackup, handleExportBackupGeneral
}) {
  const [eventoExpandido, setEventoExpandido] = useState(null);
  return (
    <div className="flex flex-col flex-1 space-y-6 pb-12">
      <Card className="p-0">
        <div className="p-5 sm:p-6">
          <PageHeader
            titulo={'Auditoría'}
            descripcion={'Trazabilidad, conciliación física y verificación por muestreo'}
            icono="fa-magnifying-glass-chart"
            contador={(
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20">
                Solo administradores
              </span>
            )}
          />
          <Toolbar className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
          <Button variante="subtle" tamano="md" icono="fa-rotate" onClick={() => fetchAuditoria(1)} title="Recargar libro de auditoría">
            {isLoadingAud ? 'Actualizando…' : 'Actualizar'}
          </Button>
          </div>
          </Toolbar>
        </div>
      </Card>

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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-4">
              {saludDatos.map(s => (
                  <div key={s.id} className="rounded-card border border-line/70 dark:border-white/10 px-3 py-3 text-center shadow-sm">
                      <p className="text-xl sm:text-2xl font-black tabular-nums text-content-1 dark:text-white">{s.count}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-content-3 mt-0.5 leading-tight">{s.label}</p>
                  </div>
              ))}
          </div>
          {saludDatos[0].detalle.length > 0 && (
              <div className="max-h-40 overflow-y-auto custom-scrollbar rounded-card border border-line/60 dark:border-white/10 divide-y divide-zinc-100 dark:divide-white/5">
                  {saludDatos[0].detalle.map(b => (
                      <button
                          key={b.id}
                          onClick={() => { clearAllFilters(); setSearchTerm(b.rotulo || ''); setSearchInput(b.rotulo || ''); setCurrentPage(1); setActiveTab('inventario'); }}
                          className="w-full flex items-center justify-between gap-2 px-3.5 py-2 text-xs hover:bg-surface-2 dark:hover:bg-surface-1/[0.04] transition-colors cursor-pointer"
                          title="Revisar en inventario"
                      >
                          <span className="font-mono font-bold text-content-1 dark:text-content-3 truncate">{b.rotulo}</span>
                          <span className="text-content-3 truncate">{b.descripcion}</span>
                      </button>
                  ))}
              </div>
          )}
          {saludDatos[1].detalle.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto custom-scrollbar rounded-card border border-violet-500/20 divide-y divide-zinc-100 dark:divide-white/5">
                  {saludDatos[1].detalle.map(f => (
                      <button
                          key={f.id}
                          onClick={() => { setSearchFuncionarioInput(f.nombre || ''); setCurrentPaginaFuncionarios(1); setActiveTab('funcionarios'); }}
                          className="w-full flex items-center justify-between gap-2 px-3.5 py-2 text-xs hover:bg-surface-2 dark:hover:bg-surface-1/[0.04] transition-colors cursor-pointer"
                          title="Revisar en el padrón"
                      >
                          <span className="font-bold text-content-1 dark:text-content-3 truncate">{f.nombre}</span>
                          <span className="text-content-3 tabular-nums truncate">CI {f.cedula} · {f.cargo}</span>
                      </button>
                  ))}
              </div>
          )}
      </div>

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

      <div className="bg-surface-1 dark:bg-surface-1/[0.04] rounded-panel border border-line/70 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-5 border-b border-line dark:border-white/10">
          <h3 className="text-sm font-bold text-content-1 dark:text-white flex items-center gap-2 mr-auto">
            <i className="fa-solid fa-book-open text-content-3"></i> Libro de auditoría
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums bg-surface-3 dark:bg-surface-1/10 text-content-3 dark:text-content-3">{totalAud} eventos</span>
          </h3>
          <div className="flex rounded-control bg-surface-3 dark:bg-surface-1/5 p-1 gap-1" role="tablist" aria-label="Alcance del libro">
            {[
              { id: 'dep', label: dependenciaActual },
              { id: 'todas', label: 'Todas' }
            ].map(o => (
              <button
                key={o.id}
                onClick={() => setAlcanceAud(o.id)}
                className={`h-8 px-3 rounded-lg text-[11px] font-bold transition-all cursor-pointer truncate max-w-[160px] ${alcanceAud === o.id ? 'bg-surface-1 dark:bg-surface-3 text-content-1 dark:text-white shadow-sm' : 'text-content-3 dark:text-content-3 hover:text-content-1 dark:hover:text-zinc-200'}`}
                title={o.id === 'dep' ? 'Solo eventos de esta dependencia' : 'Eventos de todas las dependencias'}
              >
                {o.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-content-3 text-xs pointer-events-none"></i>
            <input
              type="text" value={searchAud} onChange={(e) => setSearchAud(e.target.value)} placeholder="Buscar en el libro..."
              className="rounded-control border border-line dark:border-white/10 bg-surface-2 dark:bg-surface-1/5 h-10 pl-10 pr-3 text-[13px] font-medium text-content-1 dark:text-white placeholder:text-content-3 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 w-full sm:w-56"
            />
          </div>
          <FiltroCombo
            valor={filtroAccionAud}
            opciones={accionesUnicasAud}
            onElegir={setFiltroAccionAud}
            etiquetaTodos="Acción: Todas"
            titulo="Filtrar por acción"
            ancho="max-w-[200px]"
          />
          <FiltroCombo
            valor={filtroUsuarioAud}
            opciones={usuariosAud}
            onElegir={setFiltroUsuarioAud}
            etiquetaTodos="Usuario: Todos"
            titulo="Filtrar por usuario"
            ancho="max-w-[220px]"
          />
          <label className="flex min-h-10 items-center gap-2 rounded-control border border-line bg-surface-1 px-2.5 text-[10px] font-semibold text-content-3">
            Desde
            <input type="date" value={desdeAud} max={hastaAud || undefined} onChange={event => setDesdeAud(event.target.value)} aria-label="Auditoría desde la fecha" className="min-w-0 bg-transparent text-label text-content-1 outline-none" />
          </label>
          <label className="flex min-h-10 items-center gap-2 rounded-control border border-line bg-surface-1 px-2.5 text-[10px] font-semibold text-content-3">
            Hasta
            <input type="date" value={hastaAud} min={desdeAud || undefined} onChange={event => setHastaAud(event.target.value)} aria-label="Auditoría hasta la fecha" className="min-w-0 bg-transparent text-label text-content-1 outline-none" />
          </label>
          {(desdeAud || hastaAud) && <button type="button" onClick={() => { setDesdeAud(''); setHastaAud(''); }} className="min-h-10 rounded-control px-3 text-label font-bold text-content-3 hover:bg-surface-2 hover:text-content-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">Limpiar fechas</button>}
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <Table sinContenedor minWidth={false} className="w-full text-left border-collapse min-w-[720px]">
            <THead>
              <TRow className="text-[10px] sm:text-[11px] font-bold text-content-3 dark:text-content-3 uppercase tracking-[0.14em]">
                <TH className="py-3.5 pl-6 pr-4">Fecha</TH>
                <TH className="px-4 py-3.5">Usuario</TH>
                <TH className="px-4 py-3.5">Acción</TH>
                <TH className="px-4 py-3.5">Evento</TH>
                <TH className="py-3.5 pl-4 pr-6">Detalle</TH>
              </TRow>
            </THead>
            <TBody>
              {isLoadingAud ? (
                <TRow><TD colSpan="5" className="p-10 text-center text-xs font-semibold text-content-3">Cargando libro...</TD></TRow>
              ) : auditoriaList.length === 0 ? (
                <TRow><TD colSpan="5" className="p-10 text-center text-xs font-semibold text-content-3">Sin eventos para los filtros aplicados.</TD></TRow>
              ) : (
                auditoriaList.map(r => {
                  let cambios = null;
                  try {
                    const mensaje = typeof r.mensaje === 'string' ? JSON.parse(r.mensaje) : r.mensaje;
                    if (mensaje?.cambios?.anterior && mensaje?.cambios?.nuevo) cambios = mensaje.cambios;
                  } catch { /* evento histórico sin estructura de cambios */ }
                  const campos = cambios ? Object.keys(cambios.nuevo).filter(k => JSON.stringify(cambios.nuevo[k]) !== JSON.stringify(cambios.anterior[k])) : [];
                  const expandido = eventoExpandido === r.id && campos.length > 0;
                  return (
                  <React.Fragment key={r.id}>
                  <TRow className="hover:bg-surface-2/70 dark:hover:bg-surface-1/[0.03] transition-colors">
                    <TD className="py-3 pl-6 pr-4 align-top text-xs tabular-nums text-content-3 dark:text-content-3 whitespace-nowrap">
                      {r.fecha ? new Date(r.fecha).toLocaleString('es-PY', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                    </TD>
                    <TD className="px-4 py-3 align-top text-xs font-bold text-content-1 dark:text-content-3 whitespace-nowrap">{actorAud(r)}</TD>
                    <TD className="px-4 py-3 align-top">
                      <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${tonoAccionAud(r.accion)}`}>
                        {r.accion || 'OTROS'}
                      </span>
                    </TD>
                    <TD className="px-4 py-3 align-top text-xs font-bold text-content-1 dark:text-zinc-200">{r.titulo || '-'}</TD>
                    <TD className="py-3 pl-4 pr-6 align-top text-xs text-content-3 dark:text-content-3 max-w-[280px]">
                      <button type="button" onClick={() => setEventoExpandido(expandido ? null : r.id)} disabled={!campos.length} aria-expanded={expandido} className="max-w-full inline-flex items-center gap-2 text-left truncate disabled:cursor-default enabled:hover:text-brand-text">
                        <span className="truncate" title={detalleAudCorto(r)}>{detalleAudCorto(r)}</span>
                        {campos.length > 0 && <i className={`fa-solid ${expandido ? 'fa-chevron-up' : 'fa-chevron-down'} text-[9px] shrink-0`} aria-hidden="true"></i>}
                      </button>
                    </TD>
                  </TRow>
                  {expandido && (
                    <TRow className="bg-surface-2/60 dark:bg-surface-1/[0.04]">
                      <TD colSpan="5" className="px-6 py-4">
                        <div className="grid gap-2 sm:grid-cols-2">
                          {campos.map(campo => (
                            <div key={campo} className="rounded-control border border-line dark:border-white/10 bg-surface-1 dark:bg-surface-1/5 p-3">
                              <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-content-3">{campo}</p>
                              <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <p className="min-w-0"><span className="block font-bold text-content-3">Antes</span><span className="block break-words text-content-2 dark:text-content-3">{String(cambios.anterior[campo] ?? '—')}</span></p>
                                <p className="min-w-0"><span className="block font-bold text-content-3">Después</span><span className="block break-words text-content-1 dark:text-white">{String(cambios.nuevo[campo] ?? '—')}</span></p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TD>
                    </TRow>
                  )}
                  </React.Fragment>
                  );
                })
              )}
            </TBody>
          </Table>
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
    </div>
  );
}
