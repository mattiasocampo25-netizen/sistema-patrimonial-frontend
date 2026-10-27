import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { crearEventosAgenda, fechaAgenda } from '../src/utils/agenda.js';

describe('agenda patrimonial', () => {
  it('deriva altas, asignaciones y fechas estimadas de vida útil', () => {
    const eventos = crearEventosAgenda(
      [{ id: 'bien-1', rotulo: 'A-1', dependencia: 'Rectorado', fechaAdquisicion: '2020-02-28', vidaUtil: '5', descripcion: 'Notebook' }],
      [{ id: 'fc10-1', bienId: 'bien-1', dependencia: 'Rectorado', entregadoFecha: '2024-03-10', bienRotulo: 'A-1', funcionario: 'Ana' }],
      'Rectorado'
    );

    assert.deepEqual(eventos.map(({ fecha, tipo }) => [fecha, tipo]), [
      ['2020-02-28', 'inventario'],
      ['2024-03-10', 'asignacion'],
      ['2025-02-28', 'vencimiento']
    ]);
    assert.match(eventos[1].detalle, /Ana/);
  });

  it('filtra por dependencia y descarta fechas inválidas', () => {
    const eventos = crearEventosAgenda([
      { id: '1', dependencia: 'Rectorado', fechaAdquisicion: '2024-01-10' },
      { id: '2', dependencia: 'Humanidades', fechaAdquisicion: '2024-01-11' },
      { id: '3', dependencia: 'Rectorado', fechaAdquisicion: '2024-02-31' }
    ], [], 'Rectorado');

    assert.equal(eventos.length, 1);
    assert.equal(eventos[0].rotulo, 'Bien sin rótulo');
    assert.equal(fechaAgenda('2024-02-31'), null);
  });
});
