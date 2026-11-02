import { INACTIVITY_LIMIT_MS } from '../constants/appConstants.js';

const CLAVE_ULTIMA_ACTIVIDAD = 'unp_session_last_activity';

function limpiarSesion() {
  try {
    localStorage.removeItem('current_user');
    localStorage.removeItem('is_logged_in');
    localStorage.removeItem(CLAVE_ULTIMA_ACTIVIDAD);
  } catch { /* almacenamiento no disponible */ }
}

export function registrarActividadLocal(fecha = Date.now()) {
  try { localStorage.setItem(CLAVE_ULTIMA_ACTIVIDAD, String(fecha)); } catch { /* opcional */ }
}

export function sesionLocalExpirada(fechaActual = Date.now()) {
  try {
    const ultimaActividad = Number(localStorage.getItem(CLAVE_ULTIMA_ACTIVIDAD));
    return !Number.isFinite(ultimaActividad) || ultimaActividad <= 0 ||
      fechaActual < ultimaActividad || fechaActual - ultimaActividad >= INACTIVITY_LIMIT_MS;
  } catch { return true; }
}

/** Lee el perfil cacheado. JSON corrupto no debe tumbar la app. */
export function leerUsuarioLocal() {
  try {
    const saved = localStorage.getItem('current_user');
    if (!saved) return null;
    const u = JSON.parse(saved);
    if (!u || typeof u !== 'object' || typeof u.username !== 'string' || !u.username.trim()) {
      throw new Error('sesión inválida');
    }
    return u;
  } catch {
    try {
      localStorage.removeItem('current_user');
      localStorage.removeItem('is_logged_in');
    } catch {
      /* ignore */
    }
    return null;
  }
}

export function sesionMarcadaLocal() {
  try {
    const marcada = localStorage.getItem('is_logged_in') === 'true' && !!leerUsuarioLocal();
    if (!marcada) {
      limpiarSesion();
      return false;
    }
    if (sesionLocalExpirada()) {
      limpiarSesion();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
