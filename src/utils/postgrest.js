/**
 * Valores interpolados en filtros `.or()` de PostgREST deben ir entre comillas
 * y escapados: un `.` o `eq.` en el texto puede ampliar o romper la consulta.
 */
export function escaparFiltroPostgrest(valor) {
  const s = String(valor ?? '');
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

export function rolDesdeCargo(cargo) {
  const valor = String(cargo ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('es');
  if (['admin', 'administrator', 'administracion', 'administrador', 'administrador general', 'administrador del sistema'].includes(valor)) return 'admin';
  if (['desarrollador', 'desarrollador del sistema', 'developer', 'dev'].includes(valor)) return 'dev';
  return 'user';
}

export function rolEsPrivilegiado(roleOCargo) {
  const rol = rolDesdeCargo(roleOCargo);
  return rol === 'admin' || rol === 'dev';
}
