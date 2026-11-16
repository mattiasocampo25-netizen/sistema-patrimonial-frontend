import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agruparAnuncios, seleccionarNotificacionesPurgables } from '../src/utils/anuncios.js';

test('los anuncios directos y globales nunca se eliminan por retención automática', () => {
  const corte = Date.parse('2026-11-16T00:00:00.000Z');
  const viejos = [
    { id: 'directo', accion: 'anuncio', usuarioDestino: 'maria', leido: true, fecha: '2026-01-01T00:00:00.000Z' },
    { id: 'global', accion: 'anuncio', usuarioDestino: 'TODOS', leidos: ['a', 'b'], totalDest: 2, fecha: '2026-01-01T00:00:00.000Z' },
    { id: 'notif', tipoRegistro: 'NOTIFICACION', usuarioDestino: 'maria', leido: true, fecha: '2026-01-01T00:00:00.000Z' },
    { id: 'pendiente', tipo: 'BAJA_BIEN', estado: 'PENDIENTE', leido: true, fecha: '2026-01-01T00:00:00.000Z' }
  ];
  assert.deepEqual(seleccionarNotificacionesPurgables(viejos, corte).map(fila => fila.id), ['notif']);
});

test('el historial cuenta como leído un anuncio dirigido de una fila', () => {
  const [anuncio] = agruparAnuncios([
    { id: '1', grupo: 'g1', accion: 'anuncio', usuarioDestino: 'maria', alcance: 'maria', totalDest: 1, leidos: [], leido: true, fecha: '2026-11-16T00:00:00.000Z' }
  ]);
  assert.equal(anuncio.total, 1);
  assert.equal(anuncio.leidos, 1);
});

test('el historial combina la consulta de archivo y la notificación local sin duplicar', () => {
  const filas = [
    { id: '1', grupo: 'g1', accion: 'anuncio', usuarioDestino: 'TODOS', alcance: 'TODOS', totalDest: 3, leidos: ['a'], fecha: '2026-11-16T00:00:00.000Z' },
    { id: '1', grupo: 'g1', accion: 'anuncio', usuarioDestino: 'TODOS', alcance: 'TODOS', totalDest: 3, leidos: ['a'], fecha: '2026-11-16T00:00:00.000Z' }
  ];
  const agrupados = agruparAnuncios(filas);
  assert.equal(agrupados.length, 1);
  assert.equal(agrupados[0].total, 3);
  assert.equal(agrupados[0].leidos, 1);
});
