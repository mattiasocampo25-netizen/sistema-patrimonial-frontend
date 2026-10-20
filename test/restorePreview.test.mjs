import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  analizarRespaldo, previsualizarRestauracion, normalizarFilaActual,
  TABLAS_RESTORABLES
} from '../src/services/restore.js';

// Regresión: el preview de restauración comparaba la fila actual de la base
// (que se traía SOLO con la clave primaria) contra la fila completa del
// archivo. Nunca coincidían, así que TODAS las filas existentes se
// reportaban como "actualizadas" y el preview no decía nada útil.

const defBienes = TABLAS_RESTORABLES.find(t => t.clave === 'bienes');
const defUsuarios = TABLAS_RESTORABLES.find(t => t.clave === 'usuarios');

test('normalizarFilaActual deja la fila de la base en el mismo formato que la del archivo', () => {
  // Fila de la BD: { id, data: {...} } (tabla JSONB)
  const filaBD = { id: 'b1', data: { id: 'b1', rotulo: '1045', ubicacion: 'Aula 1' } };
  const norm = normalizarFilaActual(filaBD, defBienes);

  assert.equal(norm.id, 'b1');
  assert.equal(norm.rotulo, '1045');
  assert.equal(norm.ubicacion, 'Aula 1');
  assert.equal(typeof norm.id, 'string', 'la clave primaria se normaliza a texto');
});

test('normalizarFilaActual descarta la contraseña de usuarios', () => {
  const norm = normalizarFilaActual(
    { username: 'admin', nombre: 'Admin', cargo: 'admin', password: 'secreto' },
    defUsuarios
  );
  assert.equal(norm.password, undefined);
  assert.equal(norm.username, 'admin');
});

test('el preview distingue sin cambio, cambio y fila nueva', () => {
  const archivo = {
    metadata: {
      version: '2.2',
      sistema: 'Sistema de Gestión Patrimonial UNP',
      fechaGeneracion: '2026-01-01',
      totalBienes: 2
    },
    bienes: [
      { id: 'b1', data: { id: 'b1', rotulo: '1045', ubicacion: 'Aula 1' } },
      { id: 'b2', data: { id: 'b2', rotulo: '1046', ubicacion: 'Aula MODIFICADA' } }
    ]
  };

  const analizado = analizarRespaldo(archivo);
  assert.equal(analizado.ok, true);

  // Estado actual de la base:
  //  - b1 idéntico  -> sin cambio
  //  - b2 distinto  -> actualizado
  //  - b3 no está en el archivo -> no cuenta (se calcula aparte)
  const existentes = {
    bienes: [
      normalizarFilaActual({ id: 'b1', data: { id: 'b1', rotulo: '1045', ubicacion: 'Aula 1' } }, defBienes),
      normalizarFilaActual({ id: 'b2', data: { id: 'b2', rotulo: '1046', ubicacion: 'Aula 2' } }, defBienes)
    ]
  };

  const p = previsualizarRestauracion(analizado.tablas, existentes);
  const b = p.bienes;

  assert.equal(b.entrantes, 2);
  assert.equal(b.sinCambio, 1, 'b1 es idéntico: debe contar como sin cambio');
  assert.equal(b.actualizadas, 1, 'solo b2 cambió');
  assert.equal(b.nuevas, 0);
  assert.equal(b.hayCambios, true);
  assert.equal(b.cambios.length, 1);
  assert.deepEqual(b.cambios[0].campos, ['ubicacion']);
});

test('el preview con un backup idéntico no reporta cambios', () => {
  const archivo = {
    metadata: {
      version: '2.2',
      sistema: 'Sistema de Gestión Patrimonial UNP',
      fechaGeneracion: '2026-01-01',
      totalBienes: 1
    },
    bienes: [{ id: 'b1', data: { id: 'b1', rotulo: '1045', ubicacion: 'Aula 1' } }]
  };

  const analizado = analizarRespaldo(archivo);
  const existentes = {
    bienes: [
      normalizarFilaActual({ id: 'b1', data: { id: 'b1', rotulo: '1045', ubicacion: 'Aula 1' } }, defBienes)
    ]
  };

  const p = previsualizarRestauracion(analizado.tablas, existentes);

  assert.equal(p.bienes.sinCambio, 1);
  assert.equal(p.bienes.actualizadas, 0, 'un backup idéntico no debe marcar nada como actualizado');
  assert.equal(p.bienes.hayCambios, false);
});
