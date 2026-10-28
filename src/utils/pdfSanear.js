import { solicitarNombreArchivo } from './fileNames.js';

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
 * Trabaja sobre los bytes CRUDOS del ArrayBuffer: los patrones que se
 * buscan (/OpenAction, /Font, /F1, etc.) son puro ASCII, asi que se pueden
 * localizar y reemplazar por espacios del mismo largo sin tocar el resto del
 * archivo. Nunca se decodifica el archivo completo como latin1, porque eso
 * corromperia los streams comprimidos (imagenes, fuentes embebidas, objetos
 * FlateDecode) y haria que Acrobat detecte el PDF como corrupto o dañado.
 */
export function sanearPDF(arrayBuffer) {
  try {
    const bytes = new Uint8Array(arrayBuffer);

    // Los patrones que buscamos son ASCII puro, asi que se buscan como bytes.
    const patOpenAction = new TextEncoder().encode('/OpenAction [');

    // ---------------------------------------------------------------
    // 1) Quitar /OpenAction [...] (accion automatica al abrir).
    //    Se reemplaza por ESPACIOS del mismo largo: el PDF conserva su
    //    tamano y la tabla xref sigue siendo valida.
    // ---------------------------------------------------------------
    let resultado = quitarPatronConEspacios(bytes, patOpenAction);

    // ---------------------------------------------------------------
    // 2) Quitar fuentes declaradas en /Font que NO se usan en el contenido.
    //    Todo el trabajo se hace sobre Uint8Array: nunca se decodifica el
    //    archivo completo como texto, con lo que no se tocan los bytes
    //    no-ASCII de streams comprimidos, imagenes ni fuentes embebidas.
    // ---------------------------------------------------------------
    const usadas = fuentesUsadasBytes(resultado);
    resultado = limpiarFuentesNoUsadasBytes(resultado, usadas);

    return resultado.buffer;
  } catch (e) {
    console.warn('No se pudo sanear el PDF:', e?.message || e);
    return arrayBuffer;
  }
}

/**
 * Busca un patron ASCII en los bytes y lo reemplaza por espacios del mismo
 * largo. Devuelve un Uint8Array nuevo (no muta el original).
 */
function quitarPatronConEspacios(datos, patron) {
  const haystack = datos;
  const n = haystack.length;
  const m = patron.length;
  const out = new Uint8Array(n);
  out.set(haystack);
  let i = 0;
  while (i <= n - m) {
    let coincide = true;
    for (let j = 0; j < m; j++) {
      if (haystack[i + j] !== patron[j]) { coincide = false; break; }
    }
    if (coincide) {
      // Buscar el cierre ']' del OpenAction
      let fin = i + m;
      while (fin < n && haystack[fin] !== 0x5d) fin++; // 0x5d = ']'
      if (fin < n) {
        for (let k = i; k <= fin; k++) out[k] = 0x20; // espacio
        i = fin + 1;
      } else {
        i++;
      }
    } else {
      i++;
    }
  }
  return out;
}

/**
 * Busca la primera ocurrencia de un patron de bytes a partir de 'desde'.
 * Devuelve el indice o -1.
 */
function indexOfBytes(haystack, patron, desde = 0) {
  const n = haystack.length;
  const m = patron.length;
  for (let i = desde; i <= n - m; i++) {
    let coincide = true;
    for (let j = 0; j < m; j++) {
      if (haystack[i + j] !== patron[j]) { coincide = false; break; }
    }
    if (coincide) return i;
  }
  return -1;
}

/**
 * Lee un entero ASCII desde la posicion 'pos' hasta encontrar un byte no
 * digito. Devuelve { valor, nuevaPos }.
 */
function leerEnteroAscii(datos, pos) {
  let valor = 0;
  let p = pos;
  while (p < datos.length && datos[p] >= 0x30 && datos[p] <= 0x39) {
    valor = valor * 10 + (datos[p] - 0x30);
    p++;
  }
  return { valor, pos: p };
}

/**
 * Salta espacios en blanco ASCII (0x20, 0x09, 0x0a, 0x0d, 0x00).
 */
function saltarEspacios(datos, pos) {
  while (pos < datos.length) {
    const b = datos[pos];
    if (b === 0x20 || b === 0x09 || b === 0x0a || b === 0x0d || b === 0x00) pos++;
    else break;
  }
  return pos;
}

/**
 * Devuelve el conjunto de nombres de fuentes (p. ej. 'F1', 'F2') que
 * aparecen en el contenido del PDF como operadores de texto (Fn ... Tf).
 * Escanea sobre bytes sin decodificar el archivo completo.
 */
function fuentesUsadasBytes(datos) {
  const usadas = new Set();
  const patSlashF = new TextEncoder().encode('/F');
  const patTf = new TextEncoder().encode('Tf');
  let i = 0;
  const n = datos.length;
  while (i < n) {
    // Buscar '/F'
    const idxSlashF = indexOfBytes(datos, patSlashF, i);
    if (idxSlashF === -1) break;
    i = idxSlashF + patSlashF.length;

    // Leer el nombre de la fuente: F seguido de digitos
    let nombreFin = i;
    while (nombreFin < n && datos[nombreFin] >= 0x30 && datos[nombreFin] <= 0x39) nombreFin++;
    if (nombreFin === i) { i++; continue; } // no hubo digitos despues de F
    const nombre = 'F' + new TextDecoder('ascii').decode(datos.subarray(i, nombreFin));
    i = nombreFin;

    // Saltar espacios
    i = saltarEspacios(datos, i);

    // Leer el tamaño de fuente (numero)
    const { pos: posDespuesNum } = leerEnteroAscii(datos, i);
    i = posDespuesNum;

    // Saltar espacios
    i = saltarEspacios(datos, i);

    // Verificar que venga 'Tf'
    const idxTf = indexOfBytes(datos, patTf, i);
    if (idxTf === i) { // Tf empieza justo aqui
      usadas.add(nombre);
      i = idxTf + patTf.length;
    } else {
      i = idxSlashF + 1; // avanzar para no buclear
    }
  }
  return usadas;
}

/**
 * Dentro de cada diccionario /Font << ... >>, reemplaza por espacios las
 * entradas de fuentes que NO se usan en el contenido. Trabaja sobre bytes.
 */
function limpiarFuentesNoUsadasBytes(datos, usadas) {
  const out = new Uint8Array(datos);
  out.set(datos);
  const patFontOpen = new TextEncoder().encode('/Font <<');
  const patFontClose = new TextEncoder().encode('>>');
  const patSlashF = new TextEncoder().encode('/F');
  const patRef = new TextEncoder().encode('0 R');

  let i = 0;
  const n = datos.length;
  while (i < n) {
    const idxOpen = indexOfBytes(datos, patFontOpen, i);
    if (idxOpen === -1) break;
    let p = idxOpen + patFontOpen.length;

    // Buscar el cierre '>>' de este diccionario
    let idxClose = indexOfBytes(datos, patFontClose, p);
    if (idxClose === -1) break;

    // Dentro de [p, idxClose) buscar entradas /Fn N 0 R
    let j = p;
    while (j < idxClose) {
      const idxF = indexOfBytes(datos, patSlashF, j);
      if (idxF === -1 || idxF >= idxClose) break;

      // Leer nombre Fn
      let nombreFin = idxF + patSlashF.length;
      while (nombreFin < idxClose && datos[nombreFin] >= 0x30 && datos[nombreFin] <= 0x39) nombreFin++;
      if (nombreFin === idxF + patSlashF.length) { j = idxF + 1; continue; }
      const nombre = 'F' + new TextDecoder('ascii').decode(datos.subarray(idxF + patSlashF.length, nombreFin));

      // Saltar espacios
      let k = saltarEspacios(datos, nombreFin);

      // Leer numero de objeto
      const { pos: posDespuesNum } = leerEnteroAscii(datos, k);
      k = posDespuesNum;

      // Saltar espacios
      k = saltarEspacios(datos, k);

      // Verificar '0 R'
      const idx0R = indexOfBytes(datos, patRef, k);
      if (idx0R === k) {
        // Entrada completa: /Fn N 0 R
        if (!usadas.has(nombre)) {
          // Reemplazar por espacios del mismo largo
          for (let x = idxF; x < idx0R + patRef.length; x++) out[x] = 0x20;
        }
        j = idx0R + patRef.length;
      } else {
        j = idxF + 1;
      }
    }
    i = idxClose + patFontClose.length;
  }
  return out;
}

/**
 * Genera el PDF, lo sanea y lo descarga.
 *
 * Se usa en vez de doc.save() para poder pasar los bytes por el saneado.
 */
export async function guardarPDF(doc, nombreArchivo) {
  const nombreElegido = await solicitarNombreArchivo(nombreArchivo);
  const buffer = doc.output('arraybuffer');
  const limpio = sanearPDF(buffer);
  const blob = new Blob([limpio], { type: 'application/pdf' });
  if (window.saveAs) {
    window.saveAs(blob, nombreElegido);
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreElegido;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}
