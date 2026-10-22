import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { INACTIVITY_LIMIT_MS } from '../constants/appConstants';
import { leerUsuarioLocal, sesionMarcadaLocal } from '../utils/sesionLocal';
import { normalizarEntradaAcceso, validarPassword, construirSesion } from '../utils/authInput';
import { APP_VERSION } from '../utils/helpers';

// Sesión y autenticación (extraído de App.jsx, Fase 6).
// Autosuficiente a propósito: incluye dependenciaActual, isProcessing y
// showLogoutConfirm para no crear referencias circulares por orden de
// declaración. Único parámetro: notify (addToast estable).
export function useAuthSession({ notify }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sesionMarcadaLocal());
  const [currentUser, setCurrentUser] = useState(() => leerUsuarioLocal());

  // Admin solo por rol. Antes comparaba además `cargo === 'cargo'`, que no es un
  // rol sino el nombre del campo: cualquier registro con ese texto quedaba como
  // administrador.
  const isAdmin = useMemo(() => currentUser?.role === 'admin' || currentUser?.role === 'dev', [currentUser]);
  // Desarrollador: mismas capacidades que admin, pero nunca bloqueado por mantenimiento
  // y único con acceso al módulo de mantenimiento.
  const esDesarrollador = useMemo(() => currentUser?.role === 'dev', [currentUser]);

  const [loginUser, setLoginUser] = useState(''); 
  const [loginPass, setLoginPass] = useState(''); 
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(false);

  const [isProcessing, setIsProcessing] = useState({ active: false, text: '' });

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [mantenimiento, setMantenimiento] = useState(null);
  const [isMantenimientoModalOpen, setIsMantenimientoModalOpen] = useState(false);
  const [isSavingMant, setIsSavingMant] = useState(false);
  // Puerta de acceso dev: si el muro te agarra sin sesión, este flag muestra
  // el login en vez del muro. Solo una sesión con cargo 'desarrollador'
  // levanta el bloqueo (misma validación de siempre, sin atajos nuevos).
  const [mostrarLoginDev, setMostrarLoginDev] = useState(false);

  useEffect(() => {
    let alive = true;
    const cargar = async () => {
      if (document.hidden) return;
      try {
        const { data, error } = await supabase.from('app_config').select('*').eq('id', 'global').limit(1);
        if (!error && data && data[0] && alive) setMantenimiento(data[0]);
      } catch {}
    };
    cargar();
    const t = setInterval(cargar, 60000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const [dependenciaActual, setDependenciaActual] = useState(() => {
    if (currentUser?.dependencia) return currentUser.dependencia;
    return isAdmin ? 'Rectorado' : 'Rectorado';
  });

  const handleLogout = useCallback(() => {
    try { supabase.auth.signOut(); } catch {}
    localStorage.removeItem('is_logged_in');
    localStorage.removeItem('current_user');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setShowLogoutConfirm(false);
  }, []);

  // Sesión real: al arrancar, solo vale si Supabase confirma sesión activa.
  // Sin sesión no hay acceso aunque exista bandera local (cierra la puerta de DevTools).
  useEffect(() => {
    let vivo = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!vivo) return;
      if (!data.session) {
        localStorage.removeItem('is_logged_in');
        localStorage.removeItem('current_user');
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === 'SIGNED_OUT') {
        localStorage.removeItem('is_logged_in');
        localStorage.removeItem('current_user');
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    });
    return () => { vivo = false; try { sub.subscription.unsubscribe(); } catch {} };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    // Se limpia el error previo: si no, la clase 'animate-shake' ya estaba
    // activa y la animacion no volvia a reproducirse en el siguiente intento.
    setLoginError(false);
    setIsProcessing({ active: true, text: 'Verificando credenciales...' });

    // Validación y normalización antes de tocar la red: evita mandar basura a
    // Supabase y da una respuesta inmediata cuando falta un campo.
    const acceso = normalizarEntradaAcceso(loginUser);
    if (!acceso.ok) {
      setLoginError(true);
      notify(acceso.error, 'error');
      setIsProcessing({ active: false, text: '' });
      return;
    }
    const clave = validarPassword(loginPass);
    if (!clave.ok) {
      notify(clave.error, 'error');
      setIsProcessing({ active: false, text: '' });
      return;
    }

    try {
        // Acepta usuario o email completo (el email siempre es usuario@unp.edu.py)
        // Sesión real con Supabase Auth
        const { error: errorAuth } = await supabase.auth.signInWithPassword({
            email: acceso.emailAcceso,
            password: loginPass
        });

        if (errorAuth) {
            setLoginError(true);
            const msgAuth = String(errorAuth.message || '');
            if (/confirm/i.test(msgAuth)) {
                notify("Cuenta sin confirmar. Pide al administrador que la confirme en Supabase.", "error");
            } else {
                notify("Credenciales incorrectas. Verifique su usuario y contraseña.", "error");
            }
            setIsProcessing({ active: false, text: '' });
            return;
        }

        // Perfil y rol desde la tabla usuarios (solo legible con sesión)
        const { data: perfil, error: errorPerfil } = await supabase
            .from('usuarios')
            .select('username, nombre, cargo, dependencia')
            .eq('username', acceso.nombreUsuario)
            .maybeSingle();

        if (errorPerfil || !perfil) {
            await supabase.auth.signOut();
            setLoginError(true);
            notify("Usuario sin perfil en el sistema. Contacte al administrador.", "error");
            setIsProcessing({ active: false, text: '' });
            return;
        }

        const userSession = construirSesion(perfil);

        localStorage.setItem('is_logged_in', 'true'); 
        localStorage.setItem('current_user', JSON.stringify(userSession)); 
        
        setLoginError(false); 
        setCurrentUser(userSession); 
        setIsAuthenticated(true); 
        setDependenciaActual(userSession.dependencia);
        // Cierra la puerta dev: el gate decide según el rol (dev entra, resto al muro).
        setMostrarLoginDev(false); 
        
        notify(`Bienvenido, ${perfil.nombre} (${userSession.dependencia})`, "success"); 
    } catch {
        setLoginError(true);
        notify("Error al conectar con la base de datos", "error");
    } finally {
        setIsProcessing({ active: false, text: '' });
    }
  };

  // --- MANEJO DE INACTIVIDAD Y CIERRE AUTOMÁTICO DE SESIÓN (15 Minutos) ---
  // INACTIVITY_LIMIT_MS vive en constants/appConstants (Fase 0 del split).

useEffect(() => {
  if (!isAuthenticated) return;

  let inactivityTimer;

  const handleInactivityLogout = () => {
    notify("Sesión cerrada automáticamente por inactividad (15 min).", "warning");
    handleLogout();
  };

  const resetTimer = () => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(handleInactivityLogout, INACTIVITY_LIMIT_MS);
  };

  const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

  resetTimer();
  events.forEach(event => window.addEventListener(event, resetTimer));

  return () => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    events.forEach(event => window.removeEventListener(event, resetTimer));
  };
}, [isAuthenticated, handleLogout, notify]);

// El muro de mantenimiento solo lo salta una sesión con cargo desarrollador.
// Un `?mant=off` público (o un leftover en sessionStorage) ya no abre la app.
// La limpieza va en un efecto (una vez al montar): en el cuerpo del hook
// escribía en sessionStorage en CADA render.
useEffect(() => {
  if (typeof window === 'undefined') return;
  try { sessionStorage.removeItem('mant_bypass'); } catch { /* ignore */ }
}, []);
const mantBypass = false;

// Auto-reparación de rol: si el mantenimiento está activo y la sesión local no
// refleja el rol desarrollador, se verifica en vivo contra la base (cubre
// cambios de rol posteriores al login y sesiones locales viejas).
useEffect(() => {
  if (!mantenimiento?.en_mantenimiento || esDesarrollador || !currentUser?.username) return;
  let vivo = true;
  (async () => {
    try {
      const { data, error } = await supabase.from('usuarios').select('cargo').eq('username', currentUser.username).maybeSingle();
      if (!vivo || error || !data) return;
      if (data.cargo === 'desarrollador') {
        const actualizado = { ...currentUser, cargo: 'desarrollador', role: 'dev' };
        setCurrentUser(actualizado);
        try {
          localStorage.setItem('is_logged_in', 'true');
          localStorage.setItem('current_user', JSON.stringify(actualizado));
        } catch {}
      }
    } catch {}
  })();
  return () => { vivo = false; };
}, [mantenimiento?.en_mantenimiento, esDesarrollador, currentUser]);

const saveMantenimiento = async (data) => {
  setIsSavingMant(true);
  try {
    const payload = { id: 'global', ...data };
    const { error } = await supabase.from('app_config').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    setMantenimiento(payload);
    setIsMantenimientoModalOpen(false);
    notify(
      data.en_mantenimiento ? 'Modo mantenimiento activado para todos.' : 'Sistema habilitado nuevamente.',
      data.en_mantenimiento ? 'warning' : 'success'
    );
  } catch {
    notify('No se pudo guardar. Crea la tabla app_config en Supabase (te pasé el SQL).', 'error');
  } finally {
    setIsSavingMant(false);
  }
};

  // Version visible del sistema.
  //
  // La fuente de verdad es `app_config.ultima_version` (la base), que es la
  // que publica el script de aviso en cada despliegue. `APP_VERSION` queda
  // como respaldo para cuando la configuracion todavia no cargo.
  const versionApp = (typeof mantenimiento?.ultima_version === 'string' && mantenimiento.ultima_version.trim())
    ? mantenimiento.ultima_version.trim()
    : APP_VERSION;

  return {
    isAuthenticated, setIsAuthenticated, currentUser, setCurrentUser,
    isAdmin, esDesarrollador,
    loginUser, setLoginUser, loginPass, setLoginPass,
    showPassword, setShowPassword, loginError, setLoginError,
    isProcessing, setIsProcessing,
    dependenciaActual, setDependenciaActual,
    showLogoutConfirm, setShowLogoutConfirm,
    mantenimiento, setMantenimiento,
    versionApp,
    isMantenimientoModalOpen, setIsMantenimientoModalOpen, isSavingMant,
    mostrarLoginDev, setMostrarLoginDev, mantBypass,
    handleLogin, handleLogout, saveMantenimiento
  };
}
