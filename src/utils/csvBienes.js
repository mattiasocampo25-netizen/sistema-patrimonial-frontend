import { normalizeStr, generateId } from './helpers.js';

export const MAX_CSV_BIENES_BYTES = 25 * 1024 * 1024;
export const MAX_CSV_BIENES_FILAS = 100_000;

export const ALIAS_COLUMNAS_BIENES = {
  rotulo: ['Nº RÓTULO', 'N° RÓTULO', 'N ROTULO', 'ROTULO', 'RÓTULO', 'CÓDIGO', 'CODIGO', 'ETIQUETA'],
  cuenta: ['CUENTA MAYOR', 'CUENTA'],
  subcuenta: ['SUB-CUENTA', 'SUBCUENTA', 'SUB CUENTA'],
  analitico1: ['ANALÍTICO 1', 'ANALITICO 1', 'AN 1', 'AN. 1'],
  analitico2: ['ANALÍTICO 2', 'ANALITICO 2', 'AN 2', 'AN. 2'],
  descripcion: ['DESCRIPCIÓN GENERAL', 'DESCRIPCION GENERAL', 'DESCRIPCIÓN', 'DESCRIPCION', 'DETALLE'],
  fechaAdquisicion: ['FECHA ADQUISICIÓN (YYYY-MM-DD)', 'FECHA ADQUISICION', 'FECHA ADQUISICIÓN', 'FECHA'],
  valorUnitario: ['VALOR UNITARIO (SIN PUNTOS)', 'VALOR UNITARIO', 'VALOR', 'PRECIO', 'COSTO'],
  vidaUtil: ['VIDA ÚTIL (AÑOS)', 'VIDA ATIL (AÑOS)', 'VIDA ÚTIL', 'VIDA UTIL', 'VIDA'],
};

const normHeader = (value) => normalizeStr(String(value ?? '').replace(/^\uFEFF/, '').trim());
const MAP_ALIASES = Object.entries(ALIAS_COLUMNAS_BIENES).map(([campo, aliases]) => [campo, new Set(aliases.map(normHeader))]);

export const validarEncabezadosBienes = (fields = []) => {
  const issues = [];
  const mapped = {};
  const normalized = fields.map((header) => ({ header, norm: normHeader(header) }));
  if (!normalized.length) return { issues: [{ motivo: 'El archivo no tiene encabezados.' }], mapped };

  for (const [campo, aliases] of MAP_ALIASES) {
    const found = normalized.filter((entry) => aliases.has(entry.norm));
    if (found.length > 1) {
      issues.push({ campo, motivo: `Hay varias columnas que podrían ser “${campo}”: ${found.map(x => x.header).join(', ')}.` });
    } else if (found.length === 1) mapped[campo] = found[0].header;
  }

  if (!mapped.rotulo) issues.push({ campo: 'rotulo', motivo: 'Falta la columna obligatoria de rótulo. Usa “Nº Rótulo” o “Código”.' });
  const duplicateHeaders = normalized.filter((entry, i) => normalized.some((other, j) => i !== j && entry.norm && entry.norm === other.norm));
  if (duplicateHeaders.length) {
    const names = [...new Set(duplicateHeaders.map(x => x.header))];
    issues.push({ motivo: `Hay encabezados repetidos: ${names.join(', ')}.` });
  }
  return { issues, mapped };
};

/** Lee CSV en UTF-8 o Windows-1252 y permite a Papa Parse inferir el separador. */
export const parsearArchivoCSVBienes = async (file, onProgress) => {
  if (!file) throw new Error('Selecciona un archivo CSV.');
  if (file.size === 0) throw new Error('El archivo está vacío.');
  if (file.size > MAX_CSV_BIENES_BYTES) throw new Error('El archivo supera el límite de 25 MB. Divídelo en archivos más pequeños.');
  if (!/\.csv$/i.test(file.name || '') && !['text/csv', 'application/vnd.ms-excel'].includes(file.type)) {
    throw new Error('El archivo seleccionado no parece ser CSV.');
  }

  const bytes = await file.arrayBuffer();
  let text;
  let encoding = 'UTF-8';
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    text = new TextDecoder('windows-1252').decode(bytes);
    encoding = 'Windows-1252';
  }
  text = text.replace(/^\uFEFF/, '');

  const { default: Papa } = await import('papaparse');
  const rows = [];
  const parseErrors = [];
  const seenParseErrors = new Set();
  let fields = [];
  let delimiter = ';';
  let tooManyRows = false;
  let headerParsed = false;
  await new Promise((resolve, reject) => {
    Papa.parse(text, {
      // Parse as arrays so worker options contain only cloneable values.
      // A transformHeader callback here causes postMessage DataCloneError.
      header: false,
      skipEmptyLines: 'greedy',
      delimiter: '',
      worker: typeof Worker !== 'undefined',
      step: (result, parser) => {
        if (!headerParsed) {
          fields = (Array.isArray(result.data) ? result.data : [result.data])
            .map(header => String(header ?? '').replace(/^\uFEFF/, '').trim());
          delimiter = result.meta.delimiter || delimiter;
          headerParsed = true;
          return;
        }
        if (rows.length >= MAX_CSV_BIENES_FILAS) {
          tooManyRows = true;
          parser.abort();
          return;
        }
        const linea = rows.length + 2;
        const values = Array.isArray(result.data) ? result.data : [result.data];
        const row = {};
        fields.forEach((field, index) => { row[field] = values[index] ?? ''; });
        if (values.length > fields.length) row.__parsed_extra = values.slice(fields.length);
        if (values.length < fields.length) row.__missing_fields = fields.slice(values.length);
        rows.push(row);
        for (const err of result.errors || []) {
          const errorLine = Number.isInteger(err.row) ? err.row + 2 : linea;
          const key = `${errorLine}:${err.code || ''}:${err.message || ''}`;
          if (!seenParseErrors.has(key)) {
            seenParseErrors.add(key);
            parseErrors.push({ linea: errorLine, motivo: err.message || 'Fila CSV mal formada.' });
          }
        }
        if (rows.length % 1000 === 0) onProgress?.(rows.length, result.meta.cursor || 0, text.length);
      },
      complete: (results) => {
        if (!headerParsed && Array.isArray(results?.data?.[0])) {
          fields = results.data[0].map(header => String(header ?? '').replace(/^\uFEFF/, '').trim());
          delimiter = results.meta.delimiter || delimiter;
        }
        resolve();
      },
      error: reject
    });
  });
  if (tooManyRows) throw new Error('El archivo supera el límite de 100.000 filas. Divídelo en varios CSV.');
  return { rows, fields, parseErrors, delimiter, encoding };
};

const parseDate = (raw) => {
  const value = String(raw ?? '').trim();
  if (!value) return { value: '', error: null };
  let year; let month; let day;
  let match = value.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (match) [, year, month, day] = match;
  else {
    match = value.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (match) [, day, month, year] = match;
  }
  if (!match) return { value, error: 'Usa YYYY-MM-DD o DD/MM/YYYY.' };
  const y = Number(year); const m = Number(month); const d = Number(day);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return { value, error: 'La fecha no existe en el calendario.' };
  }
  return { value: `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, error: null };
};

const parseInteger = (raw, label, { optional = true, allowZero = true } = {}) => {
  const value = String(raw ?? '').trim();
  if (!value && optional) return { value: '', error: null };
  if (!value) return { value: '', error: `${label} es obligatorio.` };
  if (value.includes('-')) return { value, error: `${label} no puede ser negativo.` };
  if (!/^[\d\s.,₲$+-]+$/.test(value)) return { value, error: `${label} debe ser numérico.` };
  if (/^[\d\s]+[.,]\d{1,2}$/.test(value) && !/[.,]\d{3}(?:[.,]|$)/.test(value)) return { value, error: `${label} debe ser un monto entero en guaraníes.` };
  const digits = value.replace(/\D/g, '');
  if (!digits) return { value, error: `${label} debe ser numérico.` };
  const number = Number(digits);
  if (!Number.isSafeInteger(number)) return { value, error: `${label} excede el rango admitido.` };
  if (!allowZero && number <= 0) return { value, error: `${label} debe ser mayor que cero.` };
  return { value: String(number), error: null };
};

/** Convierte filas CSV en registros clasificados y problemas corregibles. */
export const mapearFilasBienes = (rows, fields, bienes, dependenciaActual, corrections = {}) => {
  const { mapped, issues: headerIssues } = validarEncabezadosBienes(fields);
  const val = (row, field, linea) => {
    if (corrections[linea]?.[field] !== undefined) return String(corrections[linea][field] ?? '').trim();
    const column = mapped[field];
    return column ? String(row?.[column] ?? '').trim() : '';
  };

  const validos = [];
  const duplicados = [];
  const errores = [];
  const rotulosEnArchivo = new Set();
  const bienesPorRotulo = new Map();
  for (const bien of bienes || []) {
    if (normalizeStr(bien.rotulo) && normalizeStr(bien.dependencia) === normalizeStr(dependenciaActual)) {
      bienesPorRotulo.set(normalizeStr(bien.rotulo), bien);
    }
  }

  (rows || []).forEach((row, idx) => {
    const linea = idx + 2;
    const item = {
      id: generateId(), dependencia: dependenciaActual,
      rotulo: val(row, 'rotulo', linea),
      cuenta: val(row, 'cuenta', linea), subcuenta: val(row, 'subcuenta', linea),
      analitico1: val(row, 'analitico1', linea), analitico2: val(row, 'analitico2', linea),
      descripcion: val(row, 'descripcion', linea),
      fechaAdquisicion: val(row, 'fechaAdquisicion', linea),
      valorUnitario: val(row, 'valorUnitario', linea), vidaUtil: val(row, 'vidaUtil', linea),
      funcionario: '', ubicacion: '', hasFC10: false, hasQR: false,
      estadoConservacion: 'Muy bueno'
    };
    const rowErrors = [];
    if (row?.__parsed_extra?.length) rowErrors.push({ campo: 'fila', motivo: 'La fila tiene más valores que encabezados; revisa el separador o las comillas.' });
    if (row?.__missing_fields?.length) rowErrors.push({ campo: 'fila', motivo: `La fila no incluye valores para: ${row.__missing_fields.join(', ')}.` });
    if (!item.rotulo) rowErrors.push({ campo: 'rotulo', motivo: 'Falta el rótulo.' });
    else if (item.rotulo.length > 100) rowErrors.push({ campo: 'rotulo', motivo: 'El rótulo supera 100 caracteres.' });
    if (!item.descripcion) rowErrors.push({ campo: 'descripcion', motivo: 'Falta la descripción.' });
    else if (item.descripcion.length > 1000) rowErrors.push({ campo: 'descripcion', motivo: 'La descripción supera 1.000 caracteres.' });

    const fecha = parseDate(item.fechaAdquisicion);
    item.fechaAdquisicion = fecha.value;
    if (fecha.error) rowErrors.push({ campo: 'fechaAdquisicion', motivo: `Fecha de adquisición: ${fecha.error}` });
    const valor = parseInteger(item.valorUnitario || '0', 'Valor unitario');
    item.valorUnitario = valor.value || '0';
    if (valor.error) rowErrors.push({ campo: 'valorUnitario', motivo: valor.error });
    const vida = parseInteger(item.vidaUtil, 'Vida útil', { allowZero: false });
    item.vidaUtil = vida.value;
    if (vida.error) rowErrors.push({ campo: 'vidaUtil', motivo: vida.error });

    if (rowErrors.length) {
      rowErrors.forEach((error) => errores.push({ linea, ...error, valor: error.campo === 'fila' ? '' : item[error.campo] || '', fila: row }));
      return;
    }

    const rotuloNormalizado = normalizeStr(item.rotulo);
    const existing = bienesPorRotulo.get(rotuloNormalizado);
    const repeatedInFile = rotulosEnArchivo.has(rotuloNormalizado);
    rotulosEnArchivo.add(rotuloNormalizado);
    if (existing || repeatedInFile) {
      duplicados.push({ ...item, linea, _columnasPresentes: Object.keys(mapped).filter((key) => mapped[key]), existenteId: existing?.id || null, repetidoEnArchivo: repeatedInFile, motivo: repeatedInFile ? 'Rótulo repetido dentro del archivo.' : 'El rótulo ya existe en esta dependencia.' });
      return;
    }
    item.linea = linea;
    item._columnasPresentes = Object.keys(mapped).filter((key) => mapped[key]);
    validos.push(item);
  });

  return { validos, duplicados, errores, problemasEncabezado: headerIssues, columnasMapeadas: mapped };
};

const csvCell = (value) => {
  let text = String(value ?? '');
  if (/^\s*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export const descargarReporteImportacionCSV = (resultados, nombre = 'informe_importacion_bienes.csv') => {
  const rows = [['Fila', 'Rótulo', 'Resultado', 'Detalle'], ...(resultados || []).map((row) => [row.linea, row.rotulo, row.resultado, row.detalle])];
  const content = `\uFEFF${rows.map(row => row.map(csvCell).join(';')).join('\r\n')}`;
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = nombre;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
