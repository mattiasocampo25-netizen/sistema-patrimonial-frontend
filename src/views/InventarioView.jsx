import React, { useState } from 'react';
import { PENDIENTE_LABELS, ESTADOS_CONSERVACION } from '../constants/appConstants';
import FiltroCombo from '../components/FiltroCombo';
import CompararBienesModal from '../components/CompararBienesModal';
import KanbanBienes from '../components/KanbanBienes';
import SkeletonLoader from '../components/SkeletonLoader';
import ExportScheduleMenu from '../components/ExportScheduleMenu';
import { formatDateText, repairMojibake } from '../utils/helpers';
import { useIdioma } from '../utils/i18n';
import Dialogo from '../components/ui/Dialogo';
import { Card, EmptyState, PageHeader, Toolbar, Table, THead, TBody, TRow, TH, TD, Button, IconButton } from '../components/ui';

// Vista del inventario general (extraída de App.jsx, Fase 5).
// Es la vista más grande del sistema; recibe todo por props.
export default function InventarioView({
  hasFilters,
  filteredBienes,
  handleDownloadTemplateCSV,
  fileInputRef,
  handleExportInventarioCSV,
  handleExportInventarioExcel,
  ultimaExportacion,
  onRepetirExport,
  setIsBulkQR,
  setQrTargetBien,
  setIsQRModalOpen,
  openFC03Modal,
  setBienEditing,
  setIsBienModalOpen,
  searchRef,
  searchTerm,
  debouncedSearchTerm,
  setSearchTerm,
  setSearchInput,
  setCurrentPage,
  orden,
  setOrden,
  filtroFuncionario,
  setFiltroFuncionario,
  funcionariosUnicos,
  filtroUbicacion,
  setFiltroUbicacion,
  ubicacionesUnicas,
  filtroAnio,
  setFiltroAnio,
  aniosUnicos,
  filtroSubcuenta,
  setFiltroSubcuenta,
  subcuentasUnicas,
  filtroAnalitico1,
  setFiltroAnalitico1,
  analiticos1Unicos,
  filtroAnalitico2,
  setFiltroAnalitico2,
  analiticos2Unicos,
  filtroFC10,
  setFiltroFC10,
  filtroEstado,
  setFiltroEstado,
  vistasGuardadas,
  aplicarVista,
  eliminarVista,
  mostrarGuardarVista,
  setMostrarGuardarVista,
  nombreVista,
  setNombreVista,
  guardarVistaActual,
  clearAllFilters,
  filtroPendiente,
  setFiltroPendiente,
  itemsPaginados,
  fc10VigentePorBien,
  isAdmin,
  setItemToDelete,
  openFichaBien,
  openFC10Modal,
  openFC11Modal,
  renderPagination,
  seleccionados,
  toggleSeleccion,
  limpiarSeleccion,
  vistaInv,
  cambiarVistaInv,
  lastMutatedBienId,
  onBajaMasiva,
  onAsignarMasivo,
  onExportarSeleccion,
  onQRLoteSeleccion,
  onMoverEstado,
  onCopiarLink,
  onExportarProgramado,
  STYLES,
  isLoading,
  hasInventoryData = false
}) {
  // Densidad y columnas visibles (preferencia local por usuario)
  const [densidad, setDensidad] = useState(() => {
    try { return localStorage.getItem('inv_densidad') || 'comoda'; } catch { return 'comoda'; }
  });
  const compacto = densidad === 'compacta';
  const cambiarDensidad = () => {
    const v = compacto ? 'comoda' : 'compacta';
    setDensidad(v);
    try { localStorage.setItem('inv_densidad', v); } catch {}
  };
  const [cols, setCols] = useState(() => {
    try { return { fecha: true, cuenta: true, qr: true, ...JSON.parse(localStorage.getItem('inv_columnas') || '{}') }; }
    catch { return { fecha: true, cuenta: true, qr: true }; }
  });
  const alternarCol = (k) => {
    setCols(prev => {
      const n = { ...prev, [k]: !prev[k] };
      try { localStorage.setItem('inv_columnas', JSON.stringify(n)); } catch {}
      return n;
    });
  };
  const [menuCols, setMenuCols] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);
  const filtrosAvanzadosActivos = [filtroSubcuenta, filtroAnalitico1, filtroAnalitico2].filter(Boolean).length;
  const [recientes, setRecientes] = useState(() => { try { return JSON.parse(localStorage.getItem('inv_recientes') || '[]'); } catch { return []; } });
  const guardarReciente = (texto) => {
    const v = String(texto || '').trim();
    if (!v) return;
    setRecientes(prev => {
      const next = [v, ...prev.filter(x => x !== v)].slice(0, 6);
      try { localStorage.setItem('inv_recientes', JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const ORDENES = [
    { id: 'natural', label: 'Orden natural' },
    { id: 'rotulo-asc', label: 'Rótulo A–Z' },
    { id: 'rotulo-desc', label: 'Rótulo Z–A' },
    { id: 'valor-desc', label: 'Mayor valor' },
    { id: 'valor-asc', label: 'Menor valor' },
    { id: 'fecha-desc', label: 'Más recientes' },
    { id: 'fecha-asc', label: 'Más antiguos' }
  ];
  const ordenActual = !orden ? 'natural' : (orden.campo + '-' + orden.dir);
  const cambiarOrden = (id) => {
    if (id === 'natural') { setOrden(null); setCurrentPage(1); return; }
    const [campo, dir] = id.split('-');
    setOrden({ campo, dir });
    setCurrentPage(1);
  };
  // Orden rápido por campo (clic en encabezado o aquí): asc -> desc -> natural
  const ciclarOrden = (campo) => {
    if (!orden || orden.campo !== campo) { setOrden({ campo, dir: campo === 'valor' ? 'desc' : 'asc' }); }
    else if (orden.dir === 'asc') { setOrden({ campo, dir: 'desc' }); }
    else { setOrden(null); }
    setCurrentPage(1);
  };
  const flechaOrden = (campo) => (!orden || orden.campo !== campo) ? 'fa-sort' : (orden.dir === 'asc' ? 'fa-arrow-up-wide-short' : 'fa-arrow-down-wide-short');
  const [comparando, setComparando] = useState(false);
  const [confirmaBajaMasiva, setConfirmaBajaMasiva] = useState(false);
  const [mostrarAsignacionMasiva, setMostrarAsignacionMasiva] = useState(false);
  const [asignacionMasiva, setAsignacionMasiva] = useState({ funcionario: '__MANTENER__', ubicacion: '__MANTENER__' });
  const { t } = useIdioma();
  const bienesSeleccionados = itemsPaginados.filter(i => seleccionados.includes(i.id));
  const selFueraPagina = seleccionados.length - bienesSeleccionados.length;
  // Chips de filtros activos con limpieza individual
  const limpiarPag = (fn) => () => { fn(); setCurrentPage(1); };
  const chips = [];
  if (searchTerm) chips.push({ id: 'q', label: searchTerm, limpiar: () => { setSearchTerm(''); setSearchInput(''); setCurrentPage(1); } });
  if (filtroFuncionario) chips.push({ id: 'func', label: filtroFuncionario, limpiar: limpiarPag(() => setFiltroFuncionario('')) });
  if (filtroUbicacion) chips.push({ id: 'ubi', label: filtroUbicacion, limpiar: limpiarPag(() => setFiltroUbicacion('')) });
  if (filtroAnio) chips.push({ id: 'anio', label: 'Año ' + filtroAnio, limpiar: limpiarPag(() => setFiltroAnio('')) });
  if (filtroSubcuenta) chips.push({ id: 'sub', label: 'Sub. ' + filtroSubcuenta, limpiar: limpiarPag(() => setFiltroSubcuenta('')) });
  if (filtroAnalitico1) chips.push({ id: 'a1', label: 'An.1 ' + filtroAnalitico1, limpiar: limpiarPag(() => setFiltroAnalitico1('')) });
  if (filtroAnalitico2) chips.push({ id: 'a2', label: 'An.2 ' + filtroAnalitico2, limpiar: limpiarPag(() => setFiltroAnalitico2('')) });
  if (filtroFC10 !== 'ALL') chips.push({ id: 'fc10', label: 'FC-10: ' + (filtroFC10 === 'YES' ? 'Con acta' : 'Sin acta'), limpiar: limpiarPag(() => setFiltroFC10('ALL')) });
  if (filtroEstado !== 'ALL') chips.push({ id: 'est', label: filtroEstado, limpiar: limpiarPag(() => setFiltroEstado('ALL')) });
  if (filtroPendiente) chips.push({ id: 'pend', label: PENDIENTE_LABELS[filtroPendiente] || filtroPendiente, limpiar: limpiarPag(() => setFiltroPendiente('')) });
  if (orden) chips.push({ id: 'ord', label: 'Orden: ' + (ORDENES.find(o => o.id === ordenActual)?.label || ordenActual), limpiar: () => cambiarOrden('natural') });
  return (
<div className="inventory-view inventory-stagger space-y-6 pb-12 font-sans text-content-1 dark:text-content-1">

  {/* 1. ENCABEZADO Y ACCIONES PRINCIPALES */}
  <Card className="p-0">
    <div className="p-5 sm:p-6">
      <PageHeader
        titulo={'Inventario General'}
        descripcion={'Gestión integral e inventario consolidado de activos de la Universidad'}
        icono="fa-boxes-stacked"
      />
      {/* Antes el `contador` de la cabecera mostraba "Añadir Registro", que
          repetía el botón de la toolbar de abajo (línea ~262) y además no era
          un contador. El total de bienes ya se ve en la paginación
          ("Mostrando X de Y"), así que la cabecera queda solo con la
          identidad del módulo. */}
      <Toolbar className="mt-4">

      {/* Barra de Acciones Rápidas: secundarias con scroll, CTA primario siempre visible */}
      <div className="flex items-center gap-2 min-w-0">
      <div className="flex items-center gap-2 min-w-0 overflow-x-auto hide-scrollbar py-0.5 -my-0.5">
        <Button variante="subtle" icono="fa-file-excel" onClick={handleDownloadTemplateCSV} title="Descargar Plantilla CSV">
          {t('inv.plantilla')}
        </Button>

        <Button variante="subtle" icono="fa-file-import" onClick={() => fileInputRef.current?.click()} title="Importar archivo CSV">
          {t('inv.importar')}
        </Button>

        <Button variante="subtle" icono="fa-file-export" onClick={handleExportInventarioCSV} title="Exportar archivo CSV">
          {t('inv.exportar')}
        </Button>

        <Button variante="subtle" icono="fa-file-excel" onClick={handleExportInventarioExcel} title="Exportar Excel real (.xlsx)">
          {t('inv.excel')}
        </Button>

        {ultimaExportacion && (
          <Button variante="subtle" icono="fa-rotate-right" onClick={onRepetirExport} title={`Repetir última exportación (${ultimaExportacion.formato.toUpperCase()}) con los filtros actuales`}>
            {t('inv.repetir')}
          </Button>
        )}

        <Button variante="subtle" icono="fa-qrcode" onClick={() => { setIsBulkQR(true); setQrTargetBien(null); setIsQRModalOpen(true); }} title="Generar Lote Masivo de QRs">
          {t('inv.loteqr')}
        </Button>
      </div>

        <Button variante="subtle" icono="fa-print" onClick={openFC03Modal} title="Generar Reporte FC-03">
          FC-03
        </Button>

        <span className="hidden sm:block w-px h-5 bg-line shrink-0 mx-2"></span>

        <Button variante="primary" icono="fa-plus" onClick={() => { setBienEditing(null); setIsBienModalOpen(true); }} title={t('inv.anadir')}>
          {t('inv.anadir')}
        </Button>
      </div>

      </Toolbar>
    </div>
  </Card>

  {/* 2. PANEL DE FILTROS BaSQUEDA Y SELECCIÓN EN GRID */}
  <div className="bg-surface-1 p-4 sm:p-5 rounded-panel border border-line shadow-sm space-y-4">

    {/* Campo de Búsqueda Principal */}
    <div className="relative w-full">
      <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-content-3 text-sm pointer-events-none"></i>
      <input
        type="search"
        ref={searchRef}
        aria-label="Buscar bienes por rótulo, descripción, responsable o código"
        autoComplete="off"
        title="Busca por rótulo, descripción, funcionario, ubicación o código (atajo: /)"
        data-tour="inv-search"
        placeholder="Busca por rótulo, bien, funcionario o código… Ej.: 1045 silla"
        value={searchTerm}
        onChange={(e) => { setSearchTerm(e.target.value); setSearchInput(e.target.value); setCurrentPage(1); }}
        onFocus={() => setShowHistorial(true)}
        onBlur={() => setTimeout(() => setShowHistorial(false), 150)}
        onKeyDown={(e) => { if (e.key === 'Enter' && searchTerm.trim()) { guardarReciente(searchTerm); setShowHistorial(false); } }}
        className="w-full rounded-control border border-line bg-surface-1 py-3 pl-11 pr-11 text-sm font-medium text-content-1 placeholder:text-content-3 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-[border-color,box-shadow] duration-[var(--dur-fast)]"
      />
      {showHistorial && !searchTerm && recientes.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-30 rounded-card bg-surface-1 dark:bg-surface-1 border border-line dark:border-zinc-700 shadow-2xl py-1.5 animate-pop">
          <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-content-3">Búsquedas recientes</p>
          {recientes.map(r => (
            <button
              key={r} type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setSearchTerm(r); setSearchInput(r); setCurrentPage(1); setShowHistorial(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-surface-2 dark:hover:bg-surface-3/50 transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-clock-rotate-left text-[10px] text-content-3 shrink-0"></i>
              <span className="text-[13px] font-semibold text-content-1 dark:text-zinc-200 truncate">{r}</span>
            </button>
          ))}
          <button
            type="button" onMouseDown={(e) => e.preventDefault()}
            onClick={() => { setRecientes([]); try { localStorage.removeItem('inv_recientes'); } catch {} }}
            className="w-full px-4 py-1.5 text-left text-[11px] font-bold text-content-3 hover:text-danger transition-colors cursor-pointer"
          >
            Borrar historial
          </button>
        </div>
      )}
      {searchTerm && (
        <button
          type="button"
          onClick={() => { setSearchTerm(''); setSearchInput(''); setCurrentPage(1); searchRef?.current?.focus(); }}
          title="Limpiar búsqueda" aria-label="Limpiar búsqueda"
          className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-surface-3 dark:bg-surface-3/20 text-content-3 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-3/30 transition-all cursor-pointer"
        >
          <i className="fa-solid fa-xmark text-xs"></i>
        </button>
      )}
    </div>
    {searchTerm && (
      <p role="status" aria-live="polite" className="-mt-2 flex items-center gap-2 px-1 text-xs font-medium text-content-3">
        {searchTerm !== debouncedSearchTerm ? (
          <><i className="fa-solid fa-circle-notch fa-spin text-brand" aria-hidden="true" /> Buscando en el inventario…</>
        ) : (
          <>{filteredBienes.length.toLocaleString('es-PY')} {filteredBienes.length === 1 ? 'coincidencia en esta vista' : 'coincidencias en esta vista'}</>
        )}
      </p>
    )}

    {/* Filtros frecuentes primero; los contables quedan agrupados para reducir ruido. */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">

      {/* Responsables */}
      <FiltroCombo
        valor={filtroFuncionario}
        opciones={funcionariosUnicos}
        onElegir={(v) => { setFiltroFuncionario(v); setCurrentPage(1); }}
        etiquetaTodos="Responsables: Todos"
        titulo="Filtrar por responsable"
      />

      {/* Ubicaciones */}
      <FiltroCombo
        valor={filtroUbicacion}
        opciones={ubicacionesUnicas}
        onElegir={(v) => { setFiltroUbicacion(v); setCurrentPage(1); }}
        etiquetaTodos="Ubicación: Todas"
        titulo="Filtrar por ubicación"
      />

      {/* Año */}
      <FiltroCombo
        valor={filtroAnio}
        opciones={aniosUnicos}
        onElegir={(v) => { setFiltroAnio(v); setCurrentPage(1); }}
        etiquetaTodos="Año: Todos"
        titulo="Filtrar por año"
      />

      {/* Estado */}
      <FiltroCombo
        valor={filtroEstado === 'ALL' ? '' : filtroEstado}
        opciones={ESTADOS_CONSERVACION}
        onElegir={(v) => { setFiltroEstado(v || 'ALL'); setCurrentPage(1); }}
        etiquetaTodos="Estado: Todos"
        titulo="Filtrar por estado de conservación"
      />

      {/* FC-10 */}
      <FiltroCombo
        valor={filtroFC10 === 'ALL' ? '' : (filtroFC10 === 'YES' ? 'Con FC-10' : 'Sin FC-10')}
        opciones={['Con FC-10', 'Sin FC-10']}
        onElegir={(v) => { setFiltroFC10(v === 'Con FC-10' ? 'YES' : v === 'Sin FC-10' ? 'NO' : 'ALL'); setCurrentPage(1); }}
        etiquetaTodos="FC-10: Todos"
        titulo="Filtrar por FC-10"
      />

    </div>

    <div>
      <button
        type="button"
        aria-expanded={mostrarFiltrosAvanzados}
        onClick={() => setMostrarFiltrosAvanzados(v => !v)}
        className="inline-flex items-center gap-2 rounded-control px-2.5 py-2 text-xs font-bold text-content-2 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand motion"
      >
        <i className={`fa-solid fa-sliders text-brand-text`} aria-hidden="true"></i>
        Más filtros
        <span className="rounded-full bg-surface-3 px-1.5 py-0.5 text-[10px] tabular-nums text-content-3">{filtrosAvanzadosActivos ? `${filtrosAvanzadosActivos} activos · 3` : '3'}</span>
        <i className={`fa-solid fa-chevron-down text-[10px] transition-transform ${mostrarFiltrosAvanzados ? 'rotate-180' : ''}`} aria-hidden="true"></i>
      </button>
      {mostrarFiltrosAvanzados && (
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 animate-fade-in">
          <FiltroCombo valor={filtroSubcuenta} opciones={subcuentasUnicas} onElegir={(v) => { setFiltroSubcuenta(v); setCurrentPage(1); }} etiquetaTodos="Subcuenta: Todas" titulo="Filtrar por subcuenta" />
          <FiltroCombo valor={filtroAnalitico1} opciones={analiticos1Unicos} onElegir={(v) => { setFiltroAnalitico1(v); setCurrentPage(1); }} etiquetaTodos="Analítico 1: Todos" titulo="Filtrar por analítico 1" />
          <FiltroCombo valor={filtroAnalitico2} opciones={analiticos2Unicos} onElegir={(v) => { setFiltroAnalitico2(v); setCurrentPage(1); }} etiquetaTodos="Analítico 2: Todos" titulo="Filtrar por analítico 2" />
        </div>
      )}
    </div>

    {/* Vistas guardadas + Restablecer */}
    <div className="flex flex-wrap items-center gap-2 pt-1">
      {vistasGuardadas.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mr-auto">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-content-3 dark:text-content-3">Vistas:</span>
          {vistasGuardadas.map(v => (
            <span key={v.nombre} className="inline-flex items-center gap-1 pl-3 pr-1.5 py-1 rounded-full text-xs font-semibold bg-surface-3 dark:bg-surface-3/20 text-content-2 dark:text-content-3 border border-line dark:border-zinc-700/30">
              <button onClick={() => aplicarVista(v)} title={`Aplicar vista "${v.nombre}"`} className="hover:text-content-1 dark:hover:text-white transition-colors cursor-pointer">
                {v.nombre}
              </button>
              <button onClick={() => eliminarVista(v.nombre)} title="Eliminar vista" aria-label="Eliminar vista" className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-surface-3 dark:hover:bg-surface-3/30 text-content-3 transition-colors cursor-pointer">
                <i className="fa-solid fa-xmark text-[9px]"></i>
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 ml-auto">
        {hasFilters && !mostrarGuardarVista && (
          <button
            onClick={() => setMostrarGuardarVista(true)}
            className="text-xs font-semibold text-content-3 hover:text-content-1 dark:text-content-3 dark:hover:text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Guardar los filtros actuales como vista"
          >
            <i className="fa-solid fa-bookmark text-xs"></i> Guardar vista
          </button>
        )}
        {mostrarGuardarVista && (
          <span className="flex items-center gap-1.5">
            <input
              type="text"
              value={nombreVista}
              onChange={(e) => setNombreVista(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') guardarVistaActual(); if (e.key === 'Escape') setMostrarGuardarVista(false); }}
              placeholder="Nombre de la vista..."
              autoFocus
              className="h-8 w-40 rounded-control border border-line dark:border-zinc-700/30 bg-surface-1 dark:bg-surface-3/50 px-3 text-xs font-medium text-content-1 dark:text-white placeholder:text-content-3 outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
            />
            <button onClick={guardarVistaActual} title="Guardar" aria-label="Guardar" className="flex h-8 w-8 items-center justify-center rounded-control bg-zinc-900 dark:bg-surface-1 text-white dark:text-zinc-100 cursor-pointer">
              <i className="fa-solid fa-check text-[11px]"></i>
            </button>
          </span>
        )}
        {hasFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs font-semibold text-danger hover:text-danger dark:text-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-xs"></i> Restablecer filtros
          </button>
        )}
      </div>
    </div>

  </div>

  {/* 3. TABLA Y LISTADO DE BIENES CON MATRIZ COMPLETA DE ACCIONES */}
  {/* Chips de filtros + controles de vista */}
    <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
          {chips.length === 0 && (
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-content-3 dark:text-content-2">Sin filtros</span>
          )}
          {chips.map(c => (
            <button
              key={c.id}
              onClick={c.limpiar}
              title={'Quitar filtro: ' + c.label}
              className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-xs font-bold bg-brand-soft text-brand-text border border-brand/20 hover:border-brand/40 hover:shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-[var(--dur-fast)] cursor-pointer focus-visible:ring-2 focus-visible:ring-brand outline-none animate-pop active:scale-[0.97]"
            >
              <span className="max-w-[220px] truncate">{c.label}</span>
              <i className="fa-solid fa-xmark text-[10px]"></i>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center rounded-control border border-line dark:border-zinc-700/30 overflow-hidden" title="Vista de resultados">
            <button
              onClick={() => cambiarVistaInv('tabla')} title="Vista tabla" aria-label="Vista tabla"
              aria-pressed={vistaInv === 'tabla'}
              className={`flex h-9 w-9 items-center justify-center transition-[color,background-color,transform] duration-[var(--dur-fast)] cursor-pointer ${vistaInv === 'tabla' ? 'bg-brand text-content-inverse shadow-sm' : 'text-content-3 hover:bg-surface-3 hover:text-content-1'}`}
            >
              <i className="fa-solid fa-table-list text-xs"></i>
            </button>
            <button
              onClick={() => cambiarVistaInv('tarjetas')} title="Vista compacta de tarjetas" aria-label="Vista compacta de tarjetas"
              aria-pressed={vistaInv === 'tarjetas'}
              className={`flex h-9 w-9 items-center justify-center transition-[color,background-color,transform] duration-[var(--dur-fast)] cursor-pointer ${vistaInv === 'tarjetas' ? 'bg-brand text-content-inverse shadow-sm' : 'text-content-3 hover:bg-surface-3 hover:text-content-1'}`}
            >
              <i className="fa-solid fa-grip text-xs"></i>
            </button>
            <button
              onClick={() => cambiarVistaInv('kanban')} title="Vista tablero (Kanban por estado)" aria-label="Vista tablero Kanban"
              aria-pressed={vistaInv === 'kanban'}
              className={`flex h-9 w-9 items-center justify-center transition-[color,background-color,transform] duration-[var(--dur-fast)] cursor-pointer ${vistaInv === 'kanban' ? 'bg-brand text-content-inverse shadow-sm' : 'text-content-3 hover:bg-surface-3 hover:text-content-1'}`}
            >
              <i className="fa-solid fa-table-columns text-xs"></i>
            </button>
            <button
              onClick={() => cambiarVistaInv('galeria')} title="Vista detallada de fichas" aria-label="Vista detallada de fichas"
              aria-pressed={vistaInv === 'galeria'}
              className={`flex h-9 w-9 items-center justify-center transition-[color,background-color,transform] duration-[var(--dur-fast)] cursor-pointer ${vistaInv === 'galeria' ? 'bg-brand text-content-inverse shadow-sm' : 'text-content-3 hover:bg-surface-3 hover:text-content-1'}`}
            >
              <i className="fa-solid fa-address-card text-xs"></i>
            </button>
          </div>
          {hasFilters && onCopiarLink && (
            <button
              onClick={onCopiarLink}
              title="Copiar un link con estos filtros aplicados"
              className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-control border border-line dark:border-zinc-700/30 text-[11px] font-bold text-content-3 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-3/20 hover:text-content-1 dark:hover:text-zinc-200 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <i className="fa-solid fa-link text-[10px]"></i>
              <span className="hidden sm:inline">Copiar link</span>
            </button>
          )}
          <ExportScheduleMenu onEjecutarAhora={onExportarProgramado} />
          <div className="hidden xl:flex items-center gap-1 shrink-0" title="Orden rápido">
            {[['rotulo', 'Rótulo'], ['valor', 'Valor'], ['fecha', 'Fecha']].map(([campo, label]) => (
              <button
                key={campo} onClick={() => ciclarOrden(campo)} title={`Ordenar por ${label}`}
              aria-pressed={orden?.campo === campo}
              className={`inline-flex items-center gap-1.5 h-9 px-2.5 rounded-control text-[11px] font-bold transition-[color,background-color,transform] duration-[var(--dur-fast)] cursor-pointer ${orden?.campo === campo ? 'bg-brand text-content-inverse shadow-sm' : 'text-content-3 hover:bg-surface-3 hover:text-content-1'}`}
              >
                {label} <i className={`fa-solid ${flechaOrden(campo)} text-[9px]`}></i>
              </button>
            ))}
          </div>
          <FiltroCombo
            valor={ORDENES.find(o => o.id === ordenActual)?.label || ''}
            opciones={ORDENES.map(o => o.label)}
            onElegir={(v) => cambiarOrden(ORDENES.find(o => o.label === v)?.id || 'natural')}
            etiquetaTodos="Orden"
            titulo="Orden de la tabla"
            ancho="w-[190px]"
          />
          <button
            onClick={cambiarDensidad}
            title={compacto ? 'Vista cómoda' : 'Vista compacta'}
            className="flex h-9 w-9 items-center justify-center rounded-control border border-line dark:border-zinc-700/30 text-content-3 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-3/20 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand outline-none"
          >
            <i className={`fa-solid text-xs ${compacto ? 'fa-arrows-up-down' : 'fa-arrows-up-down-left-right'}`} aria-hidden="true"></i>
          </button>
          <div className="relative">
            <button
              onClick={() => setMenuCols(v => !v)}
              title="Columnas visibles" aria-label="Columnas visibles"
              className="flex h-9 w-9 items-center justify-center rounded-control border border-line dark:border-zinc-700/30 text-content-3 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-3/20 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand outline-none"
            >
              <i className="fa-solid fa-table-columns text-xs"></i>
            </button>
            {menuCols && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuCols(false)}></div>
                <div className="absolute right-0 z-50 mt-1.5 w-48 rounded-card border border-line dark:border-zinc-700 bg-surface-1 dark:bg-surface-1 shadow-xl p-1.5 animate-pop">
                  {[['fecha', 'Fecha de compra'], ['cuenta', 'Cuenta'], ['qr', 'Estado / QR']].map(([k, label]) => (
                    <button
                      key={k}
                      onClick={() => alternarCol(k)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-control text-xs font-semibold text-content-1 dark:text-zinc-200 hover:bg-surface-3 dark:hover:bg-surface-3/20 transition-colors cursor-pointer"
                    >
                      <span className={'flex h-4 w-4 items-center justify-center rounded border' + (cols[k] ? 'bg-brand border-brand text-content-inverse' : 'border-line-strong dark:border-zinc-600 text-transparent')}>
                        <i className="fa-solid fa-check text-[9px]"></i>
                      </span>
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
                    {/* Barra de acciones en lote */}
                    {seleccionados.length > 0 && (
                      <div className="inventory-selection-bar flex flex-wrap items-center gap-2 px-4 sm:px-5 py-3 rounded-card text-white shadow-md animate-pop">
                        <span className="text-[13px] font-bold tabular-nums">
                          {seleccionados.length} seleccionado{seleccionados.length === 1 ? '' : 's'}{selFueraPagina > 0 ? ` (${selFueraPagina} en otras páginas)` : ''}
                        </span>
                        <span className="flex-1"></span>
                        <button onClick={() => onQRLoteSeleccion && onQRLoteSeleccion()} title="Generar ZIP de etiquetas de la selección" className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-control text-xs font-bold bg-surface-1/15 dark:bg-surface-1/10 hover:bg-surface-1/25 dark:hover:bg-surface-2/20 transition-all cursor-pointer">
                          <i className="fa-solid fa-qrcode text-[11px]"></i> QRs
                        </button>
                        <button onClick={() => setMostrarAsignacionMasiva(true)} title="Asignar responsable o ubicación a los bienes seleccionados" className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-control text-xs font-bold bg-surface-1/15 dark:bg-surface-1/10 hover:bg-surface-1/25 dark:hover:bg-surface-2/20 transition-all cursor-pointer">
                          <i className="fa-solid fa-user-gear text-[11px]"></i> Asignar
                        </button>
                        <button onClick={() => onExportarSeleccion?.('csv')} title="Exportar bienes seleccionados a CSV" className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-control text-xs font-bold bg-surface-1/15 dark:bg-surface-1/10 hover:bg-surface-1/25 dark:hover:bg-surface-2/20 transition-all cursor-pointer">
                          <i className="fa-solid fa-file-csv text-[11px]"></i> Exportar
                        </button>
                        <button onClick={() => setComparando(true)} disabled={seleccionados.length < 2 || seleccionados.length > 3} title="Comparar 2 o 3 bienes lado a lado" className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-control text-xs font-bold bg-surface-1/15 dark:bg-surface-1/10 hover:bg-surface-1/25 dark:hover:bg-surface-2/20 transition-all cursor-pointer disabled:opacity-40">
                          <i className="fa-solid fa-columns-compare text-[11px]"></i> Comparar
                        </button>
                        <button onClick={() => setConfirmaBajaMasiva(true)} title={isAdmin ? 'Dar de baja la selección' : 'Solicitar baja de la selección'} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-control text-xs font-bold bg-rose-500/90 hover:bg-rose-500 text-white transition-all cursor-pointer">
                          <i className="fa-solid fa-trash-can text-[11px]"></i> Baja
                        </button>
                        <button onClick={limpiarSeleccion} title="Limpiar selección" aria-label="Limpiar selección" className="flex h-9 w-9 items-center justify-center rounded-control hover:bg-surface-1/15 dark:hover:bg-surface-2/10 transition-all cursor-pointer">
                          <i className="fa-solid fa-xmark text-xs"></i>
                        </button>
                      </div>
                    )}
                  {isLoading && !hasInventoryData ? (
                    /* Durante la carga inicial se muestra el esqueleto en vez del
                       estado vacío: "Todavía no hay bienes cargados" era falso y
                       alarmaba al usuario mientras los datos aún no llegaban. */
                    <SkeletonLoader />
                  ) : (
                  <div className="bg-surface-1 dark:bg-surface-1/40 border border-line/70 dark:border-zinc-700/30 rounded-panel shadow-sm overflow-hidden" data-tour="inv-table">
                    {vistaInv === 'galeria' ? (
                    <div className="p-4 sm:p-6">
                      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                        <div>
                          <h2 className="text-title font-bold text-content-1">Fichas de bienes</h2>
                          <p className="mt-1 text-body text-content-3">Cada ficha reúne responsable, ubicación, estado y accesos frecuentes.</p>
                        </div>
                        <span className="text-label font-semibold text-content-3">{filteredBienes.length.toLocaleString('es-PY')} bienes en esta vista</span>
                      </div>
                      {itemsPaginados.length ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                          {itemsPaginados.map(item => {
                            const estado = (item.estadoConservacion || 'Regular').toLowerCase();
                            const tonoEstado = estado.includes('muy bueno') || estado.includes('excelente')
                              ? 'bg-ok-soft text-ok border-ok/25'
                              : estado.includes('bueno') ? 'bg-info-soft text-info border-info/25' : 'bg-warn-soft text-warn border-warn/25';
                            return (
                              <article key={item.id} className={`group rounded-panel border bg-surface-1 p-4 shadow-card transition-[border-color,box-shadow,transform] duration-[var(--dur-base)] hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-panel ${lastMutatedBienId === item.id ? 'row-flash border-brand/50' : 'border-line'}`}>
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex min-w-0 items-start gap-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-brand-soft text-brand-text"><i className="fa-solid fa-box" aria-hidden="true" /></span>
                                    <div className="min-w-0">
                                      <span className="inline-flex max-w-full truncate rounded-md bg-surface-2 px-2 py-1 font-mono text-label font-bold text-content-2">{item.rotulo || 'Sin rótulo'}</span>
                                      <h3 className="mt-2 line-clamp-2 text-body font-bold leading-snug text-content-1" title={repairMojibake(item.descripcion)}>{repairMojibake(item.descripcion) || 'Sin descripción'}</h3>
                                    </div>
                                  </div>
                                  <input type="checkbox" checked={seleccionados.includes(item.id)} onChange={() => toggleSeleccion(item.id)} title="Seleccionar bien" aria-label={`Seleccionar ${item.rotulo || item.descripcion}`} className="mt-1 h-4 w-4 shrink-0 rounded border-line-strong text-brand-text cursor-pointer" />
                                </div>
                                <div className="mt-4 grid grid-cols-1 gap-2 rounded-control bg-surface-2 p-3">
                                  <div className="flex min-w-0 items-start gap-2 text-body"><i className="fa-solid fa-user-check mt-0.5 w-4 shrink-0 text-ok" aria-hidden="true" /><span className="min-w-0"><span className="block text-label font-semibold uppercase tracking-wide text-content-3">Responsable</span><span className="block truncate font-semibold text-content-1">{item.funcionario || 'Sin asignar'}</span></span></div>
                                  <div className="flex min-w-0 items-start gap-2 text-body"><i className="fa-solid fa-location-dot mt-0.5 w-4 shrink-0 text-danger" aria-hidden="true" /><span className="min-w-0"><span className="block text-label font-semibold uppercase tracking-wide text-content-3">Ubicación</span><span className="block truncate font-semibold text-content-1">{item.ubicacion || 'Sin ubicación'}</span></span></div>
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  <span className={`rounded-pill border px-2.5 py-1 text-label font-bold ${tonoEstado}`}>{item.estadoConservacion || 'Regular'}</span>
                                  <span className={`rounded-pill border px-2.5 py-1 text-label font-bold ${item.hasQR ? 'border-brand/20 bg-brand-soft text-brand-text' : 'border-line bg-surface-2 text-content-3'}`}><i className="fa-solid fa-qrcode mr-1" aria-hidden="true" />{item.hasQR ? 'Con QR' : 'Sin QR'}</span>
                                  <span className={`rounded-pill border px-2.5 py-1 text-label font-bold ${fc10VigentePorBien.has(item.id) ? 'border-ok/25 bg-ok-soft text-ok' : 'border-line bg-surface-2 text-content-3'}`}>{fc10VigentePorBien.has(item.id) ? 'Con FC-10' : 'Sin FC-10'}</span>
                                </div>
                                <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
                                  <Button variante="primary" tamano="sm" icono="fa-arrow-up-right-from-square" onClick={() => openFichaBien(item)} title="Abrir ficha y trazabilidad">
                                    Ver ficha
                                  </Button>
                                  <IconButton titulo="Ver o generar QR" icono="fa-qrcode" variante="ghost" tamano="sm" onClick={() => { setQrTargetBien(item); setIsBulkQR(false); setIsQRModalOpen(true); }} />
                                  <IconButton titulo="Crear o gestionar acta FC-10" icono="fa-file-signature" variante="ghost" tamano="sm" onClick={() => openFC10Modal(item)} />
                                  <IconButton titulo="Registrar traslado FC-11" icono="fa-truck-fast" variante="ghost" tamano="sm" onClick={() => openFC11Modal(item)} />
                                  <IconButton titulo="Editar bien" icono="fa-pen-to-square" variante="ghost" tamano="sm" onClick={() => { setBienEditing(item); setIsBienModalOpen(true); }} />
                                  <IconButton titulo={isAdmin ? 'Dar de baja el bien' : 'Solicitar baja del bien'} icono="fa-trash-can" variante="danger" tamano="sm" onClick={() => setItemToDelete({ type: isAdmin ? 'bien' : 'requestBaja', id: item.id, item })} />
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      ) : <div className="py-8"><EmptyState icon="fa-filter-circle-xmark" titulo="No hay bienes para mostrar" descripcion="Prueba quitando algún filtro o cambia las palabras de búsqueda." accionLabel="Restablecer filtros" onAccion={clearAllFilters} /></div>}
                    </div>
                    ) : vistaInv === 'tarjetas' ? (
                    <div className="p-4 sm:p-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {itemsPaginados.map((item) => (
                          <div key={item.id} className={`inventory-item-card relative rounded-card border p-4 shadow-xs bg-surface-1 ${lastMutatedBienId === item.id ? 'row-flash border-brand/50' : 'border-line/70 dark:border-zinc-700/30'}`}>
                            <div className="flex items-start gap-2.5">
                              <input type="checkbox" checked={seleccionados.includes(item.id)} onChange={() => toggleSeleccion(item.id)} title="Seleccionar" aria-label={`Seleccionar ${item.rotulo}`} className="mt-1 h-4 w-4 rounded border-line-strong text-brand-text cursor-pointer" />
                              <div className="min-w-0 flex-1">
                                <span className="font-mono font-semibold text-xs text-content-1 dark:text-white bg-surface-3 dark:bg-surface-3/20 px-2 py-0.5 rounded-lg">{item.rotulo || 'S/R'}</span>
                                <p className="font-semibold text-content-1 dark:text-white text-sm leading-snug line-clamp-2 mt-1.5">{repairMojibake(item.descripcion)}</p>
                                <p className="text-xs text-content-3 dark:text-content-3 mt-1 truncate"><i className="fa-solid fa-user-check text-ok text-[10px] mr-1"></i>{item.funcionario || 'Sin asignación'}</p>
                                <p className="text-xs text-content-3 dark:text-content-3 truncate"><i className="fa-solid fa-location-dot text-danger text-[10px] mr-1"></i>{item.ubicacion || 'Sin ubicación'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-line dark:border-zinc-700/50">
                              <IconButton titulo="Ficha 360" icono="fa-timeline" variante="ghost" tamano="sm" onClick={() => openFichaBien(item)} />
                              <IconButton titulo="QR" icono="fa-qrcode" variante="ghost" tamano="sm" onClick={() => { setQrTargetBien(item); setIsBulkQR(false); setIsQRModalOpen(true); }} />
                              <IconButton titulo="Asignación FC-10" icono="fa-file-signature" variante="ghost" tamano="sm" onClick={() => openFC10Modal(item)} />
                              <IconButton titulo="Editar" icono="fa-pen-to-square" variante="ghost" tamano="sm" onClick={() => { setBienEditing(item); setIsBienModalOpen(true); }} />
                            </div>
                          </div>
                        ))}
                        {itemsPaginados.length === 0 && (
                          <div className="col-span-full">
                            <EmptyState
                              icon={hasFilters ? 'fa-filter-circle-xmark' : 'fa-boxes-packing'}
                              titulo={hasFilters ? 'Ningún bien coincide con los filtros' : 'Todavía no hay bienes cargados'}
                              descripcion={hasFilters
                                ? 'Probá con menos filtros o restablecelos para ver todo el inventario.'
                                : 'Importá un CSV con la plantilla o creá el primer registro a mano.'}
                              accionLabel={hasFilters ? 'Restablecer filtros' : 'Añadir bien'}
                              onAccion={hasFilters ? clearAllFilters : () => { setBienEditing(null); setIsBienModalOpen(true); }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    ) : vistaInv === 'kanban' ? (
                    /* Kanban: una columna por estado, arrastrar para reclasificar */
                    <div className="p-4 sm:p-5 bg-surface-2/50 dark:bg-black/10">
                      {filteredBienes.length === 0 ? (
                        <EmptyState
                          icon={hasFilters ? 'fa-filter-circle-xmark' : 'fa-boxes-packing'}
                          titulo={hasFilters ? 'Ningún bien coincide con los filtros' : 'Todavía no hay bienes cargados'}
                          descripcion={hasFilters
                            ? 'Probá con menos filtros o restablecelos para ver todo el inventario.'
                            : 'Importá un CSV con la plantilla o creá el primer registro a mano.'}
                          accionLabel={hasFilters ? 'Restablecer filtros' : 'Añadir bien'}
                          onAccion={hasFilters ? clearAllFilters : () => { setBienEditing(null); setIsBienModalOpen(true); }}
                        />
                      ) : (
                        <KanbanBienes
                          bienes={filteredBienes}
                          onMover={onMoverEstado}
                          onOpenFicha={openFichaBien}
                          isAdmin={isAdmin}
                        />
                      )}
                    </div>
                    ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                      <Table sinContenedor minWidth={false} className="anim-rows w-full text-left border-collapse min-w-[900px]">

                                                  <THead sticky={false}>
                          <TRow className="text-[10px] sm:text-[11px] font-semibold text-content-3 dark:text-content-3 uppercase tracking-widest">
                            <TH className="py-4 pl-4 sm:pl-5 pr-1 w-[40px] align-middle">
                              <input
                                type="checkbox" title="Seleccionar página" aria-label="Seleccionar página"
                                checked={itemsPaginados.length > 0 && itemsPaginados.every(i => seleccionados.includes(i.id))}
                                onChange={(e) => { if (e.target.checked) { itemsPaginados.forEach(i => { if (!seleccionados.includes(i.id)) toggleSeleccion(i.id); }); } else { itemsPaginados.forEach(i => { if (seleccionados.includes(i.id)) toggleSeleccion(i.id); }); } }}
                                className="h-4 w-4 rounded border-line-strong text-brand-text cursor-pointer align-middle"
                              />
                            </TH>
                            <TH className="py-4 pr-4 w-[38%]">
                              <button onClick={() => ciclarOrden('rotulo')} title="Ordenar por rótulo" className="inline-flex items-center gap-1.5 uppercase tracking-widest hover:text-content-1 dark:hover:text-white transition-colors cursor-pointer">
                                Identificación y Descripción <i className={`fa-solid ${flechaOrden('rotulo')} text-[9px]`}></i>
                              </button>
                            </TH>
                            <TH className="px-4 py-4 w-[28%]">Localización y Custodio</TH>
                            <TH className="px-4 py-4 w-[18%]">Condición y Estado</TH>
                            <TH className="py-4 pl-4 pr-6 sm:pr-8 text-right w-[16%]">Acciones</TH>
                          </TRow>
                        </THead>

                        <TBody>
                          {itemsPaginados.map((item) => {

                            const getCondicionBadge = (cond) => {
                              const c = (cond || '').toLowerCase();
                              if (c.includes('muy bueno') || c.includes('excelente'))
                                return 'bg-emerald-500/10 text-ok dark:text-emerald-400 border-emerald-500/20';
                              if (c.includes('bueno'))
                                return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
                              return 'bg-amber-500/10 text-warn dark:text-amber-400 border-amber-500/20';
                            };

                            return (
                              <TRow key={item.id} className={`hover:bg-surface-2/50 dark:hover:bg-surface-3/20 transition-colors group ${lastMutatedBienId === item.id ? 'row-flash' : ''}`}>

                                {/* Selección */}
                                <TD className={`pl-4 sm:pl-5 pr-1 align-middle ${compacto ? 'py-2' : 'py-4'}`}>
                                  <input type="checkbox" checked={seleccionados.includes(item.id)} onChange={() => toggleSeleccion(item.id)} title="Seleccionar" aria-label={`Seleccionar ${item.rotulo}`} className="h-4 w-4 rounded border-line-strong text-brand-text cursor-pointer align-middle" />
                                </TD>
                                {/* Columna 1: Identificación */}
                                <TD className={`pr-4 align-top ${compacto ? 'py-2' : 'py-4'}`} >
                                  <div className="flex items-start gap-3.5">
                                    <div className={`shrink-0 items-center justify-center rounded-card bg-surface-3 dark:bg-surface-3/50 text-content-2 dark:text-content-3 text-xs ${compacto ? 'hidden' : 'mt-1 flex h-10 w-10'}`}>
                                      <i className="fa-solid fa-tag text-sm"></i>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono font-semibold text-xs text-content-1 dark:text-white bg-surface-3 dark:bg-surface-3/20 px-2 py-0.5 rounded-lg">
                                          {item.rotulo || 'S/R'}
                                        </span>
                                        {cols.fecha && item.fechaAdquisicion && (
                                          <span className="text-[10px] font-bold text-content-3 flex items-center gap-1">
                                            <i className="fa-regular fa-calendar text-[9px]"></i>
                                            {item.fechaAdquisicion}
                                          </span>
                                        )}
                                      </div>
                                      <p className={`font-semibold text-content-1 dark:text-white text-sm leading-snug ${compacto ? 'line-clamp-1' : 'line-clamp-2'}`} >
                                        {repairMojibake(item.descripcion)}
                                      </p>
                                      {cols.cuenta && item.cuenta && (
                                        <span className="inline-block text-[10px] font-medium text-content-3 bg-surface-3 dark:bg-surface-3/50 px-2 py-0.5 rounded-lg">
                                          #{item.cuenta}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </TD>

                                {/* Columna 2: Localización y Custodio */}
                                <TD className={`px-4 align-top ${compacto ? 'py-2' : 'py-4'}`} >
                                  <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-xs font-bold text-content-1 dark:text-zinc-200">
                                      <i className="fa-solid fa-user-check text-ok text-xs shrink-0"></i>
                                      <span className="truncate">{item.funcionario || 'Sin asignación'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-semibold text-content-3 dark:text-content-3">
                                      <i className="fa-solid fa-location-dot text-danger text-xs shrink-0"></i>
                                      <span className="truncate">{item.ubicacion || 'Sin ubicación'}</span>
                                    </div>
                                    {(() => {
                                      const fc10 = fc10VigentePorBien.get(item.id);
                                      const fechaAsig = fc10 ? (fc10.entregadoFecha || fc10.fechaGeneracion) : null;
                                      if (!fechaAsig) return null;
                                      return (
                                        <div className="flex items-center gap-2 text-xs font-semibold text-content-3 dark:text-content-3" title={`Asignado por FC-10 el ${formatDateText(fechaAsig)}`}>
                                          <i className="fa-solid fa-file-signature text-brand-text dark:text-brand text-xs shrink-0"></i>
                                          <span className="truncate tabular-nums">Asignado: {formatDateText(fechaAsig)}</span>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </TD>

                                {/* Columna 3: Condición y QR (Botón interactivo) */}
                                <TD className={`px-4 align-middle ${compacto ? 'py-2' : 'py-4'}`} >
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className={`inline-flex items-center justify-center px-2.5 py-1 min-w-[76px] text-center rounded-control text-[11px] font-bold border uppercase tracking-wider ${getCondicionBadge(item.estadoConservacion)}`}>
                                      {item.estadoConservacion || 'Regular'}
                                    </span>

                                    {cols.qr && (<button
                                      type="button"
                                      onClick={() => { setQrTargetBien(item); setIsBulkQR(false); setIsQRModalOpen(true); }}
                                      title={item.hasQR ? "Ver / Descargar Código QR" : "Generar Código QR"}
                                      className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 min-w-[76px] rounded-control text-[11px] font-semibold border transition-all cursor-pointer active:scale-95 ${ item.hasQR ? 'bg-zinc-900 text-white dark:bg-surface-1 dark:text-zinc-100 border-zinc-900 dark:border-white shadow-xs hover:opacity-85' : 'bg-surface-3 dark:bg-surface-3/50 text-content-3 dark:text-content-3 border-line dark:border-zinc-700/30 hover:border-zinc-400' }`}
                                    >
                                      <i className="fa-solid fa-qrcode text-[10px]"></i>
                                      <span>{item.hasQR ? 'Con QR' : 'Sin QR'}</span>
                                    </button>)}
                                  </div>
                                </TD>

                                {/* Columna 4: Matriz Completa de Acciones Restaurada */}
                                <TD className={`pl-4 pr-6 sm:pr-8 align-top text-right ${compacto ? 'py-2' : 'py-4'}`} >
                                  <div className="flex items-center justify-end gap-1.5">

                                    {/* Ficha 360 y trazabilidad */}
                                    <IconButton
                                      titulo="Ficha 360 y trazabilidad"
                                      icono="fa-timeline"
                                      variante="ghost"
                                      tamano="sm"
                                      onClick={() => openFichaBien(item)}
                                      className="focus-visible:ring-emerald-500"
                                    />

                                    {/* Generar QR */}
                                    <IconButton
                                      titulo="Generar Código QR"
                                      icono="fa-qrcode"
                                      variante="ghost"
                                      tamano="sm"
                                      onClick={() => { setQrTargetBien(item); setIsBulkQR(false); setIsQRModalOpen(true); }}
                                    />

                                    {/* Asignar FC-10 */}
                                    <IconButton
                                      titulo="Asignación FC-10"
                                      icono="fa-file-signature"
                                      variante="ghost"
                                      tamano="sm"
                                      onClick={() => openFC10Modal(item)}
                                    />

                                    {/* Traslado FC-11 */}
                                    <IconButton
                                      titulo="Traslado FC-11"
                                      icono="fa-truck-fast"
                                      variante="ghost"
                                      tamano="sm"
                                      onClick={() => openFC11Modal(item)}
                                    />

                                    {/* Editar Bien */}
                                    <IconButton
                                      titulo="Editar Bien"
                                      icono="fa-pen-to-square"
                                      variante="ghost"
                                      tamano="sm"
                                      onClick={() => { setBienEditing(item); setIsBienModalOpen(true); }}
                                    />

                                    {/* Eliminar o Solicitar Baja */}
                                    <IconButton
                                      titulo="Eliminar o Solicitar Baja"
                                      icono="fa-trash-can"
                                      variante="danger"
                                      tamano="sm"
                                      onClick={() => {
                                        if (isAdmin) {
                                          setItemToDelete({ type: 'bien', id: item.id, item });
                                        } else {
                                          setItemToDelete({ type: 'requestBaja', id: item.id, item });
                                        }
                                      }}
                                    />

                                  </div>
                                </TD>

                              </TRow>
                            );
                          })}

                          {itemsPaginados.length === 0 && (
                            <TRow>
                              <TD colSpan="5" className="p-0">
                                <EmptyState
                                  icon={hasFilters ? 'fa-filter-circle-xmark' : 'fa-boxes-packing'}
                                  titulo={hasFilters ? 'Ningún bien coincide con los filtros' : 'Todavía no hay bienes cargados'}
                                  descripcion={hasFilters
                                    ? 'Probá con menos filtros o restablecelos para ver todo el inventario.'
                                    : 'Importá un CSV con la plantilla o creá el primer registro a mano.'}
                                  accionLabel={hasFilters ? 'Restablecer filtros' : 'Añadir bien'}
                                  onAccion={hasFilters ? clearAllFilters : () => { setBienEditing(null); setIsBienModalOpen(true); }}
                                />
                              </TD>
                            </TRow>
                          )}
                        </TBody>

                      </Table>
                    </div>
                    )}

                    {/* Paginación Integrada */}
                    {renderPagination()}
                  </div>
                  )}

      {comparando && (
        <CompararBienesModal
          bienes={itemsPaginados.filter(i => seleccionados.includes(i.id)).slice(0, 3)}
          onClose={() => setComparando(false)}
          STYLES={STYLES}
        />
      )}
      {mostrarAsignacionMasiva && (
        <Dialogo className={STYLES.modalOverlay} onClick={() => setMostrarAsignacionMasiva(false)}>
          <div className={STYLES.modalContent + ' max-w-lg !p-0 overflow-hidden rounded-[24px] shadow-2xl border border-line/80 dark:border-line'} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Asignación masiva de bienes">
            <div className="px-6 py-5 border-b border-line dark:border-white/10">
              <h2 className="text-lg font-bold text-content-1 dark:text-white">Asignar bienes seleccionados</h2>
              <p className="mt-1 text-sm text-content-3">Se actualizarán {seleccionados.length} bienes. Deja un campo en “Mantener” para no modificarlo.</p>
            </div>
            <div className="p-6 grid gap-4">
              <label className="grid gap-1.5 text-xs font-bold text-content-2">Responsable
                <select value={asignacionMasiva.funcionario} onChange={e => setAsignacionMasiva(v => ({ ...v, funcionario: e.target.value }))} className="h-11 rounded-control border border-line bg-surface-1 px-3 text-sm font-medium text-content-1 dark:text-white">
                  <option value="__MANTENER__">Mantener responsable actual</option>
                  <option value="__SIN_ASIGNACION__">Quitar responsable</option>
                  {funcionariosUnicos.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </label>
              <label className="grid gap-1.5 text-xs font-bold text-content-2">Ubicación
                <select value={asignacionMasiva.ubicacion} onChange={e => setAsignacionMasiva(v => ({ ...v, ubicacion: e.target.value }))} className="h-11 rounded-control border border-line bg-surface-1 px-3 text-sm font-medium text-content-1 dark:text-white">
                  <option value="__MANTENER__">Mantener ubicación actual</option>
                  <option value="__SIN_UBICACION__">Quitar ubicación</option>
                  {ubicacionesUnicas.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </label>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-line dark:border-white/10">
              <button onClick={() => setMostrarAsignacionMasiva(false)} className="h-10 px-4 rounded-control text-sm font-semibold hover:bg-surface-2">Cancelar</button>
              <button
                disabled={asignacionMasiva.funcionario === '__MANTENER__' && asignacionMasiva.ubicacion === '__MANTENER__'}
                onClick={() => {
                  const funcionario = asignacionMasiva.funcionario === '__MANTENER__' ? undefined : asignacionMasiva.funcionario === '__SIN_ASIGNACION__' ? '' : asignacionMasiva.funcionario;
                  const ubicacion = asignacionMasiva.ubicacion === '__MANTENER__' ? undefined : asignacionMasiva.ubicacion === '__SIN_UBICACION__' ? '' : asignacionMasiva.ubicacion;
                  onAsignarMasivo?.({ ids: seleccionados, funcionario, ubicacion });
                  setMostrarAsignacionMasiva(false);
                }}
                className="h-10 px-5 rounded-control bg-brand text-white text-sm font-bold disabled:opacity-45"
              >Aplicar cambios</button>
            </div>
          </div>
        </Dialogo>
      )}
      {confirmaBajaMasiva && (
        <Dialogo className={STYLES.modalOverlay} onClick={() => setConfirmaBajaMasiva(false)}>
          <div className={STYLES.modalContent + ' max-w-[380px] !p-0 overflow-hidden rounded-[24px] shadow-2xl border border-line/80 dark:border-line animate-slide-up'} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Confirmar baja masiva">
            <div className="p-8 text-center bg-surface-1 dark:bg-surface-1">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-card mb-6 bg-rose-100 text-danger dark:bg-rose-500/10 dark:text-rose-400">
                <i className="fa-solid fa-trash-can text-xl"></i>
              </div>
              <h3 className="text-lg font-bold tracking-tight text-content-1 dark:text-white mb-3">
                {isAdmin ? `¿Dar de baja ${seleccionados.length} bienes?` : `¿Solicitar baja de ${seleccionados.length} bienes?`}
              </h3>
              <p className="text-xs text-content-3 dark:text-content-3 font-medium leading-relaxed">
                {isAdmin ? 'Pasarán a estado "De Baja" y quedará registro en auditoría.' : 'Se enviarán como solicitudes al administrador para su revisión.'}
              </p>
            </div>
            <div className="flex items-center gap-3 p-6 bg-surface-2 dark:bg-surface-2 border-t border-line dark:border-line">
              <button data-modal-close onClick={() => setConfirmaBajaMasiva(false)} className="flex-1 h-10 px-4 rounded-control text-[13px] font-semibold text-content-1 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-3/20 transition-colors cursor-pointer">Cancelar</button>
              <button onClick={() => { setConfirmaBajaMasiva(false); if (onBajaMasiva) onBajaMasiva(seleccionados); }} className="flex-1 h-10 px-5 rounded-control text-[13px] font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer">Confirmar</button>
            </div>
          </div>
        </Dialogo>
      )}

                </div>
  );
}
