import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coincideBienOPieza, piezasCoincidentes } from '../src/utils/componentesInventario.js';

test('encuentra piezas por ubicación o responsable y conserva herencia del bien', () => {
  const bien = { ubicacion: 'TIC', funcionario: 'Ana', componentes: [{ nombre: 'Mesa', ubicacion: 'Académica', funcionario: 'Luis' }, { nombre: 'Silla' }] };
  assert.equal(coincideBienOPieza(bien, 'ubicacion', 'academica'), true);
  assert.deepEqual(piezasCoincidentes(bien, 'ubicacion', 'TIC').map(p => p.nombre), ['Silla']);
  assert.deepEqual(piezasCoincidentes(bien, 'funcionario', 'Luis').map(p => p.nombre), ['Mesa']);
  assert.equal(coincideBienOPieza(bien, 'ubicacion', 'Biblioteca'), false);
});
