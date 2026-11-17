import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escaparFiltroPostgrest, rolDesdeCargo, rolEsPrivilegiado } from '../src/utils/postgrest.js';

test('escaparFiltroPostgrest entrecomilla y escapa comillas', () => {
  assert.equal(escaparFiltroPostgrest('Rectorado'), '"Rectorado"');
  assert.equal(escaparFiltroPostgrest('a"b'), '"a\\"b"');
  assert.equal(escaparFiltroPostgrest('Fac. de Derecho'), '"Fac. de Derecho"');
});

test('rolDesdeCargo mapea cargos conocidos', () => {
  assert.equal(rolDesdeCargo('admin'), 'admin');
  assert.equal(rolDesdeCargo('desarrollador'), 'dev');
  assert.equal(rolDesdeCargo('funcionario'), 'user');
  assert.equal(rolDesdeCargo('Administrador'), 'admin');
  assert.equal(rolDesdeCargo('ADMINISTRADOR GENERAL'), 'admin');
  assert.equal(rolDesdeCargo('Desarrollador del sistema'), 'dev');
  assert.equal(rolDesdeCargo('Funcionario Local'), 'user');
  assert.equal(rolDesdeCargo('user'), 'user');
});

test('rolEsPrivilegiado cubre admin y desarrollador', () => {
  assert.equal(rolEsPrivilegiado('dev'), true);
  assert.equal(rolEsPrivilegiado('admin'), true);
  assert.equal(rolEsPrivilegiado('Administrador'), true);
  assert.equal(rolEsPrivilegiado('Desarrollador del sistema'), true);
  assert.equal(rolEsPrivilegiado('user'), false);
});
