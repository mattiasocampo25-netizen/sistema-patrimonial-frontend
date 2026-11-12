import localforage from 'localforage';
import { supabase } from '../supabaseClient';
import { conSello } from './syncBienes';
import {
  encolarAccion, procesarCola, quitarExitosas, contarPendientes
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

// Encolar acción localmente.
export const enqueueOfflineAction = async (action) => {
  try {
    const actual = (await localforage.getItem(QUEUE_KEY)) || [];
    // Se vuelve a leer y a escribir la cola completa: si hay un sincronizado en
    // curso, su escritura final solo quita lo que él procesó, así que la acción
    // nueva sobrevive.
    const nueva = encolarAccion(actual, action);
    await localforage.setItem(QUEUE_KEY, nueva);
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
      if (item.type === 'SAVE_BIEN') {
        // conSello es obligatorio: sin updated_at el cambio no entra en el
        // delta de los demás equipos hasta la resincronización total (24 h).
        return supabase.from('bens').upsert([conSello({ id: item.payload.id, data: item.payload })]);
      }
      if (item.type === 'DELETE_BIEN') {
        return supabase.from('bens').delete().eq('id', item.payload.id);
      }
      if (item.type === 'SAVE_FC10') {
        // fc10 no usa delta: se recarga entera, por eso no lleva conSello.
        return supabase.from('fc10').upsert([{ id: item.payload.id, data: item.payload }]);
      }
      return { error: new Error(`tipo no soportado: ${item.type}`) };
    };

    const { exitosas, fallidas } = await procesarCola(cola, enviar);

    if (exitosas.length > 0) {
      // Releer antes de escribir: entre la lectura inicial y ahora pueden
      // haber entrado acciones nuevas, y esas no se deben tocar.
      const vigente = (await localforage.getItem(QUEUE_KEY)) || [];
      await localforage.setItem(QUEUE_KEY, quitarExitosas(vigente, exitosas));
    }

    const pendientes = await getOfflineQueueLength();
    const resumen = { exitosas: exitosas.length, fallidas: pendientes, pendientes, ocupado: false };
    if (resumen.pendientes > 0) {
      reintentarDespuesDe = Date.now() + esperaReintentoMs;
      esperaReintentoMs = Math.min(esperaReintentoMs * 2, 120000);
      console.warn(`⚠️ ${resumen.fallidas} acción(es) offline siguen pendientes.`);
    } else {
      reintentarDespuesDe = 0;
      esperaReintentoMs = 5000;
    }
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
