/**
 * frontend/test/harness/app.js
 * ============================================================================
 * Arranca la app real dentro del DOM de jsdom y da utilidades para
 * navegar y ejecutar acciones, que es lo que hacen los smoke tests por módulo.
 *
 * La app NO se modifica ni se mockea módulo por módulo: se renderiza tal
 * cual, con el cliente de Supabase hablando contra un fetch falso. Asi el test
 * detecta regresiones reales de la interfaz y no solo de los props.
 * ============================================================================
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { instalarDom, settle } from './dom.js';
const aqui = path.dirname(fileURLToPath(import.meta.url));
const raizProyecto = path.resolve(aqui, '..', '..');

let vite = null;
let raizReact = null;
let createRoot = null;

/** Crea (una sola vez) el servidor de Vite que carga los modulos de la app. */
export async function arrancarVite() {
  if (vite) return vite;
  instalarDom();
  const { createServer } = await import('vite');
  vite = await createServer({
    root: raizProyecto,
    logLevel: 'silent',
    server: { middlewareMode: true },
    appType: 'custom'
  });
  return vite;
}

/** Cierra el servidor de Vite (para que el proceso termine). */
export async function cerrarVite() {
  if (vite) {
    await vite.close();
    vite = null;
  }
}

/** Carga el modulo de la app con el DOM ya instalado. */
export async function cargarApp() {
  await arrancarVite();
  if (!raizReact) {
    raizReact = await import('react-dom/client');
  }
  if (!createRoot) createRoot = raizReact.createRoot;
  const mod = await vite.ssrLoadModule('/src/App.jsx');
  return mod.default;
}

/**
 * Monta la app en el DOM. Devuelve un "controlador" con las utilidades.
 *
 * @param {object} opciones
 * @param {object|null} opciones.usuario  perfil a simular en la sesion local
 * @param {object} opciones.datos        filas por tabla que devuelve el mock
 */
export async function montarApp({ usuario = null, datos = {}, conTour = false } = {}) {
  // El cliente de Supabase lee la sesion de localStorage con la clave
  // sb-<ref>-auth-token. Sin eso, getSession() devuelve null y la app
  // vuelve al login aunque el perfil local exista.
  const refProyecto = 'xgactumwhukhjwggcmqs';
  const email = usuario ? (usuario.email || usuario.username + '@unp.edu.py') : 'admin@unp.edu.py';

  const datosCompletos = {
    // Por defecto, el unico usuario que la app conoce es el que se simulo:
    // asi el perfil se resuelve siempre con el rol correcto.
    usuarios: usuario
      ? [{
          username: usuario.username,
          nombre: usuario.nombre || 'Administrador',
          cargo: usuario.cargo || 'admin',
          dependencia: usuario.dependencia || 'Rectorado'
        }]
      : [],
    ...datos
  };

  instalarDom({
    fetchConfig: {
      usuario: { email, id: '00000000-0000-0000-0000-000000000000' },
      datos: datosCompletos
    }
  });

  const App = await cargarApp();
  const contenedor = document.getElementById('root');
  contenedor.innerHTML = '';

  // Sesion local: lo que el login guarda en el navegador.
  try {
    localStorage.removeItem('current_user');
    localStorage.removeItem('is_logged_in');
    localStorage.removeItem('sb-' + refProyecto + '-auth-token');
    // El tour guiado se abre solo la primera vez (a los 900 ms) y tapa la
    // aplicacion, interceptando los clics. En los tests molesta: se marca como
    // visto salvo que el test pida lo contrario.
    if (!conTour) localStorage.setItem('tour_visto_v1', '1');
    else localStorage.removeItem('tour_visto_v1');
    if (usuario) {
      localStorage.setItem('current_user', JSON.stringify(usuario));
      localStorage.setItem('is_logged_in', 'true');
      localStorage.setItem(
        'sb-' + refProyecto + '-auth-token',
        JSON.stringify({
          access_token: 'token-de-prueba',
          token_type: 'bearer',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          refresh_token: 'refresh-de-prueba',
          user: {
            id: '00000000-0000-0000-0000-000000000000',
            aud: 'authenticated',
            role: 'authenticated',
            email,
            user_metadata: {}
          }
        })
      );
    }
  } catch { /* ignore */ }

  const React = (await import('react')).default;
  const raiz = createRoot(contenedor);
  raiz.render(React.createElement(App));
  await settle(150);

  return controlador(raiz, contenedor);
}

function controlador(raiz, contenedor) {
  /**
   * Raiz de busqueda.
   *
   * document.body y no solo #root: el primitive <Modal> se monta con
   * createPortal sobre document.body, asi que los dialogos (y su contenido)
   * quedan fuera del contenedor de la app. Buscar solo en el contenedor hacia
   * que el harness no viera los dialogos nuevos.
   */
  const raizBusqueda = () => document.body || contenedor;
  const todos = () => Array.from(raizBusqueda().querySelectorAll('*'));

  /**
   * Primer elemento cuyo texto visible incluye el texto buscado.
   *
   * Se queda con el MAS INTERNO: un boton como
   * `<button><i class="fa-qrcode"></i> Escanear QR</button>` tiene el texto
   * repartido entre el icono y el nodo de texto, asi que el match tiene que
   * resolverse al boton, no a un hijo.
   */
  const porTexto = (texto) => {
    const normal = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const buscado = normal(texto);
    if (!buscado) return null;
    const candidatos = todos().filter((el) => normal(el.textContent).includes(buscado));
    if (!candidatos.length) return null;
    return candidatos.find((el) => !candidatos.some((o) => o !== el && el.contains(o))) || null;
  };

  /** Todos los elementos que coinciden con el texto. */
  const todosPorTexto = (texto) => {
    const normal = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const buscado = normal(texto);
    return todos().filter((el) => normal(el.textContent).includes(buscado));
  };

  const clic = (el) => {
    if (!el) throw new Error('No se encontro el elemento para clicear');
    el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    return el;
  };

  const api = {
    raiz,
    contenedor,

    /** Texto visible del modulo renderizado (incluidos los portales). */
    texto: () => (raizBusqueda().textContent || '').replace(/\s+/g, ' ').trim(),

    porTexto,
    todosPorTexto,

    /** Hace clic en el primer elemento que contenga el texto. */
    async click(texto) {
      clic(porTexto(texto));
      await settle(80);
      return api;
    },

    /**
     * Hace clic en el elemento con ese data-tour (navegacion del sidebar).
     * Espera a que el elemento exista: algunos destinos dependen del rol
     * (por ejemplo "anuncios" solo aparece para el desarrollador) y todavia
     * no estan renderizados al montar.
     */
    async clickTour(tour, ms = 3000) {
      const limite = Date.now() + ms;
      let el = null;
      while (Date.now() < limite) {
        el = contenedor.querySelector(`[data-tour="${tour}"]`);
        if (el) break;
        await settle(50);
      }
      if (!el) throw new Error('No se encontro data-tour=' + tour);
      clic(el);
      await settle(120);
      return api;
    },

    /** Hace clic en el primer elemento que contenga el texto y devuelve si existia. */
    async clickSiExiste(texto) {
      const el = porTexto(texto);
      if (!el) return false;
      clic(el);
      await settle(80);
      return true;
    },

    /** Espera a que aparezca un texto. */
    async esperar(texto, ms = 1500) {
      const limite = Date.now() + ms;
      while (Date.now() < limite) {
        if (api.texto().toLowerCase().includes(String(texto).toLowerCase())) return true;
        await settle(60);
      }
      return false;
    },

    /** Existe un texto? */
    tiene(texto) {
      return api.texto().toLowerCase().includes(String(texto).toLowerCase());
    },

    /** Cantidad de elementos que coinciden. */
    contar(selector) {
      return raizBusqueda().querySelectorAll(selector).length;
    },

    /**
     * Llamadas hechas a Supabase (url y metodo).
     *
     * Sirve para comprobar que una accion ESCRIBIO de verdad y no solo
     * cambio el estado de la pantalla: un DELETE contra /funcionarios es la
     * diferencia entre "la interfaz dijo que elimino" y "elimino".
     */
    llamadas() {
      return (globalThis.fetch && globalThis.fetch.__llamadas) || [];
    },

    /**
     * Hay un dialogo abierto? Detecta tanto el <Modal> nuevo (role="dialog")
     * como los overlays viejos (STYLES.modalOverlay, z-[300]).
     *
     * Espera: los modales se cargan de forma diferida (lazy), asi que el
     * dialogo aparece un instante despues del clic.
     */
    async hayDialogo(ms = 2500) {
      const limite = Date.now() + ms;
      while (Date.now() < limite) {
        // El <Modal> nuevo usa role="dialog" + z-[400]; los overlays viejos
        // usan STYLES.modalOverlay, cuyo z-index subio a z-[400].
        if (
          raizBusqueda().querySelector('[role="dialog"]') !== null ||
          raizBusqueda().querySelector('.z-\\[300\\]') !== null ||
          raizBusqueda().querySelector('.z-\\[400\\]') !== null
        ) {
          return true;
        }
        await settle(60);
      }
      return false;
    },

    /** Hay un toast (aviso flotante) en pantalla? Espera a que aparezca. */
    async hayToast(ms = 2500) {
      const limite = Date.now() + ms;
      while (Date.now() < limite) {
        if (raizBusqueda().querySelector('[role="status"]') !== null) return true;
        await settle(60);
      }
      return false;
    },

    /** Escribe en un input por su name. */
    async escribir(name, valor) {
      const el = raizBusqueda().querySelector(`[name="${name}"]`);
      if (!el) throw new Error('No se encontro el campo ' + name);
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      ).set;
      setter.call(el, valor);
      el.dispatchEvent(new window.Event('input', { bubbles: true }));
      await settle(40);
      return el;
    },

    /** Desmonta la app (para el siguiente test). */
    async desmontar() {
      try { raiz.unmount(); } catch { /* ignore */ }
      contenedor.innerHTML = '';
      await settle(20);
    }
  };

  return api;
}
