const textoSeguro = (valor, alternativo = '—') => {
  const texto = String(valor ?? '').trim();
  return texto || alternativo;
};

const nombreSeguro = (valor) => String(valor || 'bien')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 70) || 'bien';

const fechaLocal = (valor) => {
  if (!valor) return 'Sin fecha';
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? String(valor) : fecha.toLocaleDateString('es-PY');
};

export async function crearExpedienteAuditoria({ bien, eventos = [], fc10 = [], fc11 = [], fotos = [] }) {
  const jsPDF = window.jspdf?.jsPDF;
  if (!jsPDF || typeof jsPDF.API?.autoTable !== 'function') {
    throw new Error('El generador de informes todavía está cargando. Intenta nuevamente en unos segundos.');
  }
  if (!window.JSZip) throw new Error('El generador de paquetes ZIP no está disponible. Recarga el sistema e intenta nuevamente.');

  const doc = new jsPDF('p', 'mm', [216, 330]);
  const ancho = doc.internal.pageSize.width;
  const alto = doc.internal.pageSize.height;
  const margen = 14;
  let y = 34;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('EXPEDIENTE DE AUDITORÍA PATRIMONIAL', margen, 17);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleString('es-PY')}`, margen, 23);
  doc.text(`Dependencia: ${textoSeguro(bien.dependencia)}`, margen, 28);

  const tabla = (titulo, encabezados, filas) => {
    if (y > alto - 34) { doc.addPage(); y = 18; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(titulo, margen, y);
    doc.autoTable({
      startY: y + 3,
      margin: { left: margen, right: margen, bottom: 17 },
      head: [encabezados],
      body: filas.length ? filas : [['Sin registros relacionados']],
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.5, overflow: 'linebreak', valign: 'top' },
      headStyles: { fillColor: [19, 57, 76], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 248, 250] },
      rowPageBreak: 'avoid'
    });
    y = doc.lastAutoTable.finalY + 8;
  };

  tabla('1. Identificación del bien', ['Campo', 'Dato'], [
    ['Rótulo / código patrimonial', textoSeguro(bien.rotulo)],
    ['Descripción', textoSeguro(bien.descripcion)],
    ['Dependencia', textoSeguro(bien.dependencia)],
    ['Ubicación', textoSeguro(bien.ubicacion)],
    ['Responsable principal', textoSeguro(bien.funcionario)],
    ['Responsable alternativo', textoSeguro(bien.funcionarioAlternativo)],
    ['Cuenta / subcuenta / analíticos', [bien.cuenta, bien.subcuenta, bien.analitico1, bien.analitico2].filter(Boolean).join(' · ') || '—'],
    ['Estado de conservación', textoSeguro(bien.estadoConservacion)],
    ['Fecha de adquisición', fechaLocal(bien.fechaAdquisicion)],
    ['Valor unitario', bien.valorUnitario ? `Gs. ${bien.valorUnitario}` : '—'],
    ['Observaciones', textoSeguro(bien.observaciones)]
  ]);

  tabla('2. Historial de movimientos', ['Fecha', 'Movimiento', 'Detalle', 'Registrado por'], eventos.map((evento) => [
    textoSeguro(evento.fechaFmt || evento.fecha),
    textoSeguro(evento.titulo),
    [evento.detalle, evento.cambios?.anterior || evento.cambios?.nuevo ? `Cambios: ${JSON.stringify(evento.cambios)}` : ''].filter(Boolean).join('\n'),
    textoSeguro(evento.usuario)
  ]));

  tabla('3. Registros FC-10 asociados', ['N.º formulario', 'Fecha', 'Funcionario', 'Estado de firma', 'Devolución'], fc10.map((registro) => [
    textoSeguro(registro.numeroFormulario), fechaLocal(registro.entregadoFecha || registro.fechaGeneracion),
    textoSeguro(registro.funcionarioNombre), textoSeguro(registro.estadoFirma),
    registro.devolucionFecha ? fechaLocal(registro.devolucionFecha) : 'Sin devolución registrada'
  ]));

  tabla('4. Registros FC-11 asociados', ['N.º formulario', 'Fecha', 'Origen', 'Destino', 'Receptor'], fc11.map((registro) => [
    textoSeguro(registro.numeroFormulario), fechaLocal(registro.fecha),
    textoSeguro([registro.dependenciaRemitente || registro.remitente, registro.areaRemitente].filter(Boolean).join(' · ')),
    textoSeguro([registro.dependenciaDestinataria || registro.destinatario, registro.areaDestinataria].filter(Boolean).join(' · ')),
    textoSeguro(registro.receptorNombre)
  ]));

  const paginas = doc.internal.getNumberOfPages();
  for (let pagina = 1; pagina <= paginas; pagina += 1) {
    doc.setPage(pagina);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Documento de consulta y trazabilidad. No sustituye los formularios oficiales firmados.', margen, alto - 8);
    doc.text(`Página ${pagina} de ${paginas}`, ancho - margen, alto - 8, { align: 'right' });
  }

  const zip = new window.JSZip();
  const base = `Expediente_${nombreSeguro(bien.rotulo || bien.id)}`;
  zip.file(`${base}.pdf`, doc.output('blob'));
  zip.folder('registros').file('FC10_asociados.json', JSON.stringify(fc10, null, 2));
  zip.folder('registros').file('FC11_asociados.json', JSON.stringify(fc11, null, 2));
  const evidencia = zip.folder('evidencias');
  const adjuntosNoIncluidos = [];
  let fotosIncluidas = 0;
  for (let i = 0; i < fotos.length; i += 1) {
    const foto = fotos[i];
    if (!foto.url) { adjuntosNoIncluidos.push(`Foto ${i + 1}: no hay enlace disponible`); continue; }
    try {
      const respuesta = await fetch(foto.url);
      if (!respuesta.ok) throw new Error('No se pudo descargar');
      const blob = await respuesta.blob();
      const extension = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg').replace(/[^a-z0-9]/gi, '');
      evidencia.file(`foto_${String(i + 1).padStart(2, '0')}.${extension}`, blob);
      fotosIncluidas += 1;
    } catch {
      adjuntosNoIncluidos.push(`Foto ${i + 1}: el archivo no estuvo disponible al generar el expediente`);
    }
  }
  const manifiesto = [
    'EXPEDIENTE DE AUDITORÍA PATRIMONIAL',
    `Bien: ${textoSeguro(bien.rotulo)} · ${textoSeguro(bien.descripcion)}`,
    `Dependencia: ${textoSeguro(bien.dependencia)}`,
    `FC-10 incluidos como registros: ${fc10.length}`,
    `FC-11 incluidos como registros: ${fc11.length}`,
    `Evidencias fotográficas incluidas: ${fotosIncluidas}`,
    ...adjuntosNoIncluidos,
    'El PDF es un informe de consulta; los registros JSON contienen los datos FC-10/FC-11 disponibles en el sistema.',
    'Los documentos originales firmados deben conservarse en el archivo institucional correspondiente.'
  ].join('\n');
  zip.file('LEEME.txt', manifiesto);
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 4 } });
  return { blob, filename: `${base}.zip` };
}
