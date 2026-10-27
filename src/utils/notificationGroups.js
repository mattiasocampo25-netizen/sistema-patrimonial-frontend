function fechaValida(valor) {
  const soloFecha = String(valor || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (soloFecha) {
    const [, anio, mes, dia] = soloFecha;
    const local = new Date(Number(anio), Number(mes) - 1, Number(dia), 12);
    if (local.getFullYear() !== Number(anio) || local.getMonth() !== Number(mes) - 1 || local.getDate() !== Number(dia)) return null;
    return local;
  }
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function claveDia(fecha) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

export function agruparNotificacionesPorDia(notificaciones = [], ahora = new Date()) {
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);
  const grupos = new Map();

  for (const notificacion of notificaciones || []) {
    const fecha = fechaValida(notificacion?.fecha);
    const clave = fecha ? claveDia(fecha) : 'sin-fecha';
    if (!grupos.has(clave)) {
      const dia = fecha ? new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()) : null;
      const etiqueta = !dia
        ? 'Sin fecha'
        : dia.getTime() === hoy.getTime()
          ? 'Hoy'
          : dia.getTime() === ayer.getTime()
            ? 'Ayer'
            : new Intl.DateTimeFormat('es-PY', { weekday: 'long', day: 'numeric', month: 'long' }).format(dia);
      grupos.set(clave, { clave, etiqueta, notificaciones: [] });
    }
    grupos.get(clave).notificaciones.push(notificacion);
  }

  return Array.from(grupos.values());
}
