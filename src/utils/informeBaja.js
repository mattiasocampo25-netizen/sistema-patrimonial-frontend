import { guardarPDF } from './pdfSanear';
import { normalizarSegmentoArchivo, fechaParaArchivo } from './fileNames.js';

const textoSeguro = value => String(value ?? 'No consignado').replace(/\s+/g, ' ').trim();
const etiquetaEstado = estado => ({ PENDIENTE: 'Pendiente', EN_REVISION: 'En revisión', APROBADO: 'Aprobado', RECHAZADO: 'Rechazado' }[estado] || estado || 'Pendiente');

function nuevoDocumento(titulo, subtitulo, actor) {
  const motor = window.jspdf?.jsPDF;
  if (!motor) throw new Error('El generador PDF no está disponible. Recarga la página e inténtalo nuevamente.');
  const doc = new motor({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const ancho = doc.internal.pageSize.getWidth();
  const alto = doc.internal.pageSize.getHeight();
  const margen = 17;
  let y = margen;
  const revisarPagina = altoDisponible => {
    if (y + altoDisponible > alto - margen - 12) { doc.addPage(); y = margen; }
  };
  const texto = value => textoSeguro(value);
  const seccion = nombre => {
    revisarPagina(13);
    y += 3; doc.setFillColor(36, 59, 103); doc.rect(margen, y, 2, 7, 'F');
    doc.setTextColor(36, 59, 103); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text(texto(nombre), margen + 5, y + 5); y += 12;
  };
  const parrafo = contenido => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(45, 55, 72);
    const lineas = doc.splitTextToSize(texto(contenido), ancho - margen * 2 - 4);
    for (const linea of lineas) { revisarPagina(5); doc.text(linea, margen + 1, y); y += 4.5; }
    y += 2;
  };
  const tabla = filas => {
    const anchoEtiqueta = 53;
    for (const [label, valor] of filas) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
      const lineasValor = doc.splitTextToSize(texto(valor), ancho - margen * 2 - anchoEtiqueta - 8);
      const altoFila = Math.max(7, lineasValor.length * 4 + 3);
      revisarPagina(altoFila);
      doc.setFillColor(241, 244, 248); doc.setDrawColor(206, 214, 225); doc.setLineWidth(.2);
      doc.rect(margen, y, anchoEtiqueta, altoFila, 'FD'); doc.rect(margen + anchoEtiqueta, y, ancho - margen * 2 - anchoEtiqueta, altoFila, 'S');
      doc.setFont('helvetica', 'bold'); doc.setTextColor(46, 58, 77); doc.text(doc.splitTextToSize(texto(label), anchoEtiqueta - 4), margen + 2, y + 4.5);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(31, 41, 55); doc.text(lineasValor, margen + anchoEtiqueta + 3, y + 4.5);
      y += altoFila;
    }
    y += 3;
  };

  doc.setFillColor(36, 59, 103); doc.rect(0, 0, ancho, 5, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(72, 85, 105);
  doc.text('UNIVERSIDAD NACIONAL DE PILAR · GESTIÓN PATRIMONIAL', margen, y + 3); y += 11;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(17); doc.setTextColor(23, 43, 77);
  doc.text(doc.splitTextToSize(texto(titulo), ancho - margen * 2), margen, y + 5); y += 14;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(82, 96, 120);
  doc.text(doc.splitTextToSize(texto(subtitulo), ancho - margen * 2), margen, y); y += 8;
  doc.setFontSize(8); doc.text(`Emitido: ${new Date().toLocaleString('es-PY')} · Generado por: ${texto(actor)}`, margen, y); y += 7;
  doc.setFillColor(255, 247, 230); doc.setDrawColor(201, 140, 41);
  const advertencia = 'Este documento sirve para preparar y dar seguimiento al trámite. No constituye por sí mismo autorización de baja ni modifica el inventario. La baja patrimonial requiere el expediente, las verificaciones y los actos administrativos que correspondan.';
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
  const lineasAviso = doc.splitTextToSize(advertencia, ancho - margen * 2 - 8);
  const altoAviso = lineasAviso.length * 4.2 + 6;
  doc.roundedRect(margen, y, ancho - margen * 2, altoAviso, 1.5, 1.5, 'FD');
  doc.setTextColor(105, 70, 18); doc.text(lineasAviso, margen + 4, y + 5); y += altoAviso + 5;

  doc.seccion = seccion; doc.tabla = tabla; doc.parrafo = parrafo;
  doc.finalizar = async nombre => {
    const total = doc.getNumberOfPages();
    for (let pagina = 1; pagina <= total; pagina++) {
      doc.setPage(pagina); doc.setDrawColor(203, 213, 225); doc.line(margen, alto - 11, ancho - margen, alto - 11);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(100, 116, 139);
      doc.text('Informe de seguimiento · No sustituye el acto administrativo de baja patrimonial', margen, alto - 7);
      doc.text(`Página ${pagina} de ${total}`, ancho - margen, alto - 7, { align: 'right' });
    }
    await guardarPDF(doc, nombre);
  };
  return doc;
}

/** Descarga un informe preparatorio. No persiste cambios ni modifica el bien. */
export async function imprimirInformeBajaBien(bien, usuario = 'Administrador') {
  if (!bien) return;
  try {
    const doc = nuevoDocumento('Informe administrativo de baja patrimonial', 'Documento preparatorio para evaluación y eventual inicio del procedimiento administrativo.', usuario);
    doc.seccion('1. Identificación y trazabilidad del bien');
    doc.tabla([
      ['Rótulo patrimonial', bien.rotulo], ['Descripción', bien.descripcion], ['Marca', bien.marca], ['Modelo', bien.modelo],
      ['Número de serie', bien.numeroSerie || bien.serie], ['Subcuenta', bien.subcuenta], ['Analítico 1', bien.analitico1], ['Analítico 2', bien.analitico2],
      ['Dependencia', bien.dependencia], ['Ubicación', bien.ubicacion], ['Funcionario asignado', bien.funcionario], ['Cédula', bien.cedula],
      ['Fecha de adquisición', bien.fechaAdquisicion], ['Valor de adquisición', bien.valor], ['Estado de conservación registrado', bien.estadoConservacion], ['Observaciones existentes', bien.observaciones]
    ]);
    doc.seccion('2. Antecedentes y motivo para evaluar');
    doc.parrafo('Describir los antecedentes, el motivo por el cual se propone evaluar la baja y la documentación respaldatoria disponible:');
    doc.parrafo('________________________________________________________________________________');
    doc.parrafo('________________________________________________________________________________');
    doc.seccion('3. Verificación física y técnica');
    doc.tabla([['Fecha y lugar de inspección', ''], ['Condición física constatada', ''], ['Informe técnico o diagnóstico', ''], ['Documentos o fotografías adjuntos', '']]);
    doc.seccion('4. Lista de control del trámite administrativo');
    ['Verificar identificación y existencia física del bien.', 'Incorporar informe técnico y antecedentes patrimoniales.', 'Determinar la causal y el procedimiento aplicable.', 'Obtener dictámenes, autorizaciones y actos administrativos requeridos.', 'Registrar la baja en inventario solo una vez cumplido el procedimiento.'].forEach((texto, i) => doc.parrafo(`[  ] ${i + 1}. ${texto}`));
    doc.seccion('5. Observaciones');
    doc.parrafo('________________________________________________________________________________');
    doc.parrafo('________________________________________________________________________________');
    doc.seccion('6. Constancia y firmas');
    doc.tabla([['Encargado/a de Patrimonio', 'Nombre, cargo, firma y fecha'], ['Autoridad competente', 'Nombre, cargo, firma y fecha']]);
    await doc.finalizar(`Informe_Preparatorio_Baja_${normalizarSegmentoArchivo(bien.rotulo, 'bien')}_${fechaParaArchivo()}.pdf`);
  } catch (error) {
    console.error('No se pudo descargar el informe administrativo de baja:', error);
    window.alert(error.message || 'No se pudo generar el archivo PDF.');
  }
}

/** Descarga el detalle e historial de una solicitud concreta. */
export async function descargarInformeSolicitudBaja(solicitud, bien, historial = []) {
  try {
    const doc = nuevoDocumento('Informe de solicitud de baja', 'Detalle y seguimiento de una solicitud registrada en el Centro de Aprobaciones.', solicitud?.resueltoPor || solicitud?.revisionPor || solicitud?.solicitante || 'Sistema');
    doc.seccion('1. Identificación de la solicitud');
    doc.tabla([
      ['Número de solicitud', solicitud?.id], ['Tipo', solicitud?.tipo === 'BAJA_FUNCIONARIO' ? 'Solicitud relacionada con funcionario' : 'Solicitud de baja de bien'],
      ['Estado', etiquetaEstado(solicitud?.estado)], ['Fecha de presentación', solicitud?.created_at || solicitud?.fecha],
      ['Dependencia', solicitud?.dependencia], ['Solicitante', solicitud?.solicitante], ['Responsable asignado', solicitud?.responsable]
    ]);
    doc.seccion('2. Identificación del bien relacionado');
    doc.tabla([
      ['Rótulo patrimonial', bien?.rotulo || solicitud?.rotulo], ['Descripción', bien?.descripcion || solicitud?.descripcion],
      ['Marca y modelo', [bien?.marca, bien?.modelo].filter(Boolean).join(' ')], ['Número de serie', bien?.numeroSerie || bien?.serie],
      ['Dependencia', bien?.dependencia || solicitud?.dependencia], ['Ubicación', bien?.ubicacion],
      ['Estado de conservación registrado', bien?.estadoConservacion]
    ]);
    doc.seccion('3. Fundamento de la solicitud');
    doc.parrafo(solicitud?.motivo || 'No se registró un motivo.');
    doc.seccion('4. Resolución registrada');
    doc.tabla([
      ['Resultado', etiquetaEstado(solicitud?.estado)], ['Registrado por', solicitud?.resueltoPor || solicitud?.revisionPor],
      ['Fecha y hora', solicitud?.resueltoEn || solicitud?.resueltoFecha || solicitud?.revisionEn], ['Observación', solicitud?.motivoResolucion]
    ]);
    doc.seccion('5. Historial de actuaciones');
    if (!historial.length) doc.parrafo('Sin actuaciones registradas.');
    historial.forEach((evento, indice) => {
      doc.tabla([[`Actuación ${indice + 1}`, etiquetaEstado(evento.estado)], ['Usuario', evento.usuario], ['Fecha y hora', evento.fecha], ['Observación', evento.motivo]]);
    });
    doc.seccion('6. Constancia');
    doc.tabla([['Responsable de Patrimonio', 'Nombre, firma y fecha'], ['Autoridad competente', 'Nombre, firma y fecha']]);
    await doc.finalizar(`Informe_Solicitud_Baja_${normalizarSegmentoArchivo(bien?.rotulo || solicitud?.id, 'solicitud')}_${fechaParaArchivo()}.pdf`);
  } catch (error) {
    console.error('No se pudo descargar el informe de solicitud:', error);
    window.alert(error.message || 'No se pudo generar el archivo PDF.');
  }
}
