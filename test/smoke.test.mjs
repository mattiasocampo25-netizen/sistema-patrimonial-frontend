import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Smoke test de render: ejecuta el cuerpo de App (todos los hooks en orden)
// vía SSR. Efectos no corren, pero los ReferenceError/TDZ de render sí
// explotan aquí. Este test habría evitado la pantalla blanca de producción.
describe('smoke de render', () => {
  let server;

  before(async () => {
    // Stubs mínimos de navegador para el render
    const storage = () => {
      const m = new Map();
      return {
        getItem: (k) => (m.has(k) ? m.get(k) : null),
        setItem: (k, v) => m.set(k, String(v)),
        removeItem: (k) => m.delete(k),
        clear: () => m.clear()
      };
    };
    globalThis.localStorage = storage();
    globalThis.sessionStorage = storage();
    Object.defineProperty(globalThis, 'navigator', {
      value: { onLine: true },
      configurable: true,
      writable: true
    });
    globalThis.window = {
      location: { search: '', origin: 'http://localhost:5173' },
      addEventListener: () => {},
      removeEventListener: () => {}
    };

    const { createServer } = await import('vite');
    const { fileURLToPath } = await import('node:url');
    const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
    server = await createServer({
      root,
      logLevel: 'silent',
      server: { middlewareMode: true },
      define: {
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('http://localhost:54321'),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('test-anon-key')
      }
    });
  });

  after(async () => {
    if (server) await server.close();
  });

  it('App renderiza sin ReferenceError', async () => {
    const { default: App } = await server.ssrLoadModule('/src/App.jsx');
    const React = (await import('react')).default;
    const { renderToString } = await import('react-dom/server');
    let html = '';
    assert.doesNotThrow(() => {
      html = renderToString(React.createElement(App));
    }, 'el render no debe lanzar');
    // El texto real es "Iniciar sesión": la 's' va en minúscula y la 'ó'
    // lleva tilde, así que se busca un fragmento sin caracteres acentuados
    // para que la aserción no dependa de mayúsculas ni de codificación.
    assert.ok(html.includes('Iniciar sesi'), 'muestra el login (sin sesion)');
  });

  it('no borra la bandera de reintento de chunks', async () => {
    // Regresión: App.jsx limpiaba 'chunk_reintentado' en cada montaje. Con eso,
    // un chunk que fallaba (404 tras un deploy) entraba en bucle de recarga
    // infinito: montar -> borrar flag -> fallar -> recargar -> montar -> ...
    //
    // No se puede comprobar con el render de SSR porque renderToString NO
    // ejecuta los useEffect, así que el borrado nunca ocurría durante el test.
    // Por eso se verifica sobre el código fuente: ningún archivo de src/ puede
    // limpiar esa bandera, que debe durar toda la sesión de la pestaña.
    const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
    const src = path.join(raiz, 'src');

    const recorrer = (dir) => {
      const out = [];
      for (const entrada of readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entrada.name);
        if (entrada.isDirectory()) out.push(...recorrer(p));
        else if (/\.(js|jsx)$/.test(entrada.name)) out.push(p);
      }
      return out;
    };

    const ofensores = [];
    for (const archivo of recorrer(src)) {
      const contenido = readFileSync(archivo, 'utf8');
      if (/removeItem\(\s*['"`]chunk_reintentado/.test(contenido)) {
        ofensores.push(path.relative(raiz, archivo));
      }
    }

    assert.deepEqual(
      ofensores,
      [],
      'ningún archivo puede borrar la bandera chunk_reintentado: eso reinicia el reintento y produce un bucle de recarga infinito'
    );
  });
});
