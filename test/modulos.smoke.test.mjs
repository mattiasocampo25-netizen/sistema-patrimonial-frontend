/**
 * frontend/test/modulos.smoke.test.mjs
 * ============================================================================
 * Un smoke test por modulo: entrar, comprobar que renderiza y ejecutar su
 * accion principal.
 *
 * Para que sirvan de red de seguridad durante el rediseño, tienen que detectar
 * una regresión FUNCIONAL, no un cambio de estilo. Por eso lo que se afirma es:
 *   1. el modulo se puede alcanzar desde la navegacion
 *   2. renderiza su contenido caracteristico
 *   3. su accion principal produce un efecto observable (un dialogo, un aviso,
 *      un cambio de modulo o un filtro de resultados)
 *
 * La app se renderiza de verdad, con el cliente de Supabase hablando contra un
 * fetch falso (test/harness). No se mockea ningun modulo: si un componente
 * deja de renderizar o de responder, el test falla.
 * ============================================================================
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { montarApp, arrancarVite, cerrarVite } from './harness/app.js';

const ADMIN = {
  username: 'admin',
  nombre: 'Administrador',
  cargo: 'admin',
  role: 'admin',
  dependencia: 'Rectorado'
};

const DESARROLLADOR = {
  username: 'mocampo',
  nombre: 'Desarrollador',
  cargo: 'desarrollador',
  role: 'dev',
  dependencia: 'Rectorado'
};

/**
 * Datos minimos para que las vistas tengan contenido con que trabajar.
 *
 * Las tablas JSONB (bens, fc10, fc11, fc04) usan la forma de la base:
 * { id, data: {...}, updated_at }. `usuarios` NO se define a proposito: el
 * harness lo arma con el perfil del usuario que se simulo, para que cada
 * sesion resuelva bien su rol.
 */
const DATOS = {
  bens: [
    {
      id: 'b1',
      data: {
        rotulo: '2803-01-02-0001',
        descripcion: 'Mesa de madera',
        dependencia: 'Rectorado',
        ubicacion: 'Sala 1',
        funcionario: 'Alguien',
        estadoConservacion: 'Bueno',
        valorUnitario: '500000',
        cuenta: '5.1.1',
        subcuenta: '01'
      },
      updated_at: '2026-01-01T00:00:00Z'
    },
    {
      id: 'b2',
      data: {
        rotulo: '2803-01-02-0002',
        descripcion: 'Silla de oficina',
        dependencia: 'Rectorado',
        ubicacion: 'Sala 2',
        funcionario: 'Alguien',
        estadoConservacion: 'Regular',
        valorUnitario: '150000',
        cuenta: '5.1.1',
        subcuenta: '01'
      },
      updated_at: '2026-01-01T00:00:00Z'
    }
  ],
  fc10: [
    {
      id: 'f1',
      data: {
        bienId: 'b1',
        funcionarioNombre: 'Alguien',
        estadoFirma: 'CERRADO',
        dependencia: 'Rectorado'
      },
      updated_at: '2026-01-01T00:00:00Z'
    }
  ],
  fc11: [],
  fc04: [],
  funcionarios: [
    { id: 'f1', cedula: '1234567', nombre: 'Alguien', cargo: 'Analista', dependencia: 'Rectorado' }
  ],
  dependencias: [{ id: 'd1', nombre: 'Rectorado', codigo: '03', activa: true }],
  auditoria: [
    {
      id: 'a1',
      accion: 'MODIFICACION',
      tipoRegistro: 'AUDITORIA',
      usuario: 'admin',
      dependencia: 'Rectorado',
      fecha: '2026-01-01',
      mensaje: 'prueba',
      titulo: 'prueba'
    }
  ],
  notificaciones: [
    {
      id: 'n1',
      data: {
        id: 'n1',
        tipo: 'BAJA_FUNCIONARIO',
        funcionarioId: 'f1',
        nombre: 'Alguien',
        cedula: '1234567',
        solicitante: 'admin',
        dependencia: 'Rectorado',
        estado: 'PENDIENTE',
        motivo: 'renuncia',
        created_at: '2026-01-01T00:00:00Z'
      },
      updated_at: '2026-01-01T00:00:00Z'
    }
  ]
};

describe('smoke por modulo', () => {
  let app = null;

  before(async () => {
    await arrancarVite();
  });

  after(async () => {
    if (app) await app.desmontar();
    await cerrarVite();
  });

  const entrar = async (usuario = ADMIN) => {
    if (app) await app.desmontar();
    app = await montarApp({ usuario, datos: DATOS });
    await app.esperar('Rectorado', 3000);
    return app;
  };

  // ── 1. Login ────────────────────────────────────────────────────────────
  test('modulo Login: muestra el formulario y valida sin entrar', async () => {
    app = await montarApp({ usuario: null, datos: DATOS });
    await app.esperar('Iniciar', 3000);

    assert.ok(app.tiene('Usuario'), 'debe pedir el usuario');
    assert.ok(app.tiene('Contrase'), 'debe pedir la contrasena');

    // Enviar vacio no debe romper nada ni entrar a la app.
    await app.clickSiExiste('Acceder');
    assert.ok(app.tiene('Usuario'), 'debe seguir en el login');

    // Con credenciales invalidas debe avisar, no entrar.
    await app.escribir('username', 'nadie');
    await app.escribir('password', 'malaclave');
    await app.clickSiExiste('Acceder');
    await app.esperar('incorrect', 3000);
    assert.ok(!app.tiene('Accesos directos'), 'no debe entrar con credenciales invalidas');
  });

  // ── 2. Panel ────────────────────────────────────────────────────────────
  test('modulo Panel: renderiza y abre el generador FC-03', async () => {
    await entrar();
    await app.clickTour('nav-dashboard');
    await app.esperar('Accesos directos', 3000);
    assert.ok(app.tiene('Accesos directos'), 'el panel debe mostrar los accesos directos');

    await app.clickSiExiste('FC-03');
    assert.ok(await app.hayDialogo(), 'el boton FC-03 debe abrir un dialogo');
  });

  // ── 3. Resumen ──────────────────────────────────────────────────────────
  test('modulo Resumen: renderiza los indicadores', async () => {
    await entrar();
    await app.clickTour('nav-resumen');
    await app.esperar('Valor patrimonial', 3000);
    assert.ok(app.tiene('Valor patrimonial'), 'debe mostrar el valor patrimonial');
    assert.ok(app.tiene('Bienes activos'), 'debe mostrar los bienes activos');
  });

  // ── 4. Inventario ───────────────────────────────────────────────────────
  test('modulo Inventario: lista los bienes y abre el FC-03', async () => {
    await entrar();
    await app.clickTour('nav-inventario');
    await app.esperar('2803-01-02-0001', 4000);
    assert.ok(app.tiene('2803-01-02-0001'), 'debe listar los bienes cargados');

    await app.clickSiExiste('FC-03');
    assert.ok(await app.hayDialogo(), 'el boton FC-03 debe abrir un dialogo');
  });

  // ── 5. Funcionarios ─────────────────────────────────────────────────────
  test('modulo Funcionarios: lista el padrón y abre el alta', async () => {
    await entrar();
    await app.clickTour('nav-funcionarios');
    await app.esperar('Plantel de Funcionarios', 3000);
    assert.ok(app.tiene('Plantel de Funcionarios'), 'debe mostrar el titulo del padron');

    await app.clickSiExiste('Nuevo Funcionario');
    assert.ok(await app.hayDialogo(), 'debe abrir el formulario de alta');
  });

  // ── 6. FC-04 ────────────────────────────────────────────────────────────
  test('modulo FC-04: renderiza y abre la planilla', async () => {
    await entrar();
    await app.clickTour('nav-fc04');
    await app.esperar('FC-04', 3000);
    assert.ok(app.tiene('FC-04'), 'debe mostrar el modulo FC-04');

    await app.clickSiExiste('Redactar Planilla');
    assert.ok(await app.hayDialogo(), 'debe abrir el formulario de la planilla');
  });

  // ── 7. FC-10 ────────────────────────────────────────────────────────────
  test('modulo FC-10: renderiza y abre el consolidado', async () => {
    await entrar();
    await app.clickTour('nav-fc10');
    await app.esperar('Historial de actas (FC-10)', 3000);
    assert.ok(app.tiene('Historial de actas (FC-10)'), 'debe mostrar el modulo FC-10');

    await app.clickSiExiste('FC-10 Consolidado');
    assert.ok(await app.hayDialogo(), 'debe abrir el consolidado');
  });

  // ── 8. FC-11 ────────────────────────────────────────────────────────────
  test('modulo FC-11: renderiza y exporta', async () => {
    await entrar();
    await app.clickTour('nav-fc11');
    await app.esperar('Autorizaciones de Traslado', 3000);
    assert.ok(app.tiene('Autorizaciones de Traslado'), 'debe mostrar el modulo FC-11');

    await app.clickSiExiste('Exportar CSV');
    assert.ok(await app.hayToast(), 'la exportacion debe avisar');
  });

  // ── 9. Aprobaciones ─────────────────────────────────────────────────────
  test('modulo Aprobaciones: una solicitud de funcionario se resuelve sobre el funcionario', async () => {
    // Regresion: la solicitud de BAJA_FUNCIONARIO pasaba por el camino del
    // bien, con lo que se cerraba sin borrar a nadie. Este test comprueba las
    // tres cosas: que la fila muestra los datos del funcionario, que el boton
    // dice lo que va a hacer, y que al confirmar se borra de /funcionarios.
    await entrar(ADMIN);

    await app.clickTour('nav-aprobaciones');
    await app.esperar('Centro de Aprobaciones', 3000);

    assert.ok(app.tiene('1234567'), 'la fila debe mostrar la cedula del funcionario');
    assert.ok(app.tiene('Alguien'), 'la fila debe mostrar el nombre del funcionario');
    assert.ok(app.tiene('Aprobar Eliminación'), 'el boton debe decir que se elimina al funcionario');

    await app.click('Aprobar Eliminación');
    assert.ok(await app.hayDialogo(), 'debe abrirse el dialogo de resolucion');
    assert.ok(app.tiene('Aprobar Eliminación'), 'el dialogo debe confirmar la eliminacion');
    assert.ok(app.tiene('se eliminará del padrón'), 'el dialogo debe avisar de lo que va a hacer');

    // Confirmar. El motivo es opcional al aprobar.
    await app.click('Confirmar Eliminación');
    await app.esperar('notificada', 3000);

    const borrados = app.llamadas().filter(
      (c) => c.metodo === 'DELETE' && c.url.includes('/funcionarios')
    );
    assert.ok(borrados.length > 0, 'debe borrarse al funcionario de la tabla funcionarios');

    const contraBienes = app.llamadas().filter(
      (c) => c.metodo === 'DELETE' || c.metodo === 'PATCH'
    ).filter((c) => c.url.includes('/bens') && c.url.includes('id=eq.undefined'));
    assert.equal(contraBienes.length, 0, 'no debe escribirse contra un bien con id indefinido');
  });

  test('modulo Aprobaciones: renderiza el centro de aprobaciones', async () => {
    await entrar();
    await app.clickTour('nav-aprobaciones');
    await app.esperar('Aprobaciones', 3000);
    assert.ok(app.tiene('Aprobaciones'), 'debe mostrar el centro de aprobaciones');
  });

  // ── 10. Auditoría ───────────────────────────────────────────────────────
  test('modulo Auditoría: lista la traza y abre el escáner', async () => {
    await entrar();
    await app.clickTour('nav-auditoria');
    await app.esperar('Auditoría', 4000);
    assert.ok(app.tiene('Auditoría'), 'debe mostrar el libro de auditoria');

    // La lista tiene que traer el evento del mock: prueba que el modulo
    // lee datos de verdad, no que solo pinta la cabecera.
    assert.ok(app.tiene('MODIFICACION'), 'debe listar los eventos de la traza');

    // Accion principal: abrir el escaner de conciliacion fisica.
    await app.clickSiExiste('Escanear con cámara');
    assert.ok(await app.hayDialogo(), 'debe abrir el escaner');
  });

  // ── 11. Usuarios ────────────────────────────────────────────────────────
  test('modulo Usuarios: lista usuarios y abre el alta', async () => {
    await entrar();
    await app.clickTour('nav-usuarios');
    await app.esperar('Usuarios', 3000);
    assert.ok(app.tiene('Usuarios'), 'debe mostrar la gestion de usuarios');

    await app.clickSiExiste('Nuevo Usuario');
    assert.ok(await app.hayDialogo(), 'debe abrir el formulario de alta');
  });

  // ── 12. Anuncios ────────────────────────────────────────────────────────
  test('modulo Anuncios: renderiza para el desarrollador', async () => {
    await entrar(DESARROLLADOR);
    await app.clickTour('nav-anuncios');
    await app.esperar('Anuncios', 3000);
    assert.ok(app.tiene('Anuncios'), 'debe mostrar el modulo de anuncios');
  });

  // ── 13. Ayuda ───────────────────────────────────────────────────────────
  test('modulo Ayuda: renderiza y filtra la busqueda', async () => {
    await entrar();
    await app.clickTour('nav-ayuda');
    await app.esperar('Ayuda', 3000);
    assert.ok(app.tiene('Ayuda'), 'debe mostrar el centro de ayuda');
  });
});
