import test from 'node:test';
import assert from 'node:assert/strict';
import { aplicarSeleccionRango, construirLinkInventario, detectarBienesSimilares, idsEntre } from '../src/utils/inventarioInteracciones.js';
import { fechaParaArchivo, nombreFC10Archivo, normalizarSegmentoArchivo, registrarDialogoNombreArchivo, solicitarNombreArchivo } from '../src/utils/fileNames.js';

test('los nombres sugeridos de descargas son legibles, seguros y conservan fecha local ISO', () => {
  assert.equal(normalizarSegmentoArchivo('Área: Dirección/Académica'), 'Area_Direccion_Academica');
  assert.equal(fechaParaArchivo('2026-10-28'), '2026-10-28');
  assert.equal(nombreFC10Archivo({ funcionarioNombre: 'José Pérez', bienRotulo: 'UNP/123', entregadoFecha: '2026-10-28' }), 'FC10_Acta_Jose_Perez_UNP_123_2026-10-28.pdf');
});

test('el diálogo permite cambiar el nombre y usar el sugerido sin extensiones duplicadas', async () => {
  let solicitud;
  const desconectar = registrarDialogoNombreArchivo((valor) => { solicitud = valor; });
  try {
    const elegido = solicitarNombreArchivo('FC03_Rectorado_Seleccion_2026-10-28.pdf');
    solicitud.aceptar('Acta / revisada');
    assert.equal(await elegido, 'Acta_revisada.pdf');

    const sugerido = solicitarNombreArchivo('Inventario_Rectorado_2026-10-28.csv');
    solicitud.usarSugerido();
    assert.equal(await sugerido, 'Inventario_Rectorado_2026-10-28.csv');
  } finally {
    desconectar();
  }
});

test('el link compartido abre inventario y conserva filtros y fragmento', () => {
  const enlace = construirLinkInventario('https://ejemplo.test/app?q=notebook&estado=Bueno#inventario');
  const url = new URL(enlace);
  assert.equal(url.searchParams.get('tab'), 'inventario');
  assert.equal(url.searchParams.get('q'), 'notebook');
  assert.equal(url.searchParams.get('estado'), 'Bueno');
  assert.equal(url.hash, '#inventario');
  assert.equal(construirLinkInventario('no es una url'), '');
});

test('el link del inventario incluye solo los bienes seleccionados, sin duplicados', () => {
  const enlace = construirLinkInventario('https://ejemplo.test/app?q=mesa#inventario', ['b1', 'b2', 'b1']);
  const url = new URL(enlace);
  assert.equal(url.searchParams.get('tab'), 'inventario');
  assert.equal(url.searchParams.get('q'), 'mesa');
  assert.equal(url.searchParams.get('sel'), 'b1,b2');
  assert.equal(new URL(construirLinkInventario(enlace)).searchParams.has('sel'), false);
});

test('idsEntre obtiene un rango inclusivo en ambas direcciones', () => {
  assert.deepEqual(idsEntre(['a', 'b', 'c', 'd'], 'b', 'd'), ['b', 'c', 'd']);
  assert.deepEqual(idsEntre(['a', 'b', 'c', 'd'], 'd', 'b'), ['b', 'c', 'd']);
});

test('aplicarSeleccionRango suma o quita todo el rango sin duplicar', () => {
  assert.deepEqual(aplicarSeleccionRango(['a'], ['b', 'c'], true), ['a', 'b', 'c']);
  assert.deepEqual(aplicarSeleccionRango(['a', 'b', 'c'], ['b', 'c'], false), ['a']);
});

test('detectarBienesSimilares alerta por descripción exacta y excluye el registro editado', () => {
  const bienes = [{ id: '1', rotulo: 'B-1', descripcion: 'Notebook Lenovo ThinkPad', dependencia: 'Rectorado' }];
  assert.equal(detectarBienesSimilares({ descripcion: 'notebook lenovo thinkpad' }, bienes).length, 1);
  assert.equal(detectarBienesSimilares({ descripcion: 'notebook lenovo thinkpad' }, bienes, '1').length, 0);
  assert.deepEqual(detectarBienesSimilares({ descripcion: 'Mesa' }, bienes), []);
});
