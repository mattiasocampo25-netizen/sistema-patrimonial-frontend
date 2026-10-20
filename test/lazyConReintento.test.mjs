import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { cargarConReintento } from '../src/utils/lazyConReintento.js';

// Regresión: el flag 'chunk_reintentado' se borraba en cada montaje de la app,
// así que un chunk que fallaba (404 tras un deploy) provocaba un bucle de
// recarga infinito: montar -> borrar flag -> fallar -> recargar -> montar...

describe('lazyConReintento', () => {
  let recargas;
  let storage;

  beforeEach(() => {
    recargas = 0;
    storage = new Map();
    globalThis.sessionStorage = {
      getItem: (k) => (storage.has(k) ? storage.get(k) : null),
      setItem: (k, v) => storage.set(k, String(v)),
      removeItem: (k) => storage.delete(k),
      clear: () => storage.clear()
    };
    globalThis.window = {
      location: {
        reload: () => {
          recargas++;
        }
      }
    };
  });

  afterEach(() => {
    delete globalThis.sessionStorage;
    delete globalThis.window;
  });

  it('deja pasar el modulo cuando la carga funciona', async () => {
    const mod = await cargarConReintento(async () => ({ default: 'ok' }));
    assert.equal(mod.default, 'ok');
    assert.equal(recargas, 0);
  });

  it('reloads una sola vez cuando el chunk falla', async () => {
    const falla = async () => {
      throw new Error('chunk 404');
    };

    await assert.rejects(() => cargarConReintento(falla), /chunk 404/);
    assert.equal(recargas, 1, 'debe recargar una vez');
    assert.ok(storage.get('chunk_reintentado'), 'debe marcar el reintento');
  });

  it('NO vuelve a recargar si ya se reintento en esta sesion', async () => {
    // Simula el estado tras una recarga: el flag sigue puesto.
    storage.set('chunk_reintentado', String(Date.now()));

    const falla = async () => {
      throw new Error('chunk 404');
    };

    await assert.rejects(() => cargarConReintento(falla), /chunk 404/);
    assert.equal(recargas, 0, 'no debe recargar otra vez (seria un bucle)');
  });

  it('no entra en bucle tras varios intentos seguidos', async () => {
    const falla = async () => {
      throw new Error('chunk 404');
    };

    // Primer fallo: recarga y deja el flag puesto.
    await assert.rejects(() => cargarConReintento(falla));
    assert.equal(recargas, 1);

    // La app se recarga -> vuelve a montar -> el chunk vuelve a fallar.
    // Ahora el flag sigue en sessionStorage, asi que NO debe recargar.
    for (let i = 0; i < 5; i++) {
      await assert.rejects(() => cargarConReintento(falla));
    }

    assert.equal(recargas, 1, 'el total de recargas debe seguir siendo 1');
  });
});
