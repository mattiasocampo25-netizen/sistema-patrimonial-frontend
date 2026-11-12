// src/utils/helpers.js
export const formatCurrency = (value) => { if (!value) return "0"; const number = parseInt(value.toString().replace(/\D/g, ''), 10); return isNaN(number) ? "0" : new Intl.NumberFormat('es-PY').format(number); };
export const formatCI = (value) => { if (!value) return ""; return value.toString().replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, "."); };
export const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback seguro usando getRandomValues
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
};
export const parseDateInfo = (dateStr) => { if (!dateStr) return { year: null, month: null }; const str = String(dateStr).trim().replace(/\//g, '-'); const p = str.split('-'); if (p.length === 3) { if (p[0].length === 4) return { year: p[0], month: p[1].padStart(2, '0') }; if (p[2].length === 4) return { year: p[2], month: p[1].padStart(2, '0') }; } return { year: null, month: null }; };
export const formatDateText = (dateStr) => { if(!dateStr) return ''; const str = String(dateStr).trim().replace(/\//g, '-'); const p = str.split('-'); if(p.length === 3) { if(p[0].length === 4) return `${p[2]}-${p[1]}-${p[0]}`; if(p[2].length === 4) return `${p[0]}-${p[1]}-${p[2]}`; } return str; };
export const toInputDateFormat = (val) => {
  if (!val) return '';
  const str = String(val).trim().replace(/\//g, '-');
  const clean = str.split('T')[0].split(' ')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    if (parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  return '';
};
export const getEstadoAbbr = (estado) => { if(!estado) return '-'; const e = String(estado).toLowerCase(); if(e.includes('muy')) return 'MB'; if(e.includes('bueno')) return 'B'; if(e.includes('regular')) return 'R'; if(e.includes('malo')) return 'M'; if(e.includes('inutilizable')) return 'I'; if(e.includes('baja')) return 'DB'; return estado; };
export const normalizeStr = (str) =>
  String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');

// Colores institucionales estables por facultad. Se usan en marca y acciones
// de la interfaz, no en estados semánticos como error, advertencia o éxito.
const PALETAS_DEPENDENCIA = [
  { clave: 'CIENCIAS APLICADAS', claro: ['#4338ca', '#3730a3', '#eef2ff', '#3730a3'], oscuro: ['#a5b4fc', '#c7d2fe', '#24214a', '#c7d2fe'] },
  { clave: 'HUMANIDADES', claro: ['#6d28d9', '#5b21b6', '#f5f3ff', '#5b21b6'], oscuro: ['#c4b5fd', '#ddd6fe', '#32204f', '#ddd6fe'] },
  { clave: 'CONTABLES', claro: ['#047857', '#065f46', '#ecfdf5', '#065f46'], oscuro: ['#6ee7b7', '#a7f3d0', '#123b32', '#a7f3d0'] },
  { clave: 'DERECHO', claro: ['#be123c', '#9f1239', '#fff1f2', '#9f1239'], oscuro: ['#fda4af', '#fecdd3', '#471c2b', '#fecdd3'] },
  { clave: 'AGROPECUARIAS', claro: ['#4d7c0f', '#3f6212', '#f7fee7', '#3f6212'], oscuro: ['#bef264', '#d9f99d', '#303c1e', '#d9f99d'] },
  { clave: 'BIOMEDICAS', claro: ['#0e7490', '#155e75', '#ecfeff', '#155e75'], oscuro: ['#67e8f9', '#a5f3fc', '#123c49', '#a5f3fc'] },
  { clave: 'TECNOLOGIAS Y ARTES', claro: ['#c2410c', '#9a3412', '#fff7ed', '#9a3412'], oscuro: ['#fdba74', '#fed7aa', '#4b2c1d', '#fed7aa'] }
];

export const coloresPorDependencia = (dependencia, darkMode = false) => {
  const nombre = normalizeStr(dependencia);
  const paleta = PALETAS_DEPENDENCIA.find(item => nombre.includes(item.clave));
  const [accent, hover, soft, text] = (darkMode ? paleta?.oscuro : paleta?.claro)
    || (darkMode ? ['#5bb8c0', '#79cbd0', '#123944', '#8cdae0'] : ['#14728a', '#105d72', '#e6f3f5', '#11596e']);
  return {
    '--dep-accent': accent,
    '--brand': accent,
    '--brand-hover': hover,
    '--brand-soft': soft,
    '--brand-text': text
  };
};

export const colorPorDependencia = (dependencia) => coloresPorDependencia(dependencia)['--dep-accent'];

// Repara texto UTF-8 que fue interpretado como Windows-1252/Latin-1 al
// importar datos antiguos (por ejemplo, "PedagÃ³gicas"). Solo se aplica al
// presentar el texto; no cambia los valores guardados ni toca cadenas válidas.
export const repairMojibake = (value) => {
  const text = String(value ?? '');
  if (!/(?:Ã[\u0080-\u00bf]|Â[\u0080-\u00bf]|â[\u0080-\u00bf]{1,2})/.test(text)) return text;
  try {
    const bytes = Uint8Array.from(text, (char) => {
      const code = char.charCodeAt(0);
      if (code > 0xff) throw new Error('Not a single-byte mojibake sequence');
      return code;
    });
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return decoded.includes('\uFFFD') ? text : decoded;
  } catch {
    return text;
  }
};

// Versión de RESBALDO del sistema.
//
// La versión que ve el usuario sale de `app_config.ultima_version` (la base):
// esa es la fuente de verdad y la que el script `aviso-mantenimiento.js`
// publica en cada despliegue. Esta constante solo se usa si la configuración
// todavía no cargó (por ejemplo, sin red), y el script la mantiene
// actualizada junto con los `package.json` de los dos repositorios.
//
// OJO: no cambiar la version a mano. Se cambia con:
//   npm run aviso:cerrar -- --mensaje "..." --mejoras "..." --version 2.13.1
export const APP_VERSION = '2.19.2';

// Comprime una imagen al mínimo peso razonable (objetivo ≤120KB):
// 1024px/q0.70, y si sigue pesada reintenta más agresivo. Quita metadatos EXIF.
export const comprimirImagen = (file, maxLado = 1024, calidad = 0.7, objetivoBytes = 120 * 1024) => {
  const intentar = (lado, q) => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          const escala = Math.min(1, lado / Math.max(width, height));
          width = Math.max(1, Math.round(width * escala));
          height = Math.max(1, Math.round(height * escala));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          URL.revokeObjectURL(url);
          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo comprimir'))),
            'image/jpeg',
            q
          );
        } catch (e) {
          URL.revokeObjectURL(url);
          reject(e);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Archivo de imagen inválido'));
      };
      img.src = url;
    });
  };
  return (async () => {
    const pasos = [
      [maxLado, calidad],
      [maxLado, 0.55],
      [800, 0.5],
    ];
    let ultimoError = null;
    for (const [lado, q] of pasos) {
      try {
        const blob = await intentar(lado, q);
        if (blob.size <= objetivoBytes) return blob;
        if (lado === 800 && q === 0.5) return blob; // último nivel: aceptar aunque supere el objetivo
      } catch (e) {
        ultimoError = e;
      }
    }
    throw ultimoError || new Error('No se pudo procesar la imagen');
  })();
};

export const matchSearchWords = (text, query) => {
  if (!query || !String(query).trim()) return true;
  const target = normalizeStr(text);
  const tokens = normalizeStr(query).split(' ').filter(Boolean);
  return tokens.every(token => target.includes(token));
};

// Formatea dígitos con separador de miles (1.234.567). Para CI y montos en vivo.
export const formatearMiles = (valor) => {
  const digitos = String(valor ?? '').replace(/\D/g, '').slice(0, 12).replace(/^0+(?=\d)/, '');
  if (!digitos) return '';
  return digitos.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Búsqueda robusta de bienes: insensible a tildes/mayúsculas, multi-palabra (AND),
// tolerante a ceros/guiones en rótulos y ampliada a más campos.
export const matchBienSearch = (bien, query, registrosRelacionados = [], { codigoSolo = false, exactoFinal = false } = {}) => {
  if (!query || !String(query).trim()) return true;
  const b = bien || {};
  const tokens = normalizeStr(query).split(' ').filter(Boolean);
  const esConsultaNumerica = tokens.length > 0 && tokens.every(tok => /^[\d.,/#_-]+$/.test(tok));
  const camposCodigo = [b.rotulo, b.etiqueta, b.codigo, b.codigoPatrimonial, b.id]
    .map(v => String(v ?? ''));
  // Al buscar un número que coincide con un rótulo/código, no incluir bienes
  // cuyo único match está en una CI, fecha u otro dato relacionado. Eso hacía
  // que el contador mostrara bienes que no parecían coincidir con la búsqueda.
  const coincideCodigo = (campo, token) => {
    const digitos = token.replace(/\D/g, '');
    const sinCeros = digitos.replace(/^0+/, '') || '0';
    const raw = String(campo ?? '').replace(/\D/g, '');
    return Boolean(raw && (raw.includes(digitos) || (raw.replace(/^0+/, '') || '0').includes(sinCeros)));
  };
  if (esConsultaNumerica && exactoFinal) {
    return tokens.every(token => {
      const digitos = token.replace(/\D/g, '').replace(/^0+/, '') || '0';
      return [b.rotulo, b.etiqueta, b.codigo, b.codigoPatrimonial].some(campo => {
        const final = String(campo ?? '').match(/(\d+)\D*$/)?.[1];
        return final && (final.replace(/^0+/, '') || '0') === digitos;
      });
    });
  }
  if (esConsultaNumerica && codigoSolo) {
    return tokens.every(token => camposCodigo.some(campo => coincideCodigo(campo, token)));
  }
  if (esConsultaNumerica && tokens.some(token => {
    const digitos = token.replace(/\D/g, '');
    const sinCeros = digitos.replace(/^0+/, '') || '0';
    return camposCodigo.some(campo => coincideCodigo(campo, token));
  })) {
    return tokens.every(token => camposCodigo.some(campo => coincideCodigo(campo, token)));
  }
  const fields = [
    b.rotulo, b.etiqueta, b.codigo, b.codigoPatrimonial, b.descripcion,
    b.cuenta, b.subcuenta, b.analitico1, b.analitico2, b.ubicacion,
    b.funcionario, b.funcionarioAlternativo, b.funcionarioNombre, b.responsable, b.responsableNombre,
    b.custodio, b.funcionarioDoc, b.cedulaResponsable, b.funcionarioCargo, b.id,
    ...registrosRelacionados.flatMap(registro => [
      registro?.funcionarioNombre, registro?.funcionarioDoc, registro?.funcionarioCargo,
      registro?.jefeInmediatoNombre, registro?.jefeInmediatoDoc
    ])
  ].map(v => String(v ?? ''));
  const fieldsNorm = fields.map(normalizeStr).filter(Boolean);
  // Algunas cargas históricas guardan códigos con separadores distintos
  // (p. ej. 2803-01-05-4788 frente a 280301054788).
  const fieldsCompact = fieldsNorm.map(f => f.replace(/[^A-Z0-9]/g, '')).filter(Boolean);
  const fieldDigits = fields.map(f => {
    const raw = String(f).replace(/\D/g, '');
    return { raw, stripped: raw.replace(/^0+/, '') || (raw ? '0' : '') };
  });
  if (tokens.length === 0) return true;
  return tokens.every(tok => {
    if (fieldsNorm.some(field => field.includes(tok))) return true;
    const compactToken = tok.replace(/[^A-Z0-9]/g, '');
    if (compactToken && fieldsCompact.some(field => field.includes(compactToken))) return true;
    const tokRawDigits = tok.replace(/\D/g, '');
    // Solo compara dígitos si el término de búsqueda contiene exclusivamente
    // números y separadores; así una palabra con números no da falsos positivos.
    if (!tokRawDigits || /[^\d\s.,/#_-]/.test(tok)) return false;
    const tokStripped = tokRawDigits.replace(/^0+/, '') || '0';
    return fieldDigits.some(fd => {
      if (!fd.raw) return false;
      return fd.stripped.includes(tokStripped) || fd.raw.includes(tokRawDigits);
    });
  });
};

export const decodeText = (buffer) => {
    let text = new TextDecoder('utf-8').decode(buffer);
    if (text.includes('')) {
        text = new TextDecoder('iso-8859-1').decode(buffer);
    }
    return text;
};

export const getPlaceholderLogo = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0,0,200,200);
    ctx.fillStyle = '#121212';
    ctx.font = 'bold 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LOGO', 100, 115);
    ctx.lineWidth = 4;
    ctx.strokeRect(0,0,200,200);
    return canvas.toDataURL('image/png');
 };
export const convertirImagenABase64 = async (url) => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Error al convertir logo a Base64:", error);
        return null;
    }
};
export const getLogoPorDependencia = (dependencia, ext = 'png') => {
    if (!dependencia) return `/publiclogo_unp.${ext}`;
    const dep = String(dependencia).toLowerCase();

    if (dep.includes('agropecuarias')) return `/publiclogo_agro.${ext}`;
    if (dep.includes('aplicadas')) return `/publiclogo_aplicadas.${ext}`;
    if (dep.includes('biomédicas') || dep.includes('biomedicas')) return `/publiclogo_biomedicas.${ext}`;
    if (dep.includes('derecho')) return `/publiclogo_derecho.${ext}`;
    if (dep.includes('económicas') || dep.includes('economicas') || dep.includes('contables')) return `/publiclogo_contables.${ext}`;
    if (dep.includes('tecnolog')) return `/publiclogo_cta.${ext}`;
    if (dep.includes('humanidades')) return `/publiclogo_humanidades.${ext}`;

    return `/publiclogo_unp.${ext}`;
};
