export function normalizarSegmentoArchivo(valor, fallback = 'sin_dato') {
  const limpio = String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[<>:"/\\|?*]/g, ' ')
    .split('').filter(caracter => caracter.charCodeAt(0) >= 32 && caracter.charCodeAt(0) !== 127).join('')
    .replace(/[.\s]+/g, '_')
    .replace(/[^A-Za-z0-9_-]/g, '')
    .replace(/_+/g, '_')
    .replace(/^[_-]+|[_-]+$/g, '')
    .slice(0, 64);
  return limpio || fallback;
}

export function fechaParaArchivo(fecha = new Date()) {
  const isoCorto = typeof fecha === 'string' && fecha.match(/^\d{4}-\d{2}-\d{2}/);
  if (isoCorto) return isoCorto[0];
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  if (Number.isNaN(d.getTime())) return 'sin_fecha';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function solicitarNombreArchivo(nombreSugerido) {
  if (typeof window === 'undefined' || typeof window.prompt !== 'function') return nombreSugerido;
  const extension = String(nombreSugerido).match(/\.([A-Za-z0-9]{1,8})$/)?.[1] || 'pdf';
  const base = normalizarSegmentoArchivo(String(nombreSugerido).replace(/\.[A-Za-z0-9]{1,8}$/, ''), 'descarga');
  let elegido = null;
  try { elegido = window.prompt('Puedes cambiar el nombre del archivo. Si cancelas, se usará el nombre sugerido:', base); } catch { /* navegador sin diálogo disponible */ }
  const nombre = normalizarSegmentoArchivo(elegido, base);
  return `${nombre}.${extension.toLowerCase()}`;
}

export function nombreFC10Archivo(fc, fecha = new Date()) {
  const responsable = normalizarSegmentoArchivo(fc?.funcionarioNombre, 'sin_responsable');
  const rotulo = normalizarSegmentoArchivo(fc?.rotulo || fc?.bienRotulo, '');
  return `FC10_Acta_${responsable}${rotulo ? `_${rotulo}` : ''}_${fechaParaArchivo(fc?.entregadoFecha || fc?.fechaGeneracion || fecha)}.pdf`;
}
