import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { analizarSaludDatos } from '../src/utils/saludDatos.js';

describe('revisión de salud de datos', () => {
  it('presenta 20 verificaciones de solo lectura', () => {
    const resultado = analizarSaludDatos({ hoy: new Date('2026-11-13T12:00:00Z') });
    assert.equal(resultado.length, 20);
    assert.ok(resultado.every((r) => r.count === 0 && Array.isArray(r.detalle)));
  });

  it('encuentra duplicados por rótulo y documento, sin confundir personas homónimas con mismo CI', () => {
    const resultado = analizarSaludDatos({
      bienes: [
        { id: 'b1', rotulo: ' A-10 ', dependencia: 'Rectorado' },
        { id: 'b2', rotulo: 'a-10', dependencia: ' rectorado ' },
      ],
      funcionariosPadron: [
        { id: 'f1', nombre: 'Ana Pérez', cedula: '123' },
        { id: 'f2', nombre: 'Ana Pérez', cedula: '456' },
        { id: 'f3', nombre: 'Otra persona', cedula: '123' },
      ],
    });
    assert.equal(resultado.find((r) => r.id === 'dup').count, 1);
    assert.equal(resultado.find((r) => r.id === 'dupfunc').count, 1);
    assert.equal(resultado.find((r) => r.id === 'dupnombre').count, 1);
  });

  it('detecta formularios huérfanos, fecha inválida y futura, monto negativo y componentes incompletos', () => {
    const resultado = analizarSaludDatos({
      hoy: new Date('2026-11-13T12:00:00Z'),
      bienes: [
        { id: 'b1', fechaAdquisicion: '31/02/2024', valorUnitario: '-100', componentes: [{ nombre: 'Mesa', cantidad: 0 }] },
        { id: 'b2', fechaAdquisicion: '2027-01-01', valorUnitario: 'Gs. 12.000' },
      ],
      fc10List: [{ id: 'a1', bienId: 'desconocido' }],
      fc11List: [{ id: 't1', bien_id: 'desconocido' }],
    });
    const count = (id) => resultado.find((r) => r.id === id).count;
    assert.equal(count('fc10'), 1);
    assert.equal(count('fc11'), 1);
    assert.equal(count('fechaInvalida'), 1);
    assert.equal(count('fechaFutura'), 1);
    assert.equal(count('montoInvalido'), 1);
    assert.equal(count('componentes'), 1);
  });

  it('acepta fechas ISO con hora y valores monetarios locales', () => {
    const resultado = analizarSaludDatos({
      hoy: new Date('2026-11-13T12:00:00Z'),
      bienes: [{ id: 'b1', fechaAdquisicion: '2024-03-20T10:30:00.000Z', valorUnitario: '1.250.000 Gs.' }],
    });
    assert.equal(resultado.find((r) => r.id === 'fechaInvalida').count, 0);
    assert.equal(resultado.find((r) => r.id === 'fechaFutura').count, 0);
    assert.equal(resultado.find((r) => r.id === 'montoInvalido').count, 0);
  });
});
