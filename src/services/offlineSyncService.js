import localforage from 'localforage';
import { supabase } from '../supabaseClient';
import { conSello } from './syncBienes';
import {
  encolarAccion, procesarCola, quitarExitosas, contarPendientes, crearMutacionSerializada,
  TIPOS_CONOCIDOS
} from './offlineQueue';

const QUEUE_KEY = 'pending_offline_actions';

export const esFalloDeConexion = (error) => {
  const texto = `${error?.name || ''} ${error?.message || error || ''}`.toLowerCase();
  return error instanceof TypeError || /failed to fetch|networkerror|network request failed|load failed|fetch failed|internet disconnected|connection (?:was )?lost/.test(texto);
};

// Mutex: impide que dos sincronizados corran a la vez. El evento 'online' y el
// intervalo de reintento pueden dispararse casi juntos y, sin esto, el segundo
// leería la cola con la del primero todavía en curso.
let sincronizando = false;
let reintentarDespuesDe = 0;
let esperaReintentoMs = 5000;
const mutarCola = crearMutacionSerializada({
  leer: async () => (await localforage.getItem(QUEUE_KEY)) || [],
  escribir: (cola) => localforage.setItem(QUEUE_KEY, cola)
});

// Encolar acción localmente.
export const enqueueOfflineAction = async (action) => {
  try {
    const nueva = await mutarCola(actual => encolarAccion(actual, action));
    return nueva.length;
  } catch (error) {
    console.error('❌ Error al guardar en cola offline:', error);
    throw new Error('No se pudo guardar el cambio pendiente en este dispositivo. Mantén el formulario abierto e inténtalo otra vez.');
  }
};

// Cantidad de acciones guardadas localmente sin sincronizar.
export const getOfflineQueueLength = async () => {
  try {
    return contarPendientes((await localforage.getItem(QUEUE_KEY)) || []);
  } catch {
    return 0;
  }
};

/**
 * Sincroniza la cola al recuperar señal.
 *
 * Escribe POR DIFERENCIA: procesa, y al final relee la cola vigente para quitar
 * únicamente las claves que se sincronizaron. Antes se escribía la cola
 * "restante" calculada al principio, y cualquier acción que el usuario hubiera
 * encolado durante la espera se perdía en silencio.
 */
export const processOfflineQueue = async (onComplete, { force = false } = {}) => {
  if (!navigator.onLine) return { exitosas: 0, fallidas: 0, pendientes: await getOfflineQueueLength(), ocupado: false };
  if (sincronizando) return { exitosas: 0, fallidas: 0, pendientes: await getOfflineQueueLength(), ocupado: true };
  if (!force && Date.now() < reintentarDespuesDe) {
    const pendientes = await getOfflineQueueLength();
    return { exitosas: 0, fallidas: pendientes, pendientes, ocupado: false, reintentoEn: reintentarDespuesDe };
  }

  sincronizando = true;
  try {
    const cola = (await localforage.getItem(QUEUE_KEY)) || [];
    if (cola.length === 0) {
      reintentarDespuesDe = 0;
      esperaReintentoMs = 5000;
      return { exitosas: 0, fallidas: 0, pendientes: 0, ocupado: false };
    }

    const enviar = async (item) => {
      let consulta;
      if (item.type === 'SAVE_BIEN') {
        // conSello es obligatorio: sin updated_at el cambio no entra en el
        // delta de los demás equipos hasta la resincronización total (24 h).
        consulta = supabase.from('bens').upsert([conSello({ id: item.payload.id, data: item.payload })]);
      }
      else if (item.type === 'DELETE_BIEN') {
        consulta = supabase.from('bens').delete().eq('id', item.payload.id);
      }
      else if (item.type === 'SAVE_FC10') {
        // fc10 no usa delta: se recarga entera, por eso no lleva conSello.
        consulta = supabase.from('fc10').upsert([{ id: item.payload.id, data: item.payload }]);
      }
      else return { error: new Error(`tipo no soportado: ${item.type}`) };

      // navigator.onLine solo indica que hay una interfaz de red. Si el acceso
      // a Supabase sigue colgado, abortar esta operación permite liberar el
      // mutex, conservar la acción pendiente y reintentar después.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      try {
        return await consulta.abortSignal(controller.signal);
      } finally {
        clearTimeout(timeoutId);
      }
    };

    const procesables = cola.filter(item => TIPOS_CONOCIDOS.includes(item.type));
    const desconocidas = cola.filter(item => !TIPOS_CONOCIDOS.includes(item.type));
    const { exitosas, fallidas } = await procesarCola(procesables, enviar);

    if (exitosas.length > 0) {
      // La lectura y escritura se serializan con las nuevas acciones encoladas:
      // ninguna puede entrar en la ventana entre el getItem y el setItem.
      await mutarCola(vigente => quitarExitosas(vigente, exitosas));
    }

    const pendientes = await getOfflineQueueLength();
    const resumen = { exitosas: exitosas.length, fallidas: fallidas.length, desconocidas: desconocidas.length, pendientes, requiereAtencion: desconocidas.length > 0, ocupado: false };
    if (fallidas.length > 0) {
      reintentarDespuesDe = Date.now() + esperaReintentoMs;
      esperaReintentoMs = Math.min(esperaReintentoMs * 2, 120000);
      console.warn(`⚠️ ${fallidas.length} acción(es) offline siguen pendientes.`);
    } else if (desconocidas.length > 0) {
      reintentarDespuesDe = Date.now() + 60 * 60 * 1000;
      esperaReintentoMs = 5000;
    } else {
      reintentarDespuesDe = 0;
      esperaReintentoMs = 5000;
    }
    if (desconocidas.length) console.error(`⚠️ ${desconocidas.length} acción(es) offline requieren atención por formato desconocido; se conservaron sin borrar.`);
    if (onComplete) onComplete(resumen);
    return resumen;
  } catch (error) {
    console.error('❌ Error general procesando la cola offline:', error);
    reintentarDespuesDe = Date.now() + esperaReintentoMs;
    esperaReintentoMs = Math.min(esperaReintentoMs * 2, 120000);
    const pendientes = await getOfflineQueueLength();
    const resumen = { exitosas: 0, fallidas: pendientes, pendientes, ocupado: false, error };
    if (onComplete) onComplete(resumen);
    return resumen;
  } finally {
    sincronizando = false;
  }
};
