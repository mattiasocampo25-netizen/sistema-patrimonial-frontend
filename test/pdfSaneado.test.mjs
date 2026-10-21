/**
 * frontend/test/pdfSaneado.test.mjs
 * ============================================================================
 * El saneado de PDF evita que Acrobat abra los documentos con el "Informe de
 * integridad del aspecto" lleno de avisos.
 *
 * Lo que hacia jsPDF (medido sobre el PDF que genera la app):
 *   - escribia en el catalogo `/OpenAction [3 0 R /FitH null]`: una accion
 *     automatica al abrir, que Acrobat marca como comportamiento oculto
 *     (1000) y como accion obsoleta (1014).
 *   - declaraba en el recurso /Font de la pagina las 14 fuentes estandar
 *     aunque no se usaran: Acrobat las cuenta como "fuentes no integradas"
 *     (2013 y el aviso de fuentes).
 *   - los logos son PNG con canal alfa: jsPDF los mete con una /SMask (grupo
 *     de transparencia), que Acrobat reporta como contenido enriquecido que no
 *     puede suprimirse. Ademas, al incestarlos a 2000 px, el PDF se iba en
 *     16 MB.
 *
 * Aqui se prueba la parte que es codigo nuestro: el saneado de los bytes y
 * el codificador de PNG sin canal alfa.
 * ============================================================================
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import { sanearPDF, pngSinAlfa } from '../src/utils/pdfSanear.js';

const aBuffer = (txt) => {
  const out = new Uint8Array(txt.length);
  for (let i = 0; i < txt.length; i++) out[i] = txt.charCodeAt(i) & 0xff;
  return out.buffer;
};

const aTexto = (buf) => new TextDecoder('latin1').decode(new Uint8Array(buf));

/** Un PDF minimo con los tres problemas. */
const PDF_CON_PROBLEMAS = [
  '%PDF-1.3',
  '1 0 obj',
  '<< /Type /Catalog /Pages 2 0 R /OpenAction [3 0 R /FitH null] /PageLayout /OneColumn >>',
  'endobj',
  '2 0 obj',
  '<< /Type /Pages /Kids [4 0 R] /Count 1 >>',
  'endobj',
  '3 0 obj',
  '<< /Type /Action /S /GoTo /D [4 0 R /FitH null] >>',
  'endobj',
  '4 0 obj',
  '<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> >> /Contents 8 0 R >>',
  'endobj',
  '5 0 obj',
  '<< /Type /Font /BaseFont /Helvetica /Subtype /Type1 /Encoding /WinAnsiEncoding >>',
  'endobj',
  '6 0 obj',
  '<< /Type /Font /BaseFont /Courier /Subtype /Type1 /Encoding /WinAnsiEncoding >>',
  'endobj',
  '7 0 obj',
  '<< /Type /Font /BaseFont /OpenSans /Subtype /Type0 >>',
  'endobj',
  '8 0 obj',
  '<< /Length 44 >>',
  'stream',
  'BT /F3 9 Tf 10 50 Td (Texto) Tj ET',
  'endstream',
  'endobj',
  'trailer',
  '<< /Size 9 /Root 1 0 R >>',
  '%%EOF'
].join('\n');

describe('saneado de PDF', () => {
  test('el PDF conserva EXACTAMENTE el mismo numero de bytes', () => {
    // Esto es lo mas importante: si el saneado acortara el archivo, los
    // desplazamientos de la tabla xref dejarian de valer y Acrobat
    // responderia "Hay un error en esta pagina".
    const original = aBuffer(PDF_CON_PROBLEMAS);
    const limpio = sanearPDF(original);
    assert.equal(limpio.byteLength, original.byteLength, 'el tamaño no puede cambiar');
  });

  test('quita la accion automatica al abrir (OpenAction)', () => {
    const limpio = aTexto(sanearPDF(aBuffer(PDF_CON_PROBLEMAS)));
    assert.ok(!limpio.includes('/OpenAction'), 'el catalogo no debe llevar /OpenAction');
    // el resto del catalogo sigue intacto
    assert.ok(limpio.includes('/Type /Catalog'));
    assert.ok(limpio.includes('/PageLayout /OneColumn'));
  });

  test('quita del recurso las fuentes declaradas pero no usadas', () => {
    const limpio = aTexto(sanearPDF(aBuffer(PDF_CON_PROBLEMAS)));
    const m = limpio.match(/\/Font\s*<<([^>]*?)>>/);
    assert.ok(m, 'debe quedar el diccionario /Font');
    assert.ok(m[1].includes('/F3'), 'la fuente que se usa (/F3) se queda');
    assert.ok(!m[1].includes('/F1'), 'Helvetica no se usa: no debe declararse');
    assert.ok(!m[1].includes('/F2'), 'Courier no se usa: no debe declararse');
  });

  test('no toca el contenido ni el resto del documento', () => {
    const limpio = aTexto(sanearPDF(aBuffer(PDF_CON_PROBLEMAS)));
    assert.ok(limpio.includes('BT /F3 9 Tf'), 'el contenido de la pagina sigue igual');
    assert.ok(limpio.includes('%%EOF'));
    assert.ok(limpio.includes('/BaseFont /OpenSans'), 'los objetos de fuente siguen en el archivo');
  });

  test('si algo falla, devuelve el PDF original en vez de romperlo', () => {
    const raro = aBuffer('esto no es un PDF');
    const salida = sanearPDF(raro);
    assert.ok(salida instanceof ArrayBuffer);
  });
});

describe('PNG sin canal alfa (para que jsPDF no cree la /SMask)', () => {
  test('genera un PNG valido, con color type 2 (RGB)', async () => {
    const ancho = 4;
    const alto = 3;
    // RGBA: dos pixeles con alfa 255 y dos con alfa 0 (que deben quedar igual
    // de todos modos: el alfa se descarta).
    const rgba = new Uint8ClampedArray([
      255, 0, 0, 255, 0, 255, 0, 255,
      0, 0, 255, 0, 255, 255, 0, 128,
      10, 20, 30, 255, 40, 50, 60, 255,
      70, 80, 90, 255, 100, 110, 120, 255
    ]);

    const png = Buffer.from(await pngSinAlfa(ancho, alto, rgba));

    // firma
    assert.deepEqual([...png.slice(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    // IHDR
    assert.equal(png.toString('latin1', 12, 16), 'IHDR');
    assert.equal(png.readUInt32BE(8), 13, 'el largo de IHDR es 13');
    assert.equal(png.readUInt32BE(16), ancho);
    assert.equal(png.readUInt32BE(20), alto);
    assert.equal(png[24], 8, '8 bits por canal');
    assert.equal(png[25], 2, 'color type 2 = RGB, sin canal alfa');
    // IEND al final
    assert.equal(png.toString('latin1', png.length - 8, png.length - 4), 'IEND');
  });

  test('los pixeles se recuperan intactos (el alfa se descarta)', async () => {
    const ancho = 2;
    const alto = 2;
    const rgba = new Uint8ClampedArray([
      1, 2, 3, 255, 4, 5, 6, 255,
      7, 8, 9, 0, 10, 11, 12, 128
    ]);
    const png = Buffer.from(await pngSinAlfa(ancho, alto, rgba));

    // localizar el IDAT y descomprimirlo
    const i = png.indexOf('IDAT', 0, 'latin1');
    assert.ok(i > 0, 'debe haber un chunk IDAT');
    const largo = png.readUInt32BE(i - 4);
    const datos = png.slice(i + 4, i + 4 + largo);
    const crudo = zlib.inflateSync(datos);

    // cada fila: 1 byte de filtro + ancho * 3
    assert.equal(crudo.length, alto * (1 + ancho * 3));
    const pixeles = [];
    for (let y = 0; y < alto; y++) {
      const base = y * (1 + ancho * 3);
      assert.equal(crudo[base], 0, 'el filtro de cada fila es "none"');
      for (let x = 0; x < ancho; x++) {
        const p = base + 1 + x * 3;
        pixeles.push([crudo[p], crudo[p + 1], crudo[p + 2]]);
      }
    }
    assert.deepEqual(pixeles, [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]]);
  });
});
