const CAMPOS_TECNICOS = new Set(['id', 'updated_at', 'created_at', 'updatedat', 'createdat']);

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

export function obtenerCambiosAuditoria(row) {
  const mensaje = leerMensajeAuditoria(row);
  const anterior = mensaje?.cambios?.anterior;
  const nuevo = mensaje?.cambios?.nuevo;
  if (!anterior || !nuevo || typeof anterior !== 'object' || typeof nuevo !== 'object') return [];
  return Object.keys(nuevo)
    .filter(campo => !CAMPOS_TECNICOS.has(String(campo).toLowerCase()))
    .filter(campo => JSON.stringify(nuevo[campo]) !== JSON.stringify(anterior[campo]))
    .map(campo => ({ campo, etiqueta: etiquetaCampoAuditoria(campo), antes: anterior[campo], despues: nuevo[campo] }));
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
  const entidad = titulo.match(/\s[-–]\s([A-ZÁÉÍÓÚÑ0-9_-]+)\s*$/i)?.[1];
  const nombresEntidad = { BIEN: 'bien', FC10: 'FC-10', FC11: 'FC-11', USUARIO: 'usuario', FUNCIONARIO: 'funcionario', SOLICITUD: 'solicitud' };
  const entidadLegible = nombresEntidad[String(entidad || '').toUpperCase()];
  return entidadLegible ? `${nombreAccion} de ${entidadLegible}` : nombreAccion;
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
    if (String(campo).toLowerCase() === 'fotos') return `${valor.length} ${valor.length === 1 ? 'fotografía' : 'fotografías'}`;
    return valor.map(item => typeof item === 'object' ? item?.nombre || item?.label || '[Elemento]' : String(item)).join(', ');
  }
  if (typeof valor === 'object') return valor.nombre || valor.label || valor.descripcion || 'Dato actualizado';
  const texto = String(valor);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(texto)) {
    const fecha = new Date(texto);
    if (Number.isFinite(fecha.getTime())) return fecha.toLocaleString('es-PY', { dateStyle: 'short', timeStyle: 'short' });
  }
  return texto;
}
