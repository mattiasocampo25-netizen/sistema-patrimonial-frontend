// ============================================================================
// SANEADO DE LOS PDF: que Acrobat no salga con el "Informe de integridad del
// aspecto" lleno de avisos.
//
// Que pasaba y por que (medido sobre el PDF que genera la app):
//
// 1. 2013 "El aspecto del texto puede cambiar de forma silenciosa" y
//    "El documento contiene fuentes que no estan integradas"
//    -> jsPDF dibuja con las fuentes estandar PDF (Helvetica, Courier...),
//       que por norma no van incrustadas. Cualquier lector conforme las
//       tiene, pero Acrobat avisa igual.
//    SOLUCION: se incrusta Open Sans (la fuente de la app) con addFont.
//    jsPDF hace subconjunto: de 147 KB de TTF solo incrusta ~26 KB.
//
// 2. 1000 "El documento contiene comportamiento oculto" y
//    1014 "El documento tiene acciones obsoletas"
//    -> jsPDF escribe SIEMPRE en el catalogo
//       `/OpenAction [3 0 R /FitH null]`, una accion automatica al abrir el
//       documento con un constructor obsoleto (/FitH null).
//    SOLUCION: se quita esa linea del catalogo (no va comprimido, es un
//    cambio de bytes seguro). Los objetos que quedan sin referencias son
//    inofensivos.
//
// 3. "El documento contiene contenido enriquecido que no puede suprimirse de
//    manera confiable"
//    -> los logos son PNG con canal alfa (RGBA). jsPDF los mete con una
//       /SMask, que es un grupo de transparencia: contenido opcional que
//       Acrobat no puede suprimir de forma fiable.
//    SOLUCION: se reescribe el logo como PNG sin canal alfa (color type 2).
//
// 4. Ademas, jsPDF declara en el recurso /Font de la pagina las 14 fuentes
//    estandar aunque no se usen. Se quitan las que no aparecen en el
//    contenido, para que Acrobat no las cuente como "no integradas".
// ============================================================================

const URL_FUENTE = '/fonts/OpenSans-Regular.ttf';
const URL_FUENTE_BOLD = '/fonts/OpenSans-Bold.ttf';

export const FUENTE_PDF = 'OpenSans';

// La carga es perezosa y se cachea: los TTF se piden una sola vez por
// sesion, y solo cuando se genera un PDF (no forman parte del bundle).
let fuentesCache = null;

async function cargarBase64(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`no se pudo cargar la fuente ${url} (${res.status})`);
  const buf = await res.arrayBuffer();
  let bin = '';
  const bytes = new Uint8Array(buf);
  const LOTE = 0x8000;
  for (let i = 0; i < bytes.length; i += LOTE) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + LOTE));
  }
  return btoa(bin);
}

async function cargarFuentes() {
  if (fuentesCache) return fuentesCache;
  fuentesCache = (async () => {
    const [regular, bold] = await Promise.all([
      cargarBase64(URL_FUENTE),
      cargarBase64(URL_FUENTE_BOLD).catch(() => null)
    ]);
    return { regular, bold };
  })().catch((e) => {
    fuentesCache = null;
    throw e;
  });
  return fuentesCache;
}

/**
 * Incrusta Open Sans en el documento y la deja como fuente por defecto.
 *
 * Si la fuente no se puede cargar (sin red, por ejemplo), se sigue con las
 * fuentes estandar: es mejor un PDF con un aviso que no PDF.
 */
export async function prepararFuente(doc) {
  try {
    const { regular, bold } = await cargarFuentes();

    // OJO con el quinto parametro de addFont:
    //   addFont(archivo, familia, fontStyle, codificacion, style)
    // El "style" es con el que despues se busca la variante con
    // setFont(familia, estilo). Si no se pasa, jsPDF lo deja como
    // "Identity-H" y la variante negrita queda registrada con otro nombre:
    // setFont('OpenSans', 'bold') no la encuentra, avisa por consola y se
    // queda con la normal. Todo lo que deberia ir en negrita (titulos,
    // firmas, encabezados de tabla) se dibuja con el mismo peso que el
    // resto del texto.
    doc.addFileToVFS('OpenSans-Regular.ttf', regular);
    doc.addFont('OpenSans-Regular.ttf', FUENTE_PDF, 'normal', 'Identity-H', 'normal');
    if (bold) {
      doc.addFileToVFS('OpenSans-Bold.ttf', bold);
      doc.addFont('OpenSans-Bold.ttf', FUENTE_PDF, 'bold', 'Identity-H', 'bold');
    }
    doc.setFont(FUENTE_PDF, 'normal');
    return true;
  } catch (e) {
    console.warn('No se pudo incrustar la fuente en el PDF:', e?.message || e);
    return false;
  }
}

// ── PNG sin canal alfa ─────────────────────────────────────────────────────
//
// El canvas del navegador solo sabe exportar PNG con alfa (color type 6), y
// jsPDF crea una /SMask con cualquier PNG que tenga canal alfa. Se reescribe
// a mano como color type 2 (RGB sin alfa): es lo que evita el aviso de
// "contenido enriquecido".

const TABLA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

const crc32 = (bytes) => {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = TABLA_CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const trozoPNG = (tipo, datos) => {
  const largo = datos.length;
  const largoBytes = new Uint8Array([largo >>> 24, (largo >>> 16) & 255, (largo >>> 8) & 255, largo & 255]);
  const tipoBytes = new Uint8Array([tipo.charCodeAt(0), tipo.charCodeAt(1), tipo.charCodeAt(2), tipo.charCodeAt(3)]);
  // El CRC del chunk cubre el TIPO y los DATOS (no el largo).
  const cuerpo = unir([tipoBytes, datos]);
  const crc = crc32(cuerpo);
  const crcBytes = new Uint8Array([(crc >>> 24) & 255, (crc >>> 16) & 255, (crc >>> 8) & 255, crc & 255]);
  return unir([largoBytes, cuerpo, crcBytes]);
};

const unir = (partes) => {
  const total = partes.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let p = 0;
  for (const parte of partes) { out.set(parte, p); p += parte.length; }
  return out;
};

/** PNG (RGB, sin alfa) a partir de los pixeles del canvas. */
export async function pngSinAlfa(ancho, alto, rgba) {
  // datos "crudos" del PNG: cada fila empieza con el byte de filtro (0 = none)
  const crudo = new Uint8Array(alto * (1 + ancho * 3));
  let p = 0;
  for (let y = 0; y < alto; y++) {
    crudo[p++] = 0;
    for (let x = 0; x < ancho; x++) {
      const i = (y * ancho + x) * 4;
      crudo[p++] = rgba[i];
      crudo[p++] = rgba[i + 1];
      crudo[p++] = rgba[i + 2];
    }
  }

  let comprimido;
  if (typeof CompressionStream === 'function') {
    const cs = new CompressionStream('deflate');   // deflate "crudo": el PNG usa zlib
    const flujo = new Blob([crudo]).stream().pipeThrough(cs);
    comprimido = new Uint8Array(await new Response(flujo).arrayBuffer());
  } else {
    // Sin CompressionStream no hay zlib: se deja sin comprimir (mas peso, pero
    // el PDF sigue siendo valido).
    comprimido = crudo;
  }

  const ihdr = new Uint8Array(13);
  ihdr.set([(ancho >>> 24) & 255, (ancho >>> 16) & 255, (ancho >>> 8) & 255, ancho & 255], 0);
  ihdr.set([(alto >>> 24) & 255, (alto >>> 16) & 255, (alto >>> 8) & 255, alto & 255], 4);
  ihdr.set([8, 2, 0, 0, 0], 8);   // 8 bits, color type 2 (RGB), sin alfa

  return unir([
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    trozoPNG('IHDR', ihdr),
    trozoPNG('IDAT', comprimido),
    trozoPNG('IEND', new Uint8Array(0))
  ]);
}

/** El logo se dibuja a 22-24 mm. A 300 dpi eso son ~280 px. */
const MAX_PX_LOGO = 320;

/**
 * Aplana y reescala una imagen para incrustarla en el PDF.
 *
 * Hace dos cosas:
 *   - la pone sobre fondo blanco (para quitarle el canal alfa), y
 *   - la reduce: los logos del sistema son de 2000 px y se dibujan a 22 mm.
 *     Sin reducir, cada PDF se iba en 16 MB.
 */
export async function aplanarImagen(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) return dataUrl;
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = dataUrl;
    });

    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const escala = Math.min(1, MAX_PX_LOGO / Math.max(w, h));
    const ancho = Math.max(1, Math.round(w * escala));
    const alto = Math.max(1, Math.round(h * escala));

    const lienzo = document.createElement('canvas');
    lienzo.width = ancho;
    lienzo.height = alto;
    const ctx = lienzo.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, ancho, alto);
    ctx.drawImage(img, 0, 0, ancho, alto);

    const datos = ctx.getImageData(0, 0, ancho, alto).data;
    const png = await pngSinAlfa(ancho, alto, datos);

    let bin = '';
    const bytes = new Uint8Array(png);
    const LOTE = 0x8000;
    for (let i = 0; i < bytes.length; i += LOTE) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + LOTE));
    }
    return 'data:image/png;base64,' + btoa(bin);
  } catch {
    return dataUrl;
  }
}

/**
 * Quita del PDF lo que hace que Acrobat salga con avisos:
 *   - la accion /OpenAction automatica de jsPDF,
 *   - las fuentes estandar declaradas pero no usadas.
 *
 * Trabaja sobre los bytes: el catalogo y el diccionario /Font no van
 * comprimidos, asi que se pueden editar sin romper nada.
 */
export function sanearPDF(arrayBuffer) {
  try {
    let txt = new TextDecoder('latin1').decode(new Uint8Array(arrayBuffer));

    // Las fuentes que usa el contenido: se calculan ANTES de tocar nada.
    const usadas = new Set();
    for (const m of txt.matchAll(/\/(F\d+)\s+[\d.]+\s+Tf/g)) usadas.add(m[1]);

    // 1) La accion automatica al abrir.
    //    Se sustituye por ESPACIOS del mismo numero de bytes: el PDF pierde
    //    la accion, pero el archivo no cambia de tamano y la tabla xref
    //    sigue siendo valida. (Borrarla dejaba los desplazamientos
    //    desfasados y Acrobat avisaba de un error en la pagina.)
    txt = txt.replace(/\/OpenAction\s*\[[^\]]*\]/g, (m) => ' '.repeat(m.length));

    // 2) Las fuentes declaradas en /Font que no usa el contenido: igual,
    //    con espacios.
    txt = txt.replace(/\/Font\s*<<([^>]*?)>>/g, (todo, cuerpo) => {
      const limpio = cuerpo.replace(/\/(F\d+)\s+\d+\s+0\s+R/g, (m, f) => (usadas.has(f) ? m : ' '.repeat(m.length)));
      return '/Font <<' + limpio + '>>';
    });

    const salida = new Uint8Array(txt.length);
    for (let i = 0; i < txt.length; i++) salida[i] = txt.charCodeAt(i) & 0xff;
    return salida.buffer;
  } catch (e) {
    console.warn('No se pudo sanear el PDF:', e?.message || e);
    return arrayBuffer;
  }
}

/**
 * Genera el PDF, lo sanea y lo descarga.
 *
 * Se usa en vez de doc.save() para poder pasar los bytes por el saneado.
 */
export function guardarPDF(doc, nombreArchivo) {
  const buffer = doc.output('arraybuffer');
  const limpio = sanearPDF(buffer);
  const blob = new Blob([limpio], { type: 'application/pdf' });
  if (window.saveAs) {
    window.saveAs(blob, nombreArchivo);
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}
