/**
 * Prueba de humo del harness: monta la app en jsdom y navega.
 * Sirve de red de seguridad para el resto de los smoke tests.
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { montarApp, arrancarVite, cerrarVite } from './harness/app.js';

describe('harness de la app', () => {
  let app = null;

  before(async () => {
    await arrancarVite();
  });

  after(async () => {
    if (app) await app.desmontar();
    await cerrarVite();
  });

  test('monta la app y muestra el login sin sesion', async () => {
    app = await montarApp({ usuario: null });
    const txt = app.texto();
    assert.ok(txt.length > 0, 'la app deberia renderizar algo');
    assert.ok(
      /iniciar sesi|usuario|contrase/i.test(txt),
      'sin sesion deberia mostrar el login. Texto: ' + txt.slice(0, 200)
    );
  });

  test('con sesion de administrador entra al panel', async () => {
    await app.desmontar();
    app = await montarApp({
      usuario: {
        username: 'admin',
        nombre: 'Administrador',
        cargo: 'admin',
        role: 'admin',
        dependencia: 'Rectorado'
      }
    });
    const ok = await app.esperar('panel', 3000);
    assert.ok(ok, 'deberia entrar al panel. Texto: ' + app.texto().slice(0, 300));
  });

  test('el sidebar tiene los destinos de su rol', async () => {
    // Un administrador ve los 11 destinos de operacion, documentos y
    // administracion. "Anuncios" es solo del desarrollador, asi que no debe
    // aparecer para un admin.
    const deAdmin = ['nav-dashboard', 'nav-resumen', 'nav-inventario', 'nav-funcionarios',
      'nav-fc04', 'nav-fc10', 'nav-fc11', 'nav-aprobaciones', 'nav-auditoria',
      'nav-usuarios', 'nav-ayuda'];
    for (const t of deAdmin) {
      assert.ok(
        app.contenedor.querySelector(`[data-tour="${t}"]`),
        'falta el destino ' + t
      );
    }
    assert.equal(
      app.contenedor.querySelector('[data-tour="nav-anuncios"]'),
      null,
      'anuncios es solo del desarrollador'
    );
  });

  test('el desarrollador ademas ve anuncios', async () => {
    await app.desmontar();
    app = await montarApp({
      usuario: {
        username: 'mocampo',
        nombre: 'Desarrollador',
        cargo: 'desarrollador',
        role: 'dev',
        dependencia: 'Rectorado'
      }
    });
    await app.esperar('panel', 3000);
    assert.ok(
      app.contenedor.querySelector('[data-tour="nav-anuncios"]'),
      'el desarrollador debe ver anuncios'
    );
  });
});
