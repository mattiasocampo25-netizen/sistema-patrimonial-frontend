const CAMPOS_TECNICOS = new Set(['id', 'updated_at', 'created_at', 'updatedat', 'createdat', 'fechacarga', 'fechamodificacion', 'createdby', 'updatedby', 'creadopor', 'modificadoen', 'modificadopor', 'syncat', 'version']);

const ETIQUETAS_CAMPO = {
  funcionario: 'Responsable',
  funcionarioDoc: 'Cédula del responsable',
  funcionarioCargo: 'Cargo del responsable',
  funcionarioAlternativo: 'Responsable alternativo',
  funcionarioAlternativoDoc: 'Cédula del responsable alternativo',
  funcionarioAlternativoCargo: 'Cargo del responsable alternativo',
  ubicacion: 'Ubicación',
  dependencia: 'Dependencia',
  departamento: 'Departamento',
  rotulo: 'Rótulo patrimonial',
  descripcion: 'Descripción',
  estadoConservacion: 'Estado de conservación',
  observaciones: 'Observaciones',
  componentes: 'Componentes del bien',
  fechaAdquisicion: 'Fecha de adquisición',
  valorUnitario: 'Valor unitario',
  cuenta: 'Cuenta contable',
  subcuenta: 'Subcuenta',
  fotos: 'Fotografías',
  hasQR: 'Código QR',
  vidaUtil: 'Vida útil',
  codigo: 'Código',
  nombre: 'Nombre',
  cargo: 'Cargo',
  cedula: 'Cédula',
  telefono: 'Teléfono',
  email: 'Correo electrónico',
  estado: 'Estado',
};

export function leerMensajeAuditoria(row) {
  try {
    return typeof row?.mensaje === 'string' ? JSON.parse(row.mensaje) : row?.mensaje;
  } catch {
    return null;
  }
}

export function etiquetaCampoAuditoria(campo) {
  if (ETIQUETAS_CAMPO[campo]) return ETIQUETAS_CAMPO[campo];
  return String(campo || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, letra => letra.toUpperCase());
}

const valorVacio = valor => valor == null
  || (typeof valor === 'string' && !valor.trim())
  || (Array.isArray(valor) && valor.length === 0)
  || (typeof valor === 'object' && !Array.isArray(valor) && Object.keys(valor).length === 0);

const normalizarValorComparacion = valor => {
  if (valorVacio(valor)) return null;
  if (Array.isArray(valor)) return valor.map(normalizarValorComparacion);
  if (valor && typeof valor === 'object') return Object.fromEntries(Object.keys(valor).sort().map(k => [k, normalizarValorComparacion(valor[k])]));
  return typeof valor === 'string' ? valor.trim() : valor;
};

const valoresEquivalentes = (a, b) => JSON.stringify(normalizarValorComparacion(a)) === JSON.stringify(normalizarValorComparacion(b));

export function obtenerCambiosAuditoria(row) {
  const mensaje = leerMensajeAuditoria(row);
  const entradas = Array.isArray(mensaje?.cambios)
    ? mensaje.cambios
    : [{ anterior: mensaje?.cambios?.anterior, nuevo: mensaje?.cambios?.nuevo, rotulo: mensaje?.rotulo }];
  const cambios = [];
  entradas.forEach((entrada, indice) => {
    const anterior = entrada?.anterior;
    const nuevo = entrada?.nuevo;
    if (!anterior || !nuevo || typeof anterior !== 'object' || typeof nuevo !== 'object') return;
    Object.keys(nuevo).forEach(campo => {
      if (CAMPOS_TECNICOS.has(String(campo).toLowerCase()) || valoresEquivalentes(nuevo[campo], anterior[campo])) return;
      const sujeto = entradas.length > 1 ? (entrada.rotulo || `Bien ${indice + 1}`) : '';
      cambios.push({
        campo: entradas.length > 1 ? `${entrada.bienId || indice}.${campo}` : campo,
        etiqueta: sujeto ? `${sujeto} · ${etiquetaCampoAuditoria(campo)}` : etiquetaCampoAuditoria(campo),
        campoOriginal: campo,
        antes: anterior[campo],
        despues: nuevo[campo]
      });
    });
  });
  const prioridad = ['funcionario', 'ubicacion', 'dependencia', 'estadoConservacion', 'observaciones', 'rotulo', 'descripcion', 'fotos', 'componentes'];
  return cambios.sort((a, b) => {
    const ai = prioridad.indexOf(a.campoOriginal);
    const bi = prioridad.indexOf(b.campoOriginal);
    return (ai < 0 ? prioridad.length : ai) - (bi < 0 ? prioridad.length : bi) || a.etiqueta.localeCompare(b.etiqueta, 'es');
  });
}

function unirEtiquetas(etiquetas) {
  if (etiquetas.length < 2) return etiquetas[0] || '';
  if (etiquetas.length === 2) return `${etiquetas[0]} y ${etiquetas[1]}`;
  return `${etiquetas.slice(0, -1).join(', ')} y ${etiquetas.at(-1)}`;
}

export function detalleAuditoriaLegible(row) {
  const mensaje = leerMensajeAuditoria(row);
  const cambios = obtenerCambiosAuditoria(row);
  if (cambios.length) {
    const etiquetas = cambios.slice(0, 3).map(cambio => cambio.etiqueta.toLocaleLowerCase('es-PY'));
    const extra = cambios.length > 3 ? ` y ${cambios.length - 3} más` : '';
    const rotuloBien = mensaje?.rotulo || mensaje?.cambios?.anterior?.rotulo || mensaje?.cambios?.nuevo?.rotulo;
    const rotulo = rotuloBien ? `Bien ${rotuloBien}: ` : '';
    return `${rotulo}${unirEtiquetas(etiquetas)}${extra}`;
  }
  if (mensaje && typeof mensaje === 'object') {
    const partes = [];
    if (mensaje.rotulo) partes.push(`Bien ${mensaje.rotulo}`);
    if (mensaje.descripcion) partes.push(String(mensaje.descripcion));
    if (mensaje.solicitante) partes.push(`Solicitante: ${mensaje.solicitante}`);
    if (mensaje.motivo) partes.push(`Motivo: ${mensaje.motivo}`);
    if (mensaje.estadoPrevio !== undefined || mensaje.estadoNuevo !== undefined) {
      partes.push(`Estado: ${valorAuditoriaLegible(mensaje.estadoPrevio)} → ${valorAuditoriaLegible(mensaje.estadoNuevo)}`);
    }
    if (mensaje.archivoAgregado) partes.push(`Foto agregada: ${mensaje.archivoAgregado}`);
    if (mensaje.archivoEliminado) partes.push(`Foto eliminada: ${mensaje.archivoEliminado}`);
    if (partes.length) return partes.join(' · ');
    return 'Evento registrado';
  }
  const texto = String(row?.mensaje || '').trim();
  return texto ? texto.slice(0, 120) : 'Sin detalle adicional';
}

export function tituloEventoAuditoria(row) {
  const accion = String(row?.accion || '').toUpperCase();
  const etiquetas = {
    MODIFICACION: 'Modificación',
    MODIFICACION_FOTOS: 'Cambio de fotografías',
    ALTA: 'Alta',
    CREACION: 'Creación',
    ELIMINACION: 'Eliminación',
    BAJA: 'Solicitud de baja',
    APROBACION: 'Aprobación',
    RECHAZO: 'Rechazo',
    TRASLADO: 'Traslado',
    RESTAURACION: 'Restauración',
  };
  const nombreAccion = etiquetas[accion] || etiquetaCampoAuditoria(accion.toLowerCase());
  const titulo = String(row?.titulo || '');
  const entidadTexto = titulo.split(/\s[-–]\s/, 2)[1] || '';
  const entidad = Object.keys({ BIEN: 1, FC10: 1, FC11: 1, USUARIO: 1, FUNCIONARIO: 1, SOLICITUD: 1 })
    .find(clave => new RegExp(`^${clave}(?=$|[^A-Z0-9])`, 'i').test(entidadTexto))
    // Hay títulos antiguos con texto de navegación pegado a la entidad (por
    // ejemplo, "BIENAbrir bien relacionado"). Reconocemos primero el prefijo.
    || Object.keys({ BIEN: 1, FC10: 1, FC11: 1, USUARIO: 1, FUNCIONARIO: 1, SOLICITUD: 1 })
      .find(clave => entidadTexto.toUpperCase().startsWith(clave));
  const nombresEntidad = { BIEN: 'bien', FC10: 'FC-10', FC11: 'FC-11', USUARIO: 'usuario', FUNCIONARIO: 'funcionario', SOLICITUD: 'solicitud' };
  const entidadLegible = nombresEntidad[String(entidad || '').toUpperCase()];
  return entidadLegible ? `${nombreAccion} de ${entidadLegible}` : nombreAccion;
}

export function resumenAccionAuditoria(row, actor = row?.usuario) {
  const accion = String(row?.accion || '').trim().toUpperCase();
  const titulo = String(row?.titulo || '');
  const tituloEntidad = titulo.split(/\s[-–]\s/, 2)[1] || '';
  const nombresEntidad = [
    ['FUNCIONARIO', 'el funcionario'], ['SOLICITUD', 'la solicitud'],
    ['FC11', 'el FC-11'], ['FC10', 'el FC-10'], ['BIEN', 'el bien'], ['USUARIO', 'el usuario']
  ];
  const entidad = nombresEntidad.find(([clave]) => tituloEntidad.toUpperCase().startsWith(clave))?.[1]
    || (accion.includes('FUNCIONARIO') ? 'el funcionario' : accion.includes('FC11') ? 'el FC-11' : accion.includes('FC10') ? 'el FC-10' : accion.includes('BIEN') ? 'el bien' : 'registro del sistema');
  const verbos = [
    [/SOLICITUD_BAJA_EN_REVISION/, `marcó en revisión la solicitud de baja de ${entidad}`],
    [/SOLICITUD_BAJA_ASIGNADA/, `asignó responsable a la solicitud de baja de ${entidad}`],
    [/APROBAR_BAJA_FUNCIONARIO/, 'aprobó la baja del funcionario'],
    [/RECHAZAR_BAJA_FUNCIONARIO/, 'rechazó la solicitud de baja del funcionario'],
    [/APROBAR_SOLICITUD_BAJA/, `aprobó la solicitud de baja de ${entidad}`],
    [/RECHAZAR_SOLICITUD_BAJA/, `rechazó la solicitud de baja de ${entidad}`],
    [/SOLICITUD_BAJA_FUNCIONARIO/, 'solicitó la baja del funcionario'],
    [/SOLICITUD_BAJA/, `solicitó la baja de ${entidad}`],
    [/MODIFICACION_FOTOS/, `actualizó las fotografías de ${entidad}`],
    [/MODIFICACION/, `modificó ${entidad}`],
    [/ELIMINACION|BAJA/, `registró la baja o eliminación de ${entidad}`],
    [/RECHAZO/, `rechazó ${entidad}`], [/APROBACION|APROBAR/, `aprobó ${entidad}`],
    [/ALTA|CREACION|CREACIÓN/, `registró ${entidad}`], [/TRASLADO/, `registró un traslado de ${entidad}`],
    [/FC10_/, 'actualizó el trámite del FC-10'], [/FC11_/, 'actualizó el trámite del FC-11'],
    [/CONCILIACION|MUESTREO/, 'realizó una verificación física del inventario'],
  ];
  const accionHumana = verbos.find(([patron]) => patron.test(accion))?.[1]
    || `registró una acción sobre ${entidad}`;
  const mensaje = leerMensajeAuditoria(row);
  const sujeto = mensaje?.rotulo ? ` · Rótulo ${mensaje.rotulo}`
    : mensaje?.nombre ? ` · ${mensaje.nombre}`
      : mensaje?.cambios?.nuevo?.rotulo || mensaje?.cambios?.anterior?.rotulo
        ? ` · Rótulo ${mensaje.cambios.nuevo?.rotulo || mensaje.cambios.anterior?.rotulo}` : '';
  return `${actor || 'Usuario no identificado'} ${accionHumana}${sujeto}`;
}

export function etiquetaAccionAuditoria(accion) {
  const accionMayus = String(accion || '').toUpperCase();
  const conocidas = {
    MODIFICACION: 'Modificación',
    MODIFICACION_FOTOS: 'Fotos',
    ALTA: 'Alta',
    CREACION: 'Creación',
    ELIMINACION: 'Eliminación',
    BAJA: 'Baja',
    APROBACION: 'Aprobación',
    RECHAZO: 'Rechazo',
    TRASLADO: 'Traslado',
  };
  return conocidas[accionMayus] || etiquetaCampoAuditoria(accionMayus.toLowerCase()) || 'Otro';
}

export function valorAuditoriaLegible(valor, campo) {
  if (valor === null || valor === undefined || String(valor).trim() === '') return 'Sin dato';
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
  if (Array.isArray(valor)) {
    if (!valor.length) return 'Ninguno';
    if (String(campo).toLowerCase() === 'fotos') {
      const nombres = valor.map(item => {
        const ruta = typeof item === 'object' ? item?.nombre || item?.name || item?.ruta || item?.url || '' : String(item);
        const ultimo = String(ruta).split(/[/?#]/).filter(Boolean).at(-1) || '';
        try { return decodeURIComponent(ultimo); } catch { return ultimo; }
      }).filter(Boolean);
      return `${valor.length} ${valor.length === 1 ? 'fotografía' : 'fotografías'}${nombres.length ? `: ${nombres.join(', ')}` : ''}`;
    }
    return valor.map(item => {
      if (typeof item !== 'object') return String(item);
      const nombre = item?.nombre || item?.tipo || item?.descripcion || item?.label || 'Componente';
      const cantidad = Number(item?.cantidad || 1);
      return `${nombre}${cantidad > 1 ? ` × ${cantidad}` : ''}`;
    }).join(', ');
  }
  if (typeof valor === 'object') return valor.nombre || valor.label || valor.descripcion || 'Dato actualizado';
  const texto = String(valor);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(texto)) {
    const fecha = new Date(texto);
    if (Number.isFinite(fecha.getTime())) return fecha.toLocaleString('es-PY', { dateStyle: 'short', timeStyle: 'short' });
  }
  return texto;
}
