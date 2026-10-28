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

let abrirDialogoNombreArchivo = null;

export function registrarDialogoNombreArchivo(controlador) {
  abrirDialogoNombreArchivo = controlador;
  return () => {
    if (abrirDialogoNombreArchivo === controlador) abrirDialogoNombreArchivo = null;
  };
}

export function solicitarNombreArchivo(nombreSugerido) {
  const sugerido = String(nombreSugerido || 'descarga.pdf');
  const extension = sugerido.match(/\.([A-Za-z0-9]{1,8})$/)?.[1]?.toLowerCase() || 'pdf';
  const base = normalizarSegmentoArchivo(sugerido.replace(/\.[A-Za-z0-9]{1,8}$/, ''), 'descarga');
  const nombreCompleto = (valor) => `${normalizarSegmentoArchivo(valor, base)}.${extension}`;
  if (!abrirDialogoNombreArchivo) return Promise.resolve(nombreCompleto(base));

  return new Promise(resolve => {
    let resuelto = false;
    const terminar = (valor) => {
      if (resuelto) return;
      resuelto = true;
      resolve(valor == null ? nombreCompleto(base) : nombreCompleto(valor));
    };
    abrirDialogoNombreArchivo({
      id: `${Date.now()}-${Math.random()}`,
      nombreSugerido: base,
      extension,
      aceptar: terminar,
      usarSugerido: () => terminar(base)
    });
  });
}

export function nombreFC10Archivo(fc, fecha = new Date()) {
  const responsable = normalizarSegmentoArchivo(fc?.funcionarioNombre, 'sin_responsable');
  const rotulo = normalizarSegmentoArchivo(fc?.rotulo || fc?.bienRotulo, '');
  return `FC10_Acta_${responsable}${rotulo ? `_${rotulo}` : ''}_${fechaParaArchivo(fc?.entregadoFecha || fc?.fechaGeneracion || fecha)}.pdf`;
}

export function nombreDescargaFC10(fc, bien, fecha = new Date()) {
  return nombreFC10Archivo({
    ...fc,
    bienRotulo: fc?.bienRotulo || fc?.rotulo || bien?.rotulo
  }, fecha);
}
