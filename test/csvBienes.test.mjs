import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mapearFilasBienes, parsearArchivoCSVBienes, validarEncabezadosBienes, MAX_CSV_BIENES_BYTES } from '../src/utils/csvBienes.js';

describe('mapearFilasBienes', () => {
  const campos = ['Rótulo', 'Descripción'];

  it('detecta duplicados dentro del mismo archivo aunque cambien mayúsculas y tildes', () => {
    const { validos, duplicados, errores } = mapearFilasBienes([
      { 'Rótulo': 'A-001', 'Descripción': 'Primero' },
      { 'Rótulo': 'a-001', 'Descripción': 'Repetido' },
      { 'Rótulo': 'B-002', 'Descripción': 'Otro bien' }
    ], campos, [], 'Rectorado');

    assert.equal(validos.length, 2);
    assert.equal(duplicados.length, 1);
    assert.equal(duplicados[0].descripcion, 'Repetido');
    assert.equal(errores.length, 0);
  });

  it('compara duplicados existentes con dependencia normalizada', () => {
    const { validos, duplicados } = mapearFilasBienes(
      [{ 'Rótulo': ' 2803-01 ', 'Descripción': 'Bien ya registrado' }],
      campos,
      [{ rotulo: '2803-01', dependencia: 'RECTORADO' }],
      'Rectorado'
    );

    assert.equal(validos.length, 0);
    assert.equal(duplicados.length, 1);
    assert.equal(duplicados[0].existenteId, null);
  });

  it('detecta encabezado obligatorio ausente y columnas ambiguas', () => {
    const missing = validarEncabezadosBienes(['Descripción']);
    assert.match(missing.issues[0].motivo, /Falta la columna obligatoria/);

    const ambiguous = validarEncabezadosBienes(['Rótulo', 'Código', 'Descripción']);
    assert.ok(ambiguous.issues.some(issue => issue.campo === 'rotulo' && /varias columnas/.test(issue.motivo)));
  });

  it('valida fechas y montos, y permite corregir valores por número de fila', () => {
    const fields = ['Rótulo', 'Descripción', 'Fecha Adquisición', 'Valor Unitario', 'Vida Útil'];
    const rows = [{
      'Rótulo': 'A-100', 'Descripción': 'Silla', 'Fecha Adquisición': '31/02/2024',
      'Valor Unitario': '12,5', 'Vida Útil': '0'
    }];
    const invalid = mapearFilasBienes(rows, fields, [], 'Rectorado');
    assert.equal(invalid.validos.length, 0);
    assert.deepEqual(new Set(invalid.errores.map(error => error.campo)), new Set(['fechaAdquisicion', 'valorUnitario', 'vidaUtil']));

    const fixed = mapearFilasBienes(rows, fields, [], 'Rectorado', {
      2: { fechaAdquisicion: '2024-02-29', valorUnitario: '1.250.000', vidaUtil: '5' }
    });
    assert.equal(fixed.validos.length, 1);
    assert.equal(fixed.validos[0].fechaAdquisicion, '2024-02-29');
    assert.equal(fixed.validos[0].valorUnitario, '1250000');
    assert.equal(fixed.validos[0].vidaUtil, '5');
  });

  it('distingue rótulos existentes de repetidos dentro del archivo', () => {
    const { validos, duplicados } = mapearFilasBienes([
      { 'Rótulo': 'A-001', 'Descripción': 'Actualizar existente' },
      { 'Rótulo': 'A-001', 'Descripción': 'Repetido del archivo' }
    ], campos, [{ id: 'bien-1', rotulo: 'A-001', dependencia: 'Rectorado' }], 'Rectorado');
    assert.equal(validos.length, 0);
    assert.equal(duplicados.length, 2);
    assert.equal(duplicados[0].existenteId, 'bien-1');
    assert.equal(duplicados[0].repetidoEnArchivo, false);
    assert.equal(duplicados[1].repetidoEnArchivo, true);
  });

  it('infiere punto y coma, quita BOM y conserva encabezados con acentos', async () => {
    const text = '\uFEFFRótulo;Descripción\r\nR-1;Mesa';
    const file = {
      name: 'bienes.csv', type: 'text/csv', size: new TextEncoder().encode(text).length,
      arrayBuffer: async () => new TextEncoder().encode(text).buffer
    };
    const parsed = await parsearArchivoCSVBienes(file);
    assert.equal(parsed.delimiter, ';');
    assert.deepEqual(parsed.fields, ['Rótulo', 'Descripción']);
    assert.equal(parsed.rows[0]['Rótulo'], 'R-1');
  });

  it('detecta CSV separado por coma y recupera texto Windows-1252', async () => {
    const text = 'Rótulo,Descripción\nR-2,Silla';
    const bytes = Uint8Array.from([...text].map(char => char.codePointAt(0)));
    const file = {
      name: 'latin.csv', type: 'text/csv', size: bytes.byteLength,
      arrayBuffer: async () => bytes.buffer
    };
    const parsed = await parsearArchivoCSVBienes(file);
    assert.equal(parsed.encoding, 'Windows-1252');
    assert.equal(parsed.delimiter, ',');
    assert.equal(parsed.rows[0].Descripción, 'Silla');
  });

  it('rechaza archivos por encima del límite antes de leerlos', async () => {
    const file = {
      name: 'grande.csv', type: 'text/csv', size: MAX_CSV_BIENES_BYTES + 1,
      arrayBuffer: async () => { throw new Error('No debería leerse el archivo.'); }
    };
    await assert.rejects(parsearArchivoCSVBienes(file), /25 MB/);
  });
});
