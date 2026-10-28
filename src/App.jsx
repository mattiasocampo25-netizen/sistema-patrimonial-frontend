import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
import { lazyConReintento } from './utils/lazyConReintento';
import { STYLES, DEPENDENCIAS_UNP, ESTADOS_CONSERVACION, ORIGENES_FC04 } from './constants/appConstants';
import FiltroCombo from './components/FiltroCombo';
import { Pagination, Card, Button, StatTile, Badge } from './components/ui';
import AtajosModal from './components/modals/AtajosModal';
import AppShell from './components/shell/AppShell';
// Modales de apertura bajo demanda: carga diferida para acelerar el arranque
import localforage from 'localforage';
import LoginScreen from './components/LoginScreen';
import { supabase } from './supabaseClient';
// Modales pesados: carga diferida para acelerar el arranque
import { formatCurrency, generateId, parseDateInfo, formatDateText, normalizeStr, getPlaceholderLogo, convertirImagenABase64, getLogoPorDependencia, comprimirImagen, colorPorDependencia } from './utils/helpers';
import { useIdioma } from './utils/i18n';
import { conSello } from './services/syncBienes';
import { mapearFilasBienes } from './utils/csvBienes';
import { useToasts } from './hooks/useToasts';
import { useAuditoria } from './hooks/useAuditoria';
import { usePdfHandlers } from './hooks/usePdfHandlers';
import { useFuncionarios } from './hooks/useFuncionarios';
import { useAuthSession } from './hooks/useAuthSession';
import { useRealtimeSync } from './hooks/useRealtimeSync';
import { useFcModals } from './hooks/useFcModals';
import { useRestoreBackup } from './hooks/useRestoreBackup';
import AppModals from './components/AppModals';
import RestoreBackupModal from './components/RestoreBackupModal';
import NombreArchivoModal from './components/NombreArchivoModal';
import { registrarDialogoNombreArchivo } from './utils/fileNames.js';
import { useInventarioFiltros } from './hooks/useInventarioFiltros';
import { useDependencias } from './hooks/useDependencias';
import { pendienteDeFirma } from './utils/fc10Firmas';
import { detectarCambios, fusionarSobreFresco, detectarConflictos, describirCampos } from './services/escrituraSegura';
import { normalizarBien } from './utils/bienPublico';
import { copiarAlPortapapeles } from './utils/inventarioInteracciones.js';
import MaintenanceScreen from './components/MaintenanceScreen';
const AyudaView = lazyConReintento(() => import('./views/AyudaView'));
const ResumenView = lazyConReintento(() => import('./views/ResumenView'));
const UsuariosView = lazyConReintento(() => import('./views/UsuariosView'));
const AnunciosView = lazyConReintento(() => import('./views/AnunciosView'));
const Fc04View = lazyConReintento(() => import('./views/Fc04View'));
const Fc10View = lazyConReintento(() => import('./views/Fc10View'));
const Fc11View = lazyConReintento(() => import('./views/Fc11View'));
const FuncionariosView = lazyConReintento(() => import('./views/FuncionariosView'));
const AprobacionesView = lazyConReintento(() => import('./views/AprobacionesView'));
const AuditoriaView = lazyConReintento(() => import('./views/AuditoriaView'));
const DashboardView = lazyConReintento(() => import('./views/DashboardView'));
const InventarioView = lazyConReintento(() => import('./views/InventarioView'));
import { registrarAuditoria } from './services/auditService';
import { MAX_FOTOS_POR_BIEN } from './services/supabaseFreeTier';
import ErrorView from './views/ErrorView';
import InventarioCompartidoView from './views/InventarioCompartidoView';
import KioskBar, { BotonPantallaCompleta } from './components/KioskBar';
import { parseIdleSegundos } from './utils/kiosk';
import { obtenerProgramacion, guardarProgramacion, tocaEjecutar, construirCSVInventario, nombreArchivoInventario, descargarYArchivar } from './services/exportSchedule';

// La regla de dependencias de hooks se desactiva en este archivo a proposito:
//
// - El efecto del teclado usa setIsBienModalOpen y setBienEditing, que
//   vienen de un hook declarado mas abajo en el archivo: listarlos los
//   usaria antes de que existan (error de TDZ).
// - El efecto de la exportacion programada usa ejecutarExportacionProgramada,
//   que se recrea en cada render. No pasa nada: el `programacionRevisada`
//   hace que la revision solo ocurra una vez.
/* eslint-disable react-hooks/exhaustive-deps */

// Nota: papaparse y qrcode se importan dinámicamente donde se usan para no
// inflar el bundle inicial (ver executeProcessBienesCSV y pdfGenerators).
// Nota: STYLES y constantes globales viven en constants/appConstants
// (Fase 0 del split de este monolito).

/**
 * Esqueleto de carga de un modulo.
 *
 * Las vistas se descargan cuando se abren por primera vez. Mientras llega,
 * esto evita el salto de layout: misma altura, misma estructura.
 */
function CargaModulo() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 w-full" role="status" aria-label="Cargando modulo">
      <div className="h-8 w-56 rounded-control bg-surface-2 motion" />
      <div className="mt-3 h-4 w-80 max-w-full rounded-control bg-surface-2 motion" />
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-card bg-surface-2 motion" />
        ))}
      </div>
      <div className="mt-6 h-72 rounded-card bg-surface-2 motion" />
      <span className="sr-only">Cargando...</span>
    </div>
  );
}

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const publicBienId = urlParams.get('id') || urlParams.get('bienId');
  const publicShareToken = urlParams.get('compartir') || urlParams.get('share');
  // Rutas conocidas del sistema. Si la URL no corresponde a ninguna y tampoco
  // es la vista pública de un bien, se muestra el 404 en vez de un shell vacío.
  const RUTAS_CONOCIDAS = ['escaner', 'inventario', 'dashboard', 'usuarios', 'ayuda', 'auditoria', 'panel', 'kiosco'];
  const rutaActual = String(window.location.pathname || '/').replace(/^\/+|\/+$/g, '');
  const rutaDesconocida = rutaActual !== '' && !RUTAS_CONOCIDAS.includes(rutaActual.toLowerCase());
  // Modo kiosco: se activa con ?kiosk=1 en el link del QR. Agrega temporizador de
  // inactividad y controles de exhibition; no cambia cómo se leen los datos.
  const kioscoActivo = urlParams.get('kiosk') === '1';
  const kioscoIdle = kioscoActivo ? parseIdleSegundos(window.location.search) : 0;
  
  const [publicBienData, setPublicBienData] = useState(null);
  const [publicFotoAmpliada, setPublicFotoAmpliada] = useState(null);
  const [publicDescExpandida, setPublicDescExpandida] = useState(false);
  const { toasts, addToast, quitarToast } = useToasts();
  const [solicitudesNombreArchivo, setSolicitudesNombreArchivo] = useState([]);
  const solicitudNombreArchivo = solicitudesNombreArchivo[0] || null;
  useEffect(() => registrarDialogoNombreArchivo((solicitud) => {
    setSolicitudesNombreArchivo(actuales => [...actuales, solicitud]);
  }), []);
  const resolverNombreArchivo = (accion) => {
    if (!solicitudNombreArchivo) return;
    solicitudNombreArchivo[accion]();
    setSolicitudesNombreArchivo(actuales => actuales.slice(1));
  };
  // Sesión y autenticación: hook extraído (Fase 6). La UI usa los mismos nombres.
  const { isAuthenticated, currentUser, setCurrentUser, isAdmin, esDesarrollador, loginUser, setLoginUser, loginPass, setLoginPass, showPassword, setShowPassword, loginError, isProcessing, setIsProcessing, dependenciaActual, setDependenciaActual, showLogoutConfirm, setShowLogoutConfirm, mantenimiento, versionApp, isMantenimientoModalOpen, setIsMantenimientoModalOpen, isSavingMant, mostrarLoginDev, setMostrarLoginDev, mantBypass, handleLogin, handleLogout, saveMantenimiento } = useAuthSession({ notify: addToast });
  const [appLogo, _setAppLogo] = useState(() => localStorage.getItem('logoOficial'));
  
  
  // Modo oscuro: 3 estados posibles. Sin elección guardada, sigue la preferencia
  // del sistema (prefers-color-scheme) y se actualiza solo si el usuario la cambia
  // mientras la app está abierta. Antes caía siempre en `true` (oscuro).
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    try { return window.matchMedia('(prefers-color-scheme: dark)').matches; } catch { return true; }
  });
  // Solo persiste cuando el usuario elige tema. Si se escribiera en el primer
  // render, `theme` pasaría a dark/light y el sistema dejaría de gobernar.
  const fijarTemaUsuario = useCallback((valor) => {
    const next = typeof valor === 'function' ? valor(darkMode) : valor;
    setDarkMode(next);
    try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch { /* ignore */ }
  }, [darkMode]);
  // Escuchar cambios del tema del sistema SOLO si el usuario no fijó uno manual.
  useEffect(() => {
    let mq;
    try { mq = window.matchMedia('(prefers-color-scheme: dark)'); } catch { return; }
    const alCambiar = (e) => {
      const saved = localStorage.getItem('theme');
      if (saved !== 'dark' && saved !== 'light') setDarkMode(e.matches);
    };
    if (mq.addEventListener) mq.addEventListener('change', alCambiar);
    else if (mq.addListener) mq.addListener(alCambiar); // Safari < 14
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', alCambiar);
      else if (mq.removeListener) mq.removeListener(alCambiar);
    };
  }, []);
  // Nota: la bandera 'chunk_reintentado' NO se limpia aquí a propósito.
  // utils/lazyConReintento la usa para recargar UNA vez por sesión cuando un
  // chunk falla (deploy intermedio). Si se borrara en cada montaje, el ciclo
  // montar -> borrar -> fallar -> recargar -> montar se repetiría sin fin.
  // Sincronizar clase 'dark' en <html> para que el CSS de contraste alto
  // (.dark.contrast-more) y los temas oscuro/claro funcionen globalmente.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);
  // FORMATO_PDF vive en constants/appConstants (se usa en usePdfHandlers).
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [activeTab, setActiveTab] = useState(() => new URLSearchParams(window.location.search).get('tab') === 'inventario' ? 'inventario' : 'dashboard');
  const [isLoading, setIsLoading] = useState(true);
  // Modo mantenimiento: aviso global que bloquea el uso para todos
  // Aviso "Sistema Actualizado": una vez por versión, para todo usuario autenticado
  useEffect(() => {
    try {
      const vista = localStorage.getItem('unp_last_version');
      const v = mantenimiento?.ultima_version;
      if (v && v !== vista && isAuthenticated && !mantenimiento?.en_mantenimiento) setShowChangelog(true);
    } catch {}
  }, [mantenimiento, isAuthenticated]);

  const [showDependenciaConfirm, setShowDependenciaConfirm] = useState(false);
  const [pendingDependencia, setPendingDependencia] = useState('');
  const [bienes, setBienes] = useState([]);
 
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  // Ficha 360 del bien: timeline de trazabilidad
  








  const [dbError, setDbError] = useState(false);

  const fileInputFuncionariosRef = useRef(null);

  const [fc10List, setFc10List] = useState([]); 
  const [fc11List, setFc11List] = useState([]); 
  const [fc04List, setFc04List] = useState([]);
  const [usuariosList, setUsuariosList] = useState([]); 
  const [funcionariosPadron, setFuncionariosPadron] = useState([]); 
  const [estructurasDB, setEstructurasDB] = useState([]);
  // Ficha 360: la lee el realtime (H5) y el memo de abajo; vive en App.
  const [fichaBien, setFichaBien] = useState(null);
  const [eventosAuditFicha, setEventosAuditFicha] = useState([]);
  const eventosFicha = useMemo(() => {
    if (!fichaBien) return [];
    const ev = [];
    const fmt = (f) => { try { return formatDateText(f) || f; } catch { return f; } };
    if (fichaBien.fechaAdquisicion) {
      ev.push({ fecha: fichaBien.fechaAdquisicion, fechaFmt: fmt(fichaBien.fechaAdquisicion), tipo: 'alta', titulo: 'Alta en inventario', detalle: `Adquirido el ${fmt(fichaBien.fechaAdquisicion)}` });
    }
    fc10List.filter(fc => fc.bienId === fichaBien.id).forEach(fc => {
      const f = fc.entregadoFecha || fc.fechaGeneracion;
      ev.push({
        fecha: f || '', fechaFmt: f ? fmt(f) : 'Sin fecha', tipo: 'asignacion',
        titulo: `Acta FC-10 · ${fc.funcionarioNombre || 'Sin responsable'}`,
        detalle: fc.devolucionFecha ? `Devuelto el ${fmt(fc.devolucionFecha)}` : `Entregado en ${fc.entregadoLugar || fc.dependencia || ''}`.trim()
      });
    });
    fc11List.filter(fc => fc.bienId === fichaBien.id).forEach(fc => {
      const rem = fc.dependenciaRemitente || fc.remitente || '';
      const dest = fc.dependenciaDestinataria || fc.destinatario || '';
      ev.push({
        fecha: fc.fecha || '', fechaFmt: fc.fecha ? fmt(fc.fecha) : 'Sin fecha', tipo: 'traslado',
        titulo: `Traslado ${rem} → ${dest}`,
        detalle: fc.motivo || fc.tipoRegistro || ''
      });
    });
    eventosAuditFicha.forEach(row => {
      const a = String(row.accion || '').toUpperCase();
      const tipo = a.includes('CREA') || a.includes('ALTA') ? 'alta' : a.includes('BAJA') || a.includes('ELIMINA') ? 'baja' : a.includes('MODIF') ? 'modificacion' : a.includes('FC10') || a.includes('ASIGNA') ? 'asignacion' : a.includes('FC11') || a.includes('TRASLADO') ? 'traslado' : 'otro';
      let detalle = '';
      let cambios = null;
      try {
        const m = typeof row.mensaje === 'string' ? JSON.parse(row.mensaje) : row.mensaje;
        if (m && typeof m === 'object') {
          if (m.cambios && m.cambios.anterior && m.cambios.nuevo) {
            cambios = m.cambios;
            const keys = Object.keys(m.cambios.nuevo).filter(k => JSON.stringify(m.cambios.nuevo[k]) !== JSON.stringify(m.cambios.anterior[k]));
            detalle = keys.length ? `Campos: ${keys.slice(0, 6).join(', ')}${keys.length > 6 ? '…' : ''}` : 'Registro actualizado';
          } else {
            const bits = [];
            if (m.solicitante) bits.push(`Por: ${m.solicitante}`);
            if (m.motivo) bits.push(`Motivo: ${m.motivo}`);
            detalle = bits.join(' · ');
          }
        } else if (m) detalle = String(m);
      } catch { detalle = String(row.mensaje || ''); }
      ev.push({ fecha: row.fecha || '', fechaFmt: row.fecha ? fmt(String(row.fecha).split('T')[0]) : 'Sin fecha', tipo, titulo: row.titulo || row.accion || 'Evento', detalle, usuario: row.usuario || '', cambios });
    });
    return ev.sort((x, y) => String(y.fecha || '').localeCompare(String(x.fecha || '')));
  }, [fichaBien, eventosAuditFicha, fc10List, fc11List]);
  // Fotos del bien: galería en ficha (máx. 5, Storage + URLs en el registro)
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const subirFotoBien = async (file) => {
    if (!fichaBien || !file) return;
    if (!file.type.startsWith('image/')) return addToast('El archivo debe ser una imagen.', 'warning');
    setSubiendoFoto(true);
    let rutaSubida = null;
    try {
      const blob = await comprimirImagen(file);
      const nombre = `${fichaBien.id}/${generateId()}.jpg`;
      rutaSubida = nombre;
      const { error: upErr } = await supabase.storage.from('fotos-bienes').upload(nombre, blob, { contentType: 'image/jpeg', upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('fotos-bienes').getPublicUrl(nombre);
      // Tope de 3 fotos: Storage del plan Free tiene 1 GB y cada
      // foto pesa ~120 KB. Una galería breve deja espacio para más bienes
      // (las fichas se revisan con 2 o 3 fotos).
      const fotos = [...(fichaBien.fotos || []), { url: pub.publicUrl, ruta: nombre, fecha: new Date().toISOString(), usuario: currentUser?.username || 'Usuario' }].slice(-MAX_FOTOS_POR_BIEN);
      const sobrantes = (fichaBien.fotos || []).filter(f => !fotos.includes(f));
      const actualizado = { ...fichaBien, fotos };
      const { error: dbErr } = await supabase.from('bens').update(conSello({ data: actualizado })).eq('id', fichaBien.id);
      if (dbErr) throw dbErr;
      rutaSubida = null;
      // Actualiza primero la referencia en Postgres; solo entonces borra fotos
      // antiguas para no dejar rutas rotas si falla la escritura del bien.
      if (sobrantes.length > 0) {
        const rutasAntiguas = sobrantes.map(f => f.ruta).filter(Boolean);
        if (rutasAntiguas.length) {
          const { error: errorLimpieza } = await supabase.storage.from('fotos-bienes').remove(rutasAntiguas);
          if (errorLimpieza) addToast('La foto se guardó, pero no se pudieron limpiar algunos archivos anteriores.', 'warning');
        }
      }
      // Releer del servidor como fuente de verdad (la galería muestra exactamente lo guardado)
      let final = actualizado;
      try {
        const { data: releido, error: readErr } = await supabase.from('bens').select('*').eq('id', fichaBien.id).maybeSingle();
        if (!readErr && releido) {
          const d = typeof releido.data === 'string' ? JSON.parse(releido.data) : (releido.data || {});
          final = { id: releido.id, ...d };
        }
      } catch {}
      setBienes(prev => prev.map(b => (b.id === fichaBien.id ? final : b)));
      setFichaBien(final);
      const kb = Math.round(blob.size / 1024);
      addToast(`Foto agregada (${kb} KB).`, 'success');
    } catch {
      if (rutaSubida) {
        try { await supabase.storage.from('fotos-bienes').remove([rutaSubida]); } catch {}
      }
      addToast('No se pudo subir la foto. Verifica el bucket fotos-bienes en Supabase.', 'error');
    } finally {
      setSubiendoFoto(false);
    }
  };
  const eliminarFotoBien = async (foto) => {
    if (!fichaBien || !foto) return;
    try {
      const actualizado = { ...fichaBien, fotos: (fichaBien.fotos || []).filter(f => f.url !== foto.url) };
      const { error } = await supabase.from('bens').update(conSello({ data: actualizado })).eq('id', fichaBien.id);
      if (error) throw error;
      if (foto.ruta) {
        const { error: errorStorage } = await supabase.storage.from('fotos-bienes').remove([foto.ruta]);
        if (errorStorage) addToast('La foto se quitó del bien, pero no se pudo limpiar el archivo del almacenamiento.', 'warning');
      }
      setBienes(prev => prev.map(b => (b.id === fichaBien.id ? actualizado : b)));
      setFichaBien(actualizado);
      addToast('Foto eliminada.', 'success');
    } catch {
      addToast('No se pudo eliminar la foto.', 'error');
    }
  };

  // Filtros/búsqueda/paginación del inventario: hook extraído (Fase 3).
  // La UI usa los mismos nombres vía desestructuración.
  const { setSearchInput, searchTerm, debouncedSearchTerm, setSearchTerm, orden, setOrden, filtroFuncionario, setFiltroFuncionario, filtroUbicacion, setFiltroUbicacion, filtroAnio, setFiltroAnio, setFiltroMes, filtroSubcuenta, setFiltroSubcuenta, filtroAnalitico1, setFiltroAnalitico1, filtroAnalitico2, setFiltroAnalitico2, setFiltroQR, filtroFC10, setFiltroFC10, filtroEstado, setFiltroEstado, filtroPendiente, setFiltroPendiente, currentPage, setCurrentPage, clearAllFilters, hasFilters, vistasGuardadas, nombreVista, setNombreVista, mostrarGuardarVista, setMostrarGuardarVista, guardarVistaActual, aplicarVista, eliminarVista, funcionariosUnicos, ubicacionesUnicas, aniosUnicos, subcuentasUnicas, analiticos1Unicos, stats, pendientes, filteredBienes, itemsPaginados, totalPages, itemsPorPagina, cambiarPaginaTam, seleccionados, toggleSeleccion, limpiarSeleccion, vistaInv, cambiarVistaInv } = useInventarioFiltros({ bienes, dependenciaActual, fc10List, username: currentUser?.username, notify: addToast });
  // Sugerencias para auto_completado (memoizado: evita refiltrar miles de bienes en cada render)
  const sugerenciasBienesDep = useMemo(
    () => bienes.filter(b => normalizeStr(b.dependencia) === normalizeStr(dependenciaActual)),
    [bienes, dependenciaActual]
  );
  const padronDep = useMemo(
    () => funcionariosPadron.filter(f => f.dependencia === dependenciaActual),
    [funcionariosPadron, dependenciaActual]
  );
  // Dominio de dependencias y ubicaciones: hook extraído (modularización).
  // Centraliza lecturas y escrituras sobre dependencias, ubicaciones y sus
  // cascadas en bens, funcionarios, fc10, fc11 y fc04.
  const {
    dependenciasList, isDependenciasModalOpen, setIsDependenciasModalOpen,
    isSavingDep, todasDependencias,
    guardarDependencia, fusionarDependencia, eliminarDependencia,
    verPadronDependencia, asignarFuncionarioAUbicacion,
    ubicacionesList, isUbicacionesModalOpen, setIsUbicacionesModalOpen,
    isSavingUbicacion, ubicacionesDep, conteosUbicacion,
    guardarUbicacion, eliminarUbicacion,
    dependenciasDetectadas, conteosDependencia,
  } = useDependencias({
    isAuthenticated,
    dependenciaActual,
    setDependenciaActual,
    clearAllFilters,
    setActiveTab,
    notify: addToast,
    bienes,
    setBienes,
    funcionariosPadron,
    setFuncionariosPadron,
    fc10List,
    setFc10List,
    fc11List,
    setFc11List,
    fc04List,
    setFc04List,
  });
  // Resalta la fila recién creada/editada en el inventario.
  const [lastMutatedBienId, setLastMutatedBienId] = useState(null);
  // FC-10 que se está firmando en este momento: solo una tarjeta muestra el
  // spinner, para que un doble clic no dispare dos registros de firma.
  const [firmandoId, setFirmandoId] = useState(null);
  // Acta que se está poniendo en trámite (mismo bloqueo anti doble clic).
  const [poniendoEnTramite, setPoniendoEnTramite] = useState(null);
  const marcarBienMutado = (id) => {
    setLastMutatedBienId(id);
    setTimeout(() => setLastMutatedBienId(prev => (prev === id ? null : prev)), 4000);
  };
  // QR en lote de la selección del inventario.
  const qrLoteSeleccion = () => {
    const lista = filteredBienes.filter(b => seleccionados.includes(b.id));
    if (lista.length === 0) return addToast('Selecciona al menos un bien.', 'warning');
    handleBulkLabelPNGZip(lista);
  };
  const exportarSeleccionInventario = (formato) => {
    const lista = filteredBienes.filter(b => seleccionados.includes(b.id));
    if (!lista.length) return addToast('Selecciona al menos un bien para exportar.', 'warning');
    if (formato === 'xlsx') handleExportInventarioExcel(lista);
    else handleExportInventarioCSV(lista);
  };
  const editarCampoBienEnLinea = async (bien, campo, valorNuevo) => {
    const permitidos = new Set(['funcionario', 'ubicacion']);
    if (!bien?.id || !permitidos.has(campo)) return false;
    const anterior = String(bien[campo] || '');
    if (anterior.trim() === String(valorNuevo || '').trim()) return true;
    if (!navigator.onLine) {
      addToast('La edición rápida requiere conexión. Abre la ficha de edición para guardar sin conexión.', 'warning');
      return false;
    }
    const actualizado = { ...bien, [campo]: String(valorNuevo || '').trim() };
    const payload = conSello({ data: actualizado });
    try {
      let query = supabase.from('bens').update(payload).eq('id', bien.id);
      if (bien.updated_at) query = query.eq('updated_at', bien.updated_at);
      const { data, error } = await query.select('id').maybeSingle();
      if (error) throw error;
      if (!data) { addToast('El bien cambió en otra sesión. Actualiza la página antes de editarlo.', 'warning'); return false; }
      const guardado = { ...actualizado, updated_at: payload.updated_at };
      setBienes(prev => prev.map(b => b.id === bien.id ? guardado : b));
      try {
        const claveCache = `bienes_cache_${dependenciaActual}`;
        const cache = await localforage.getItem(claveCache);
        if (Array.isArray(cache)) await localforage.setItem(claveCache, cache.map(b => b.id === bien.id ? guardado : b));
      } catch {}
      await registrarAuditoria({
        usuario: currentUser?.username || 'Usuario', dependencia: dependenciaActual,
        accion: 'MODIFICACION', entidad: 'BIEN', entidadId: bien.id,
        detalles: { rotulo: bien.rotulo, cambios: { anterior: { [campo]: anterior }, nuevo: { [campo]: guardado[campo] } } }
      });
      const deshacer = async () => {
        const restaurado = { ...guardado, [campo]: anterior };
        const payloadReversion = conSello({ data: restaurado });
        let revertQuery = supabase.from('bens').update(payloadReversion).eq('id', bien.id).eq('updated_at', guardado.updated_at);
        const { data: revertido, error: errorReversion } = await revertQuery.select('id').maybeSingle();
        if (errorReversion || !revertido) return addToast('No se pudo deshacer: el bien volvió a cambiar.', 'warning');
        const bienRestaurado = { ...restaurado, updated_at: payloadReversion.updated_at };
        setBienes(prev => prev.map(b => b.id === bien.id ? bienRestaurado : b));
        try {
          const claveCache = `bienes_cache_${dependenciaActual}`;
          const cache = await localforage.getItem(claveCache);
          if (Array.isArray(cache)) await localforage.setItem(claveCache, cache.map(b => b.id === bien.id ? bienRestaurado : b));
        } catch {}
        await registrarAuditoria({
          usuario: currentUser?.username || 'Usuario', dependencia: dependenciaActual,
          accion: 'MODIFICACION_DESHECHA', entidad: 'BIEN', entidadId: bien.id,
          detalles: { rotulo: bien.rotulo, cambios: { anterior: { [campo]: guardado[campo] }, nuevo: { [campo]: anterior } } }
        });
        addToast('Cambio deshecho.', 'success');
      };
      addToast(`${campo === 'funcionario' ? 'Responsable' : 'Ubicación'} actualizado.`, 'success', { action: { label: 'Deshacer', onClick: deshacer } });
      return true;
    } catch (error) {
      console.error('No se pudo guardar la edición rápida:', error);
      addToast('No se pudo guardar el cambio. Vuelve a intentarlo.', 'error');
      return false;
    }
  };
  const asignarBienesSeleccionados = async ({ ids, funcionario, ubicacion }) => {
    const objetivo = bienes.filter(b => ids.includes(b.id));
    if (!objetivo.length || (!funcionario && !ubicacion)) return;
    setIsProcessing({ active: true, text: `Actualizando ${objetivo.length} bienes...` });
    const guardados = [];
    const errores = [];
    try {
      for (const bien of objetivo) {
        const actualizado = {
          ...bien,
          ...(funcionario !== undefined ? { funcionario, funcionarioDoc: funcionario ? bien.funcionarioDoc || '' : '', funcionarioCargo: funcionario ? bien.funcionarioCargo || '' : '' } : {}),
          ...(ubicacion !== undefined ? { ubicacion } : {})
        };
        const payload = conSello({ data: actualizado });
        const { error } = await supabase.from('bens').update(payload).eq('id', bien.id);
        if (error) errores.push(bien.rotulo || bien.id);
        else guardados.push({ ...actualizado, updated_at: payload.updated_at });
      }
      if (guardados.length) {
        const guardadosPorId = new Map(guardados.map(b => [b.id, b]));
        setBienes(prev => prev.map(b => guardadosPorId.get(b.id) || b));
        await registrarAuditoria({
          usuario: currentUser?.username || 'Usuario', dependencia: dependenciaActual,
          accion: 'MODIFICACION_MASIVA', entidad: 'BIEN', entidadId: `${guardados.length} bienes`,
          detalles: { cantidad: guardados.length, ids: guardados.map(b => b.id), funcionario, ubicacion }
        });
        limpiarSeleccion();
      }
      if (errores.length) addToast(`${guardados.length} actualizados; ${errores.length} no se pudieron guardar.`, 'warning');
      else addToast(`${guardados.length} bienes actualizados.`, 'success');
    } catch {
      addToast('No se pudo completar la asignación masiva.', 'error');
    } finally {
      setIsProcessing({ active: false, text: '' });
    }
  };
  const bajaMasiva = async (ids) => {
    if (!ids || ids.length === 0) return;
    setIsProcessing({ active: true, text: `Procesando ${ids.length} bienes...` });
    try {
      // supabase-js NO lanza en errores de Postgres/RLS: resuelve con { error }.
      // Sin comprobación, la baja anunciaba éxito y además dejaba una entrada
      // de auditoría de "bienes dados de baja" que nunca ocurrieron.
      if (isAdmin) {
        const objetivo = bienes.filter(x => ids.includes(x.id));
        let fallos = 0;
        for (const b of objetivo) {
          const r = await supabase.from('bens').update(conSello({ data: { ...b, estadoConservacion: 'De Baja' } })).eq('id', b.id);
          if (r.error) fallos++;
        }
        if (fallos > 0) throw new Error(`${fallos} de ${objetivo.length} bienes no se pudieron actualizar`);
        setBienes(prev => prev.map(b => (ids.includes(b.id) ? { ...b, estadoConservacion: 'De Baja' } : b)));
        await registrarAuditoria({
          usuario: currentUser?.username || 'Admin', dependencia: dependenciaActual,
          accion: 'ELIMINACION_O_BAJA', entidad: 'BIEN', entidadId: `${ids.length} bienes`,
          detalles: { cantidad: ids.length, ids }
        });
        addToast(`${ids.length} bienes dados de baja.`, 'success');
      } else {
        const filas = ids.map(id => {
          const b = bienes.find(x => x.id === id);
          const sid = generateId();
          return { id: sid, data: { id: sid, bienId: id, rotulo: b?.rotulo, descripcion: b?.descripcion, ubicacion: b?.ubicacion, funcionario: b?.funcionario, solicitante: currentUser?.username || 'Usuario', dependencia: dependenciaActual, tipo: 'BAJA_BIEN', estado: 'PENDIENTE', motivo: 'Baja masiva desde inventario', created_at: new Date().toISOString() } };
        });
        const { error: errSol } = await supabase.from('notificaciones').insert(filas);
        if (errSol) throw errSol;
        setNotificaciones(prev => [...filas.map(f => ({ id: f.id, ...f.data })), ...prev]);
        addToast(`${ids.length} solicitudes de baja enviadas.`, 'success');
      }
      limpiarSeleccion();
    } catch {
      addToast('No se pudo completar la baja masiva.', 'error');
    } finally {
      setIsProcessing({ active: false, text: '' });
    }
  };
  // Atajos: "/" buscador · Ctrl/Cmd+K paleta · N nuevo bien · ? lista de atajos
  const searchRef = useRef(null);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [isAtajosOpen, setIsAtajosOpen] = useState(false);
  const ultimaTeclaG = useRef(0);
  useEffect(() => {
    const TABS_ATAJO = {
      d: 'dashboard', r: 'resumen', i: 'inventario', f: 'funcionarios',
      c: 'fc04', a: 'fc10', t: 'fc11', u: 'usuarios', h: 'ayuda', b: 'aprobaciones'
    };
    const onKey = (e) => {
      if (!e || typeof e.key !== 'string') return;
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === 'k') {
        e.preventDefault();
        setCmdOpen(v => !v);
        return;
      }
      if (e.key === 'Escape') { ultimaTeclaG.current = 0; return; }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      const escribiendo = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      if (e.key === '/' && !escribiendo) {
        if (activeTab !== 'inventario' || cmdOpen) return;
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (e.key === '?' && !escribiendo && !cmdOpen) {
        e.preventDefault();
        setIsAtajosOpen(true);
        return;
      }
      if ((k === 'n') && !escribiendo && !cmdOpen && !isAtajosOpen) {
        if (activeTab !== 'inventario') return;
        if (document.querySelector('.modalOverlay')) return;
        e.preventDefault();
        setBienEditing(null);
  // `setIsBienModalOpen` y `setBienEditing` son setters de useState (estables),
  // pero se decluan DESPUES de este efecto: listarlos aqui los usaria antes
  // de que existan (error de TDZ).
        setIsBienModalOpen(true);
        return;
      }
      // Secuencias g+letra para navegar (con ventana de 800ms)
      if (escribiendo || cmdOpen) return;
      const ahora = Date.now();
      if (k === 'g') { ultimaTeclaG.current = ahora; return; }
      if (ahora - ultimaTeclaG.current < 800 && TABS_ATAJO[k]) {
        ultimaTeclaG.current = 0;
        e.preventDefault();
        setActiveTab(TABS_ATAJO[k]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeTab, cmdOpen, isAtajosOpen]);
  // Actas que esperan firma. Vive en App porque lo necesitan dos lugares: el
  // badge del header (para verlo desde cualquier modulo) y la bandeja del
  // dashboard (con el detalle de a quien le toca).
  const actasPorFirmarCount = useMemo(
    () => fc10List.filter(fc => !fc.devolucionFecha && pendienteDeFirma(fc)).length,
    [fc10List]
  );

  // Evita dobles registros de la misma firma (doble clic o doble submit).
  const firmarConBloqueo = async (fc) => {
    if (!fc || firmandoId) return;
    setFirmandoId(fc.id);
    try { await registrarFirmaFC10(fc); } finally { setFirmandoId(null); }
  };

  // Cierra el ciclo de las dos firmas de una vez (el caso normal: el PDF vuelve
  // con ambas firmas puestas). Mismo bloqueo anti doble clic.
  const firmarAmbasConBloqueo = async (fc) => {
    if (!fc || firmandoId) return;
    setFirmandoId(fc.id);
    try { await registrarAmbasFirmasFC10(fc); } finally { setFirmandoId(null); }
  };

  const ponerEnTramiteConBloqueo = async (fc) => {
    if (!fc || poniendoEnTramite) return;
    setPoniendoEnTramite(fc.id);
    try { await ponerFC10EnTramite(fc); } finally { setPoniendoEnTramite(null); }
  };

  const irTabGlobal = (tab, texto) => {
    if (tab === 'funcionarios' && texto) setSearchFuncionarioInput(texto);
    setActiveTab(tab);
  };
  // Tour guiado: pasos según rol, auto-inicio solo la primera vez
  const [tourPaso, setTourPaso] = useState(-1);
  const pasosTour = useMemo(() => {
    const nombreRol = esDesarrollador ? 'Desarrollador' : isAdmin ? 'Administrador' : 'Funcionario';
    const base = [
      { tab: 'dashboard', selector: null, titulo: `Bienvenido, ${nombreRol}`, texto: 'Recorrido adaptado a tus permisos y tareas más frecuentes. Puedes omitirlo y retomarlo cuando quieras desde Centro de Ayuda.' },
      { tab: 'dashboard', selector: '[data-tour="dash-stats"]', titulo: 'Métricas accionables', texto: 'Cada tarjeta filtra el inventario al hacer clic: activos, con QR, sin FC-10 y pendientes de QR.' },
      { tab: 'dashboard', selector: '[data-tour="dash-pendientes"]', titulo: 'Atención requerida', texto: 'Tu lista de trabajo: lo que falta por etiquetar, asignar, ubicar o regularizar, con acceso directo.' },
      { tab: 'dashboard', selector: '[data-tour="dash-firmas"]', titulo: 'Actas por firmar', texto: 'Cuando alguien firma en Acrobat, te aparece acá para que registres la firma. Nunca te tenés que acordar: el botón del encabezado te lleva directo.' },
      { tab: 'inventario', selector: '[data-tour="inv-search"]', titulo: 'Búsqueda robusta', texto: 'Ignora tildes y entiende varias palabras. Atajos: "/" enfoca aquí y Ctrl+K abre la búsqueda global.' },
      { tab: 'inventario', selector: '[data-tour="inv-table"]', titulo: 'Acciones por fila', texto: 'Desde cada bien: ficha 360 con trazabilidad, QR, acta FC-10, traslado y edición.' },
      { tab: null, selector: '[data-tour="scan"]', titulo: 'Escáner QR', texto: 'Con la cámara del celular o una lectora USB localizas cualquier bien al instante.' },
    ];
    if (esDesarrollador) {
      base.push(
        { tab: 'auditoria', selector: '[data-tour="aud-kpis"]', titulo: 'Auditoría y salud de datos', texto: 'Revisa los eventos, la conciliación física, los muestreos y el uso de la base.' },
        { tab: 'usuarios', selector: null, titulo: 'Administración de usuarios', texto: 'Gestiona accesos y permisos. Las opciones administrativas solo aparecen para tu rol.' },
        { tab: 'anuncios', selector: null, titulo: 'Anuncios del sistema', texto: 'Publica avisos para los usuarios de la plataforma.' },
        { tab: 'ayuda', selector: null, titulo: 'Listo para trabajar', texto: 'El Centro de Ayuda contiene esta guía, atajos y novedades.' }
      );
    } else if (isAdmin) {
      base.push(
        { tab: 'auditoria', selector: '[data-tour="aud-kpis"]', titulo: 'Módulo de Auditoría', texto: 'Consulta el libro de eventos, la conciliación física, el muestreo aleatorio y la salud de datos.' },
        { tab: 'aprobaciones', selector: null, titulo: 'Aprobaciones', texto: 'Revisa solicitudes y aplica decisiones con su registro de auditoría.' },
        { tab: 'ayuda', selector: null, titulo: 'Listo para trabajar', texto: 'Eso fue lo esencial. Encontrarás esta guía y las novedades de cada versión en el Centro de Ayuda.' }
      );
    } else {
      base.push(
        { tab: 'resumen', selector: '[data-tour="nav-resumen"]', titulo: 'Mi Dependencia', texto: 'Tu vista de solo lectura: números, pendientes y últimas asignaciones sin riesgo de romper nada.' },
        { tab: 'ayuda', selector: null, titulo: 'Listo para trabajar', texto: 'Eso fue lo esencial. Encontrarás esta guía y las novedades de cada versión en el Centro de Ayuda.' }
      );
    }
    return base;
  }, [isAdmin, esDesarrollador]);
  useEffect(() => {
    if (isAuthenticated && localStorage.getItem('tour_visto_v1') !== '1') {
      const t = setTimeout(() => setTourPaso(0), 900);
      return () => clearTimeout(t);
    }
  }, [isAuthenticated]);
  const cerrarTour = (_completado) => {
    setTourPaso(-1);
    try { localStorage.setItem('tour_visto_v1', '1'); } catch {}
  };
  // PENDIENTE_LABELS vive en constants/appConstants (se usa en InventarioView).
  // Dominio de auditoría: hook extraído (Fase 6). La vista recibe los mismos nombres.
  const { auditoriaList, isLoadingAud, searchAud, setSearchAud, filtroAccionAud, setFiltroAccionAud, filtroUsuarioAud, setFiltroUsuarioAud, usuariosAud, desdeAud, setDesdeAud, hastaAud, setHastaAud, conteoCodigos, setConteoCodigos, conteoInput, setConteoInput, muestraN, setMuestraN, muestraUbicacion, setMuestraUbicacion, conteoUbicacion, setConteoUbicacion, muestra, verificadosMuestra, setVerificadosMuestra, paginaAud, totalAud, alcanceAud, setAlcanceAud, kpisAud, accionesUnicasAud, fetchAuditoria, actorAud, detalleAudCorto, tonoAccionAud, evolucionValor, maxEvolucion, formatoCortoGs, saludDatos, usoDb, alertaDb, errorUsoDb, ultimoBackup, resultadoConteo, agregarCodigoConteo, descargarActaConteoPDF, descargarActaMuestreoPDF, exportarConteoCSV, guardarActaConteo, generarMuestra, guardarActaMuestreo } = useAuditoria({
    bienes, fc10List, fc11List, funcionariosPadron, dependenciaActual,
    currentUser, ubicacionesUnicas, activeTab, isAdmin,
    notify: addToast,
    // resolveLogoImg se define más abajo: wrapper perezoso para no romper TDZ.
    resolveLogoImg: (...a) => resolveLogoImg(...a),
    setIsProcessing
  });
  // currentPage, hasFilters y vistas viven en useInventarioFiltros (Fase 3).
  const [fc10Year, setFc10Year] = useState(new Date().getFullYear().toString()); 
  const [fc10Month, setFc10Month] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [_searchConsolidadoModal, _setSearchConsolidadoModal] = useState('');
  const [isConsolidatedFC10ModalOpen, setIsConsolidatedFC10ModalOpen] = useState(false);

  const _fc10Map = useMemo(() => {
    const map = new Map();
    fc10List.forEach(fc => {
      if (fc.bienId && !fc.devolucionFecha) map.set(fc.bienId, fc);
    });
    return map;
  }, [fc10List]);

  const requestDependenciaChange = (newDep) => {
    setPendingDependencia(newDep);
    setShowDependenciaConfirm(true);
  };

  const confirmDependenciaChange = () => {
    setDependenciaActual(pendingDependencia);
    setShowDependenciaConfirm(false);
    clearAllFilters();
    addToast(`Entorno cambiado a ${pendingDependencia}`, "success");
  };
  
  // Estado compartido entre dominios (H4 lo consume antes de que exista H8):
  // vive en App para no crear referencia circular por orden de hooks.
  const [itemToDelete, setItemToDelete] = useState(null);
  const [motivoSolicitudBaja, setMotivoSolicitudBaja] = useState('');
  const [pendingCSVImport, setPendingCSVImport] = useState(null);
  // Dominio de funcionarios/padrón: hook extraído (Fase 6). La UI usa los mismos nombres.
  const { setCurrentPaginaFuncionarios, isFuncionarioModalOpen, setIsFuncionarioModalOpen, funcionarioToEdit, isNewFuncionarioModalOpen, setIsNewFuncionarioModalOpen, isCSVPreviewOpen, setIsCSVPreviewOpen, csvPreviewData, setCsvPreviewData, searchFuncionarioInput, setSearchFuncionarioInput, funcionariosPurosDependencia, funcionariosPaginados, funcionariosConDatos, filtroCargo, setFiltroCargo, cargosFuncionarios, sincronizarBienesConPadron, handleFileUploadFuncionarios, executeProcessFuncionariosCSV, handleSaveManualFuncionario, confirmCSVImportFuncionarios, handleDeleteFuncionario, handleEditFuncionario, saveFuncionarioEdit, renderPaginationFuncionarios } = useFuncionarios({
    funcionariosPadron, setFuncionariosPadron, dependenciaActual,
    bienes, setBienes, fc10List, currentUser, isAdmin,
    notify: addToast, setIsProcessing, setItemToDelete, fileInputFuncionariosRef,
    setPendingCSVImport
  });

  // 2. Calculamos el total de páginas exactas basándonos solo en los funcionarios puros

  // 3. Cortamos la porción correspondiente a la página actual


// --- CONSULTA PÚBLICA PARA ESCANEO DE QR ROBUSTA CON EXTRACCIÓN DE VALOR ---
// (clearAllFilters vive en useInventarioFiltros, Fase 3)
useEffect(() => {
  if (!publicBienId) return;

  const cargarBienPublico = async () => {
    try {
      const idSanitizado = decodeURIComponent(publicBienId).trim();
      let bienEncontrado = null;

      // 1. RPC público: proyección de los campos públicos de UN bien (por id o
      //    por rótulo). Es el único camino de lectura para un visitante sin
      //    sesión: el rol anónimo ya no tiene SELECT sobre la tabla 'bens'
      //    (migración 004), así que no se puede volcar el inventario entero.
      //    Antes se consultaba la tabla directamente y el RPC era solo el
      //    respaldo; ahora el RPC trae todos los campos que muestra la vista
      //    (incluido el valor).
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('obtener_bien_publico', {
          p_id: idSanitizado
        });
        if (!rpcError && rpcData) {
          bienEncontrado = normalizarBien(rpcData);
        }
      } catch {}

      // 2. Fallback en caché IndexedDB local (bienes ya vistos en este
      //    dispositivo). No sirve para un visitante nuevo, pero evita el
      //    "no encontrado" si la red falla.
      if (!bienEncontrado) {
        try {
          const allKeys = await localforage.keys();
          for (const k of allKeys) {
            if (k.startsWith('bienes_cache')) {
              const cache = (await localforage.getItem(k)) || [];
              const found = cache.find(b => b.id === idSanitizado || String(b.rotulo).trim() === idSanitizado);
              if (found) {
                bienEncontrado = normalizarBien(found);
                break;
              }
            }
          }
        } catch {}
      }

      if (bienEncontrado) {
        setPublicBienData(bienEncontrado);
      } else {
        setPublicBienData({
          rotulo: idSanitizado,
          descripcion: 'No se encontraron datos registrados para este activo en la base de datos oficial.'
        });
      }
    } catch (err) {
      console.error("Error al cargar bien público:", err);
      setPublicBienData({
        rotulo: 'Error',
        descripcion: 'Ocurrió un problema al procesar la solicitud del código QR.'
      });
    }
  };

  cargarBienPublico();
}, [publicBienId]);
  // -----------------------------------


  // Listas únicas, stats, pendientes, filtrado y paginación: todo vive en
  // useInventarioFiltros (Fase 3). La UI usa los mismos nombres.


  // Ficha 360: la lee el realtime (H5) anterior a H8, vive en App.
  // Sincronización de datos: hook extraído (Fase 6). La UI usa los mismos nombres.
  const { isOnline, colaOffline, notificaciones, setNotificaciones, cargarNotificaciones, markAsRead, markAllAsRead, misNotificaciones, unreadCount, ultimoSyncBienes, isLoadingDocumentos } = useRealtimeSync({
    notify: addToast, currentUser, setCurrentUser, dependenciaActual, activeTab, isAuthenticated, isAdmin,
    handleLogout, setBienes, setFc10List, setFc11List, setFc04List,
    setEstructurasDB, setUsuariosList, setFuncionariosPadron,
    setDbError, setIsLoading, setFichaBien
  });
  // Modales de fichas y formularios: hook extraído (Fase 6). La UI usa los mismos nombres.
  const { isBulkQR, setIsBulkQR, qrTargetBien, setQrTargetBien, isQRModalOpen, setIsQRModalOpen, isBienModalOpen, setIsBienModalOpen, bienEditing, setBienEditing, bienFormRef, isFC10ModalOpen, setIsFC10ModalOpen, fc10TargetBien, fc10Editing, isFC11ModalOpen, setIsFC11ModalOpen, fc11TargetBien, fc11Editing, isFC04ModalOpen, setIsFC04ModalOpen, fc04Editing, fc04Items, fc04SinMovimiento, setFc04SinMovimiento, isFC03ModalOpen, setIsFC03ModalOpen, fc03Config, setFc03Config, fc03FuncionarioTexto, setFc03FuncionarioTexto, showFC03FuncDropdown, setShowFC03FuncDropdown, isUsuarioModalOpen, setIsUsuarioModalOpen, usuarioEditing, setUsuarioEditing, isSaving, confirmBackupModal, setConfirmBackupModal, resolucionBaja, setResolucionBaja, motivoResolucion, setMotivoResolucion, fileInputRef, showUnsavedChangesModal, setShowUnsavedChangesModal, scanParaConteo, setScanParaConteo, modoCampo, setModoCampo, ultimoEscaneo, setUltimoEscaneo, openFichaBien, openFC03Modal, executeGenerateFC03, openResolucionModal, openFC10Modal, openFC11Modal, openFC04Modal, handleAddFC04Item, handleRemoveFC04Item, handleFC04ItemChange, handleScanSuccess, saveBien, saveUsuario, saveFC11, registrarFirmasFC11, saveFC04, saveFC10, registrarFirmaFC10, registrarAmbasFirmasFC10, ponerFC10EnTramite, submitResolucionBaja, confirmDeleteAction } = useFcModals({
    notify: addToast, setIsProcessing, appLogo,
    bienes, setBienes, filteredBienes, fc10List, fc11List, fc04List,
    dependenciaActual, funcionariosConDatos,
    currentUser, isAdmin, esDesarrollador,
    clearAllFilters, setSearchTerm, setSearchInput, setActiveTab, setCurrentPage,
    agregarCodigoConteo, cargarNotificaciones,
    setIsScannerOpen, setDependenciaActual, setNotificaciones, setFc10List,
  setFichaBien, setEventosAuditFicha,
    setFc11List, setFc04List, setFuncionariosPadron, setUsuariosList,
    funcionariosPadron, notificaciones, estructurasDB, setEstructurasDB,
    itemToDelete, setItemToDelete, motivoSolicitudBaja, setMotivoSolicitudBaja, setPendingCSVImport,
    resolveLogoImg: (...a) => resolveLogoImg(...a),
    onBienGuardado: marcarBienMutado
  });
  const timeStats = useMemo(() => { const currentDate = new Date(); const currentYear = currentDate.getFullYear(); const currentMonth = currentDate.getMonth(); const depBienes = bienes.filter(b => b.dependencia === dependenciaActual); const adqCounts = {}; let adqMax = 0; depBienes.forEach(b => { const { year } = parseDateInfo(b.fechaAdquisicion); if (year) { const parsedYear = parseInt(year); if (!isNaN(parsedYear) && parsedYear > 1900 && parsedYear < 2100) { adqCounts[year] = (adqCounts[year] || 0) + 1; } } }); const adqByYear = Object.keys(adqCounts).sort((a, b) => b - a).map(year => { if(adqCounts[year] > adqMax) adqMax = adqCounts[year]; return { year, count: adqCounts[year] }; }).slice(0, 4); let asigCurrentMonth = 0; let asigPreviousMonth = 0; const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1; const yearOfPrevMonth = currentMonth === 0 ? currentYear - 1 : currentYear; const depFC10 = fc10List.filter(fc => fc.dependencia === dependenciaActual); depFC10.forEach(fc => { const fechaAUsar = fc.entregadoFecha || fc.fechaGeneracion; if (fechaAUsar) { const parts = fechaAUsar.split('-'); if (parts.length >= 2) { const year = parseInt(parts[0]); const month = parseInt(parts[1]) - 1; if (year === currentYear && month === currentMonth) { asigCurrentMonth++; } else if (year === yearOfPrevMonth && month === prevMonth) { asigPreviousMonth++; } } } }); const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]; return { adqByYear, adqMax: adqMax === 0 ? 1 : adqMax, asigCurrentMonth, asigPreviousMonth, asigMax: Math.max(asigCurrentMonth, asigPreviousMonth) === 0 ? 1 : Math.max(asigCurrentMonth, asigPreviousMonth), currentMonthName: monthNames[currentMonth], prevMonthName: monthNames[prevMonth], asigCurrent: { year: String(currentYear), month: String(currentMonth + 1).padStart(2, '0') }, asigPrev: { year: String(yearOfPrevMonth), month: String(prevMonth + 1).padStart(2, '0') } }; }, [bienes, fc10List, dependenciaActual]);
  
  // filteredBienes, paginatedBienes/itemsPaginados y totalPages: en useInventarioFiltros (Fase 3).
  const filteredFC10 = useMemo(() => { return fc10List.filter(fc => { if (fc.dependencia !== dependenciaActual) return false; const genDate = fc.entregadoFecha || fc.fechaGeneracion || ''; const devDate = fc.devolucionFecha || ''; const [gYear, gMonth] = genDate.split('-'); const matchGen = (gYear === fc10Year && gMonth === fc10Month); let matchDev = false; if (devDate) { const [dYear, dMonth] = devDate.split('-'); matchDev = (dYear === fc10Year && dMonth === fc10Month); } return matchGen || matchDev; }).sort((a, b) => new Date(b.fechaGeneracion).getTime() - new Date(a.fechaGeneracion).getTime()); }, [fc10List, dependenciaActual, fc10Year, fc10Month]);
  const conteosFC10PorMes = useMemo(() => {
    const conteos = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [String(i + 1).padStart(2, '0'), 0]));
    for (const fc of fc10List) {
      if (fc.dependencia !== dependenciaActual) continue;
      const fechas = [fc.entregadoFecha || fc.fechaGeneracion, fc.devolucionFecha].filter(Boolean);
      const mesesDelActa = new Set(fechas.map(fecha => String(fecha).slice(0, 7)).filter(periodo => periodo.startsWith(`${fc10Year}-`)).map(periodo => periodo.slice(5, 7)));
      mesesDelActa.forEach(mes => { conteos[mes] = (conteos[mes] || 0) + 1; });
    }
    return conteos;
  }, [fc10List, dependenciaActual, fc10Year]);
  // FC-10 vigente por bien (para mostrar la fecha de asignación en el inventario).
  // Si hay varios, gana el vigente (sin devolución); si no, el más reciente.
  const fc10VigentePorBien = useMemo(() => {
    const mapa = new Map();
    for (const fc of fc10List) {
      if (!fc.bienId) continue;
      const actual = mapa.get(fc.bienId);
      if (!actual) { mapa.set(fc.bienId, fc); continue; }
      const actualVigente = !actual.devolucionFecha;
      const nuevoVigente = !fc.devolucionFecha;
      if (nuevoVigente && !actualVigente) { mapa.set(fc.bienId, fc); continue; }
      if (nuevoVigente === actualVigente) {
        const fA = actual.entregadoFecha || actual.fechaGeneracion || '';
        const fN = fc.entregadoFecha || fc.fechaGeneracion || '';
        if (fN > fA) mapa.set(fc.bienId, fc);
      }
    }
    return mapa;
  }, [fc10List]);
  const filteredFC11 = useMemo(() => { return fc11List.filter(fc => { const rem = fc.dependenciaRemitente || fc.remitente || ''; const dest = fc.dependenciaDestinataria || fc.destinatario || ''; if (rem !== dependenciaActual && dest !== dependenciaActual) return false; const [year, month] = String(fc.fecha || '').split('-'); return fc.estado === 'PENDIENTE_FIRMAS' || (year === fc10Year && month === fc10Month); }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()); }, [fc11List, dependenciaActual, fc10Year, fc10Month]);
  const filteredFC04 = useMemo(() => { return fc04List.filter(fc => { return fc.dependencia === dependenciaActual && fc.anio === fc10Year && fc.mes === fc10Month; }).sort((a, b) => new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime()); }, [fc04List, dependenciaActual, fc10Year, fc10Month]);
  const solicitudesBaja = useMemo(() => { 
      return notificaciones.filter(n => {
          if ((n.tipo !== 'BAJA_BIEN' && n.tipo !== 'BAJA_FUNCIONARIO') || n.estado !== 'PENDIENTE') return false;
          if (isAdmin) return true;
          if (!n.dependencia || !dependenciaActual) return true;
          return normalizeStr(n.dependencia) === normalizeStr(dependenciaActual);
      });
  }, [notificaciones, dependenciaActual, isAdmin]);
  // --- CAMBIO MANUAL DE ESTADO DE FIRMAS FC-10 (solo administrador) ---
  // Escribe directo en Supabase (tabla fc10, columna JSONB data). No usa backend.
  const actualizarEstadoFirma = async (id, { estadoFirma, registradoPor }) => {
    if (!isAdmin) throw new Error('Solo el administrador puede cambiar el estado de firmas.');
    try {
      setIsProcessing({ active: true, text: 'Actualizando estado de firma...' });

      // Leer el acta actual
      const { data: fila, error: errLeer } = await supabase
        .from('fc10')
        .select('data')
        .eq('id', id)
        .maybeSingle();

      if (errLeer || !fila) {
        throw new Error('Acta FC-10 no encontrada');
      }

      const data = typeof fila.data === 'string' ? JSON.parse(fila.data) : (fila.data || {});
      const ahora = new Date().toISOString();

      const actualizado = {
        ...data,
        estadoFirma,
        firmaEstadoManual: true,
        firmaEstadoActualizadoPor: registradoPor || (currentUser?.username || 'admin'),
        firmaEstadoActualizadoEn: ahora
      };

      if (estadoFirma === 'CERRADO') {
        actualizado.fechaCierreFirmaManual = ahora;
      }

      const { error: errEscribir } = await supabase
        .from('fc10')
        .update({ data: actualizado })
        .eq('id', id);

      if (errEscribir) throw errEscribir;

      // Refrescar lista local para UI inmediata
      setFc10List(prev => prev.map(fc => (fc.id === id ? { ...fc, estadoFirma, firmaEstadoManual: true } : fc)));
      window.dispatchEvent(new CustomEvent('fc10-estado-cambiado', { detail: { id, estadoFirma } }));
      addToast('Estado de firma actualizado.', 'success');
    } catch (e) {
      addToast(`No se pudo actualizar el estado de firma: ${e.message}`, 'error');
      throw e;
    } finally {
      setIsProcessing({ active: false, text: '' });
    }
  };
  // Módulo Anuncios (solo desarrollador): una sola fila por anuncio.
  // Broadcast (TODOS) con leídos por usuario; directo con leído simple.
  const enviarAnuncio = async ({ titulo, mensaje, destino }) => {
      const remitente = currentUser?.username || 'Desarrollador';
      const dests = destino === 'TODOS' ? usuariosList.map(u => u.username).filter(Boolean) : [destino];
      if (dests.length === 0) { addToast('No hay destinatarios.', 'warning'); return false; }
      try {
          setIsProcessing({ active: true, text: 'Enviando anuncio...' });
          const id = generateId();
          const grupo = generateId();
          const fecha = new Date().toISOString();
          const data = { id, tipoRegistro: 'NOTIFICACION', accion: 'anuncio', usuarioDestino: destino === 'TODOS' ? 'TODOS' : destino, alcance: destino === 'TODOS' ? 'TODOS' : destino, titulo, mensaje, leido: false, leidos: [], totalDest: dests.length, fecha, remitente, grupo };
          const { error } = await supabase.from('notificaciones').insert([{ id, data }]);
          if (error) throw error;
          setNotificaciones(prev => [{ id, ...data }, ...prev]);
          await registrarAuditoria({
              usuario: remitente, dependencia: dependenciaActual,
              accion: 'ENVIAR_ANUNCIO', entidad: 'NOTIFICACION', entidadId: grupo,
              detalles: { titulo, destino, total: dests.length }
          });
          addToast(destino === 'TODOS' ? `Anuncio enviado a ${dests.length} usuarios.` : `Anuncio enviado a @${destino}.`, 'success');
          return true;
      } catch {
          addToast('No se pudo enviar el anuncio.', 'error');
          return false;
      } finally {
          setIsProcessing({ active: false, text: '' });
      }
  };
  const eliminarGrupoAnuncio = async (grupo) => {
      const ids = notificaciones.filter(n => (n.grupo || n.id) === grupo).map(n => n.id);
      if (ids.length === 0) return;
      try {
          await Promise.all(ids.map(id => supabase.from('notificaciones').delete().eq('id', id)));
          setNotificaciones(prev => prev.filter(n => (n.grupo || n.id) !== grupo));
          addToast('Anuncio eliminado.', 'success');
      } catch {
          addToast('No se pudo eliminar el anuncio.', 'error');
      }
  };
  const anunciosGrupos = useMemo(() => {
      const mapa = new Map();
      notificaciones.filter(n => n.accion === 'anuncio').forEach(n => {
          const g = n.grupo || n.id;
          if (!mapa.has(g)) mapa.set(g, { grupo: g, titulo: n.titulo || '(Sin título)', mensaje: n.mensaje || '', fecha: n.fecha, remitente: n.remitente, alcance: n.alcance || n.usuarioDestino, total: 0, leidos: 0 });
          const e = mapa.get(g);
          if (Array.isArray(n.leidos) || n.totalDest) {
              // Formato nuevo: una sola fila (toma el máximo por seguridad)
              e.total = Math.max(e.total, n.totalDest || 0);
              e.leidos = Math.max(e.leidos, (n.leidos || []).length);
          } else {
              // Formato legacy (fan-out): una fila por destinatario
              e.total++;
              if (n.leido) e.leidos++;
          }
          if (new Date(n.fecha).getTime() > new Date(e.fecha).getTime()) e.fecha = n.fecha;
      });
      return [...mapa.values()].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [notificaciones]);

  // --- EN App_2.jsx ---

  // Exportación favorita: recuerda el último formato para repetirlo en 1 clic.
  const [ultimaExportacion, setUltimaExportacion] = useState(() => { try { return JSON.parse(localStorage.getItem('ultima_exportacion') || 'null'); } catch { return null; } });
  // Idioma global (fuerza re-render al cambiar ES/GN).
  const { t: ti } = useIdioma();
  const guardarUltimaExport = (formato) => {
    const v = { formato, ts: Date.now() };
    setUltimaExportacion(v);
    try { localStorage.setItem('ultima_exportacion', JSON.stringify(v)); } catch {}
  };


  // Handlers de PDFs/QR/CSV/Excel/backup: hook extraído (Fase 6).
  const { handleDownloadLabelPNG, handleDownloadSimpleQR, handleBulkLabelPNGZip, handleBulkSimpleQRZip, handleGenerateFC04PDF, handleGenerateFC11PDF, handleGenerateFC10PDF, handleBulkFC10Zip, handleGenerateConsolidatedFC10PDF, handleExportFC10CSV, handleExportFC11CSV, handleDownloadTemplateCSV, handleExportBackupGeneral, handleExportInventarioCSV, handleExportInventarioExcel, handleDownloadTemplateFuncionarios } = usePdfHandlers({
    notify: addToast, setIsProcessing, appLogo,
    bienes, filteredBienes, dependenciaActual, fc10List, fc11List,
    funcionariosPadron, currentUser, fc10Year, isAdmin,
    setBienes, setIsQRModalOpen, setIsConsolidatedFC10ModalOpen,
    resolveLogoImg: (...a) => resolveLogoImg(...a)
  });

  // Restauración de respaldos (el camino de vuelta del backup). Se monta siempre
  // pero solo se abre desde el Sidebar, que es zona de admin.
  const restore = useRestoreBackup({
    notify: addToast, registrarAuditoria, currentUser, dependenciaActual
  });

  const exportarCSV = () => { guardarUltimaExport('csv'); handleExportInventarioCSV(); };
  const exportarExcel = () => { guardarUltimaExport('xlsx'); handleExportInventarioExcel(); };
  const repetirUltimaExportacion = () => {
    if (!ultimaExportacion) return addToast('Aún no hay exportaciones favoritas.', 'warning');
    if (ultimaExportacion.formato === 'xlsx') handleExportInventarioExcel(); else handleExportInventarioCSV();
  };
  // Reintento de importación CSV de bienes (guarda el último archivo).
  const ultimoArchivoBienesRef = useRef(null);

  // --- KANBAN: cambiar estado de conservación de un bien -------------------
  // Es la única escritura directa sobre 'bens' originada por el tablero: el
  // resto de ediciones pasan por BienModal. Se marca el bien mutado para que la
  // tabla que quedó detrásDestello (row-flash) y se registra en auditoría.
  const moverEstadoBien = async (bien, estadoNuevo) => {
    const previo = bien.estadoConservacion;
    if (previo === estadoNuevo) return;
    const actualizado = { ...bien, estadoConservacion: estadoNuevo };
    // Optimista: la tarjeta cambia de columna al instante y se revierte si Supabase falla.
    setBienes(prev => prev.map(b => (b.id === bien.id ? actualizado : b)));
    marcarBienMutado(bien.id);
    try {
      // Escritura protegida: se relee la fila y se aplica SOLO el campo que
      // cambió. Mandar el objeto entero pisaba lo que otro equipo hubiera
      // tocado mientras tanto (por ejemplo, una foto subida desde el celular).
      const { data: filaFresca, error: errLectura } = await supabase
        .from('bens').select('data').eq('id', bien.id).maybeSingle();
      if (errLectura) throw errLectura;

      const cambios = detectarCambios(bien, actualizado);
      const enBase = filaFresca?.data
        ? (typeof filaFresca.data === 'string' ? JSON.parse(filaFresca.data) : filaFresca.data)
        : null;

      if (enBase) {
        const conflictos = detectarConflictos(bien, enBase, cambios);
        if (conflictos.length > 0) {
          addToast(`Alguien más cambió ${describirCampos(conflictos)} mientras editabas. Se aplicó tu cambio sobre la versión actual.`, 'warning');
        }
      }

      const aEscribir = enBase ? fusionarSobreFresco(enBase, cambios, actualizado) : actualizado;
      const { error } = await supabase.from('bens').update(conSello({ data: aEscribir })).eq('id', bien.id);
      if (error) throw error;
      setBienes(prev => prev.map(b => (b.id === bien.id ? { id: b.id, ...aEscribir } : b)));
      await registrarAuditoria({
        usuario: currentUser?.username || 'Usuario', dependencia: dependenciaActual,
        accion: 'CAMBIO_ESTADO', entidad: 'BIEN', entidadId: bien.id,
        detalles: { rotulo: bien.rotulo, estadoPrevio: previo, estadoNuevo, campos: Object.keys(cambios) }
      });
      addToast(`${bien.rotulo || 'Bien'} → ${estadoNuevo}.`, 'success');
    } catch {
      setBienes(prev => prev.map(b => (b.id === bien.id ? bien : b)));
      addToast('No se pudo cambiar el estado.', 'error');
    }
  };

  // --- FILTROS COMPARTIBLES: copiar link de la vista actual -----------------
  const copiarLinkFiltros = async () => {
    const funcionarioCompartido = seleccionados.length ? null : filtroFuncionario;
    const bienesCompartidos = seleccionados.length
      ? bienes.filter(bien => seleccionados.includes(bien.id) && normalizeStr(bien.dependencia) === normalizeStr(dependenciaActual))
      : (() => {
          const bienesConActa = new Set(fc10List
            .filter(fc => !fc.devolucionFecha && normalizeStr(fc.funcionarioNombre) === normalizeStr(funcionarioCompartido))
            .map(fc => String(fc.bienId)));
          return bienes.filter(bien => normalizeStr(bien.dependencia) === normalizeStr(dependenciaActual)
            && bien.estadoConservacion !== 'De Baja'
            && (normalizeStr(bien.funcionario) === normalizeStr(funcionarioCompartido) || bienesConActa.has(String(bien.id))));
        })();

    if (!bienesCompartidos.length) {
      addToast(funcionarioCompartido ? 'Este funcionario no tiene bienes disponibles para compartir.' : 'Selecciona uno o más bienes para compartir.', 'warning');
      return;
    }
    if (bienesCompartidos.length > 500) {
      addToast('El enlace admite hasta 500 bienes. Selecciona menos bienes para compartir.', 'warning');
      return;
    }

    try {
      const { data: token, error } = await supabase.rpc('crear_enlace_inventario', {
        p_bien_ids: bienesCompartidos.map(bien => bien.id),
        p_dependencia: dependenciaActual,
        p_funcionario: funcionarioCompartido || null
      });
      if (error || !token) throw error || new Error('No se recibió el enlace');

      const url = new URL(window.location.origin);
      url.searchParams.set('compartir', token);
      const copiado = await copiarAlPortapapeles(url.href);
      if (!copiado) throw new Error('No se pudo copiar el enlace en este navegador');
      addToast(`Enlace de solo lectura copiado (${bienesCompartidos.length} bienes). Vence en 1 día.`, 'success');
    } catch (error) {
      console.error('No se pudo crear el enlace de inventario:', error);
      addToast('No se pudo crear el enlace. Verifica la conexión e inténtalo nuevamente.', 'error');
    }
  };

  // --- EXPORTACIÓN PROGRAMADA ---------------------------------------------
  // Genera el reporte con el formato configurado, lo descarga y deja copia.
  const ejecutarExportacionProgramada = async (silencioso = false) => {
    const cfg = obtenerProgramacion();
    const formato = cfg?.formato || 'csv';
    const lista = filteredBienes.length > 0 ? filteredBienes : bienes.filter(b => b.dependencia === dependenciaActual);
    if (!lista || lista.length === 0) {
      if (!silencioso) addToast('No hay bienes para exportar.', 'warning');
      return;
    }
    try {
      setIsProcessing({ active: true, text: 'Generando reporte programado...' });
      const nombre = nombreArchivoInventario(dependenciaActual, formato, 'prog');
      const blob = construirCSVInventario(lista, dependenciaActual);
      descargarYArchivar({ nombre, tipo: 'inventario', formato, blob });
      guardarProgramacion({ ultimaEjecucion: Date.now() });
      if (!silencioso) addToast(`Reporte generado: ${nombre}`, 'success');
    } catch {
      if (!silencioso) addToast('No se pudo generar el reporte programado.', 'error');
    } finally {
      setIsProcessing({ active: false, text: '' });
    }
  };

  // Al cargar con datos y sesión activa: si la programación ya venció, generar.
  const programacionRevisada = useRef(false);
  useEffect(() => {
    if (programacionRevisada.current) return;
    if (isLoading || !isAuthenticated || !dependenciaActual) return;
    programacionRevisada.current = true;
    const cfg = obtenerProgramacion();
    if (tocaEjecutar(cfg)) {
      // Diferido para no competir con la carga inicial de bienes.
      setTimeout(() => ejecutarExportacionProgramada(true), 1200);
    }
  }, [isLoading, isAuthenticated, dependenciaActual, ejecutarExportacionProgramada]);



  // Dependencia omitida a proposito.




  // Logo para PDFs: respeta el logo subido por el usuario, si no usa el
  // institucional según dependencia, y como último recurso el placeholder.
  const resolveLogoImg = async (dependencia) => {
    if (appLogo) return appLogo;
    try {
      const b64 = await convertirImagenABase64(getLogoPorDependencia(dependencia));
      if (b64) return b64;
    } catch {}
    return getPlaceholderLogo();
  };






  const _toggleQR = async (bien) => { 
      const nuevoEstadoQR = !bien.hasQR;
      const updatedBien = { ...bien, hasQR: nuevoEstadoQR }; 
      
      // Actualizamos inmediatamente el estado local para que no desaparezca ni parpadee
      setBienes(prev => prev.map(b => b.id === bien.id ? updatedBien : b)); 
      
      try {
          // La caché va con sufijo de dependencia: 'bienes_cache' a secas era
          // una clave que nadie leía, así que el cambio de QR no llegaba a la
          // caché real y un delta posterior podía resucitar el estado viejo.
          const { error: errQR } = await supabase.from('bens').update(conSello({ data: updatedBien })).eq('id', updatedBien.id);
          // supabase-js no lanza: resuelve con { error }.
          if (errQR) throw errQR;

          const claveCache = `bienes_cache_${dependenciaActual}`;
          const cacheActual = await localforage.getItem(claveCache) || [];
          const nuevoCache = cacheActual.map(b => b.id === bien.id ? updatedBien : b);
          await localforage.setItem(claveCache, nuevoCache);

          addToast(`Estado QR actualizado`, "success");
      } catch { 
          // Si falla, revertimos el cambio en pantalla
          setBienes(prev => prev.map(b => b.id === bien.id ? bien : b));
          addToast("Error de red al guardar QR.", "error"); 
      } 
  };
  

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPendingCSVImport({ type: 'bienes', file });
  };

  // Paso previo al import: muestra conteos y primeras filas en el modal.
  const previsualizarCSVBienes = async (file) => {
    if (!file) return;
    setIsProcessing({ active: true, text: 'Analizando planilla...' });
    try {
      const { default: Papa } = await import('papaparse');
      const { validos, duplicados, errores } = await new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          encoding: "UTF-8",
          complete: (results) => resolve(mapearFilasBienes(results.data, results.meta.fields, bienes, dependenciaActual)),
          error: (err) => reject(err)
        });
      });
      setCsvPreviewData({ validos, duplicados, errores, tipo: 'bienes', file });
      setIsCSVPreviewOpen(true);
    } catch {
      addToast("No se pudo leer el archivo CSV.", "error");
    } finally {
      setIsProcessing({ active: false, text: '' });
    }
  };

  const executeProcessBienesCSV = async (file) => {

    setIsProcessing({ active: true, text: 'Leyendo planilla CSV...', pct: 0 });
    setIsCSVPreviewOpen(false);
    if (file) ultimoArchivoBienesRef.current = file;

    // papaparse se carga bajo demanda: no entra al bundle inicial.
    const { default: Papa } = await import('papaparse');
    const filasCSV = [];
    let camposCSV = [];
    let ultimaActualizacionProgreso = 0;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: "UTF-8",
      worker: true,
      step: (results) => {
        if (!camposCSV.length) camposCSV = results.meta.fields || [];
        filasCSV.push(results.data);
        if (filasCSV.length % 150 === 0) {
          const pct = file.size ? Math.min(95, ((results.meta.cursor || 0) / file.size) * 95) : 0;
          setIsProcessing({ active: true, text: `Leyendo ${filasCSV.length.toLocaleString('es-PY')} filas...`, pct });
          ultimaActualizacionProgreso = filasCSV.length;
        }
      },
      complete: async () => {
        if (filasCSV.length > ultimaActualizacionProgreso) {
          setIsProcessing({ active: true, text: `Validando ${filasCSV.length.toLocaleString('es-PY')} filas...`, pct: 96 });
        }
        const { validos: newBienes, duplicados } = mapearFilasBienes(filasCSV, camposCSV, bienes, dependenciaActual);
        const duplicatesSkipped = duplicados.length;

        if (newBienes.length > 0) {
          try {
            setIsProcessing({ active: true, text: `Guardando ${newBienes.length.toLocaleString('es-PY')} bienes...`, pct: 98 });
            const payload = newBienes.map(b => conSello({ id: b.id, data: b }));
            const { error: errInsert } = await supabase.from('bens').insert(payload);
            // supabase-js NO lanza en error de Postgres/RLS: resuelve con
            // { error }. Sin esta comprobación el usuario veía "¡Éxito!" con
            // los bienes sin guardar, y recién al recargar aparecían los
            // bienes fantasma.
            if (errInsert) throw errInsert;
            // Actualización local dirigida (evita recargar todo el inventario)
            setBienes(prev => [...newBienes, ...prev.filter(b => !newBienes.some(n => n.id === b.id))]);
            try {
              const cacheActual = await localforage.getItem(`bienes_cache_${dependenciaActual}`) || [];
              await localforage.setItem(`bienes_cache_${dependenciaActual}`, [...newBienes, ...cacheActual.filter(b => !newBienes.some(n => n.id === b.id))]);
            } catch {}
            addToast(`¡Éxito! Se guardaron ${newBienes.length} bienes nuevos.${duplicatesSkipped > 0 ? ` Se omitieron ${duplicatesSkipped} duplicados.` : ''}`, "success");
          } catch (error) {
            addToast(`No se pudieron guardar los bienes: ${error?.message || 'error de la base de datos'}.`, "error", { action: { label: 'Reintentar', onClick: () => { if (ultimoArchivoBienesRef.current) executeProcessBienesCSV(ultimoArchivoBienesRef.current); } } });
          }
        } else {
          addToast(`No se importó ningún bien. Se omitieron ${duplicatesSkipped} duplicados.`, "warning");
        }

        setIsProcessing({ active: false, text: '' });
        // Resetea el input para permitir reimportar el mismo archivo.
        // (Antes: `e.target.value` inexistente en este scope -> ReferenceError.)
        if (fileInputRef.current) fileInputRef.current.value = null;
      },
      error: (err) => {
        console.error(err);
        addToast("Error al procesar el archivo CSV.", "error", { action: { label: 'Reintentar', onClick: () => { if (ultimoArchivoBienesRef.current) executeProcessBienesCSV(ultimoArchivoBienesRef.current); } } });
        setIsProcessing({ active: false, text: '' });
      }
    });
  };
  // --- BACKUP GENERAL DE PROTECCIÓN DEL SISTEMA (SOLO ADMINS) ---










  



  // handleScanSuccess se recrea en cada render. El lector de QR se inicializa
  // solo con [isScannerOpen] (agregarlo reiniciaría la cámara en cada render),
  // así que se guarda en un ref para que el callback vea siempre la versión
  // actual: si no, el escaneo usaría datos viejos (modo conteo, dependencias).
  const scanSuccessRef = useRef(handleScanSuccess);
  useEffect(() => { scanSuccessRef.current = handleScanSuccess; });

  // Extracción de código QR: helper puro en utils/qr (Fase 1).
  // Modo conteo: el escáner alimenta la conciliación física en vez de abrir el bien.
  //
  // El cleanup importa: html5-qrcode mantiene el elemento #reader registrado
  // aunque se lo detenga. Sin stop()+clear() al cerrar, el segundo ciclo de
  // apertura chocaba con la instancia previa y la cámara no arrancaba (el
  // error era "no se pudo acceder a la cámara" con los permisos correctos).
  // También se limpia el timer: si el usuario cerraba antes de los 300 ms, la
  // cámara arrancaba igual sobre un nodo ya desmontado.
  useEffect(() => {
      if (!isScannerOpen) return;
      let instancia = null;
      const timer = setTimeout(() => {
          if (!window.Html5Qrcode) {
              addToast("El lector de QR no está disponible.", "error");
              setIsScannerOpen(false);
              return;
          }
          try {
              instancia = new window.Html5Qrcode("reader");
  // `addToast` es estable (useCallback), pero el linter no lo sabe.
              window.html5QrCode = instancia;
          } catch {
              // Quedó una instancia previa viva: se libera antes de reintentar.
              try { window.html5QrCode?.clear(); } catch {}
              try {
                  instancia = new window.Html5Qrcode("reader");
                  window.html5QrCode = instancia;
              } catch {
                  addToast("No se pudo iniciar el lector de QR.", "error");
                  setIsScannerOpen(false);
                  return;
              }
          }

          instancia.start(
              { facingMode: "environment" },
              { fps: 10, qrbox: { width: 250, height: 250 } },
              (decodedText) => {
                  const seguir = () => scanSuccessRef.current(decodedText);
                  if (instancia && instancia.isScanning) instancia.stop().then(seguir).catch(seguir);
                  else seguir();
              },
              () => {}
          ).catch(() => {
              addToast("No se pudo acceder a la cámara. Verifique los permisos.", "error");
              setIsScannerOpen(false);
          });
      }, 300);

      return () => {
          clearTimeout(timer);
          const inst = instancia || window.html5QrCode;
          if (inst) {
              try { if (inst.isScanning) inst.stop(); } catch {}
              try { inst.clear(); } catch {}
          }
          if (window.html5QrCode === inst) window.html5QrCode = null;
      };
      // handleScanSuccess queda fuera a propósito: se recrea en cada render y
      // incluirlo reiniciaría la cámara continuamente. El ref de abajo
      // mantiene la lógica siempre al día sin reiniciar nada.
  }, [isScannerOpen, addToast]);


  const saludoBienvenida = useMemo(() => {
    const hora = new Date().getHours();
    if (hora < 12) return "¡Buenos días";
    if (hora < 19) return "¡Buenas tardes";
    return "¡Buenas noches";
  }, []);

  const renderPagination = () => (
    <Pagination
      pagina={currentPage}
      totalPaginas={totalPages}
      totalElementos={filteredBienes.length}
      porPagina={itemsPorPagina}
      onCambioPagina={setCurrentPage}
      etiquetas={{ mostrando: ti('inv.mostrando'), de: ti('inv.de'), anterior: ti('inv.anterior'), siguiente: ti('inv.siguiente') }}
      herramientas={(
        <FiltroCombo
          ancho="w-[132px]"
          compacto
          valor={itemsPorPagina}
          opciones={[10, 20, 50].map(n => ({ label: `${n} ${ti('inv.por_pagina')}`, value: n }))}
          onElegir={(v) => cambiarPaginaTam(parseInt(v, 10))}
          etiquetaTodos={ti('inv.por_pagina')}
          titulo={ti('inv.por_pagina')}
        />
      )}
      className="px-4 sm:px-6 py-4 border-t border-line dark:border-line shrink-0 bg-surface-1 dark:bg-surface-1"
    />
  );

  // --- INICIO DE CÓDIGO RESTAURADO ---

  // --- FIN DE CÓDIGO RESTAURADO ---
  // Toasts: hook extraído (Fase 1). Misma API que el código inline original.


// --- VISTA PaBLICA DE ESCANEO QR REDISEÑADA Y OPTIMIZADA PARA MÓVILES ---
// --- VISTA PÚBLICA DE ESCANEO QR CLARA, MODERNA Y OPTIMIZADA PARA MÓVILES (iOS / ANDROID) ---
if (mantenimiento?.en_mantenimiento && !mantBypass && !esDesarrollador && !mostrarLoginDev) {
  return <MaintenanceScreen config={mantenimiento} onAccesoDesarrollador={() => setMostrarLoginDev(true)} />;
}
if (mantenimiento?.en_mantenimiento && !mantBypass && !esDesarrollador && mostrarLoginDev) {
  return (
      <LoginScreen handleLogin={handleLogin} loginUser={loginUser} setLoginUser={setLoginUser} loginPass={loginPass} setLoginPass={setLoginPass} showPassword={showPassword} setShowPassword={setShowPassword} loginError={loginError} darkMode={darkMode} appLogo={appLogo} toasts={toasts} isProcessing={isProcessing.active} version={versionApp} />
  );
}
if (rutaDesconocida && !publicBienId && !publicShareToken) {
  return <ErrorView variante="404" onAccion={() => { window.location.href = window.location.origin; }} />;
}
if (publicShareToken) {
  return <InventarioCompartidoView token={publicShareToken} />;
}
if (publicBienId) {
  return (
    <div className="h-dvh overflow-y-auto bg-surface-3 flex flex-col items-center p-3 sm:p-6 text-content-1 font-sans selection:bg-brand selection:text-white custom-scrollbar">
      <Card tamaño="lg" className="max-w-md w-full shadow-pop border border-line m-auto overflow-hidden relative">

        {/* Acento superior institucional */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-brand via-brand-hover to-brand/60"></div>

        {/* Header institucional */}
        <div className="flex flex-col items-center text-center pb-4 border-b border-line">
          <div className="flex h-12 w-12 items-center justify-center rounded-card bg-brand-soft text-brand-text mb-3 border border-brand/20 shadow-sm">
            <i className="fa-solid fa-shield-halved text-xl"></i>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-brand-soft text-brand-text mb-2 border border-brand/25">
            <i className="fa-solid fa-circle-check text-[10px] text-brand"></i> Verificación Oficial de Activo
          </span>

          <h1 className="text-base sm:text-lg font-bold text-content-1 tracking-tight leading-tight font-display">
            Universidad Nacional de Pilar
          </h1>
          <p className="text-[11px] sm:text-xs text-content-3 font-semibold mt-0.5">
            Sistema Integrado de Gestión Patrimonial
          </p>
        </div>

        {/* Contenido principal o Spinner */}
        {publicBienData ? (
          <div className="py-4 space-y-3">

            {publicBienData.fotos?.[0]?.url && (
              <button type="button" onClick={() => setPublicFotoAmpliada(publicBienData.fotos[0].url)} title="Ampliar foto" aria-label="Ampliar foto del activo" className="block w-full rounded-card overflow-hidden border border-line/80 shadow-xs bg-surface-2 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                <img
                  src={publicBienData.fotos[0].url}
                  alt="Foto del activo (toca para ampliar)"
                  loading="lazy"
                  decoding="async"
                  className="w-full max-h-44 sm:max-h-56 object-cover pointer-events-none"
                  onError={(e) => { e.currentTarget.closest('button').style.display = 'none'; }}
                />
                <span className="sr-only">Ampliar foto del activo</span>
              </button>
            )}

            {/* Tarjeta de Rótulo y Estado */}
            <Card tamaño="md" className="p-4 shadow-xs border border-line/80">
              <div className="flex justify-between items-center gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-content-2 uppercase tracking-widest">Código / Rótulo</p>
                  <p className="text-xl sm:text-2xl font-black text-content-1 font-mono tracking-tight mt-0.5 truncate">
                    {publicBienData.rotulo || "S/Rótulo"}
                  </p>
                </div>
                {publicBienData.estadoConservacion && (
                  <Badge tono={publicBienData.estadoConservacion === 'De Baja' ? 'danger' : 'ok'} icono={publicBienData.estadoConservacion === 'De Baja' ? 'fa-triangle-exclamation' : 'fa-check'}>
                    {publicBienData.estadoConservacion}
                  </Badge>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-line/60">
                <p className="text-[10px] font-bold text-content-2 uppercase tracking-widest">Descripción General</p>
                <p className={!publicDescExpandida && (publicBienData.descripcion || '').length > 140 ? 'text-sm font-medium text-content-1 mt-1 leading-relaxed line-clamp-3' : 'text-sm font-medium text-content-1 mt-1 leading-relaxed'}>
                  {publicBienData.descripcion || "Sin descripción asignada"}
                </p>
                {(publicBienData.descripcion || '').length > 140 && (
                  <Button variante="ghost" tamano="sm" onClick={() => setPublicDescExpandida(v => !v)} className="mt-1.5">
                    {publicDescExpandida ? 'Ver menos' : 'Ver más'}
                  </Button>
                )}
              </div>
            </Card>

            {/* Datos Técnicos y Contables */}
            <div className="grid grid-cols-2 gap-3">
              <StatTile etiqueta="Cuenta" valor={publicBienData.cuenta || "S/Cuenta"} icono="fa-layer-group" tono="brand" animado={false} />
              <StatTile etiqueta="Valor" valor={`Gs. ${formatCurrency(publicBienData.valorUnitario || publicBienData.valor || publicBienData.valorAdquisicion || "0")}`} icono="fa-coins" tono="ok" animado={false} />
              {publicBienData.subcuenta && (
                <StatTile etiqueta="Sub-Cuenta" valor={publicBienData.subcuenta} icono="fa-sitemap" tono="info" animado={false} />
              )}
              {publicBienData.fechaAdquisicion && (
                <StatTile etiqueta="Adquisición" valor={String(publicBienData.fechaAdquisicion).split("T")[0]} icono="fa-calendar" tono="neutral" animado={false} />
              )}
              {publicBienData.vidaUtil && (
                <StatTile etiqueta="Vida Útil" valor={publicBienData.vidaUtil + " años"} icono="fa-hourglass-half" tono="brand" animado={false} />
              )}
            </div>

            {/* Custodio, Ubicación y Dependencia */}
            <Card tamaño="md" className="p-4 shadow-xs border border-line/70 space-y-3">
              <div>
                <p className="text-[10px] font-bold text-content-2 uppercase tracking-wider flex items-center gap-1.5">
                  <i className="fa-solid fa-user-check text-brand"></i> Responsable Asignado
                </p>
                <p className="text-sm font-bold text-content-1 mt-1">
                  {publicBienData.funcionario || "Sin Responsable Asignado"}
                </p>
                {publicBienData.funcionarioCargo && (
                  <p className="text-[10px] text-content-2 mt-0.5">
                    Cargo: {publicBienData.funcionarioCargo}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-line/60">
                <p className="text-[10px] font-bold text-content-2 uppercase tracking-wider flex items-center gap-1.5">
                  <i className="fa-solid fa-location-dot text-warn"></i> Ubicación Física
                </p>
                <p className="text-sm font-bold text-content-1 mt-1">
                  {publicBienData.ubicacion || "Sin Ubicación Registrada"}
                </p>
              </div>

              {publicBienData.dependencia && (
                <div className="pt-2 border-t border-line/60">
                  <p className="text-[10px] font-bold text-content-2 uppercase tracking-wider flex items-center gap-1.5">
                    <i className="fa-solid fa-building-columns text-ok"></i> Dependencia
                  </p>
                  <p className="text-sm font-bold text-content-1 mt-1">
                    {publicBienData.dependencia}
                  </p>
                </div>
              )}
            </Card>

          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <i className="fa-solid fa-circle-notch fa-spin text-3xl text-brand mb-3"></i>
            <p className="text-xs text-content-3 font-semibold">Consultando datos de registro...</p>
          </div>
        )}

        {/* Pie y botón de retorno */}
        <div className="pt-4 border-t border-line">
          <Button variante="primary" tamano="md" onClick={() => window.location.href = window.location.origin} className="w-full">
            <i className="fa-solid fa-arrow-left text-xs"></i> Ir a la Plataforma Principal
          </Button>
        </div>

      </Card>

        {/* Controles de exhibition: pantalla completa siempre; barra de kiosco solo en ?kiosk=1 */}
        <div className="flex items-center gap-2 mb-2 mt-4">
          <span className="flex-1" />
          <BotonPantallaCompleta />
          {!kioscoActivo && (
            <a href={`?id=${encodeURIComponent(publicBienId)}&kiosk=1`} title="Abrir en modo kiosco (pantalla completa con temporizador)" className="inline-flex items-center justify-center gap-2 h-9 px-3 rounded-control bg-transparent text-content-2 hover:bg-surface-2 hover:text-content-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
              <i className="fa-solid fa-display text-[10px]"></i>
              <span className="hidden sm:inline">Kiosco</span>
            </a>
          )}
        </div>

        {kioscoActivo && (
          <KioskBar
            idleSegundos={kioscoIdle}
            onSalir={() => { window.location.href = window.location.origin; }}
            onEscanearOtro={() => {
              window.location.href = window.location.origin;
            }}
          />
        )}

      {publicFotoAmpliada && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-surface-1/90 backdrop-blur-xl" onClick={() => setPublicFotoAmpliada(null)}>
          <img src={publicFotoAmpliada} alt="Foto ampliada del activo" className="max-h-[90dvh] max-w-full rounded-panel shadow-2xl object-contain" />
          <span className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-control bg-surface-1 text-content-1 border border-line shadow-lg">
            <i className="fa-solid fa-xmark"></i>
          </span>
        </div>
      )}
    </div>
  );
}

  // 2. LUEGO EL RESTO DE VALIDACIONES (Mantenimiento global, Login, etc.)

  if (!isAuthenticated) {
      return (
          <LoginScreen handleLogin={handleLogin} loginUser={loginUser} setLoginUser={setLoginUser} loginPass={loginPass} setLoginPass={setLoginPass} showPassword={showPassword} setShowPassword={setShowPassword} loginError={loginError} darkMode={darkMode} appLogo={appLogo} toasts={toasts} isProcessing={isProcessing.active} version={versionApp} />
      );
  }

  return (
    <div className={`flex flex-col h-dvh overflow-hidden bg-canvas ${darkMode ? 'dark' : ''} transition-colors duration-[var(--dur-base)] text-base`} style={{ '--dep-accent': colorPorDependencia(dependenciaActual) }}>
      <a href="#contenido" className="skip-link px-4 py-2 rounded-control bg-zinc-900 dark:bg-surface-1 text-white dark:text-content-1 text-[13px] font-bold shadow-xl">{ti('app.saltar')}</a>
      <input type="file" accept=".csv" className="hidden" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileUpload} />
      <input type="file" accept=".csv" className="hidden" style={{ display: 'none' }} ref={fileInputFuncionariosRef} onChange={handleFileUploadFuncionarios} />
      
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 pointer-events-none">
        
        {!isOnline && (
          <div className="pointer-events-auto flex items-center gap-3 px-4 py-3 min-w-[280px] max-w-[calc(100vw-3rem)] rounded-card shadow-xl text-xs font-black bg-amber-500/90 text-white backdrop-blur-md border border-amber-400/30 motion animate-slide-up">
            <i className="fa-solid fa-wifi-slash text-base"></i>
            <span className="flex-1">{ti('off.sin_conexion')}{colaOffline > 0 ? ` · ${colaOffline} ${colaOffline === 1 ? ti('off.pendiente') : ti('off.pendientes')}` : ''}</span>
          </div>
        )}
        {isOnline && colaOffline > 0 && (
          <div role="status" aria-live="polite" className="pointer-events-auto flex items-center gap-3 px-4 py-3.5 min-w-[280px] max-w-[calc(100vw-2rem)] rounded-panel shadow-pop text-body font-semibold bg-surface-1/95 text-content-1 backdrop-blur-xl border border-info/30 motion animate-slide-up">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-info-soft text-info" aria-hidden="true">
              <i className="fa-solid fa-cloud-arrow-up text-sm"></i>
            </div>
            <span className="flex-1 leading-relaxed">{ti('off.sinc')} {colaOffline} {colaOffline === 1 ? ti('off.pendiente') : ti('off.pendientes')}…</span>
          </div>
        )}

        {toasts.map(t => (
          // role="status": hace que un lector de pantalla anuncie el aviso
          // (antes no se anunciaba nada) y permite detectarlo en los tests.
          <div key={t.id} role="status" aria-live="polite" className="pointer-events-auto flex items-center gap-3 px-4 py-3.5 min-w-[280px] max-w-[calc(100vw-2rem)] rounded-panel shadow-pop text-body font-semibold bg-surface-1/95 text-content-1 backdrop-blur-xl border border-line motion animate-slide-up">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-control shadow-inner ${ t.type === 'success' ? 'bg-ok-soft dark:bg-emerald-950/50 text-ok dark:text-emerald-400 border border-ok/25 dark:border-emerald-900/50' : t.type === 'error' ? 'bg-danger-soft dark:bg-rose-950/50 text-danger dark:text-rose-400 border border-danger/25 dark:border-rose-900/50' : t.type === 'warning' ? 'bg-warn-soft dark:bg-amber-950/50 text-warn dark:text-amber-400 border border-warn/25 dark:border-amber-900/50' : 'bg-blue-50 dark:bg-blue-950/50 text-brand dark:text-blue-400 border border-brand/25 dark:border-blue-900/50' }`}>
              <i className={`fa-solid ${ t.type === 'success' ? 'fa-circle-check text-sm' : t.type === 'error' ? 'fa-circle-exclamation text-sm' : t.type === 'warning' ? 'fa-triangle-exclamation text-sm' : 'fa-circle-info text-sm' }`}></i>
            </div>
            <span className="flex-1 leading-relaxed">{t.message}</span>
            {t.action && (
              <button
                onClick={() => { try { t.action.onClick(); } catch {} quitarToast(t.id); }}
                className="shrink-0 px-3 py-1.5 rounded-control text-label font-bold bg-brand text-content-inverse hover:bg-brand-hover motion cursor-pointer active:scale-95"
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
        
      </div>

      {/* El cuadro para confirmar el nombre de descarga debe quedar accesible
          por encima del indicador global de generación. */}
      {isProcessing.active && !solicitudNombreArchivo && (
        <div className="fixed inset-0 bg-surface-1/80 dark:bg-black/80 backdrop-blur-sm z-[500] flex flex-col items-center justify-center animate-fade-in">
          <div className="proc-track"><div className={`proc-fill ${isProcessing.pct == null ? 'indete' : ''}`} style={isProcessing.pct != null ? { width: `${Math.min(100, Math.max(0, isProcessing.pct))}%` } : undefined}></div></div>
          <i className="fa-solid fa-circle-notch fa-spin text-4xl text-brand-text mb-4"></i>
          <h2 className="text-xl font-medium text-content-1 dark:text-white tracking-tight">{isProcessing.text}</h2>
          {isProcessing.pct != null && (
            <p className="text-sm font-bold text-content-3 dark:text-content-3 mt-2 tabular-nums">{Math.round(isProcessing.pct)}%</p>
          )}
        </div>
      )}
      <AppShell
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        appLogo={appLogo}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={isAdmin}
        esDesarrollador={esDesarrollador}
        solicitudesBaja={solicitudesBaja}
        dependenciaActual={dependenciaActual}
        onExportBackup={() => setConfirmBackupModal(true)}
        onOpenRestore={restore.openRestore}
        mantenimiento={mantenimiento}
        onOpenMantenimiento={() => setIsMantenimientoModalOpen(true)}
        onOpenDependencias={() => setIsDependenciasModalOpen(true)}
        setIsScannerOpen={setIsScannerOpen}
        setDependenciaActual={requestDependenciaChange}
        todasDependencias={todasDependencias}
        clearAllFilters={clearAllFilters}
        darkMode={darkMode}
        setDarkMode={fijarTemaUsuario}
        isNotifOpen={isNotifOpen}
        setIsNotifOpen={setIsNotifOpen}
        unreadCount={unreadCount}
        misNotificaciones={misNotificaciones}
        markAsRead={markAsRead}
        onMarkAllRead={markAllAsRead}
        currentUser={currentUser}
        handleLogout={() => setShowLogoutConfirm(true)}
        actasPorFirmarCount={actasPorFirmarCount}
        ultimoSyncBienes={ultimoSyncBienes}
        errorBanner={dbError ? (
          <div className="flex items-center justify-center gap-x-6 bg-danger-soft px-6 py-2.5 sm:px-3.5 border-b border-danger/30 z-50">
            <p className="text-body leading-6 text-danger font-medium">
              <i className="fa-solid fa-wifi mr-2" aria-hidden="true"></i> Error de sincronización con Supabase. Verifique su conexión.
            </p>
          </div>
        ) : null}
      >
            <Suspense fallback={<CargaModulo />}>
            <div key={activeTab} className="tab-enter mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-10 min-h-full flex flex-col">
                {activeTab === 'dashboard' && (<DashboardView requestDependenciaChange={requestDependenciaChange} currentUser={currentUser} dependenciaActual={dependenciaActual} saludoBienvenida={saludoBienvenida} stats={stats} pendientes={pendientes} isLoading={isLoading} timeStats={timeStats} clearAllFilters={clearAllFilters} setActiveTab={setActiveTab} setFiltroQR={setFiltroQR} setFiltroFC10={setFiltroFC10} setFiltroPendiente={setFiltroPendiente} setFiltroAnio={setFiltroAnio} setCurrentPage={setCurrentPage} setBienEditing={setBienEditing} setIsBienModalOpen={setIsBienModalOpen} fileInputRef={fileInputRef} handleExportInventarioCSV={handleExportInventarioCSV} setIsBulkQR={setIsBulkQR} setQrTargetBien={setQrTargetBien} setIsQRModalOpen={setIsQRModalOpen} openFC03Modal={openFC03Modal} setFc10Year={setFc10Year} setFc10Month={setFc10Month} fc10List={fc10List} bienes={bienes} />)}

                {activeTab === 'resumen' && (<ResumenView dependenciaActual={dependenciaActual} stats={stats} pendientes={pendientes} fc10List={fc10List} timeStats={timeStats} setActiveTab={setActiveTab} setFiltroQR={setFiltroQR} setFiltroFC10={setFiltroFC10} setFiltroPendiente={setFiltroPendiente} setCurrentPage={setCurrentPage} clearAllFilters={clearAllFilters} setFc10Year={setFc10Year} setFc10Month={setFc10Month} />)}
                {activeTab === 'inventario' && (<InventarioView isLoading={isLoading} hasInventoryData={bienes.length > 0} hasFilters={hasFilters} filteredBienes={filteredBienes} stats={stats} handleDownloadTemplateCSV={handleDownloadTemplateCSV} fileInputRef={fileInputRef} handleExportInventarioCSV={exportarCSV} handleExportInventarioExcel={exportarExcel} ultimaExportacion={ultimaExportacion} onRepetirExport={repetirUltimaExportacion} setIsBulkQR={setIsBulkQR} setQrTargetBien={setQrTargetBien} setIsQRModalOpen={setIsQRModalOpen} openFC03Modal={openFC03Modal} setBienEditing={setBienEditing} setIsBienModalOpen={setIsBienModalOpen} searchRef={searchRef} searchTerm={searchTerm} debouncedSearchTerm={debouncedSearchTerm} setSearchTerm={setSearchTerm} setSearchInput={setSearchInput} setCurrentPage={setCurrentPage} orden={orden} setOrden={setOrden} filtroFuncionario={filtroFuncionario} setFiltroFuncionario={setFiltroFuncionario} funcionariosUnicos={funcionariosUnicos} filtroUbicacion={filtroUbicacion} setFiltroUbicacion={setFiltroUbicacion} ubicacionesUnicas={ubicacionesUnicas} filtroAnio={filtroAnio} setFiltroAnio={setFiltroAnio} aniosUnicos={aniosUnicos} filtroSubcuenta={filtroSubcuenta} setFiltroSubcuenta={setFiltroSubcuenta} subcuentasUnicas={subcuentasUnicas} filtroAnalitico1={filtroAnalitico1} setFiltroAnalitico1={setFiltroAnalitico1} analiticos1Unicos={analiticos1Unicos} filtroAnalitico2={filtroAnalitico2} setFiltroAnalitico2={setFiltroAnalitico2} filtroFC10={filtroFC10} setFiltroFC10={setFiltroFC10} filtroEstado={filtroEstado} setFiltroEstado={setFiltroEstado} vistasGuardadas={vistasGuardadas} aplicarVista={aplicarVista} eliminarVista={eliminarVista} mostrarGuardarVista={mostrarGuardarVista} setMostrarGuardarVista={setMostrarGuardarVista} nombreVista={nombreVista} setNombreVista={setNombreVista} guardarVistaActual={guardarVistaActual} clearAllFilters={clearAllFilters} filtroPendiente={filtroPendiente} setFiltroPendiente={setFiltroPendiente} itemsPaginados={itemsPaginados} fc10VigentePorBien={fc10VigentePorBien} isAdmin={isAdmin} setItemToDelete={setItemToDelete} seleccionados={seleccionados} toggleSeleccion={toggleSeleccion} limpiarSeleccion={limpiarSeleccion} vistaInv={vistaInv} cambiarVistaInv={cambiarVistaInv} lastMutatedBienId={lastMutatedBienId} onBajaMasiva={bajaMasiva} onAsignarMasivo={asignarBienesSeleccionados} onExportarSeleccion={exportarSeleccionInventario} onExportarSeleccionPDF={() => executeGenerateFC03(seleccionados)} onEditarCampoBien={editarCampoBienEnLinea} onQRLoteSeleccion={qrLoteSeleccion} onMoverEstado={moverEstadoBien} onCopiarLink={copiarLinkFiltros} onExportarProgramado={() => ejecutarExportacionProgramada(false)} STYLES={STYLES} openFichaBien={openFichaBien} openFC10Modal={openFC10Modal} openFC11Modal={openFC11Modal} renderPagination={renderPagination} />)}

                {activeTab === 'aprobaciones' && isAdmin && (<AprobacionesView dependenciaActual={dependenciaActual} solicitudesBaja={solicitudesBaja} bienes={bienes} openResolucionModal={openResolucionModal} />)}

                {activeTab === 'auditoria' && isAdmin && (<AuditoriaView fetchAuditoria={fetchAuditoria} isLoadingAud={isLoadingAud} kpisAud={kpisAud} evolucionValor={evolucionValor} maxEvolucion={maxEvolucion} formatoCortoGs={formatoCortoGs} clearAllFilters={clearAllFilters} setFiltroAnio={setFiltroAnio} setFiltroMes={setFiltroMes} setActiveTab={setActiveTab} saludDatos={saludDatos} usoDb={usoDb} alertaDb={alertaDb} errorUsoDb={errorUsoDb} ultimoBackup={ultimoBackup} handleExportBackupGeneral={handleExportBackupGeneral} setSearchTerm={setSearchTerm} setSearchInput={setSearchInput} setCurrentPage={setCurrentPage} setSearchFuncionarioInput={setSearchFuncionarioInput} setCurrentPaginaFuncionarios={setCurrentPaginaFuncionarios} conteoUbicacion={conteoUbicacion} setConteoUbicacion={setConteoUbicacion} bienes={bienes} dependenciaActual={dependenciaActual} ubicacionesUnicas={ubicacionesUnicas} conteoCodigos={conteoCodigos} conteoInput={conteoInput} setConteoInput={setConteoInput} agregarCodigoConteo={agregarCodigoConteo} resultadoConteo={resultadoConteo} setScanParaConteo={setScanParaConteo} setIsScannerOpen={setIsScannerOpen} setConteoCodigos={setConteoCodigos} exportarConteoCSV={exportarConteoCSV} descargarActaConteoPDF={descargarActaConteoPDF} guardarActaConteo={guardarActaConteo} muestraN={muestraN} setMuestraN={setMuestraN} muestraUbicacion={muestraUbicacion} setMuestraUbicacion={setMuestraUbicacion} muestra={muestra} verificadosMuestra={verificadosMuestra} setVerificadosMuestra={setVerificadosMuestra} generarMuestra={generarMuestra} guardarActaMuestreo={guardarActaMuestreo} descargarActaMuestreoPDF={descargarActaMuestreoPDF} totalAud={totalAud} paginaAud={paginaAud} alcanceAud={alcanceAud} setAlcanceAud={setAlcanceAud} searchAud={searchAud} setSearchAud={setSearchAud} filtroAccionAud={filtroAccionAud} setFiltroAccionAud={setFiltroAccionAud} filtroUsuarioAud={filtroUsuarioAud} setFiltroUsuarioAud={setFiltroUsuarioAud} usuariosAud={usuariosAud} desdeAud={desdeAud} setDesdeAud={setDesdeAud} hastaAud={hastaAud} setHastaAud={setHastaAud} accionesUnicasAud={accionesUnicasAud} auditoriaList={auditoriaList} actorAud={actorAud} tonoAccionAud={tonoAccionAud} detalleAudCorto={detalleAudCorto} />)}
                {activeTab === 'usuarios' && isAdmin && (<UsuariosView isLoading={isLoading} usuariosList={usuariosList} setUsuarioEditing={setUsuarioEditing} setIsUsuarioModalOpen={setIsUsuarioModalOpen} esDesarrollador={esDesarrollador} currentUser={currentUser} setItemToDelete={setItemToDelete} STYLES={STYLES} />)}
                {activeTab === 'anuncios' && esDesarrollador && (<AnunciosView usuariosList={usuariosList} anunciosGrupos={anunciosGrupos} onEnviar={enviarAnuncio} onEliminarGrupo={eliminarGrupoAnuncio} currentUser={currentUser} />)}
                {activeTab === 'funcionarios' && (<FuncionariosView isLoading={isLoading} dependenciaActual={dependenciaActual} funcionariosPurosDependencia={funcionariosPurosDependencia} filtroCargo={filtroCargo} setFiltroCargo={setFiltroCargo} cargosFuncionarios={cargosFuncionarios} sincronizarBienesConPadron={sincronizarBienesConPadron} handleDownloadTemplateFuncionarios={handleDownloadTemplateFuncionarios} fileInputFuncionariosRef={fileInputFuncionariosRef} isAdmin={isAdmin} setIsUbicacionesModalOpen={setIsUbicacionesModalOpen} setIsNewFuncionarioModalOpen={setIsNewFuncionarioModalOpen} searchFuncionarioInput={searchFuncionarioInput} setSearchFuncionarioInput={setSearchFuncionarioInput} setCurrentPaginaFuncionarios={setCurrentPaginaFuncionarios} funcionariosPaginados={funcionariosPaginados} handleEditFuncionario={handleEditFuncionario} handleDeleteFuncionario={handleDeleteFuncionario} renderPaginationFuncionarios={renderPaginationFuncionarios} />)}

                {activeTab === 'fc04' && (<Fc04View filteredFC04={filteredFC04} fc10Year={fc10Year} setFc10Year={setFc10Year} fc10Month={fc10Month} setFc10Month={setFc10Month} openFC04Modal={openFC04Modal} STYLES={STYLES} isLoading={isLoading || isLoadingDocumentos} ORIGENES_FC04={ORIGENES_FC04} handleGenerateFC04PDF={handleGenerateFC04PDF} isAdmin={isAdmin} setItemToDelete={setItemToDelete} />)}

                {activeTab === 'fc10' && (<Fc10View filteredFC10={filteredFC10} conteosFC10PorMes={conteosFC10PorMes} fc10Year={fc10Year} setFc10Year={setFc10Year} fc10Month={fc10Month} setFc10Month={setFc10Month} setIsConsolidatedFC10ModalOpen={setIsConsolidatedFC10ModalOpen} handleExportFC10CSV={handleExportFC10CSV} handleBulkFC10Zip={handleBulkFC10Zip} isLoading={isLoading} bienes={bienes} handleGenerateFC10PDF={handleGenerateFC10PDF} openFC10Modal={openFC10Modal} isAdmin={isAdmin} setItemToDelete={setItemToDelete} setActiveTab={setActiveTab} registrarFirmaFC10={firmarConBloqueo} registrarAmbasFirmas={firmarAmbasConBloqueo} firmandoId={firmandoId} ponerFC10EnTramite={ponerEnTramiteConBloqueo} poniendoEnTramite={poniendoEnTramite} actualizarEstadoFirma={actualizarEstadoFirma} currentUser={currentUser} />)}
                {activeTab === 'fc11' && (<Fc11View filteredFC11={filteredFC11} fc10Year={fc10Year} setFc10Year={setFc10Year} fc10Month={fc10Month} setFc10Month={setFc10Month} STYLES={STYLES} handleExportFC11CSV={handleExportFC11CSV} isLoading={isLoading || isLoadingDocumentos} dependenciaActual={dependenciaActual} handleGenerateFC11PDF={handleGenerateFC11PDF} openFC11Modal={openFC11Modal} bienes={bienes} isAdmin={isAdmin} setItemToDelete={setItemToDelete} registrarFirmasFC11={registrarFirmasFC11} registrandoFirmasFC11={isSaving} />)}
                {activeTab === 'ayuda' && (<AyudaView setTourPaso={setTourPaso} STYLES={STYLES} version={versionApp} />)}
            </div>
            </Suspense>
      </AppShell>

      {/* Modales y componentes flotantes (carga diferida) */}
      <Suspense fallback={null}>
      <AppModals STYLES={STYLES} isCSVPreviewOpen={isCSVPreviewOpen} setIsCSVPreviewOpen={setIsCSVPreviewOpen} confirmCSVImportFuncionarios={confirmCSVImportFuncionarios} csvPreviewData={csvPreviewData} isFuncionarioModalOpen={isFuncionarioModalOpen} setIsFuncionarioModalOpen={setIsFuncionarioModalOpen} funcionarioToEdit={funcionarioToEdit} saveFuncionarioEdit={saveFuncionarioEdit} ubicacionesDep={ubicacionesDep} isScannerOpen={isScannerOpen} setIsScannerOpen={setIsScannerOpen} setScanParaConteo={setScanParaConteo} scanParaConteo={scanParaConteo} conteoCodigos={conteoCodigos} isQRModalOpen={isQRModalOpen} setIsQRModalOpen={setIsQRModalOpen} isBulkQR={isBulkQR} qrTargetBien={qrTargetBien} handleDownloadLabelPNG={handleDownloadLabelPNG} handleDownloadSimpleQR={handleDownloadSimpleQR} handleBulkLabelPNGZip={handleBulkLabelPNGZip} handleBulkSimpleQRZip={handleBulkSimpleQRZip} setDarkMode={fijarTemaUsuario} setIsAtajosOpen={setIsAtajosOpen} handleExportInventarioCSV={exportarCSV} handleExportInventarioExcel={exportarExcel} repetirUltimaExportacion={repetirUltimaExportacion} ultimaExportacion={ultimaExportacion} isFC03ModalOpen={isFC03ModalOpen} setIsFC03ModalOpen={setIsFC03ModalOpen} fc03Config={fc03Config} setFc03Config={setFc03Config} fc03FuncionarioTexto={fc03FuncionarioTexto} setFc03FuncionarioTexto={setFc03FuncionarioTexto} showFC03FuncDropdown={showFC03FuncDropdown} setShowFC03FuncDropdown={setShowFC03FuncDropdown} ubicacionesUnicas={ubicacionesUnicas} funcionariosPadron={funcionariosPadron} dependenciaActual={dependenciaActual} executeGenerateFC03={executeGenerateFC03} isFC04ModalOpen={isFC04ModalOpen} setIsFC04ModalOpen={setIsFC04ModalOpen} fc04Editing={fc04Editing} saveFC04={saveFC04} fc10Month={fc10Month} fc10Year={fc10Year} ORIGENES_FC04={ORIGENES_FC04} fc04SinMovimiento={fc04SinMovimiento} setFc04SinMovimiento={setFc04SinMovimiento} handleAddFC04Item={handleAddFC04Item} fc04Items={fc04Items} handleFC04ItemChange={handleFC04ItemChange} handleRemoveFC04Item={handleRemoveFC04Item} isFC10ModalOpen={isFC10ModalOpen} setIsFC10ModalOpen={setIsFC10ModalOpen} fc10TargetBien={fc10TargetBien} fc10Editing={fc10Editing} saveFC10={saveFC10} funcionariosConDatos={funcionariosConDatos} estructurasDB={estructurasDB} isFC11ModalOpen={isFC11ModalOpen} setIsFC11ModalOpen={setIsFC11ModalOpen} fc11TargetBien={fc11TargetBien} fc11Editing={fc11Editing} saveFC11={saveFC11} todasDependencias={todasDependencias} isUsuarioModalOpen={isUsuarioModalOpen} isAdmin={isAdmin} setIsUsuarioModalOpen={setIsUsuarioModalOpen} usuarioEditing={usuarioEditing} saveUsuario={saveUsuario} esDesarrollador={esDesarrollador} isBienModalOpen={isBienModalOpen} setIsBienModalOpen={setIsBienModalOpen} bienEditing={bienEditing} setBienEditing={setBienEditing} bienFormRef={bienFormRef} saveBien={saveBien} isSaving={isSaving} ESTADOS_CONSERVACION={ESTADOS_CONSERVACION} sugerenciasBienesDep={sugerenciasBienesDep} padronDep={padronDep} fichaBien={fichaBien} setFichaBien={setFichaBien} setEventosAuditFicha={setEventosAuditFicha} eventosFicha={eventosFicha} subirFotoBien={subirFotoBien} eliminarFotoBien={eliminarFotoBien} subiendoFoto={subiendoFoto} tourPaso={tourPaso} pasosTour={pasosTour} setTourPaso={setTourPaso} cerrarTour={cerrarTour} setActiveTab={setActiveTab} cmdOpen={cmdOpen} setCmdOpen={setCmdOpen} bienes={bienes} irTabGlobal={irTabGlobal} isDependenciasModalOpen={isDependenciasModalOpen} setIsDependenciasModalOpen={setIsDependenciasModalOpen} dependenciasList={dependenciasList} DEPENDENCIAS_UNP={DEPENDENCIAS_UNP} dependenciasDetectadas={dependenciasDetectadas} conteosDependencia={conteosDependencia} guardarDependencia={guardarDependencia} eliminarDependencia={eliminarDependencia} fusionarDependencia={fusionarDependencia} isSavingDep={isSavingDep} verPadronDependencia={verPadronDependencia} ubicacionesList={ubicacionesList} conteosUbicacion={conteosUbicacion} guardarUbicacion={guardarUbicacion} eliminarUbicacion={eliminarUbicacion} asignarFuncionarioAUbicacion={asignarFuncionarioAUbicacion} isUbicacionesModalOpen={isUbicacionesModalOpen} setIsUbicacionesModalOpen={setIsUbicacionesModalOpen} isSavingUbicacion={isSavingUbicacion} isMantenimientoModalOpen={isMantenimientoModalOpen} setIsMantenimientoModalOpen={setIsMantenimientoModalOpen} mantenimiento={mantenimiento} saveMantenimiento={saveMantenimiento} isSavingMant={isSavingMant} showLogoutConfirm={showLogoutConfirm} setShowLogoutConfirm={setShowLogoutConfirm} handleLogout={handleLogout} resolucionBaja={resolucionBaja} setResolucionBaja={setResolucionBaja} submitResolucionBaja={submitResolucionBaja} motivoResolucion={motivoResolucion} setMotivoResolucion={setMotivoResolucion} itemToDelete={itemToDelete} setItemToDelete={setItemToDelete} motivoSolicitudBaja={motivoSolicitudBaja} setMotivoSolicitudBaja={setMotivoSolicitudBaja} confirmDeleteAction={confirmDeleteAction} confirmBackupModal={confirmBackupModal} setConfirmBackupModal={setConfirmBackupModal} handleExportBackupGeneral={handleExportBackupGeneral} pendingCSVImport={pendingCSVImport} setPendingCSVImport={setPendingCSVImport} fileInputRef={fileInputRef} fileInputFuncionariosRef={fileInputFuncionariosRef} executeProcessBienesCSV={executeProcessBienesCSV} executeProcessFuncionariosCSV={executeProcessFuncionariosCSV} previsualizarCSVBienes={previsualizarCSVBienes} showChangelog={showChangelog} setShowChangelog={setShowChangelog} isConsolidatedFC10ModalOpen={isConsolidatedFC10ModalOpen} setIsConsolidatedFC10ModalOpen={setIsConsolidatedFC10ModalOpen} handleGenerateConsolidatedFC10PDF={handleGenerateConsolidatedFC10PDF} isNewFuncionarioModalOpen={isNewFuncionarioModalOpen} setIsNewFuncionarioModalOpen={setIsNewFuncionarioModalOpen} handleSaveManualFuncionario={handleSaveManualFuncionario} showUnsavedChangesModal={showUnsavedChangesModal} setShowUnsavedChangesModal={setShowUnsavedChangesModal} showDependenciaConfirm={showDependenciaConfirm} setShowDependenciaConfirm={setShowDependenciaConfirm} confirmDependenciaChange={confirmDependenciaChange} pendingDependencia={pendingDependencia} clearAllFilters={clearAllFilters} setSearchTerm={setSearchTerm} setSearchInput={setSearchInput} setCurrentPage={setCurrentPage} openFC03Modal={openFC03Modal} openFC10Modal={openFC10Modal} fc10List={fc10List} fc11List={fc11List}  modoCampo={modoCampo} setModoCampo={setModoCampo} ultimoEscaneo={ultimoEscaneo} setUltimoEscaneo={setUltimoEscaneo} openFichaBien={openFichaBien} />
      </Suspense>
      <AtajosModal isOpen={isAtajosOpen} onClose={() => setIsAtajosOpen(false)} STYLES={STYLES} />
      <RestoreBackupModal restore={restore} />
      <NombreArchivoModal
        key={solicitudNombreArchivo?.id || 'sin-solicitud'}
        solicitud={solicitudNombreArchivo}
        onAceptar={(nombre) => { solicitudNombreArchivo?.aceptar(nombre); setSolicitudesNombreArchivo(actuales => actuales.slice(1)); }}
        onUsarSugerido={() => resolverNombreArchivo('usarSugerido')}
      />
    </div>
  );
}




