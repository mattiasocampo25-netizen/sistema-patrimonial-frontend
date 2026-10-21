/**
 * frontend/test/harness/dom.js
 * ============================================================================
 * Monta un DOM de jsdom con las APIs de navegador que la app necesita, para
 * poder renderizarla y probar sus acciones de verdad (no solo que no tire).
 *
 * Lo que se emula:
 *   - document / window / Element / HTMLElement / Node / Event / MouseEvent
 *   - localStorage / sessionStorage
 *   - matchMedia (el tema oscuro lo consulta)
 *   - IntersectionObserver / ResizeObserver (las tablas y el scroll)
 *   - crypto.randomUUID (los ids de las filas)
 *   - fetch (para que el cliente de Supabase no salga a internet)
 *   - IndexedDB (localforage) via fake-indexeddb
 * ============================================================================
 */
import { JSDOM } from 'jsdom';
import 'fake-indexeddb/auto';

let instalado = false;

/** Instala el DOM de jsdom como global. Idempotente. */
export function instalarDom({ url = 'http://localhost:5173/', fetchConfig = {} } = {}) {
  if (instalado) {
    if (fetchConfig.datos || fetchConfig.usuario) {
      globalThis.fetch = crearFetchFalso(fetchConfig);
      globalThis.window.fetch = globalThis.fetch;
    }
    return globalThis.window;
  }
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>', {
    url,
    pretendToBeVisual: true
  });

  const w = dom.window;

  // --- APIs basicas ---
  // En Node 24, algunos globales (navigator, location, crypto) son solo
  // getters: la asignacion directa tira. Por eso todo pasa por
  // definirGlobal(), que usa defineProperty como respaldo.
  const definirGlobal = (nombre, valor) => {
    try {
      globalThis[nombre] = valor;
    } catch {
      Object.defineProperty(globalThis, nombre, { value: valor, configurable: true, writable: true });
    }
  };

  definirGlobal('window', w);
  definirGlobal('document', w.document);
  definirGlobal('navigator', w.navigator);
  definirGlobal('location', w.location);
  definirGlobal('history', w.history);
  definirGlobal('self', w);
  definirGlobal('HTMLElement', w.HTMLElement);
  definirGlobal('HTMLInputElement', w.HTMLInputElement);
  definirGlobal('HTMLSelectElement', w.HTMLSelectElement);
  definirGlobal('HTMLButtonElement', w.HTMLButtonElement);
  definirGlobal('Element', w.Element);
  definirGlobal('Node', w.Node);
  definirGlobal('NodeFilter', w.NodeFilter);
  definirGlobal('Event', w.Event);
  definirGlobal('CustomEvent', w.CustomEvent);
  definirGlobal('MouseEvent', w.MouseEvent);
  definirGlobal('KeyboardEvent', w.KeyboardEvent);
  definirGlobal('getComputedStyle', w.getComputedStyle.bind(w));
  definirGlobal('requestAnimationFrame', w.requestAnimationFrame
    ? w.requestAnimationFrame.bind(w)
    : (cb) => setTimeout(() => cb(Date.now()), 16));
  definirGlobal('cancelAnimationFrame', w.cancelAnimationFrame ? w.cancelAnimationFrame.bind(w) : clearTimeout);
  definirGlobal('localStorage', w.localStorage);
  definirGlobal('sessionStorage', w.sessionStorage);
  definirGlobal('DOMParser', w.DOMParser);
  definirGlobal('FormData', w.FormData);
  definirGlobal('Blob', w.Blob);
  definirGlobal('FileReader', w.FileReader);
  definirGlobal('URL', w.URL);
  definirGlobal('CSS', w.CSS);

  // --- matchMedia: la app consulta prefers-color-scheme y (prefers-reduced-motion)
  if (!w.matchMedia) {
    w.matchMedia = (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() { return false; }
    });
  }
  globalThis.matchMedia = w.matchMedia.bind(w);

  // --- Observadores que jsdom no trae ---
  class ObservadorFalso {
    constructor(cb) { this.cb = cb; }
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  }
  globalThis.IntersectionObserver = w.IntersectionObserver || ObservadorFalso;
  globalThis.ResizeObserver = w.ResizeObserver || ObservadorFalso;
  globalThis.MutationObserver = w.MutationObserver || ObservadorFalso;

  // --- crypto.randomUUID (los ids de las filas nuevas) ---
  if (!globalThis.crypto) {
    Object.defineProperty(globalThis, 'crypto', { value: {}, configurable: true, writable: true });
  }
  if (!globalThis.crypto.randomUUID) {
    let n = 0;
    globalThis.crypto.randomUUID = () => {
      n += 1;
      const hex = (i) => i.toString(16).padStart(2, '0');
      const s = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (n * 2654435761) % 16;
        n++;
        return hex(c === 'x' ? r : ((r & 0x3) | 0x8));
      });
      return s;
    };
  }

  // --- fetch: la app habla con Supabase; aca no sale a internet ---
  globalThis.fetch = crearFetchFalso(fetchConfig);
  w.fetch = globalThis.fetch;

  // --- WebSocket: el cliente realtime de Supabase intenta abrirlo. jsdom no
  //     lo trae, y el bucle de reconexion satura el event loop (los timers
  //     dejan de respectar su duracion y los tests tardan minutos).
  //     Node 24 ya trae un WebSocket nativo (undici) que ademas revienta con
  //     eventos de otra realm, asi que hay que IMPONER el stub.
  class WebSocketFalso {
    constructor(url) { this.url = url; this.readyState = 0; this.onopen = null; this.onclose = null; this.onerror = null; this.onmessage = null; }
    send() {}
    close() { this.readyState = 3; if (this.onclose) this.onclose({}); }
    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() { return true; }
  }
  try {
    Object.defineProperty(globalThis, 'WebSocket', { value: WebSocketFalso, configurable: true, writable: true });
  } catch { /* ignore */ }
  try {
    Object.defineProperty(w, 'WebSocket', { value: WebSocketFalso, configurable: true, writable: true });
  } catch { /* ignore */ }

  // --- scrollTo / scrollIntoView: no existen en jsdom ---
  if (w.Element.prototype.scrollIntoView === undefined) {
    w.Element.prototype.scrollIntoView = function () {};
  }
  if (w.scrollTo === undefined) w.scrollTo = () => {};

  instalado = true;
  return w;
}

/**
 * fetch falso: responde a las consultas de PostgREST, a las RPC y a Supabase
 * Auth con respuestas vacías pero con la forma correcta, para que la app
 * no entre en estado de error.
 *
 * `config.datos` permite responder con filas reales por tabla (se usa para
 * simular el perfil del usuario y el contenido de cada módulo).
 */
function crearFetchFalso(config = {}) {
  const llamadas = [];
  const datos = config.datos || {};

  const f = async (url, opciones = {}) => {
    const u = String(url);
    llamadas.push({ url: u, metodo: (opciones.method || 'GET').toUpperCase() });

    const json = (cuerpo, status = 200, headers = {}) => new Response(cuerpo, {
      status,
      headers: { 'Content-Type': 'application/json', 'Content-Range': '0-0/0', ...headers }
    });

    // --- Sesion de Supabase Auth ---
    if (u.includes('/auth/v1/user')) {
      const u2 = config.usuario || {};
      return json(JSON.stringify({
        id: u2.id || '00000000-0000-0000-0000-000000000000',
        aud: 'authenticated',
        role: 'authenticated',
        email: u2.email || 'admin@unp.edu.py',
        user_metadata: u2.user_metadata || {}
      }));
    }
    if (u.includes('/auth/v1/token')) {
      return json(JSON.stringify({ error: 'invalid_grant' }), 400);
    }
    if (u.includes('/auth/v1/')) return json('{}');

    // --- RPC ---
    if (u.includes('/rest/v1/rpc/')) {
      const nombre = u.split('/rest/v1/rpc/')[1].split('?')[0];
      if (datos[nombre] !== undefined) return json(JSON.stringify(datos[nombre]));
      return json('null');
    }

    // --- Tablas (PostgREST) ---
    if (u.includes('/rest/v1/')) {
      const tabla = u.split('/rest/v1/')[1].split('?')[0];
      const filas = datos[tabla] !== undefined ? datos[tabla] : [];
      const total = Array.isArray(filas) ? filas.length : 0;
      return json(JSON.stringify(filas), 200, { 'Content-Range': '0-' + Math.max(0, total - 1) + '/' + total });
    }

    return json('{}');
  };
  f.__llamadas = llamadas;
  return f;
}

/** Espera a que React termine los efectos y las microtareas pendientes. */
export async function settle(ms = 60) {
  await new Promise((r) => setTimeout(r, ms));
}
