import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { POLL_NOTIFICACIONES_MS, REALTIME_BENS_ACTIVO, REALTIME_NOTIF_ACTIVO, POLL_NOTIF_ROWS } from '../services/supabaseFreeTier';
import { crearGuardaGeneracion } from '../utils/concurrencia';
import localforage from 'localforage';
import { debeResyncTotal, fusionarBienes, ahoraISO } from '../services/syncBienes';
import { normalizeStr } from '../utils/helpers';
import { processOfflineQueue, getOfflineQueueLength } from '../services/offlineSyncService';
import { escaparFiltroPostgrest, rolDesdeCargo, rolEsPrivilegiado } from '../utils/postgrest';

// La regla de dependencias de hooks se desactiva en este archivo a proposito:
//
// El "motor de arranque" llama a cargarNotificaciones, sondearNotificaciones
// y fusionarNotificacion, que estan declaradas MAS ABAJO en este mismo
// archivo. Listarlas como dependencias las usaria antes de que existan
// (error de TDZ). El resto de las dependencias estan declaradas.
/* eslint-disable react-hooks/exhaustive-deps */


// Sincronización de datos: fetch inicial (total + delta), realtime,
// notificaciones y modo offline (extraído de App.jsx, Fase 6).
//
// Parámetros:
// - notify: addToast estable.
// - currentUser, dependenciaActual, isAuthenticated, isAdmin: contexto.
// - handleLogout: de useAuthSession (valida la sesión en cada fetch).
// - setBienes, setFc10List, setFc11List, setFc04List, setEstructurasDB,
//   setUsuariosList, setFuncionariosPadron, setDbError, setIsLoading,
//   setFichaBien: setters que viven en App.
export function useRealtimeSync({
  notify, currentUser, setCurrentUser, dependenciaActual, activeTab, isAuthenticated, isAdmin,
  handleLogout, setBienes, setFc10List, setFc11List, setFc04List,
  setEstructurasDB, setUsuariosList, setFuncionariosPadron,
  setDbError, setIsLoading, setFichaBien
}) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [ultimoSyncBienes, setUltimoSyncBienes] = useState(null);
  const [isLoadingDocumentos, setIsLoadingDocumentos] = useState(false);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pestanaVisible, setPestanaVisible] = useState(() => typeof document === 'undefined' || !document.hidden);

  useEffect(() => {
    const actualizarVisibilidad = () => setPestanaVisible(!document.hidden);
    document.addEventListener('visibilitychange', actualizarVisibilidad);
    return () => document.removeEventListener('visibilitychange', actualizarVisibilidad);
  }, []);

  // Guarda de concurrencia en ref para que sobreviva a los renders.
  // Invalida cargas viejas cuando el usuario cambia de dependencia o desmonta.
  const guardaGenRef = useRef(null);
  if (!guardaGenRef.current) guardaGenRef.current = crearGuardaGeneracion();
  const guardaGen = guardaGenRef.current;

  // Al cambiar de dependencia, la carga anterior deja de ser válida: aunque su
  // petición ya esté en camino, su resultado corresponde a otra dependencia y no
  // debe llegar a la pantalla.
  const depAnteriorRef = useRef(dependenciaActual);
  const secundariosCargadosRef = useRef({ dependencia: dependenciaActual, fc11: 0, fc04: 0 });
  useEffect(() => {
    let vigente = true;
    setUltimoSyncBienes(null);
    localforage.getItem(`bienes_meta_${dependenciaActual}`).then(meta => {
      if (vigente && meta?.actualizadoEn) setUltimoSyncBienes(meta.actualizadoEn);
    }).catch(() => {});
    return () => { vigente = false; };
  }, [dependenciaActual]);

  useEffect(() => {
    if (depAnteriorRef.current !== dependenciaActual) {
      depAnteriorRef.current = dependenciaActual;
      guardaGen.invalidar();
      secundariosCargadosRef.current = { dependencia: dependenciaActual, fc11: 0, fc04: 0 };
      setFc11List([]);
      setFc04List([]);
    }
  }, [dependenciaActual, guardaGen]);

  // Higiene de notificaciones: retención de 2 días. Solo se borra lo ya
  // visto (leídas) y las solicitudes resueltas; lo no leído y lo pendiente
  // nunca se toca.
  const RETENCION_NOTIF_MS = 2 * 24 * 60 * 60 * 1000;
  const esAnuncioGlobal = (n) => !!n && n.accion === 'anuncio' && n.usuarioDestino === 'TODOS';

  // Fetch acotado: solo mías + broadcast + solicitudes pendientes, con
  // límite. Antes era `select('*')` de toda la tabla para todos.
  // Con useCallback: si no, seria una funcion nueva en cada render y los
  // effects que dependen de ella se reejecutarian sin parar.
  const queryNotificacionesAcotadas = useCallback(() => {
    const u = currentUser?.username
      ? escaparFiltroPostgrest(currentUser.username)
      : '';
    const filtros = u
      ? `data->>usuarioDestino.eq.${u},data->>usuarioDestino.eq.TODOS,data->>estado.eq.PENDIENTE`
      : `data->>usuarioDestino.eq.TODOS,data->>estado.eq.PENDIENTE`;
    return supabase.from('notificaciones').select('id, data, updated_at').or(filtros).order('updated_at', { ascending: false }).limit(500);
  }, [currentUser?.username]);

  // Purga local (throttle 2 días por usuario): borra leídas viejas,
  // anuncios globales totalmente leídos y solicitudes resueltas viejas.
  const purgarNotificacionesViejas = async (filas) => {
    try {
      const user = currentUser?.username || 'anon';
      const key = `notif_purge_ts_${user}`;
      const last = parseInt(localStorage.getItem(key) || '0', 10) || 0;
      if (Date.now() - last < RETENCION_NOTIF_MS) return;
      localStorage.setItem(key, String(Date.now()));
      const corte = Date.now() - RETENCION_NOTIF_MS;
      const fechaDe = (n) => new Date(n.resueltoFecha || n.fecha || n.created_at || 0).getTime() || 0;
      const paraBorrar = (filas || []).filter(n => {
        if (fechaDe(n) >= corte) return false;
        if (n.tipo === 'BAJA_BIEN' || n.tipo === 'BAJA_FUNCIONARIO') {
          return n.estado === 'APROBADO' || n.estado === 'RECHAZADO';
        }
        if (esAnuncioGlobal(n)) {
          return (n.totalDest || 0) > 0 && (n.leidos || []).length >= (n.totalDest || 0);
        }
        return n.leido === true;
      });
      if (paraBorrar.length === 0) return;
      const ids = paraBorrar.map(n => n.id);
      for (let i = 0; i < ids.length; i += 20) {
        await Promise.all(ids.slice(i, i + 20).map(id => supabase.from('notificaciones').delete().eq('id', id)));
      }
      const set = new Set(ids);
      setNotificaciones(prev => prev.filter(n => !set.has(n.id)));
    } catch {}
  };

  const fetchData = useCallback(async (isSilent = false) => {
    // Toma turno de carga. Si el usuario cambia de dependencia mientras esta
    // corre, arranca otra que toma un turno mayor: cuando la vieja llegue, ya
    // no podrá escribir y no pisará los datos nuevos.
    const turno = guardaGen.siguiente();
    // Se declara FUERA del try: un `const` dentro del bloque try NO es visible
    // en el `finally` (son ámbitos léxicos distintos) y `clearTimeout(timeoutId)`
    // lanzaba ReferenceError en cada carga de datos.
    let timeoutId = null;
    try {
      if (!isSilent && guardaGen.vigente(turno)) setIsLoading(true);

    // --- 1. VALIDACIÓN DE ROL EN SERVIDOR ---
    if (currentUser?.username) {
        const { data: dbUser, error: userError } = await supabase
          .from('usuarios')
          .select('username, cargo, dependencia')
          .eq('username', currentUser.username)
          .maybeSingle();

        if (userError || !dbUser) {
          notify("Sesión no válida o usuario inexistente.", "error");
          handleLogout();
          return;
        }

        const roleDb = rolDesdeCargo(dbUser.cargo);
        if (rolEsPrivilegiado(currentUser.role) && !rolEsPrivilegiado(dbUser.cargo)) {
          notify("Se detectó una alteración no autorizada en los permisos de sesión.", "error");
          handleLogout();
          return;
        }
        if (
          currentUser.role !== roleDb
          || currentUser.cargo !== dbUser.cargo
          || (dbUser.dependencia && currentUser.dependencia !== dbUser.dependencia)
        ) {
          const actualizado = {
            ...currentUser,
            cargo: dbUser.cargo,
            role: roleDb,
            dependencia: dbUser.dependencia || currentUser.dependencia
          };
          setCurrentUser(actualizado);
          try { localStorage.setItem('current_user', JSON.stringify(actualizado)); } catch { /* ignore */ }
        }
      }
    // --- FIN DE VALIDACIÓN DE ROL ---

    let vencido = false;
    // La carga inicial descarga TODO el inventario de la dependencia (miles de
    // filas). El margen de 8 s estaba pensado para una peticion colgada y se
    // cumplia en cada primera carga: la descarga se abortaba y el inventario
    // quedaba vacio. 45 s para la carga completa, 20 s para el delta.
    const margenMs = isSilent ? 20000 : 45000;
    timeoutId = setTimeout(() => { vencido = true; }, margenMs);
    // "Esta carga ya no vale" (arranco otra mas nueva): ahi si no se escribe.
    const turnoVigente = () => guardaGen.vigente(turno);
    // "Esta carga tardo demasiado": se avisa, pero los datos que llegaron bien
    // se usan. Antes las dos cosas eran la misma y se perdian datos ya
    // descargados.
    const _sigueVigente = () => !vencido && turnoVigente();

      const fetchPromise = (async () => {
        // --- BIENES: descarga total solo si hace falta, si no delta por updated_at ---
        const CACHE_BIENES = `bienes_cache_${dependenciaActual}`;
        const META_BIENES = `bienes_meta_${dependenciaActual}`;
        let metaBienes = null;
        let cacheBienes = null;
        try { metaBienes = await localforage.getItem(META_BIENES); } catch {}
        try { cacheBienes = await localforage.getItem(CACHE_BIENES); } catch {}
        // La carga ya pasó la validación de sesión. Muestra el inventario local
        // mientras llega la sincronización para evitar una pantalla vacía al
        // iniciar o al volver a una dependencia conocida.
        if (Array.isArray(cacheBienes) && cacheBienes.length > 0 && turnoVigente()) setBienes(cacheBienes);
        const descargaTotal = debeResyncTotal(metaBienes) || !Array.isArray(cacheBienes);

        // Inicia las consultas de actas y catálogos junto con la descarga de
        // bienes. Antes empezaban después de bajar el inventario completo, lo
        // que sumaba ambas latencias en cada arranque.
        const traerPaginas = async (crearConsulta, columnaOrden = 'id') => {
          const filas = [];
          const tamanoPagina = 1000;
          for (let desde = 0; ; desde += tamanoPagina) {
            const { data, error } = await crearConsulta()
              .order(columnaOrden, { ascending: true })
              .range(desde, desde + tamanoPagina - 1);
            if (error) throw error;
            filas.push(...(data || []));
            if (!data || data.length < tamanoPagina) return filas;
          }
        };
        const consultasSecundariasPromise = Promise.all([
          traerPaginas(() => supabase.from('fc10').select('id, data').eq('data->>dependencia', dependenciaActual)),
          traerPaginas(() => supabase.from('estructuras').select('id, data')),
          queryNotificacionesAcotadas(),
          traerPaginas(() => supabase.from('usuarios').select('username, nombre, cargo, dependencia'), 'username'),
          traerPaginas(() => supabase.from('funcionarios').select('*'))
        ]).then(value => ({ value }), error => ({ error }));

        if (descargaTotal) {
        let todosLosNuevosBienes = [];
        let rangeSize = 1000;
        let from = 0;
        let to = rangeSize - 1;
        let keepFetchingBienes = true;

        while (keepFetchingBienes) {
          let query = supabase
            .from('bens')
            .select('id, data, updated_at')
            .eq('data->>dependencia', dependenciaActual);

          const { data: batch, error } = await query.range(from, to);

          if (error || !batch || batch.length === 0) {
            keepFetchingBienes = false;
          } else {
            for (const item of batch) todosLosNuevosBienes.push(item);
            if (batch.length < rangeSize) {
              keepFetchingBienes = false;
            } else {
              from += rangeSize;
              to += rangeSize;
            }
          }
        }

        const { lista: inventarioFinal, maxUpdatedAt } = fusionarBienes([], todosLosNuevosBienes, dependenciaActual);
        if (inventarioFinal.length > 0) {
          await localforage.setItem(CACHE_BIENES, inventarioFinal);
          // Si ninguna fila trae sello (datos legacy), el punto de sync es "ahora":
          // desde aquí, toda edición ya sale sellada y entra en el delta.
          const fechaSync = Date.now();
          await localforage.setItem(META_BIENES, { updated_at: maxUpdatedAt || ahoraISO(), actualizadoEn: fechaSync });
          if (!turnoVigente()) return;
          setBienes(inventarioFinal);
          setUltimoSyncBienes(fechaSync);
        } else {
          const fechaVacia = Date.now();
          await localforage.setItem(CACHE_BIENES, []);
          await localforage.setItem(META_BIENES, { updated_at: ahoraISO(), actualizadoEn: fechaVacia });
          if (!turnoVigente()) return;
          setBienes([]);
          setUltimoSyncBienes(fechaVacia);
        }
        } else {
          // Delta: solo filas tocadas desde la última sincronización (KB, no MB).
          const { data: cambios, error: errorDelta } = await supabase
            .from('bens')
            .select('id, data, updated_at')
            .eq('data->>dependencia', dependenciaActual)
            .gt('updated_at', metaBienes.updated_at);
          if (errorDelta) throw errorDelta;
          const { lista, maxUpdatedAt } = fusionarBienes(cacheBienes, cambios || [], dependenciaActual);
          await localforage.setItem(CACHE_BIENES, lista);
          const fechaSync = Date.now();
          await localforage.setItem(META_BIENES, { updated_at: maxUpdatedAt || metaBienes.updated_at, actualizadoEn: fechaSync });
          if (!turnoVigente()) return;
          setBienes(lista);
          setUltimoSyncBienes(fechaSync);
        }

        // fc11 no tiene columna 'dependencia': guarda remitente y destinataria. Antes
        // se pedía la tabla COMPLETA (sin filtro) y se filtraba en el cliente,
        // lo que arrastraba los traslados de todas las dependencias — cada fila
        // incluye un snapshot completo del bien — y los mostraba la Ficha 360.
        const consultasSecundarias = await consultasSecundariasPromise;
        if (consultasSecundarias.error) throw consultasSecundarias.error;
        const [resFc10, resEstructuras, resAuditoria, resUsuarios, resFuncionarios] = consultasSecundarias.value;

        const parseDirect = (resData) => {
            if (!resData) return [];
            return resData.map(item => {
                if (item.data) {
                    let parsed = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
                    return { id: item.id, ...parsed };
                }
                return item;
            });
        };

        // Punto único de decisión: si meanwhile arrancó otra carga, esta ya no escribe.
        if (!turnoVigente()) return;

        setFc10List(parseDirect(resFc10.data));
        setEstructurasDB(parseDirect(resEstructuras.data));

        const notifData = resAuditoria.data || [];
        setNotificaciones(notifData.map(item => item.data ? (typeof item.data === 'string' ? JSON.parse(item.data) : item.data) : item));

        setUsuariosList(resUsuarios.data || []);

        const funcsData = resFuncionarios.data || [];
        setFuncionariosPadron(funcsData.map(item => item.data ? (typeof item.data === 'string' ? JSON.parse(item.data) : item.data) : item));

        setDbError(false);
      })();

      await fetchPromise;
      if (vencido && !isSilent && guardaGen.vigente(turno)) setDbError(true);

    } catch (error) { 
        console.error("Error crítico de datos:", error);
        if (!isSilent && guardaGen.vigente(turno)) setDbError(true);
        
        try {
            const cachedBienes = await localforage.getItem(`bienes_cache_${dependenciaActual}`);
            if (guardaGen.vigente(turno) && cachedBienes && cachedBienes.length > 0) {
                setBienes(cachedBienes);
            }
        } catch {}
    } finally {
        if (timeoutId) clearTimeout(timeoutId);
        // Solo la carga vigente apaga el spinner: si una vieja termina después,
        // no debe apagar el estado de carga de la que está realmente corriendo.
        if (guardaGen.vigente(turno)) setIsLoading(false);
    }
  }, [dependenciaActual, currentUser, handleLogout, notify, setCurrentUser,
    queryNotificacionesAcotadas,
    setBienes, setFc10List, setFc11List, setFc04List, setEstructurasDB,
    setUsuariosList, setFuncionariosPadron, setIsLoading, setDbError,
    guardaGen]);

  // FC-11 y FC-04 se consultan al entrar a su sección. Cada página usa el
  // límite de PostgREST y la descarga se repite tras cinco minutos.
  const solicitudDocumentoRef = useRef(0);
  useEffect(() => {
    const modulo = activeTab === 'fc11' ? 'fc11' : activeTab === 'fc04' ? 'fc04' : null;
    if (!isAuthenticated || !pestanaVisible || !modulo) return undefined;
    const marca = secundariosCargadosRef.current;
    if (marca.dependencia !== dependenciaActual) {
      secundariosCargadosRef.current = { dependencia: dependenciaActual, fc11: 0, fc04: 0 };
    }
    const ahora = Date.now();
    if (ahora - (secundariosCargadosRef.current[modulo] || 0) < 5 * 60 * 1000) return undefined;

    let vigente = true;
    const solicitud = ++solicitudDocumentoRef.current;
    const paginar = async () => {
      const filas = [];
      const escDep = escaparFiltroPostgrest(dependenciaActual);
      for (let desde = 0; ; desde += 1000) {
        const query = modulo === 'fc11'
          ? supabase.from('fc11').select('id, data')
            .or(`data->>dependenciaRemitente.eq.${escDep},data->>dependenciaDestinataria.eq.${escDep}`)
          : supabase.from('fc04').select('id, data').eq('data->>dependencia', dependenciaActual);
        const { data, error } = await query.order('id', { ascending: true }).range(desde, desde + 999);
        if (error) throw error;
        filas.push(...(data || []));
        if (!data || data.length < 1000) return filas;
      }
    };

    setIsLoadingDocumentos(true);
    paginar().then(filas => {
      if (!vigente || solicitudDocumentoRef.current !== solicitud) return;
      const registros = filas.map(item => {
        if (!item.data) return item;
        const datos = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
        return { id: item.id, ...datos };
      });
      if (modulo === 'fc11') setFc11List(registros);
      else setFc04List(registros);
      secundariosCargadosRef.current[modulo] = Date.now();
    }).catch(error => {
      if (vigente) notify(`No se pudo cargar ${modulo.toUpperCase()}. Vuelve a intentarlo al entrar de nuevo.`, 'error');
      console.error(`Error al cargar ${modulo}:`, error);
    }).finally(() => {
      if (vigente && solicitudDocumentoRef.current === solicitud) setIsLoadingDocumentos(false);
    });

    return () => {
      vigente = false;
      if (solicitudDocumentoRef.current === solicitud) setIsLoadingDocumentos(false);
    };
  }, [activeTab, dependenciaActual, isAuthenticated, pestanaVisible, notify, setFc11List, setFc04List]);

  // --- MOTOR DE ARRANQUE DE DATOS ---
  useEffect(() => { 
      if (isAuthenticated && pestanaVisible) {
          // Al volver a la pestaña se reconcilia el delta antes de retomar
          // canales y sondeos; mientras está oculta no consume conexiones ni mensajes.
          fetchData(false); 
  // `cargarNotificaciones`, `sondearNotificaciones` y `fusionarNotificacion`
  // se decluan DESPUES de este efecto: listarlas aqui las usaria antes de
  // que existan (error de TDZ).
          cargarNotificaciones();
          const notifInterval = setInterval(() => { if (!document.hidden) sondearNotificaciones(); }, POLL_NOTIFICACIONES_MS);
          // Realtime de notificaciones desactivado en favor del sondeo: en el plan
          // free cada conexión y cada mensaje cuentan, y el sondeo cada 60 s
          const notifChannel = REALTIME_NOTIF_ACTIVO
            ? supabase.channel("notif-realtime").on("postgres_changes", { event: "*", schema: "public", table: "notificaciones" }, (payload) => { fusionarNotificacion(payload); }).subscribe()
            : null;
          // Tiempo real en bienes: lo que cambia en un equipo (ej: foto desde el celular)
          // se refleja solo en los demás, sin refrescar. Este canal sí se mantiene:
          // es el que hace útil la app en campo, y el delta cubre el resto del tráfico.
          const bensChannel = REALTIME_BENS_ACTIVO ? supabase.channel("bens-realtime").on("postgres_changes", { event: "*", schema: "public", table: "bens" }, (payload) => {
              try {
                  if (payload.eventType === 'DELETE') {
                      if (payload.old?.id) {
                        setBienes(prev => prev.filter(b => b.id !== payload.old.id));
                        // La caché también debe olvidar el borrado o el próximo delta lo resucita.
                        localforage.getItem(`bienes_cache_${dependenciaActual}`).then(cache => {
                          if (Array.isArray(cache)) localforage.setItem(`bienes_cache_${dependenciaActual}`, cache.filter(b => b.id !== payload.old.id));
                        }).catch(() => {});
                      }
                      return;
                  }
                  const row = payload.new;
                  if (!row) return;
                  const d = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {});
                  // El canal trae cambios de TODAS las dependencias: lo ajeno no se mezcla.
                  // Comparación tolerante (tildes/mayúsculas) como el resto.
                  if (normalizeStr(d.dependencia || '') !== normalizeStr(dependenciaActual)) {
                      setBienes(prev => prev.filter(b => b.id !== row.id));
                      localforage.getItem(`bienes_cache_${dependenciaActual}`).then(cache => {
                        if (Array.isArray(cache)) localforage.setItem(`bienes_cache_${dependenciaActual}`, cache.filter(b => b.id !== row.id));
                      }).catch(() => {});
                      return;
                  }
                  const bien = { id: row.id, ...d };
                  setBienes(prev => {
                      const i = prev.findIndex(b => b.id === bien.id);
                      if (i === -1) return [...prev, bien];
                      const copia = [...prev];
                      copia[i] = bien;
                      return copia;
                  });
                  setFichaBien(prev => (prev && prev.id === bien.id ? bien : prev));
                  localforage.getItem(`bienes_cache_${dependenciaActual}`).then(async cache => {
                    if (!Array.isArray(cache)) return;
                    const { lista, maxUpdatedAt } = fusionarBienes(cache, [row], dependenciaActual);
                    const actualizadoEn = Date.now();
                    await localforage.setItem(`bienes_cache_${dependenciaActual}`, lista);
                    await localforage.setItem(`bienes_meta_${dependenciaActual}`, {
                      updated_at: maxUpdatedAt || row.updated_at,
                      actualizadoEn
                    });
                    setUltimoSyncBienes(actualizadoEn);
                  }).catch(() => {});
              } catch {}
          }).subscribe() : null;
          return () => {
              clearInterval(notifInterval);
              // removeChannel(null) es seguro, pero se evita la llamada suelta.
              if (notifChannel) supabase.removeChannel(notifChannel);
              if (bensChannel) supabase.removeChannel(bensChannel);
              // Al cerrar sesión (el efecto se desmonta) se invalidan las cargas
              // en vuelo: si resolvieran después escribirían datos sobre un
              // componente que ya no tiene sesión.
              guardaGen.invalidar();
          };
      }
  }, [isAuthenticated, pestanaVisible, fetchData, dependenciaActual, isAdmin,
    setBienes, setFichaBien, guardaGen]);

  const markAsRead = async (notif) => {
      const user = currentUser?.username;
      if (esAnuncioGlobal(notif)) {
          const leidos = Array.isArray(notif.leidos) ? notif.leidos : [];
          if (!user || leidos.includes(user)) return;
          const { leido: _ign, ...base } = notif;
          const updated = { ...base, leidos: [...leidos, user] };
          setNotificaciones(prev => prev.map(n => n.id === notif.id ? updated : n));
          try {
              await supabase.from('notificaciones').update({ data: updated }).eq('id', notif.id);
          } catch {}
          return;
      }
      if(notif.leido) return;
      const updated = {...notif, leido: true};
      setNotificaciones(prev => prev.map(n => n.id === notif.id ? updated : n));
      try { 
          await supabase.from('notificaciones').update({ data: updated }).eq('id', notif.id);
      } catch {}
  };

  const markAllAsRead = async () => {
      const user = currentUser?.username;
      const pendientes = misNotificaciones.filter(n => !n.leido);
      if (pendientes.length === 0) return;
      const ids = new Set(pendientes.map(n => n.id));
      setNotificaciones(prev => prev.map(n => {
          if (!ids.has(n.id)) return n;
          if (esAnuncioGlobal(n)) {
              const leidos = Array.isArray(n.leidos) ? n.leidos : [];
              return (user && !leidos.includes(user)) ? { ...n, leidos: [...leidos, user] } : n;
          }
          return { ...n, leido: true };
      }));
      try {
          await Promise.all(pendientes.map(n => {
              const base = notificaciones.find(x => x.id === n.id) || n;
              let payload;
              if (esAnuncioGlobal(base)) {
                  const { leido: _ign, ...sinLeido } = base;
                  const leidos = Array.isArray(base.leidos) ? base.leidos : [];
                  payload = user && !leidos.includes(user) ? { ...sinLeido, leidos: [...leidos, user] } : null;
              } else {
                  payload = { ...n, leido: true };
              }
              return payload ? supabase.from('notificaciones').update({ data: payload }).eq('id', n.id) : Promise.resolve();
          }));
      } catch {}
  };

  const misNotificaciones = useMemo(() => { 
    // Broadcast (TODOS) + directas. En el broadcast el leído es por
    // usuario (array `leidos`); se mapea a `leido` efectivo para la UI.
    const directas = notificaciones
      .filter(n => n.tipoRegistro === 'NOTIFICACION' && (n.usuarioDestino === currentUser?.username || n.usuarioDestino === 'TODOS'))
      .map(n => (esAnuncioGlobal(n) ? { ...n, leido: (n.leidos || []).includes(currentUser?.username) } : n));

    if (isAdmin) {
      const solicitudesComoNotif = notificaciones
        .filter(n => (n.tipo === 'BAJA_BIEN' || n.tipo === 'BAJA_FUNCIONARIO') && n.estado === 'PENDIENTE')
        .map(n => ({
          id: n.id,
          tipoRegistro: 'NOTIFICACION',
          esSolicitud: true,
          accion: 'solicitud',
          titulo: n.tipo === 'BAJA_FUNCIONARIO'
            ? `Solicitud de padrón: ${n.nombre || 'S/N'}`
            : `Solicitud de Baja: #${n.rotulo || 'S/R'}`,
          mensaje: n.tipo === 'BAJA_FUNCIONARIO'
            ? `${n.solicitante || 'Un funcionario'} solicita eliminar a "${n.nombre || ''}" del padrón. Motivo: ${n.motivo || 'No especificado'}.`
            : `${n.solicitante || 'Un funcionario'} solicita la baja de "${n.descripcion || 'Bien'}". Motivo: ${n.motivo || 'No especificado'}.`,
          fecha: n.created_at || new Date().toISOString(),
          leido: false,
          notifOrigen: n
        }));

      return [...solicitudesComoNotif, ...directas].sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    }

    return directas.sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()); 
  }, [notificaciones, currentUser, isAdmin]);

  const unreadCount = misNotificaciones.filter(n => !n.leido).length;

  const parseNotifRow = (item) => {
      const d = item.data ? (typeof item.data === 'string' ? JSON.parse(item.data) : item.data) : item;
      return { id: item.id, ...d };
  };

  const cargarNotificaciones = async () => {
      const { data, error } = await queryNotificacionesAcotadas();
      if (!error && data) {
          const filas = data.map(parseNotifRow);
          setNotificaciones(filas);
          purgarNotificacionesViejas(filas);
      }
  };

  // Sondeo liviano: solo lo que todavía no se vio, fusionado sin recargar todo.
  //
  // El plan free da 2 M de filas leidas al mes. A 100 filas cada 60 s eran
  // ~1,44 M por cliente de 8 h/dia: con dos o tres equipos el SOLO sondeo ya
  // reventaba la cuota. Ahora son 25 filas cada 3 minutos, se saltea con la
  // pestaña oculta y se detiene si el documento no está visible.
  const sondearNotificaciones = async () => {
      try {
          if (typeof document !== 'undefined' && document.hidden) return;
          const u = currentUser?.username
            ? escaparFiltroPostgrest(currentUser.username)
            : '';
          const filtros = u
            ? `data->>usuarioDestino.eq.${u},data->>usuarioDestino.eq.TODOS,data->>estado.eq.PENDIENTE`
            : `data->>usuarioDestino.eq.TODOS,data->>estado.eq.PENDIENTE`;
          const { data, error } = await supabase.from('notificaciones').select('id, data, updated_at').or(filtros).order('updated_at', { ascending: false }).limit(POLL_NOTIF_ROWS);
          if (error || !data) return;
          const frescas = data.map(parseNotifRow);
          setNotificaciones(prev => {
              const mapa = new Map(prev.map(n => [n.id, n]));
              // Fusiona por id, pero el estado local gana: el marcado de "leído"
              // es optimista y una respuesta vieja del servidor lo pisaba,
              // haciendo reaparecer el aviso con el contador arriba.
              const vistaPrevia = new Set(prev.filter(n => n.leido).map(n => n.id));
              frescas.forEach(n => mapa.set(n.id, vistaPrevia.has(n.id) ? { ...n, leido: true } : n));
              return [...mapa.values()];
          });
      } catch {}
  };

  const fusionarNotificacion = (payload) => {
      try {
          if (payload.eventType === 'DELETE') {
              if (payload.old?.id) setNotificaciones(prev => prev.filter(n => n.id !== payload.old.id));
              return;
          }
          const row = payload.new;
          if (!row) return;
          const parsed = parseNotifRow(row);
          // El canal trae cambios de todos: lo ajeno no se mezcla.
          const u = currentUser?.username;
          const esMia = parsed.tipoRegistro === 'NOTIFICACION' && (parsed.usuarioDestino === u || parsed.usuarioDestino === 'TODOS');
          const esSolicitud = (parsed.tipo === 'BAJA_BIEN' || parsed.tipo === 'BAJA_FUNCIONARIO') && parsed.estado === 'PENDIENTE';
          if (!esMia && !esSolicitud) return;
          setNotificaciones(prev => {
              const i = prev.findIndex(n => n.id === parsed.id);
              if (i === -1) return [parsed, ...prev];
              const copia = [...prev];
              copia[i] = parsed;
              return copia;
          });
      } catch {}
  };

  // xÓ Escuchador de estado de red (Offline / Online)
  const [colaOffline, setColaOffline] = useState(0);
  const refrescarColaOffline = async () => {
    try { setColaOffline(await getOfflineQueueLength()); } catch {}
  };
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Cuando regresa internet, vaciamos la cola guardada localmente
      processOfflineQueue((count) => {
        notify(`Se sincronizaron ${count} operaciones guardadas en modo local.`, "success");
        fetchData(true); // Recargamos los datos para reflejar los cambios reales de Supabase
        refrescarColaOffline();
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      notify("Conexión perdida. Se activó el modo de almacenamiento local.", "warning");
    };

    // Escuchar eventos nativos del navegador
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Intentar sincronizar por si había algo pendiente al cargar la app
    if (navigator.onLine) {
      handleOnline();
    }
    refrescarColaOffline();
    const tCola = setInterval(() => { refrescarColaOffline(); }, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(tCola);
    };
  }, [fetchData, notify]);

  // NOTA: este hook ya carga los datos en el efecto de arranque de arriba
  // (mismas dependencias: isAuthenticated, fetchData, dependenciaActual,
  // isAdmin). Antes había un segundo efecto igual acá que ejecutaba la misma
  // descarga otra vez en cada login y en cada cambio de dependencia: el doble
  // de peticiones, el doble de filas leídas del plan free y dos escrituras
  // competing sobre la misma caché de IndexedDB.

  return {
    isOnline, colaOffline, notificaciones, setNotificaciones, ultimoSyncBienes, isLoadingDocumentos,
    fetchData, cargarNotificaciones, sondearNotificaciones, fusionarNotificacion,
    markAsRead, markAllAsRead, misNotificaciones, unreadCount
  };
}
