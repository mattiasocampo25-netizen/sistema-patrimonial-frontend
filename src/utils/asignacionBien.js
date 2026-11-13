import { normalizeStr } from './helpers';

const VALORES_SIN_ASIGNAR = new Set([
  '-', '—', 'S/A', 'S/C', 'N/A', 'NA', 'PENDIENTE', 'POR ASIGNAR',
  'SIN ASIGNAR', 'SIN ASIGNACION', 'SIN RESPONSABLE', 'SIN FUNCIONARIO', 'NO ASIGNADO', 'NO ASIGNADA',
  'LIBRE PARA ASIGNAR', 'LIBRES PARA ASIGNAR', 'DISPONIBLE PARA ASIGNAR',
  'SIN UBICACION', 'SIN UBICACION OPERATIVA', 'SIN LUGAR', 'NO UBICADO', 'NO UBICADA',
  'PENDIENTE DE UBICACION'
]);

const MARCAS_LIBRES = new Set([
  'LIBRE PARA ASIGNAR', 'LIBRES PARA ASIGNAR', 'DISPONIBLE PARA ASIGNAR',
  'PENDIENTE DE ASIGNACION', 'POR ASIGNAR'
]);

export const esCampoSinAsignar = (valor) => {
  const normalizado = normalizeStr(valor);
  return !normalizado || VALORES_SIN_ASIGNAR.has(normalizado);
};

export const esBienLibreParaAsignar = (bien) => {
  const camposEstado = [bien?.funcionario, bien?.asignacion, bien?.estadoAsignacion, bien?.responsable];
  const marcadoLibre = camposEstado.some(valor => MARCAS_LIBRES.has(normalizeStr(valor)));
  return marcadoLibre || (esCampoSinAsignar(bien?.funcionario) && esCampoSinAsignar(bien?.ubicacion));
};

export const etiquetaEstadoAsignacion = (bien) => {
  if (esBienLibreParaAsignar(bien)) return 'Libre para asignar';
  if (esCampoSinAsignar(bien?.funcionario)) return 'Falta responsable';
  if (esCampoSinAsignar(bien?.ubicacion)) return 'Falta ubicación';
  return 'Asignación completa';
};
