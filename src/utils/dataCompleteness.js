const CAMPOS_ESENCIALES = [
  ['rotulo', 'Rótulo patrimonial'],
  ['descripcion', 'Descripción'],
  ['cuenta', 'Cuenta contable'],
  ['fechaAdquisicion', 'Fecha de adquisición'],
  ['funcionario', 'Responsable'],
  ['ubicacion', 'Ubicación'],
];

export function camposIncompletos(bien) {
  if (!bien) return [];
  return CAMPOS_ESENCIALES
    .filter(([campo]) => bien[campo] === null || bien[campo] === undefined || String(bien[campo]).trim() === '')
    .map(([, etiqueta]) => etiqueta);
}
