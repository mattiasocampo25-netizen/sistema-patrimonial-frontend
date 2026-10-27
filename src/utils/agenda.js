function fechaLocal(valor) {
  const match = String(valor || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const [, anio, mes, dia] = match;
  const fecha = new Date(Number(anio), Number(mes) - 1, Number(dia), 12);
  if (fecha.getFullYear() !== Number(anio) || fecha.getMonth() !== Number(mes) - 1 || fecha.getDate() !== Number(dia)) return null;
  return fecha;
}

function claveFecha(fecha) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

/** Crea eventos de calendario a partir de fechas ya presentes en los registros. */
export function crearEventosAgenda(bienes = [], fc10List = [], dependencia) {
  const eventos = [];

  for (const bien of bienes || []) {
    if (dependencia && bien.dependencia !== dependencia) continue;
    const rotulo = bien.rotulo || 'Bien sin rótulo';
    const adquisicion = fechaLocal(bien.fechaAdquisicion);
    if (adquisicion) {
      eventos.push({
        fecha: claveFecha(adquisicion),
        tipo: 'inventario',
        titulo: 'Alta de bien',
        detalle: `${rotulo} · ${bien.descripcion || 'Registro patrimonial'}`,
        bienId: bien.id,
        rotulo,
        anioAdquisicion: String(adquisicion.getFullYear())
      });

      const vidaUtil = Number.parseInt(bien.vidaUtil, 10);
      if (Number.isFinite(vidaUtil) && vidaUtil > 0 && vidaUtil < 100) {
        const vencimiento = new Date(adquisicion);
        vencimiento.setFullYear(vencimiento.getFullYear() + vidaUtil);
        eventos.push({
          fecha: claveFecha(vencimiento),
          tipo: 'vencimiento',
          titulo: 'Fin de vida útil estimado',
          detalle: `${rotulo} · ${vidaUtil} años de vida útil`,
          bienId: bien.id,
          rotulo,
          anioAdquisicion: String(adquisicion.getFullYear())
        });
      }
    }
  }

  for (const fc of fc10List || []) {
    if (dependencia && fc.dependencia !== dependencia) continue;
    const fecha = fechaLocal(fc.entregadoFecha || fc.fechaGeneracion);
    if (!fecha) continue;
    eventos.push({
      fecha: claveFecha(fecha),
      tipo: 'asignacion',
      titulo: 'Asignación FC-10',
      detalle: `${fc.bienRotulo || 'Bien patrimonial'} · ${fc.funcionario || fc.custodio || 'Responsable no indicado'}`,
      bienId: fc.bienId,
      rotulo: fc.bienRotulo || '',
      anioAdquisicion: String(fecha.getFullYear())
    });
  }

  return eventos.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.titulo.localeCompare(b.titulo, 'es'));
}

export function fechaAgenda(fecha) {
  return fechaLocal(fecha);
}
