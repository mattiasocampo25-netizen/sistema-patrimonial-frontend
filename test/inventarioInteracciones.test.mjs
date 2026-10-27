import test from 'node:test';
import assert from 'node:assert/strict';
import { aplicarSeleccionRango, construirLinkInventario, detectarBienesSimilares, idsEntre } from '../src/utils/inventarioInteracciones.js';

test('el link compartido abre inventario y conserva filtros y fragmento', () => {
  const enlace = construirLinkInventario('https://ejemplo.test/app?q=notebook&estado=Bueno#inventario');
  const url = new URL(enlace);
  assert.equal(url.searchParams.get('tab'), 'inventario');
  assert.equal(url.searchParams.get('q'), 'notebook');
  assert.equal(url.searchParams.get('estado'), 'Bueno');
  assert.equal(url.hash, '#inventario');
  assert.equal(construirLinkInventario('no es una url'), '');
});

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
