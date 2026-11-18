/**
 * Serializa una celda CSV y evita que Excel/Calc interprete texto como fórmula.
 * Se aplica también a campos internos por consistencia de todas las exportaciones.
 */
export const csvCellSafe = (value) => {
  let text = String(value ?? '');
  // Excel puede ignorar espacios y controles iniciales antes del operador.
  let index = 0;
  while (index < text.length && (text.charCodeAt(index) <= 0x20 || text.charCodeAt(index) === 0x00a0)) index += 1;
  if ('=+-@＝＋－＠'.includes(text[index] || '')) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export const csvRowsSafe = (rows, { bom = true, eol = '\r\n' } = {}) =>
  `${bom ? '\uFEFF' : ''}${(rows || []).map(row => row.map(csvCellSafe).join(';')).join(eol)}`;
