import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PENDIENTE_LABELS, ESTADOS_CONSERVACION } from '../constants/appConstants';
import FiltroCombo from '../components/FiltroCombo';
import CompararBienesModal from '../components/CompararBienesModal';
import KanbanBienes from '../components/KanbanBienes';
import SkeletonLoader from '../components/SkeletonLoader';
import ExportScheduleMenu from '../components/ExportScheduleMenu';
import { formatDateText, repairMojibake } from '../utils/helpers';
import { esBienLibreParaAsignar } from '../utils/asignacionBien';
import { piezasCoincidentes } from '../utils/componentesInventario';
import { normalizeStr } from '../utils/helpers';
import { imprimirInformeBajaBien } from '../utils/informeBaja';
import { useIdioma } from '../utils/i18n';
import Dialogo from '../components/ui/Dialogo';
import InlineInventoryField from '../components/InlineInventoryField';
import { Card, EmptyState, PageHeader, Toolbar, Table, THead, TBody, TRow, TH, TD, Button, IconButton } from '../components/ui';
import useScopedPreference from '../hooks/useScopedPreference';
import { ContextMenuTarget } from '../components/ui/ContextualMenu';

const COLUMNAS_INICIALES = { fecha: true, cuenta: true, qr: true };
const VISTAS_RECIENTES_INICIALES = [];
const normalizarDensidad = value => value === 'compacta' ? 'compacta' : 'comoda';
const normalizarColumnas = value => ({ ...COLUMNAS_INICIALES, ...(value && typeof value === 'object' ? value : {}) });
const normalizarRecientes = value => Array.isArray(value) ? value.filter(x => typeof x === 'string').slice(0, 6) : VISTAS_RECIENTES_INICIALES;
const fechaHoraLegible = (valor) => {
  if (!valor) return '';
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? '' : new Intl.DateTimeFormat('es-PY', { dateStyle: 'medium', timeStyle: 'short' }).format(fecha);
};

function ComponentesInventario({ bien, compacto = false }) {
  let componentes = bien?.componentes;
  if (typeof componentes === 'string') {
    try { componentes = JSON.parse(componentes); } catch { componentes = []; }
  }
  if (!Array.isArray(componentes) || componentes.length === 0) return null;
  const piezas = componentes.reduce((total, componente) => total + (Number.parseInt(componente?.cantidad, 10) || 1), 0);
  return (
    <details className="mt-2 min-w-0 rounded-lg border border-brand/20 bg-brand-soft/50 text-brand-text">
      <summary className={`flex cursor-pointer list-none items-center gap-1.5 rounded-lg px-2.5 ${compacto ? 'py-1' : 'py-1.5'} text-[10px] font-bold hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand`}>
        <i className="fa-solid fa-cubes-stacked" aria-hidden="true" />
        <span>{componentes.length} {componentes.length === 1 ? 'tipo' : 'tipos'} · {piezas} {piezas === 1 ? 'pieza' : 'piezas'}</span>
        <i className="fa-solid fa-chevron-down ml-auto text-[9px]" aria-hidden="true" />
      </summary>
      <div className="grid max-h-52 gap-1 overflow-y-auto border-t border-brand/15 p-1.5 custom-scrollbar">
        {componentes.map((componente, index) => (
          <div key={componente?.id || `${componente?.nombre || 'componente'}-${index}`} className="rounded-md bg-surface-1 px-2 py-1.5 text-content-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <span className="min-w-0 truncate text-[11px] font-bold" title={componente?.nombre || `Componente ${index + 1}`}>{componente?.nombre || `Componente ${index + 1}`}</span>
              <span className="shrink-0 text-[10px] font-semibold text-content-3">× {Number.parseInt(componente?.cantidad, 10) || 1}</span>
            </div>
            <div className="mt-1 grid min-w-0 gap-x-2 text-[10px] text-content-2 sm:grid-cols-2">
              <span className="flex min-w-0 items-center gap-1"><i className="fa-solid fa-location-dot w-3 shrink-0 text-danger" aria-hidden="true" /><span className="min-w-0 truncate" title={componente?.ubicacion?.trim() || bien.ubicacion || 'Sin ubicación'}><b>Ubicación:</b> {componente?.ubicacion?.trim() || bien.ubicacion || 'Sin ubicación'}</span></span>
              <span className="flex min-w-0 items-center gap-1"><i className="fa-solid fa-user-check w-3 shrink-0 text-ok" aria-hidden="true" /><span className="min-w-0 truncate" title={componente?.funcionario?.trim() || bien.funcionario || 'Sin funcionario'}><b>Funcionario:</b> {componente?.funcionario?.trim() || bien.funcionario || 'Sin funcionario'}</span></span>
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

function ResumenObservacion({ bien, onClick }) {
  const texto = String(bien?.observaciones || '').trim();
  if (!texto) return null;
  return <button type="button" onClick={onClick} aria-label={`Leer observación del bien ${bien.rotulo || ''}`} className="mt-2 block w-full rounded-lg border border-amber-300/80 bg-amber-50/80 p-2.5 text-left transition hover:border-amber-400 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-amber-400/25 dark:bg-amber-400/5 dark:hover:bg-amber-400/10">
    <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-800 dark:text-amber-200"><i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />Observación</span>
    <span className="mt-1 block line-clamp-2 whitespace-pre-wrap break-words text-[11px] leading-relaxed text-content-2">{texto}</span>
    <span className="mt-1 block text-right text-[9px] font-bold text-amber-800 dark:text-amber-200">Leer nota completa <i className="fa-solid fa-arrow-up-right-from-square ml-1" aria-hidden="true" /></span>
  </button>;
}

// Vista del inventario general (extraída de App.jsx, Fase 5).
// Es la vista más grande del sistema; recibe todo por props.
export default function InventarioView({
  hasFilters,
  filteredBienes,
  bienesLibresParaAsignar = [],
  stats = {},
  handleDownloadTemplateCSV,
  fileInputRef,
  handleExportInventarioCSV,
  handleExportInventarioExcel,
  handleExportInventarioPDF,
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
  ubicacionesParaFiltro = ubicacionesUnicas,
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
  isInventoryViewer = false,
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
  onExportarSeleccionPDF,
  onEditarCampoBien,
  onQRLoteSeleccion,
  onMoverEstado,
  onCopiarLink,
  enlacesCompartidosSesion = [],
  onRevocarEnlace,
  onExportarProgramado,
  STYLES,
  isLoading,
  hasInventoryData = false,
  username = 'anon'
}) {
  // Densidad, columnas y búsquedas recientes por persona en equipos compartidos.
  const [densidad, setDensidad] = useScopedPreference('inv_densidad', username, 'comoda', normalizarDensidad);
  const compacto = densidad === 'compacta';
  const [buscadorRapidoVisible, setBuscadorRapidoVisible] = useState(false);
  const [buscadorRapidoFijado, setBuscadorRapidoFijado] = useState(false);
  const [buscadorRapidoOculto, setBuscadorRapidoOculto] = useState(false);
  const buscadorPrincipalRef = useRef(null);
  const mostrarBuscadorFlotante = (buscadorRapidoVisible || buscadorRapidoFijado) && !buscadorRapidoOculto;
  const [rotuloCopiado, setRotuloCopiado] = useState('');
  const [observacionAbierta, setObservacionAbierta] = useState(null);
  const cambiarDensidad = () => {
    const v = compacto ? 'comoda' : 'compacta';
    setDensidad(v);
  };
  const [cols, setCols] = useScopedPreference('inv_columnas', username, COLUMNAS_INICIALES, normalizarColumnas);
  const alternarCol = (k) => {
    setCols(prev => {
      return { ...prev, [k]: !prev[k] };
    });
  };
  const [menuCols, setMenuCols] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);
  const filtrosAvanzadosActivos = [filtroSubcuenta, filtroAnalitico1, filtroAnalitico2].filter(Boolean).length + (filtroEstado !== 'ALL' ? 1 : 0);
  const accionesContextualesBien = (item) => [
    { label: 'Ver ficha y trazabilidad', icon: 'fa-arrow-up-right-from-square', onSelect: () => openFichaBien(item) },
    { label: item.hasQR ? 'Ver o descargar QR' : 'Generar QR', icon: 'fa-qrcode', onSelect: () => { setQrTargetBien(item); setIsBulkQR(false); setIsQRModalOpen(true); } },
    { label: 'Exportar este bien a CSV', icon: 'fa-file-csv', onSelect: () => handleExportInventarioCSV?.([item]) },
    { label: 'Exportar este bien a Excel', icon: 'fa-file-excel', onSelect: () => handleExportInventarioExcel?.([item]) },
    ...(isAdmin && openFC10Modal ? [{ label: 'Crear o gestionar acta FC-10', icon: 'fa-file-signature', onSelect: () => openFC10Modal(item) }] : []),
    ...(isAdmin && openFC11Modal ? [{ label: 'Registrar traslado FC-11', icon: 'fa-truck-fast', onSelect: () => openFC11Modal(item) }] : []),
    ...(!isInventoryViewer ? [
      { label: 'Editar bien', icon: 'fa-pen-to-square', onSelect: () => { setBienEditing(item); setIsBienModalOpen(true); } },
      { label: isAdmin ? 'Dar de baja el bien' : 'Solicitar baja del bien', icon: 'fa-trash-can', danger: true, onSelect: () => setItemToDelete({ type: isAdmin ? 'bien' : 'requestBaja', id: item.id, item }) }
    ] : []),
    { label: 'Copiar rótulo', icon: 'fa-copy', onSelect: () => navigator.clipboard?.writeText(String(item.rotulo || item.id)) }
  ];
  const [recientes, setRecientes] = useScopedPreference('inv_recientes', username, VISTAS_RECIENTES_INICIALES, normalizarRecientes);
  const guardarReciente = (texto) => {
    const v = String(texto || '').trim();
    if (!v) return;
    setRecientes(prev => {
      return [v, ...prev.filter(x => x !== v)].slice(0, 6);
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
  useEffect(() => {
    const contenedor = document.getElementById('contenido');
    const buscadorPrincipal = buscadorPrincipalRef.current;
    if (!contenedor || !buscadorPrincipal) return undefined;
    const actualizarVisibilidad = (estaVisible) => {
      if (estaVisible) {
        setBuscadorRapidoVisible(false);
        setBuscadorRapidoFijado(false);
        setBuscadorRapidoOculto(false);
        return;
      }
      setBuscadorRapidoVisible(!buscadorRapidoOculto);
    };
    if (typeof window.IntersectionObserver !== 'undefined') {
      const observer = new window.IntersectionObserver(([entry]) => actualizarVisibilidad(entry.isIntersecting), {
        root: contenedor,
        threshold: 0
      });
      observer.observe(buscadorPrincipal);
      return () => observer.disconnect();
    }
    const actualizarDesdeGeometria = () => {
      const caja = buscadorPrincipal.getBoundingClientRect();
      const area = contenedor.getBoundingClientRect();
      actualizarVisibilidad(caja.bottom > area.top && caja.top < area.bottom);
    };
    actualizarDesdeGeometria();
    contenedor.addEventListener('scroll', actualizarDesdeGeometria, { passive: true });
    window.addEventListener('resize', actualizarDesdeGeometria);
    return () => {
      contenedor.removeEventListener('scroll', actualizarDesdeGeometria);
      window.removeEventListener('resize', actualizarDesdeGeometria);
    };
  }, [buscadorRapidoOculto]);
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
<div className="inventory-view inventory-stagger min-w-0 space-y-4 pb-12 font-sans text-content-1 dark:text-content-1">

  {/* 1. ENCABEZADO Y ACCIONES PRINCIPALES */}
  <Card className="overflow-hidden border-brand/15 p-0 shadow-panel">
    <div className="inventory-header bg-gradient-to-r from-brand-soft/70 via-surface-1 to-surface-1 px-4 py-4 sm:px-5 sm:py-4 dark:from-brand/10 dark:via-surface-1 dark:to-surface-1">
      <div className="inventory-header-main">
        <div className="inventory-header-content min-w-0">
          <p className="mb-1 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand-text"><i className="fa-solid fa-layer-group" aria-hidden="true" /> Gestión patrimonial</p>
          <PageHeader
            titulo={'Inventario General'}
            descripcion={'Consulta, filtra y administra los bienes registrados en la Universidad.'}
            icono="fa-boxes-stacked"
            className="!mb-0 !p-0"
          />
        </div>
        <div className="inventory-view-count flex items-center gap-2 rounded-xl border border-line px-3 py-2 shadow-xs">
          <span className="inventory-view-count-icon flex h-8 w-8 items-center justify-center rounded-lg"><i className="fa-solid fa-boxes-stacked text-xs" aria-hidden="true" /></span>
          <span className="inventory-view-count-copy"><span className="inventory-view-count-label block text-[10px] font-semibold uppercase tracking-wide">Bienes en esta vista</span><span className="inventory-view-count-value block text-sm font-extrabold tabular-nums">{filteredBienes.length.toLocaleString('es-PY')}</span></span>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1.5 border-t border-line/70 pt-2.5 sm:grid-cols-4">
        {[
          { label: 'Bienes registrados', value: stats.totalItems, icon: 'fa-boxes-stacked', tone: 'text-brand-text' },
          { label: 'Libres para asignar', value: stats.libresParaAsignar, icon: 'fa-box-open', tone: 'text-emerald-700 dark:text-emerald-300' },
          { label: 'Con observación', value: stats.observados, icon: 'fa-triangle-exclamation', tone: 'text-amber-700 dark:text-amber-300' },
          { label: 'Pendientes de QR', value: stats.withoutQR, icon: 'fa-qrcode', tone: 'text-sky-700 dark:text-sky-300' }
        ].map(item => <div key={item.label} className="flex min-w-0 items-center gap-2.5 px-1 py-1.5">
          <i className={`fa-solid ${item.icon} ${item.tone} text-xs`} aria-hidden="true" />
          <span className="min-w-0"><span className="block truncate text-[10px] font-medium text-content-3">{item.label}</span><span className="block text-sm font-bold tabular-nums text-content-1">{Number(item.value || 0).toLocaleString('es-PY')}</span></span>
        </div>)}
      </div>
    </div>
      {/* Antes el `contador` de la cabecera mostraba "Añadir Registro", que
          repetía el botón de la toolbar de abajo (línea ~262) y además no era
          un contador. El total de bienes ya se ve en la paginación
          ("Mostrando X de Y"), así que la cabecera queda solo con la
          identidad del módulo. */}
      <div className="border-t border-line bg-surface-2/50 px-3 py-2 sm:px-4">
      <Toolbar className="inventory-toolbar">

      {/* Barra de Acciones Rápidas: secundarias con scroll, CTA primario siempre visible */}
      <div className="inventory-actions">
      <div className="inventory-actions-scroll flex items-center gap-2 min-w-0 overflow-x-auto hide-scrollbar py-0.5 -my-0.5">
        <Button variante="subtle" icono="fa-file-excel" onClick={handleDownloadTemplateCSV} title="Descargar Plantilla CSV">
          {t('inv.plantilla')}
        </Button>

        {isAdmin && <Button variante="subtle" icono="fa-file-import" onClick={() => fileInputRef.current?.click()} title="Importar archivo CSV">
          {t('inv.importar')}
        </Button>}

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

        {isAdmin && <Button variante="primary" icono="fa-plus" onClick={() => { setBienEditing(null); setIsBienModalOpen(true); }} title={t('inv.anadir')}>
          {t('inv.anadir')}
        </Button>}
      </div>

      </Toolbar>
    </div>
  </Card>

  {/* 2. PANEL DE FILTROS BaSQUEDA Y SELECCIÓN EN GRID */}
    <div className="w-full min-w-0 space-y-2 rounded-2xl border border-line bg-surface-1 p-2.5 shadow-sm sm:p-3">

    {/* Solo se muestra una instancia del buscador: la flotante reemplaza a la de arriba mientras se desplaza. */}
    <div ref={buscadorPrincipalRef} aria-hidden={mostrarBuscadorFlotante} className={`space-y-1.5 transition-opacity duration-150 ${mostrarBuscadorFlotante ? 'pointer-events-none invisible' : ''}`}>
    <div className="relative block w-full min-w-0">
      <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-content-3 text-sm pointer-events-none"></i>
      <input
        type="search"
        ref={mostrarBuscadorFlotante ? undefined : searchRef}
        tabIndex={mostrarBuscadorFlotante ? -1 : 0}
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
        className="inventory-search-input block h-10 w-full min-w-0 rounded-control border border-line bg-surface-1 py-2 pl-11 pr-11 text-sm font-medium text-content-1 placeholder:text-content-3 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-[border-color,box-shadow] duration-[var(--dur-fast)]"
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
            onClick={() => setRecientes([])}
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
        <p role="status" aria-live="polite" className="mt-1 flex items-center gap-2 px-1 text-xs font-medium text-content-3">
        {searchTerm !== debouncedSearchTerm ? (
          <><i className="fa-solid fa-circle-notch fa-spin text-brand" aria-hidden="true" /> Buscando en el inventario…</>
        ) : (
          <>{filteredBienes.length.toLocaleString('es-PY')} {filteredBienes.length === 1 ? 'coincidencia en esta vista' : 'coincidencias en esta vista'}</>
        )}
      </p>
    )}
    </div>

    {/* Filtros frecuentes primero; los contables quedan agrupados para reducir ruido. */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-0.5">

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
        opciones={ubicacionesParaFiltro}
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

      {/* FC-10 */}
      <FiltroCombo
        valor={filtroFC10 === 'ALL' ? '' : (filtroFC10 === 'YES' ? 'Con FC-10' : 'Sin FC-10')}
        opciones={['Con FC-10', 'Sin FC-10']}
        onElegir={(v) => { setFiltroFC10(v === 'Con FC-10' ? 'YES' : v === 'Sin FC-10' ? 'NO' : 'ALL'); setCurrentPage(1); }}
        etiquetaTodos="FC-10: Todos"
        titulo="Filtrar por FC-10"
      />

    </div>

    <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
    <div className="inventory-free-filter grid min-h-[58px] grid-cols-1 items-center gap-2 rounded-xl border border-emerald-700/15 bg-emerald-50/70 p-1.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-2 dark:bg-emerald-500/[0.06]">
      <button
        type="button"
        aria-pressed={filtroPendiente === 'libresParaAsignar'}
        onClick={() => { setFiltroPendiente(filtroPendiente === 'libresParaAsignar' ? '' : 'libresParaAsignar'); setCurrentPage(1); }}
        className={`flex min-w-0 items-center gap-2 rounded-xl px-1.5 py-1 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${filtroPendiente === 'libresParaAsignar' ? 'bg-emerald-500/10' : 'hover:bg-emerald-500/10'}`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"><i className="fa-solid fa-box-open" aria-hidden="true" /></span>
        <span className="min-w-0">
          <span className="block text-sm font-extrabold text-content-1">Libres para asignar</span>
          <span className="block text-xs text-content-3">Sin funcionario ni ubicación, o marcados expresamente para asignación</span>
        </span>
        <span className="ml-auto min-w-[68px] rounded-full border border-emerald-700/20 bg-white px-3 py-1.5 text-center text-xs font-black tabular-nums text-emerald-800 dark:bg-slate-900 dark:text-emerald-300">{Number(stats.libresParaAsignar || 0).toLocaleString('es-PY')}</span>
      </button>
      <div className="flex flex-wrap items-center justify-end gap-1.5 border-t border-emerald-700/10 pt-1.5 sm:border-0 sm:pt-0">
        <Button variante="subtle" tamano="sm" icono="fa-file-csv" disabled={!bienesLibresParaAsignar.length} onClick={() => handleExportInventarioCSV(bienesLibresParaAsignar)} title="Descargar la lista de bienes libres para asignar en CSV">Descargar CSV</Button>
        <Button variante="subtle" tamano="sm" icono="fa-file-excel" disabled={!bienesLibresParaAsignar.length} onClick={() => handleExportInventarioExcel(bienesLibresParaAsignar)} title="Descargar la lista de bienes libres para asignar en Excel">Excel</Button>
        <Button variante="secondary" tamano="sm" icono="fa-file-pdf" disabled={!bienesLibresParaAsignar.length} onClick={() => handleExportInventarioPDF(bienesLibresParaAsignar)} title="Descargar informe PDF de bienes libres para asignar">PDF</Button>
      </div>
    </div>

    <button type="button" aria-pressed={filtroPendiente === 'observados'} onClick={() => { setFiltroPendiente(filtroPendiente === 'observados' ? '' : 'observados'); setCurrentPage(1); }} className={`inventory-observed-filter flex min-h-[58px] w-full items-center gap-2 rounded-xl border px-2 py-1.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 ${filtroPendiente === 'observados' ? 'border-amber-500/40 bg-amber-500/10' : 'border-amber-500/15 bg-amber-50/70 hover:bg-amber-500/[0.08] dark:bg-amber-500/[0.05]'}`}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400"><i className="fa-solid fa-eye" aria-hidden="true" /></span>
      <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-content-1">Bienes con observaciones</span><span className="block text-xs text-content-3">Abre el filtro para revisar las notas registradas en el inventario</span></span>
      <span className="min-w-[68px] rounded-full border border-amber-600/20 bg-white px-3 py-1.5 text-center text-xs font-black tabular-nums text-amber-800 dark:bg-slate-900 dark:text-amber-300">{Number(stats.observados || 0).toLocaleString('es-PY')}</span>
    </button>
    </div>

    <div>
      <button
        type="button"
        aria-expanded={mostrarFiltrosAvanzados}
        onClick={() => setMostrarFiltrosAvanzados(v => !v)}
        className="inline-flex items-center gap-2 rounded-control px-2 py-1.5 text-xs font-bold text-content-2 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand motion"
      >
        <i className={`fa-solid fa-sliders text-brand-text`} aria-hidden="true"></i>
        Más filtros
        <span className="rounded-full bg-surface-3 px-1.5 py-0.5 text-[10px] tabular-nums text-content-3">{filtrosAvanzadosActivos ? `${filtrosAvanzadosActivos} activos · 4` : '4'}</span>
        <i className={`fa-solid fa-chevron-down text-[10px] transition-transform ${mostrarFiltrosAvanzados ? 'rotate-180' : ''}`} aria-hidden="true"></i>
      </button>
      {mostrarFiltrosAvanzados && (
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 animate-fade-in">
          <FiltroCombo valor={filtroEstado === 'ALL' ? '' : filtroEstado} opciones={ESTADOS_CONSERVACION} onElegir={(v) => { setFiltroEstado(v || 'ALL'); setCurrentPage(1); }} etiquetaTodos="Estado: Todos" titulo="Filtrar por estado de conservación" />
          <FiltroCombo valor={filtroSubcuenta} opciones={subcuentasUnicas} onElegir={(v) => { setFiltroSubcuenta(v); setCurrentPage(1); }} etiquetaTodos="Subcuenta: Todas" titulo="Filtrar por subcuenta" />
          <FiltroCombo valor={filtroAnalitico1} opciones={analiticos1Unicos} onElegir={(v) => { setFiltroAnalitico1(v); setCurrentPage(1); }} etiquetaTodos="Analítico 1: Todos" titulo="Filtrar por analítico 1" />
          <FiltroCombo valor={filtroAnalitico2} opciones={analiticos2Unicos} onElegir={(v) => { setFiltroAnalitico2(v); setCurrentPage(1); }} etiquetaTodos="Analítico 2: Todos" titulo="Filtrar por analítico 2" />
        </div>
      )}
    </div>

    {/* Vistas guardadas + Restablecer */}
    <div className="flex flex-wrap items-center gap-2 pt-0.5">
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
            <button onClick={guardarVistaActual} title="Guardar" aria-label="Guardar" className="flex h-8 w-8 items-center justify-center rounded-control bg-zinc-900 dark:bg-surface-1 text-white dark:text-zinc-100 cursor-pointer"
>
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
    <div className="relative z-20 flex flex-wrap items-center gap-2">
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
          {(seleccionados.length > 0 || filtroFuncionario) && onCopiarLink && (
            <button
              onClick={onCopiarLink}
              title={seleccionados.length > 0 ? 'Crear enlace temporal de solo lectura para los bienes seleccionados' : 'Crear enlace temporal de solo lectura para todos los bienes de este funcionario'}
              aria-label={seleccionados.length > 0 ? `Compartir ${seleccionados.length} bienes en modo de solo lectura` : `Compartir los bienes de ${filtroFuncionario} en modo de solo lectura`}
              className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-control border border-brand/25 bg-brand-soft text-[11px] font-bold text-brand-text hover:bg-brand/15 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <i className="fa-solid fa-share-nodes text-[10px]"></i>
              <span className="hidden sm:inline">{seleccionados.length > 0 ? `Compartir (${seleccionados.length})` : 'Compartir bienes'}</span>
            </button>
          )}
          {enlacesCompartidosSesion.length > 0 && (
            <div className="inline-flex max-w-[min(36rem,45vw)] flex-wrap items-center gap-1.5" aria-label="Enlaces compartidos recientes">
              {enlacesCompartidosSesion.map((enlace) => (
                <button
                  key={enlace.token}
                  type="button"
                  onClick={() => onRevocarEnlace?.(enlace.token)}
                  title={`Revocar el enlace compartido para ${enlace.cantidad} bienes`}
                  aria-label={`Revocar enlace compartido de ${enlace.cantidad} bienes`}
                  className="inline-flex h-8 items-center gap-1 rounded-control border border-danger/25 bg-danger-soft/50 px-2 text-[10px] font-bold text-danger hover:bg-danger-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                >
                  <i className="fa-solid fa-link-slash" aria-hidden="true" />
                  Revocar · {enlace.cantidad}
                </button>
              ))}
            </div>
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
                        {isAdmin && <button onClick={() => setMostrarAsignacionMasiva(true)} title="Asignar responsable o ubicación a los bienes seleccionados" className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-control text-xs font-bold bg-surface-1/15 dark:bg-surface-1/10 hover:bg-surface-1/25 dark:hover:bg-surface-2/20 transition-all cursor-pointer">
                          <i className="fa-solid fa-user-gear text-[11px]"></i> Asignar
                        </button>}
                        {isAdmin && openFC11Modal && <button onClick={() => openFC11Modal(filteredBienes.filter(item => seleccionados.includes(item.id)))} title="Crear un FC-11 único para todos los bienes seleccionados" className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-control text-xs font-bold bg-surface-1/15 dark:bg-surface-1/10 hover:bg-surface-1/25 dark:hover:bg-surface-2/20 transition-all cursor-pointer">
                          <i className="fa-solid fa-truck-fast text-[11px]"></i> FC-11 ({seleccionados.length})
                        </button>}
                        <button onClick={() => onExportarSeleccion?.('csv')} title="Exportar bienes seleccionados a CSV" className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-control text-xs font-bold bg-surface-1/15 dark:bg-surface-1/10 hover:bg-surface-1/25 dark:hover:bg-surface-2/20 transition-all cursor-pointer">
                          <i className="fa-solid fa-file-csv text-[11px]"></i> Exportar
                        </button>
                        <button onClick={() => onExportarSeleccionPDF?.()} title="Generar FC-03 en PDF con los bienes seleccionados" className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-control text-xs font-bold bg-surface-1/15 dark:bg-surface-1/10 hover:bg-surface-1/25 dark:hover:bg-surface-2/20 transition-all cursor-pointer">
                          <i className="fa-solid fa-file-pdf text-[11px]"></i> PDF FC-03
                        </button>
                        <button onClick={() => setComparando(true)} disabled={seleccionados.length < 2 || seleccionados.length > 3} title="Comparar 2 o 3 bienes lado a lado" className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-control text-xs font-bold bg-surface-1/15 dark:bg-surface-1/10 hover:bg-surface-1/25 dark:hover:bg-surface-2/20 transition-all cursor-pointer disabled:opacity-40">
                          <i className="fa-solid fa-columns-compare text-[11px]"></i> Comparar
                        </button>
                        {!isInventoryViewer && <button onClick={() => setConfirmaBajaMasiva(true)} title={isAdmin ? 'Dar de baja la selección' : 'Solicitar baja de la selección'} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-control text-xs font-bold bg-rose-500/90 hover:bg-rose-500 text-white transition-all cursor-pointer">
                          <i className="fa-solid fa-trash-can text-[11px]"></i> Baja
                        </button>}
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
                  <ContextMenuTarget
                    actions={[
                      { label: 'Limpiar filtros del inventario', icon: 'fa-filter-circle-xmark', onSelect: clearAllFilters },
                      { label: 'Exportar resultados filtrados a CSV', icon: 'fa-file-csv', onSelect: () => handleExportInventarioCSV?.(filteredBienes) },
                      { label: 'Exportar resultados filtrados a Excel', icon: 'fa-file-excel', onSelect: () => handleExportInventarioExcel?.(filteredBienes) }
                    ]}
                    label="Acciones de la vista de inventario"
                    className="bg-surface-1 dark:bg-surface-1/40 border border-line/70 dark:border-zinc-700/30 rounded-panel shadow-sm overflow-hidden"
                    data-tour="inv-table"
                  >
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
                              <ContextMenuTarget as="article" key={item.id} actions={accionesContextualesBien(item)} label={`Acciones del bien ${item.rotulo || item.descripcion}`} className={`group rounded-panel border bg-surface-1 p-4 shadow-card transition-[border-color,box-shadow,transform] duration-[var(--dur-base)] hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-panel ${lastMutatedBienId === item.id ? 'row-flash border-brand/50' : 'border-line'}`}>
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex min-w-0 items-start gap-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-brand-soft text-brand-text"><i className="fa-solid fa-box" aria-hidden="true" /></span>
                                    <div className="min-w-0">
                                      <span className="inline-flex max-w-full truncate rounded-md bg-surface-2 px-2 py-1 font-mono text-label font-bold text-content-2">{item.rotulo || 'Sin rótulo'}</span>
                                      <h3 className="mt-2 line-clamp-2 text-body font-bold leading-snug text-content-1" title={repairMojibake(item.descripcion)}>{repairMojibake(item.descripcion) || 'Sin descripción'}</h3>
                                      <ComponentesInventario bien={item} compacto />
                                    </div>
                                  </div>
                                  <input type="checkbox" checked={seleccionados.includes(item.id)} onChange={(e) => toggleSeleccion(item.id, { shiftKey: e.nativeEvent.shiftKey, visibles: itemsPaginados.map(b => b.id), seleccionado: e.target.checked })} title="Seleccionar bien (Mayús + clic para seleccionar un rango)" aria-label={`Seleccionar ${item.rotulo || item.descripcion}`} className="mt-1 h-4 w-4 shrink-0 rounded border-line-strong text-brand-text cursor-pointer" />
                                </div>
                                <div className="mt-4 grid grid-cols-1 gap-2 rounded-control bg-surface-2 p-3">
                                  <div className="flex min-w-0 items-start gap-2 text-body"><i className="fa-solid fa-user-check mt-0.5 w-4 shrink-0 text-ok" aria-hidden="true" /><span className="min-w-0"><span className="block text-label font-semibold uppercase tracking-wide text-content-3">Responsable</span><span className="block truncate font-semibold text-content-1">{item.funcionario || 'Sin asignar'}</span>{item.funcionarioAlternativo && <span className="block truncate text-[10px] text-content-3">Otro turno: {item.funcionarioAlternativo}</span>}</span></div>
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
                                  {isAdmin && <IconButton titulo="Crear o gestionar acta FC-10" icono="fa-file-signature" variante="ghost" tamano="sm" onClick={() => openFC10Modal(item)} />}
                              {isAdmin && <IconButton titulo="Registrar traslado FC-11" icono="fa-truck-fast" variante="ghost" tamano="sm" onClick={() => openFC11Modal(item)} />}
                              {!isInventoryViewer && <IconButton titulo="Editar bien" icono="fa-pen-to-square" variante="ghost" tamano="sm" onClick={() => { setBienEditing(item); setIsBienModalOpen(true); }} />}
                                  {isAdmin && <IconButton titulo="Descargar informe administrativo de baja (no modifica el inventario)" icono="fa-file-pdf" variante="ghost" tamano="sm" onClick={() => imprimirInformeBajaBien(item)} />}
                                  {!isInventoryViewer && <IconButton titulo={isAdmin ? 'Dar de baja el bien' : 'Solicitar baja del bien'} icono="fa-trash-can" variante="danger" tamano="sm" onClick={() => setItemToDelete({ type: isAdmin ? 'bien' : 'requestBaja', id: item.id, item })} />}
                                </div>
                              </ContextMenuTarget>
                            );
                          })}
                        </div>
                      ) : <div className="py-8"><EmptyState icon="fa-filter-circle-xmark" titulo="No hay bienes para mostrar" descripcion="Prueba quitando algún filtro o cambia las palabras de búsqueda." accionLabel="Restablecer filtros" onAccion={clearAllFilters} /></div>}
                    </div>
                    ) : vistaInv === 'tarjetas' ? (
                    <div className="p-4 sm:p-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {itemsPaginados.map((item) => (
                          <ContextMenuTarget as="article" key={item.id} actions={accionesContextualesBien(item)} label={`Acciones del bien ${item.rotulo || item.descripcion}`} className={`inventory-item-card relative rounded-card border p-4 shadow-xs bg-surface-1 ${lastMutatedBienId === item.id ? 'row-flash border-brand/50' : 'border-line/70 dark:border-zinc-700/30'}`}>
                            <div className="flex items-start gap-2.5">
                              <input type="checkbox" checked={seleccionados.includes(item.id)} onChange={(e) => toggleSeleccion(item.id, { shiftKey: e.nativeEvent.shiftKey, visibles: itemsPaginados.map(b => b.id), seleccionado: e.target.checked })} title="Seleccionar (Mayús + clic para un rango)" aria-label={`Seleccionar ${item.rotulo}`} className="mt-1 h-4 w-4 rounded border-line-strong text-brand-text cursor-pointer" />
                              <div className="min-w-0 flex-1">
                                <span className="font-mono font-semibold text-xs text-content-1 dark:text-white bg-surface-3 dark:bg-surface-3/20 px-2 py-0.5 rounded-lg">{item.rotulo || 'S/R'}</span>
                                <p className="font-semibold text-content-1 dark:text-white text-sm leading-snug line-clamp-2 mt-1.5">{repairMojibake(item.descripcion)}</p>
                                <ResumenObservacion bien={item} onClick={() => setObservacionAbierta({ rotulo: item.rotulo || 'Sin rótulo', texto: String(item.observaciones || '').trim(), ubicacion: item.ubicacion, funcionario: item.funcionario, fecha: item.modificadoEn || item.updated_at, usuario: item.modificadoPor })} />
                                <ComponentesInventario bien={item} compacto />
                                <p className="text-xs text-content-3 dark:text-content-3 mt-1 truncate"><i className="fa-solid fa-user-check text-ok text-[10px] mr-1"></i>{esBienLibreParaAsignar(item) ? 'Libre para asignar' : item.funcionario || 'Sin asignación'}</p>
                                {item.funcionarioAlternativo && <p className="text-[10px] text-content-3 truncate"><i className="fa-solid fa-user-clock mr-1"></i>Otro turno: {item.funcionarioAlternativo}</p>}
                                <p className="text-xs text-content-3 dark:text-content-3 truncate"><i className="fa-solid fa-location-dot text-danger text-[10px] mr-1"></i>{item.ubicacion || 'Sin ubicación'}</p>
                                <ResumenObservacion bien={item} onClick={() => setObservacionAbierta({ rotulo: item.rotulo || 'Sin rótulo', texto: String(item.observaciones || '').trim(), ubicacion: item.ubicacion, funcionario: item.funcionario, fecha: item.modificadoEn || item.updated_at, usuario: item.modificadoPor })} />
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-line dark:border-zinc-700/50">
                              <IconButton titulo="Ficha 360" icono="fa-timeline" variante="ghost" tamano="sm" onClick={() => openFichaBien(item)} />
                              <IconButton titulo="QR" icono="fa-qrcode" variante="ghost" tamano="sm" onClick={() => { setQrTargetBien(item); setIsBulkQR(false); setIsQRModalOpen(true); }} />
                              {isAdmin && <IconButton titulo="Asignación FC-10" icono="fa-file-signature" variante="ghost" tamano="sm" onClick={() => openFC10Modal(item)} />}
                              {!isInventoryViewer && <IconButton titulo="Editar" icono="fa-pen-to-square" variante="ghost" tamano="sm" onClick={() => { setBienEditing(item); setIsBienModalOpen(true); }} />}
                              {isAdmin && <IconButton titulo="Descargar informe administrativo de baja (no modifica el inventario)" icono="fa-file-pdf" variante="ghost" tamano="sm" onClick={() => imprimirInformeBajaBien(item)} />}
                            </div>
                          </ContextMenuTarget>
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
                              onAccion={hasFilters ? clearAllFilters : (isAdmin ? () => { setBienEditing(null); setIsBienModalOpen(true); } : undefined)}
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
                          accionLabel={hasFilters ? 'Restablecer filtros' : isAdmin ? 'Añadir bien' : undefined}
                          onAccion={hasFilters ? clearAllFilters : (isAdmin ? () => { setBienEditing(null); setIsBienModalOpen(true); } : undefined)}
                        />
                      ) : (
                        <KanbanBienes
                          bienes={filteredBienes}
                          onMover={isAdmin ? onMoverEstado : undefined}
                          onOpenFicha={openFichaBien}
                          isAdmin={isAdmin}
                        />
                      )}
                    </div>
                    ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                      <Table sinContenedor minWidth={false} className="anim-rows w-full table-fixed text-left border-collapse min-w-[1180px]">

                        <colgroup>
                          <col style={{ width: '4%' }} />
                          <col style={{ width: '33%' }} />
                          <col style={{ width: '27%' }} />
                          <col style={{ width: '16%' }} />
                          <col style={{ width: '20%' }} />
                        </colgroup>

                                                  <THead sticky>
                          <TRow className="text-[10px] sm:text-[11px] font-semibold text-content-3 dark:text-content-3 uppercase tracking-widest">
                            <TH className="py-4 pl-4 sm:pl-5 pr-1 w-[40px] align-middle">
                              <input
                                type="checkbox" title="Seleccionar página" aria-label="Seleccionar página"
                                checked={itemsPaginados.length > 0 && itemsPaginados.every(i => seleccionados.includes(i.id))}
                                onChange={(e) => { if (e.target.checked) { itemsPaginados.forEach(i => { if (!seleccionados.includes(i.id)) toggleSeleccion(i.id); }); } else { itemsPaginados.forEach(i => { if (seleccionados.includes(i.id)) toggleSeleccion(i.id); }); } }}
                                className="h-4 w-4 rounded border-line-strong text-brand-text cursor-pointer align-middle"
                              />
                            </TH>
                            <TH className="py-4 pr-4">
                              <button onClick={() => ciclarOrden('rotulo')} title="Ordenar por rótulo" className="inline-flex items-center gap-1.5 uppercase tracking-widest hover:text-content-1 dark:hover:text-white transition-colors cursor-pointer">
                                Identificación y Descripción <i className={`fa-solid ${flechaOrden('rotulo')} text-[9px]`}></i>
                              </button>
                            </TH>
                            <TH className="px-4 py-4">Localización y Custodio</TH>
                            <TH className="px-4 py-4">Condición y Estado</TH>
                            <TH className="py-4 pl-4 pr-6 sm:pr-8 text-right">Acciones</TH>
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
                              <ContextMenuTarget as={TRow} key={item.id} actions={accionesContextualesBien(item)} label={`Acciones del bien ${item.rotulo || item.descripcion}`} className={`hover:bg-surface-2/50 dark:hover:bg-surface-3/20 transition-colors group ${lastMutatedBienId === item.id ? 'row-flash' : ''}`}>

                                {/* Selección */}
                                <TD className={`pl-4 sm:pl-5 pr-1 align-middle ${compacto ? 'py-2' : 'py-4'}`}>
                                  <input type="checkbox" checked={seleccionados.includes(item.id)} onChange={(e) => toggleSeleccion(item.id, { shiftKey: e.nativeEvent.shiftKey, visibles: itemsPaginados.map(b => b.id), seleccionado: e.target.checked })} title="Seleccionar (Mayús + clic para un rango)" aria-label={`Seleccionar ${item.rotulo}`} className="h-4 w-4 rounded border-line-strong text-brand-text cursor-pointer align-middle" />
                                </TD>
                                {/* Columna 1: Identificación */}
                                <TD className={`pr-4 align-top ${compacto ? 'py-2' : 'py-4'}`} >
                                  <div className="flex items-start gap-3.5">
                                    <div className={`shrink-0 items-center justify-center rounded-card bg-surface-3 dark:bg-surface-3/50 text-content-2 dark:text-content-3 text-xs ${compacto ? 'hidden' : 'mt-1 flex h-10 w-10'}`}>
                                      <i className="fa-solid fa-tag text-sm"></i>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 rounded-lg bg-surface-3 px-2 py-0.5 font-mono text-xs font-semibold text-content-1 dark:bg-surface-3/20 dark:text-white">
                                          {item.rotulo || 'S/R'}
                                          {item.rotulo && <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(String(item.rotulo)); setRotuloCopiado(item.id); window.setTimeout(() => setRotuloCopiado(actual => actual === item.id ? '' : actual), 1500); } catch { /* Copia manual disponible. */ } }} title={rotuloCopiado === item.id ? 'Rótulo copiado' : 'Copiar rótulo'} aria-label={`Copiar rótulo ${item.rotulo}`} className="rounded px-1 text-content-3 hover:text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><i className={`fa-solid ${rotuloCopiado === item.id ? 'fa-check text-ok' : 'fa-copy'}`} aria-hidden="true" /></button>}
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
                                      <ResumenObservacion bien={item} onClick={() => setObservacionAbierta({ rotulo: item.rotulo || 'Sin rótulo', texto: String(item.observaciones || '').trim(), ubicacion: item.ubicacion, funcionario: item.funcionario, fecha: item.modificadoEn || item.updated_at, usuario: item.modificadoPor })} />
                                      {filtroUbicacion && normalizeStr(item.ubicacion || '') !== normalizeStr(filtroUbicacion) && piezasCoincidentes(item, 'ubicacion', filtroUbicacion).length > 0 && <p className="mt-2 rounded-lg bg-brand-soft px-2.5 py-2 text-xs text-brand-text">Piezas en {filtroUbicacion}: {piezasCoincidentes(item, 'ubicacion', filtroUbicacion).map(p => `${p.nombre || 'Pieza'} · ${p.funcionario || item.funcionario || 'Sin responsable'}`).join('; ')}</p>}
                                      {filtroFuncionario && normalizeStr(item.funcionario || '') !== normalizeStr(filtroFuncionario) && piezasCoincidentes(item, 'funcionario', filtroFuncionario).length > 0 && <p className="mt-2 rounded-lg bg-brand-soft px-2.5 py-2 text-xs text-brand-text">Piezas a cargo: {piezasCoincidentes(item, 'funcionario', filtroFuncionario).map(p => `${p.nombre || 'Pieza'} · ${p.ubicacion || item.ubicacion || 'Sin ubicación'}`).join('; ')}</p>}
                                      <ComponentesInventario bien={item} compacto={compacto} />
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
                                  <InlineInventoryField bien={item} campo="funcionario" etiqueta="Responsable" valor={item.funcionario} onSave={isInventoryViewer ? undefined : onEditarCampoBien} />
                                      {item.funcionarioAlternativo && <div className="pl-5 text-[10px] text-content-3" title="Responsable alternativo por turnos; no tiene FC-10 propio">Otro turno: {item.funcionarioAlternativo}</div>}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-semibold text-content-3 dark:text-content-3">
                                      <i className="fa-solid fa-location-dot text-danger text-xs shrink-0"></i>
                                      <InlineInventoryField bien={item} campo="ubicacion" etiqueta="Ubicación" valor={item.ubicacion} onSave={isInventoryViewer ? undefined : onEditarCampoBien} />
                                    </div>
                                    {esBienLibreParaAsignar(item) && <span className="ml-5 inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300"><i className="fa-solid fa-box-open" aria-hidden="true" /> Libre para asignar</span>}
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
                                <TD className={`px-4 align-top ${compacto ? 'py-2' : 'py-4'}`} >
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
                                    {isAdmin && <IconButton
                                      titulo="Asignación FC-10"
                                      icono="fa-file-signature"
                                      variante="ghost"
                                      tamano="sm"
                                      onClick={() => openFC10Modal(item)}
                                    />}

                                    {/* Traslado FC-11 */}
                                    {isAdmin && <IconButton
                                      titulo="Traslado FC-11"
                                      icono="fa-truck-fast"
                                      variante="ghost"
                                      tamano="sm"
                                      onClick={() => openFC11Modal(item)}
                                    />}

                                    {/* Editar Bien */}
                                    {!isInventoryViewer && <IconButton
                                      titulo="Editar Bien"
                                      icono="fa-pen-to-square"
                                      variante="ghost"
                                      tamano="sm"
                                      onClick={() => { setBienEditing(item); setIsBienModalOpen(true); }}
                                    />}

                                    {isAdmin && <IconButton titulo="Descargar informe administrativo de baja (no modifica el inventario)" icono="fa-file-pdf" variante="ghost" tamano="sm" onClick={() => imprimirInformeBajaBien(item)} />}

                                    {/* Eliminar o Solicitar Baja */}
                                    {!isInventoryViewer && <IconButton
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
                                    />}

                                  </div>
                                </TD>

                              </ContextMenuTarget>
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
                                  onAccion={hasFilters ? clearAllFilters : (isAdmin ? () => { setBienEditing(null); setIsBienModalOpen(true); } : undefined)}
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
                  </ContextMenuTarget>
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
          <div className={STYLES.modalContent + ' mass-assignment-dialog w-[min(32rem,calc(100vw-2rem))] max-w-none !p-0 overflow-hidden rounded-[24px] shadow-2xl border border-line/80 dark:border-line'} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Asignación masiva de bienes">
            <div className="px-6 py-5 border-b border-line bg-surface-1 dark:border-white/10">
              <h2 className="text-lg font-bold text-content-1 dark:text-white">Asignar bienes seleccionados</h2>
              <p className="mt-1 text-sm leading-relaxed text-content-3">Se actualizarán {seleccionados.length} bienes. Elige solo los campos que quieres cambiar.</p>
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
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-line bg-surface-2/60 dark:border-white/10">
              <span className="text-xs text-content-3">{asignacionMasiva.funcionario === '__MANTENER__' && asignacionMasiva.ubicacion === '__MANTENER__' ? 'Selecciona al menos un cambio' : 'Los campos no elegidos se mantienen'}</span>
              <div className="flex gap-2">
              <button onClick={() => setMostrarAsignacionMasiva(false)} className="h-10 px-4 rounded-control text-sm font-semibold hover:bg-surface-2">Cancelar</button>
              <button
                disabled={asignacionMasiva.funcionario === '__MANTENER__' && asignacionMasiva.ubicacion === '__MANTENER__'}
                onClick={() => {
                  const funcionario = asignacionMasiva.funcionario === '__MANTENER__' ? undefined : asignacionMasiva.funcionario === '__SIN_ASIGNACION__' ? '' : asignacionMasiva.funcionario;
                  const ubicacion = asignacionMasiva.ubicacion === '__MANTENER__' ? undefined : asignacionMasiva.ubicacion === '__SIN_UBICACION__' ? '' : asignacionMasiva.ubicacion;
                  onAsignarMasivo?.({ ids: seleccionados, funcionario, ubicacion });
                  setMostrarAsignacionMasiva(false);
                }}
                className="h-10 px-5 rounded-control bg-brand text-white text-sm font-bold disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-content-3"
              >Aplicar cambios</button>
              </div>
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

      {observacionAbierta && (
        <Dialogo className={STYLES.modalOverlay} onCerrar={() => setObservacionAbierta(null)}>
          <section className={`${STYLES.modalContent} !w-[min(42rem,calc(100vw-2rem))] !max-w-none overflow-hidden`} role="dialog" aria-modal="true" aria-labelledby="observacion-bien-titulo" onClick={(event) => event.stopPropagation()}>
            <header className="flex items-start justify-between gap-4 border-b border-line bg-surface-2 px-5 py-4 sm:px-6">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300"><i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /></span>
                <div className="min-w-0">
                  <h2 id="observacion-bien-titulo" className="text-base font-bold text-content-1">Observación del bien</h2>
                  <span className="mt-1 inline-flex max-w-full items-center rounded-md border border-line bg-surface-1 px-2 py-1 font-mono text-[11px] font-bold text-content-1">{observacionAbierta.rotulo}</span>
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-content-2">
                    {observacionAbierta.ubicacion && <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-surface-1 px-2.5 py-1"><i className="fa-solid fa-location-dot text-danger" aria-hidden="true" /><span className="break-words">{observacionAbierta.ubicacion}</span></span>}
                    {observacionAbierta.funcionario && <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-surface-1 px-2.5 py-1"><i className="fa-solid fa-user-check text-ok" aria-hidden="true" /><span className="break-words">{observacionAbierta.funcionario}</span></span>}
                  </div>
                </div>
              </div>
              <IconButton titulo="Cerrar" icono="fa-xmark" variante="ghost" tamano="sm" onClick={() => setObservacionAbierta(null)} />
            </header>
            <div tabIndex={0} aria-label="Texto completo de la observación" className="max-h-[min(60dvh,32rem)] min-h-0 overflow-y-auto overscroll-contain bg-amber-50/40 px-5 py-4 text-sm leading-6 text-content-1 custom-scrollbar dark:bg-amber-400/[0.04] sm:px-6">
              <div className="whitespace-pre-wrap break-words">{observacionAbierta.texto}</div>
            </div>
            {(observacionAbierta.usuario || fechaHoraLegible(observacionAbierta.fecha)) && <p className="border-t border-line px-5 py-2.5 text-[10px] text-content-3 sm:px-6">{observacionAbierta.usuario ? `Último cambio del registro: ${observacionAbierta.usuario}` : ''}{fechaHoraLegible(observacionAbierta.fecha) ? `${observacionAbierta.usuario ? ' · ' : ''}${fechaHoraLegible(observacionAbierta.fecha)}` : ''}</p>}
            <footer className="flex justify-end border-t border-line bg-surface-2 px-5 py-3 sm:px-6">
              <Button variante="primary" tamano="md" onClick={() => setObservacionAbierta(null)}>Cerrar</Button>
            </footer>
          </section>
        </Dialogo>
      )}

      {mostrarBuscadorFlotante && (
        createPortal(<div className="inventory-floating-search fixed bottom-4 left-1/2 z-[110] w-[min(38rem,calc(100vw-2rem))] -translate-x-1/2 animate-slide-up sm:bottom-6" role="search" aria-label="Búsqueda rápida del inventario">
          <div className="flex min-h-14 items-center gap-2 rounded-full border border-brand/20 bg-surface-1/95 px-2.5 py-2 shadow-[0_16px_44px_rgba(14,45,62,.22)] backdrop-blur-xl ring-1 ring-white/60 transition-[box-shadow,transform] duration-200 focus-within:shadow-[0_18px_50px_rgba(14,45,62,.28)] dark:ring-white/5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-text" aria-hidden="true"><i className="fa-solid fa-magnifying-glass text-xs" /></span>
            <input
              type="search"
              ref={searchRef}
              aria-label="Buscar bien sin volver al inicio"
              placeholder="Buscar bien por rótulo, nombre o funcionario…"
              value={searchTerm}
              onFocus={() => setBuscadorRapidoFijado(true)}
              onChange={event => { setSearchTerm(event.target.value); setSearchInput(event.target.value); setCurrentPage(1); }}
              onKeyDown={event => { if (event.key === 'Enter' && event.currentTarget.value.trim()) guardarReciente(event.currentTarget.value); }}
              className="inventory-floating-search-input min-w-0 flex-1 border-0 bg-transparent px-1 py-2 text-sm font-medium text-content-1 outline-none placeholder:font-medium placeholder:text-content-3 focus:ring-0"
            />
            {searchTerm && <button type="button" onClick={() => { setSearchTerm(''); setSearchInput(''); setCurrentPage(1); }} title="Limpiar búsqueda" aria-label="Limpiar búsqueda rápida" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-content-3 hover:bg-surface-2 hover:text-content-1"><i className="fa-solid fa-xmark text-xs" /></button>}
            <span className="hidden h-6 w-px bg-line sm:block" aria-hidden="true" />
            <button type="button" onClick={() => { setBuscadorRapidoFijado(false); setBuscadorRapidoVisible(false); setBuscadorRapidoOculto(true); document.activeElement?.blur?.(); }} title="Ocultar búsqueda flotante" aria-label="Ocultar búsqueda rápida hasta volver al inicio" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-content-3 transition-colors hover:bg-surface-2 hover:text-content-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><i className="fa-solid fa-chevron-down text-[10px]" /></button>
          </div>
        </div>, document.body)
      )}

                </div>
  );
}
