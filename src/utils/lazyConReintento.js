import { lazy } from 'react';

const CLAVE_REINTENTO = 'chunk_reintentado';

/**
 * Importa un módulo con auto-recuperación: si el chunk falla (deploy
 * intermedio, chunk viejo borrado), recarga UNA vez por sesión para traer el
 * HTML y los chunks consistentes.
 *
 * El flag NO se borra al montar la app. Antes se borraba en cada montaje, y el
 * ciclo era:
 *   montar -> borrar flag -> el chunk falla -> poner flag -> recargar
 *         -> montar -> borrar flag -> el chunk falla -> ... (recarga infinita)
 * es decir, el bucle se disparaba justamente en el caso para el que existe
 * este código: un chunk que devuelve 404. Ahora el flag dura toda la sesión
 * de la pestaña, así que hay como máximo un reintento.
 *
 * Se exporta por separado de `lazyConReintento` para poder testearlo sin
 * montar un componente.
 */
export const cargarConReintento = async (importador) => {
  try {
    return await importador();
  } catch (e) {
    try {
      if (!sessionStorage.getItem(CLAVE_REINTENTO)) {
        sessionStorage.setItem(CLAVE_REINTENTO, String(Date.now()));
        window.location.reload();
      } else {
        // Ya se reintento una vez en esta sesión y el chunk sigue fallando:
        // recargar otra vez entraría en bucle. Se deja propagating el error
        // para que lo muestre el ErrorBoundary.
        console.error(
          'No se pudo cargar un modulo tras reintentar la carga. Recarga la pagina manualmente.',
          e
        );
      }
    } catch (err) {}
    throw e;
  }
};

export const lazyConReintento = (importador) => lazy(() => cargarConReintento(importador));
