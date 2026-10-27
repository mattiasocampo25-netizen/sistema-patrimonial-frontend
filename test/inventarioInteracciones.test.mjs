import test from 'node:test';
import assert from 'node:assert/strict';
import { aplicarSeleccionRango, detectarBienesSimilares, idsEntre } from '../src/utils/inventarioInteracciones.js';

test('idsEntre obtiene un rango inclusivo en ambas direcciones', () => {
  assert.deepEqual(idsEntre(['a', 'b', 'c', 'd'], 'b', 'd'), ['b', 'c', 'd']);
  assert.deepEqual(idsEntre(['a', 'b', 'c', 'd'], 'd', 'b'), ['b', 'c', 'd']);
});

test('aplicarSeleccionRango suma o quita todo el rango sin duplicar', () => {
  assert.deepEqual(aplicarSeleccionRango(['a'], ['b', 'c'], true), ['a', 'b', 'c']);
  assert.deepEqual(aplicarSeleccionRango(['a', 'b', 'c'], ['b', 'c'], false), ['a']);
});

test('detectarBienesSimilares alerta por descripción exacta y excluye el registro editado', () => {
  const bienes = [{ id: '1', rotulo: 'B-1', descripcion: 'Notebook Lenovo ThinkPad', dependencia: 'Rectorado' }];
  assert.equal(detectarBienesSimilares({ descripcion: 'notebook lenovo thinkpad' }, bienes).length, 1);
  assert.equal(detectarBienesSimilares({ descripcion: 'notebook lenovo thinkpad' }, bienes, '1').length, 0);
  assert.deepEqual(detectarBienesSimilares({ descripcion: 'Mesa' }, bienes), []);
});
