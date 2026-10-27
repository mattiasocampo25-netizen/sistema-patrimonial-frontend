import test from 'node:test';
import assert from 'node:assert/strict';
import { camposIncompletos } from '../src/utils/dataCompleteness.js';

test('camposIncompletos identifica datos esenciales ausentes y en blanco', () => {
  assert.deepEqual(camposIncompletos({ rotulo: 'A-01', descripcion: 'Mesa', cuenta: '11', fechaAdquisicion: '', funcionario: null }), [
    'Fecha de adquisición', 'Responsable', 'Ubicación',
  ]);
});

test('camposIncompletos devuelve lista vacía para un bien completo o inexistente', () => {
  assert.deepEqual(camposIncompletos({ rotulo: 'A-01', descripcion: 'Mesa', cuenta: '11', fechaAdquisicion: '2025-01-02', funcionario: 'Ana', ubicacion: 'Sala 1' }), []);
  assert.deepEqual(camposIncompletos(null), []);
});
