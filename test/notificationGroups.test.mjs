import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { agruparNotificacionesPorDia } from '../src/utils/notificationGroups.js';

describe('agruparNotificacionesPorDia', () => {
  it('agrupa por fecha local y conserva el orden de las notificaciones', () => {
    const ahora = new Date(2026, 4, 5, 12);
    const hoy = new Date(2026, 4, 5, 9).toISOString();
    const ayer = new Date(2026, 4, 4, 9).toISOString();
    const grupos = agruparNotificacionesPorDia([
      { id: '1', fecha: hoy },
      { id: '2', fecha: hoy },
      { id: '3', fecha: ayer }
    ], ahora);

    assert.deepEqual(grupos.map((grupo) => [grupo.etiqueta, grupo.notificaciones.map((n) => n.id)]), [
      ['Hoy', ['1', '2']],
      ['Ayer', ['3']]
    ]);
  });

  it('coloca fechas inválidas en un grupo identificado', () => {
    const grupos = agruparNotificacionesPorDia([{ id: 'sin-fecha', fecha: 'no-es-fecha' }], new Date(2026, 0, 1));
    assert.equal(grupos[0].etiqueta, 'Sin fecha');
    assert.equal(grupos[0].notificaciones[0].id, 'sin-fecha');
  });

  it('interpreta YYYY-MM-DD como una fecha local sin moverla al día anterior', () => {
    const ahora = new Date(2026, 4, 5, 12);
    const grupos = agruparNotificacionesPorDia([{ id: 'local', fecha: '2026-05-05' }], ahora);
    assert.equal(grupos[0].etiqueta, 'Hoy');
  });
});
