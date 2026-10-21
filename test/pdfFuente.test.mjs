/**
 * frontend/test/pdfFuente.test.mjs
 * ============================================================================
 * La negrita del PDF.
 *
 * jsPDF registra las variantes de una fuente con:
 *   addFont(archivo, familia, fontStyle, codificacion, style)
 * El QUINTO parametro es el "style" con el que despues se busca la variante
 * con setFont(familia, estilo). Si no se pasa, jsPDF lo deja como
 * "Identity-H" y la variante negrita queda registrada con otro nombre.
 *
 * Entonces setFont('OpenSans', 'bold') no la encuentra, jsPDF avisa por
 * consola ("Unable to look up font label for font 'OpenSans', 'bold'") y se
 * queda con la normal. El resultado: todo lo que deberia ir en negrita
 * (titulos, "Firma del Funcionario Responsable", encabezados de tabla) se
 * dibuja con el mismo peso que el resto del texto.
 *
 * Aqui se comprueba que las dos variantes se registran con su style y que
 * la busqueda de la negrita no falla.
 * ============================================================================
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { prepararFuente, FUENTE_PDF } from '../src/utils/pdfSanear.js';

/** Documento falso: registra lo que se le pide, como haria jsPDF. */
function docFalso() {
  const fuentes = new Map();   // nombre de archivo -> {familia, fontStyle, style}
  const familias = new Map();  // familia -> Set de styles

  return {
    fuentes,
    familias,
    addFileToVFS() {},
    addFont(archivo, familia, fontStyle, encoding, style) {
      fuentes.set(archivo, { familia, fontStyle, encoding, style });
      if (!familias.has(familia)) familias.set(familia, new Set());
      familias.get(familia).add(style);
    },
    setFont(familia, estilo) {
      const disponibles = familias.get(familia);
      if (!disponibles) throw new Error('no hay la familia ' + familia);
      if (!disponibles.has(estilo)) {
        throw new Error("Unable to look up font label for font '" + familia + "', '" + estilo + "'");
      }
    },
    // lo que hace jsPDF: fetch de la fuente (aqui, un TTF minimo de mentira)
    _fuentesFalsa: true
  };
}

/** Sustituye el fetch para que cargarFuentes() no besoins red. */
function conFuentesFalsas(fn) {
  const original = globalThis.fetch;
  const ttfFalso = Buffer.from([0x00, 0x01, 0x00, 0x00, 0x00, 0x0c]);
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    arrayBuffer: async () => ttfFalso.buffer.slice(ttfFalso.byteOffset, ttfFalso.byteOffset + ttfFalso.byteLength)
  });
  try {
    return fn();
  } finally {
    globalThis.fetch = original;
  }
}

describe('fuente incrustada en los PDF', () => {
  test('las dos variantes se registran con su style (la 5ª posicion de addFont)', async () => {
    await conFuentesFalsas(async () => {
      const doc = docFalso();
      const ok = await prepararFuente(doc);
      assert.equal(ok, true, 'la fuente tiene que quedar registrada');

      const normal = doc.fuentes.get('OpenSans-Regular.ttf');
      const bold = doc.fuentes.get('OpenSans-Bold.ttf');
      assert.ok(normal, 'la variante normal tiene que estar registrada');
      assert.ok(bold, 'la variante negrita tiene que estar registrada');

      // ESTE es el bug: sin el 5º parametro, el style queda como "Identity-H"
      // y setFont('OpenSans', 'bold') no la encuentra.
      assert.equal(normal.style, 'normal', 'la normal se registra con el style "normal"');
      assert.equal(bold.style, 'bold', 'la negrita se registra con el style "bold"');
      assert.equal(bold.encoding, 'Identity-H', 'la codificacion es Identity-H');
    });
  });

  test('setFont con la negrita NO falla (que es lo que rompia el texto)', async () => {
    await conFuentesFalsas(async () => {
      const doc = docFalso();
      await prepararFuente(doc);
      // Esto es lo que hace el generador del acta
      assert.doesNotThrow(() => doc.setFont(FUENTE_PDF, 'bold'), 'la negrita tiene que estar disponible');
      assert.doesNotThrow(() => doc.setFont(FUENTE_PDF, 'normal'), 'la normal tiene que estar disponible');
    });
  });
});
