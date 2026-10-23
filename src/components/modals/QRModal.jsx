import Dialogo from '../ui/Dialogo';
import React, { useState, useEffect } from 'react';

export default function QRModal({
  isOpen,
  onClose,
  isBulk,
  bien,
  onDownloadLabel,
  onDownloadSimpleQR,
  onBulkLabelZip,
  onBulkSimpleZip,
  STYLES
}) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState('label'); // 'label' o 'simple'
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (isOpen && bien && !isBulk) {
      const loadPreview = async () => {
        setIsGenerating(true);
        try {
          let url = null;
          if (previewType === 'label' && onDownloadLabel) {
            url = await onDownloadLabel(bien, true);
          } else if (previewType === 'simple' && onDownloadSimpleQR) {
            url = await onDownloadSimpleQR(bien, true);
          }
          if (isMounted) setPreviewUrl(url);
        } catch (e) {
          console.error("Error al generar previsualización:", e);
        } finally {
          if (isMounted) setIsGenerating(false);
        }
      };

      loadPreview();
    } else {
      setPreviewUrl(null);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, bien, isBulk, previewType, onDownloadSimpleQR, onDownloadLabel]);

  if (!isOpen) return null;

  return (
    <Dialogo className={STYLES.modalOverlay}>
      <div className={STYLES.modalContent + " max-w-md"}>

        {/* Cabecera */}
        <div className="px-7 py-5 border-b border-line dark:border-zinc-800/80 bg-surface-1 dark:bg-surface-2 flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-card bg-surface-3 dark:bg-surface-1/10 text-content-1 dark:text-white shrink-0">
              <i className="fa-solid fa-qrcode text-lg"></i>
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-content-1 dark:text-white">
                {isBulk ? "Generar Lote Masivo de QRs" : "Vista Previa de Código / Etiqueta"}
              </h3>
              <p className="text-xs text-content-3 dark:text-content-3 tabular-nums">
                {isBulk ? "Exportación comprimida en ZIP" : `Rótulo: ${bien?.rotulo || 'S/R'}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Cerrar" aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-control text-content-3 hover:text-content-1 dark:hover:text-white hover:bg-surface-3 dark:hover:bg-surface-1/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand motion cursor-pointer shrink-0">

            <i className="fa-solid fa-xmark text-base"></i>
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-7 space-y-5 bg-surface-1 dark:bg-surface-2">

          {!isBulk ? (
            <>
              {/* Selector de Pestañas: Etiqueta vs QR Simple */}
              <div className="flex rounded-card bg-surface-3 dark:bg-surface-1/5 p-1 border border-line/60 dark:border-white/5">
                <button
                  onClick={() => setPreviewType('label')}
                  className={`flex-1 py-2.5 rounded-control text-xs font-semibold motion cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${ previewType === 'label' ? 'bg-surface-1 dark:bg-surface-3 text-content-1 dark:text-white shadow-xs' : 'text-content-3 hover:text-content-1 dark:hover:text-zinc-200' }`}
                >
                  Etiqueta Completa
                </button>
                <button
                  onClick={() => setPreviewType('simple')}
                  className={`flex-1 py-2.5 rounded-control text-xs font-semibold motion cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${ previewType === 'simple' ? 'bg-surface-1 dark:bg-surface-3 text-content-1 dark:text-white shadow-xs' : 'text-content-3 hover:text-content-1 dark:hover:text-zinc-200' }`}
                >
                  Solo Código QR
                </button>
              </div>

              {/* Visor de Previsualización */}
              <div className="flex flex-col items-center justify-center p-6 bg-surface-3 dark:bg-surface-1 rounded-card border border-line/80 dark:border-zinc-800 min-h-[240px] relative">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center gap-2.5">
                    <i className="fa-solid fa-circle-notch fa-spin text-2xl text-content-3"></i>
                    <span className="text-xs font-medium text-content-3">Generando código QR...</span>
                  </div>
                ) : previewUrl ? (
                  <div className="p-3 bg-surface-1 rounded-card shadow-sm border border-line/80 flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt="Vista previa del QR"
                      className="max-h-[210px] max-w-full object-contain rounded-lg"
                    />
                  </div>
                ) : (
                  <span className="text-xs font-medium text-content-3">No hay vista previa disponible</span>
                )}
              </div>

              {/* Botones de Descarga */}
              <div className="pt-2 grid grid-cols-1 gap-2.5">
                <button
                  onClick={() => onDownloadLabel(bien, false)}
                  className="w-full h-10 px-5 rounded-control bg-zinc-900 hover:bg-zinc-800 dark:bg-surface-1 dark:hover:bg-surface-3 text-white dark:text-content-1 text-[13px] font-bold motion flex items-center justify-center gap-2 cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <i className="fa-solid fa-download"></i> Descargar Etiqueta Completa (PNG)
                </button>

                <button
                  onClick={() => onDownloadSimpleQR(bien, false)}
                  className="w-full h-10 px-4 rounded-control text-[13px] font-semibold text-content-2 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-1/10 motion border border-line dark:border-zinc-800 flex items-center justify-center gap-2 cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <i className="fa-solid fa-qrcode"></i> Descargar Solo Código QR (PNG)
                </button>
              </div>
            </>
          ) : (
            /* Lote Masivo (ZIP) */
            <div className="space-y-4">
              <div className="p-4 rounded-card bg-surface-3 dark:bg-surface-1/5 border border-line/80 dark:border-white/5">
                <p className="text-xs font-medium text-content-1 dark:text-content-3 leading-relaxed">
                  Se generará un paquete comprimido <strong>.ZIP</strong> con todos los bienes actualmente filtrados.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={onBulkLabelZip}
                  className="py-3 px-4 h-10 rounded-control bg-zinc-900 hover:bg-zinc-800 dark:bg-surface-1 dark:hover:bg-surface-3 text-white dark:text-content-1 text-[13px] font-bold motion flex items-center justify-center gap-2 cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <i className="fa-solid fa-file-zipper"></i> Descargar Etiquetas ZIP
                </button>
                <button
                  onClick={onBulkSimpleZip}
                  className="py-3 px-4 h-10 rounded-control text-[13px] font-semibold text-content-2 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-1/10 motion border border-line dark:border-zinc-800 flex items-center justify-center gap-2 cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <i className="fa-solid fa-qrcode"></i> Descargar QRs Simples ZIP
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </Dialogo>
  );
}
