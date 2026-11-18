import { useRef } from 'react';

const METODOS_PDF = [
  'marcarBienConQR',
  'handleDownloadLabelPNG',
  'handleDownloadSimpleQR',
  'handleBulkLabelPNGZip',
  'handleBulkSimpleQRZip',
  'handleGenerateFC04PDF',
  'handleGenerateFC11PDF',
  'handleGenerateFC10PDF',
  'handleBulkFC10Zip',
  'handleGenerateConsolidatedFC10PDF',
  'handleExportFC10CSV',
  'handleExportFC11CSV',
  'handleDownloadTemplateCSV',
  'handleExportBackupGeneral',
  'handleExportInventarioCSV',
  'handleExportInventarioExcel',
  'handleExportInventarioPDF',
  'handleDownloadTemplateFuncionarios'
];

/**
 * Mantiene la API de los handlers de exportación, pero difiere el módulo pesado
 * hasta que el usuario ejecuta una operación de PDF, QR, Excel o respaldo.
 * Las opciones se leen desde un ref para usar los datos actuales, incluso si
 * la página cambió de dependencia después de montar App.
 */
export function usePdfHandlers(opciones) {
  const opcionesActuales = useRef(opciones);
  opcionesActuales.current = opciones;
  const runtimePromise = useRef(null);
  const trabajoEnCurso = useRef(false);

  const obtenerHandlers = async () => {
    if (!runtimePromise.current) {
      runtimePromise.current = import('./usePdfHandlersRuntime.js').catch(error => {
        runtimePromise.current = null;
        throw error;
      });
    }
    const { createPdfHandlers } = await runtimePromise.current;
    return createPdfHandlers(opcionesActuales.current, trabajoEnCurso);
  };

  return Object.fromEntries(METODOS_PDF.map(metodo => [metodo, async (...args) => {
    try {
      const handlers = await obtenerHandlers();
      return await handlers[metodo](...args);
    } catch (error) {
      console.error(`No se pudo cargar la operación ${metodo}:`, error);
      opcionesActuales.current.notify?.('No se pudo cargar esta función. Intenta nuevamente.', 'error');
      return undefined;
    }
  }]));
}
