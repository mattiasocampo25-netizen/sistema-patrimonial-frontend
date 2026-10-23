import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mapearFilasBienes } from '../src/utils/csvBienes.js';

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
  });
});
