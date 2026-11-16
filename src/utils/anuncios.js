const esAnuncioGlobal = (notificacion) =>
  String(notificacion?.usuarioDestino || '').toUpperCase() === 'TODOS';

/** Selecciona notificaciones temporales para limpieza; nunca elimina anuncios del historial. */
export const seleccionarNotificacionesPurgables = (filas, corte) =>
  (filas || []).filter((notificacion) => {
    const fecha = new Date(notificacion.resueltoFecha || notificacion.fecha || notificacion.created_at || '').getTime();
    if (!Number.isFinite(fecha) || fecha >= corte || notificacion.tipo === 'BAJA_BIEN' || notificacion.tipo === 'BAJA_FUNCIONARIO') return false;
    if (notificacion.accion === 'anuncio' || esAnuncioGlobal(notificacion)) return false;
    return notificacion.leido === true;
  });

/** Consolida anuncios nuevos y antiguos sin duplicar filas cargadas por varias consultas. */
export const agruparAnuncios = (filas = []) => {
  const unicos = new Map();
  for (const fila of filas || []) {
    if (fila?.accion !== 'anuncio') continue;
    const clave = fila.id || `${fila.grupo || ''}:${fila.usuarioDestino || ''}:${fila.fecha || ''}`;
    unicos.set(clave, fila);
  }

  const grupos = new Map();
  for (const anuncio of unicos.values()) {
    const grupo = anuncio.grupo || anuncio.id;
    if (!grupo) continue;
    if (!grupos.has(grupo)) {
      grupos.set(grupo, {
        grupo,
        titulo: anuncio.titulo || '(Sin título)',
        mensaje: anuncio.mensaje || '',
        fecha: anuncio.fecha,
        remitente: anuncio.remitente,
        alcance: anuncio.alcance || anuncio.usuarioDestino,
        total: 0,
        leidos: 0
      });
    }
    const resumen = grupos.get(grupo);
    if (Array.isArray(anuncio.leidos) || anuncio.totalDest) {
      resumen.total = Math.max(resumen.total, Number(anuncio.totalDest) || 0);
      const lecturaDirecta = !esAnuncioGlobal(anuncio) && anuncio.leido === true ? 1 : 0;
      resumen.leidos = Math.max(resumen.leidos, anuncio.leidos?.length || 0, lecturaDirecta);
    } else {
      resumen.total++;
      if (anuncio.leido) resumen.leidos++;
    }
    if (new Date(anuncio.fecha || 0).getTime() > new Date(resumen.fecha || 0).getTime()) {
      resumen.fecha = anuncio.fecha;
    }
  }

  return [...grupos.values()].sort((a, b) =>
    (new Date(b.fecha || 0).getTime() || 0) - (new Date(a.fecha || 0).getTime() || 0)
  );
};
