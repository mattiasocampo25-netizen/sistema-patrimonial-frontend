import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Version del sistema.
//
// La version que ve el usuario sale de `app_config.ultima_version` (la base),
// que es la que publica `npm run aviso:cerrar -- --version X`. Esa constante
// se sincroniza sola con los `package.json` de los dos repositorios y con
// `APP_VERSION` del frontend.
//
// Estas pruebas son el guard: cuando la version se subia a mano en un solo
// lado, la app mostraba "v2.11.0" en el pie y en la ayuda mientras el
// changelog decia "v2.13.0".
//
// El archivo se lee como texto (y no se importa) para no depender de que
// `helpers.js` sea importable fuera de Vite.

const RAIZ = path.resolve(import.meta.dirname, '..');
const leerTexto = (rel) => fs.readFileSync(path.join(RAIZ, rel), 'utf8');
const leerPkg = (rel) => JSON.parse(leerTexto(rel));

const versionDeHelpers = () => {
  const m = leerTexto('src/utils/helpers.js').match(/export const APP_VERSION = '([^']*)';/);
  assert.ok(m, 'no se encontro "export const APP_VERSION" en src/utils/helpers.js');
  return m[1];
};

describe('version del sistema', () => {
  it('APP_VERSION coincide con la version de frontend/package.json', () => {
    const pkg = leerPkg('package.json');
    assert.equal(
      versionDeHelpers(),
      pkg.version,
      'APP_VERSION y package.json estan desincronizados. ' +
      'Se actualizan con: npm run aviso:cerrar -- --mensaje "..." --mejoras "..." --version X'
    );
  });

  it('la version tiene forma de version semantica', () => {
    const v = leerPkg('package.json').version;
    assert.match(v, /^\d+\.\d+\.\d+$/, 'la version deberia ser X.Y.Z, no "' + v + '"');
  });

  it('ningun archivo del frontend vuelve a traer la version en un literal suelto', () => {
    // Busca "v2.x.y" escrito a mano fuera de helpers.js: esas son las que se
    // desincronizan sin que nadie se entere.
    const carpeta = path.join(RAIZ, 'src');
    const recorrer = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) return recorrer(p);
      return /\.(jsx?|css)$/.test(e.name) ? [p] : [];
    });
    const sueltos = [];
    for (const archivo of recorrer(carpeta)) {
      if (archivo.endsWith(path.join('utils', 'helpers.js'))) continue;
      const texto = fs.readFileSync(archivo, 'utf8');
      const m = texto.match(/v\d+\.\d+\.\d+/g);
      if (m) sueltos.push(path.relative(RAIZ, archivo) + ': ' + [...new Set(m)].join(', '));
    }
    assert.deepEqual(sueltos, [], 'hay versiones escritas a mano; usá la prop "version" o APP_VERSION');
  });
});
