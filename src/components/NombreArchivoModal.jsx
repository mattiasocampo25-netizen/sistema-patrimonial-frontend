import React, { useEffect, useState } from 'react';
import { Button, Input, Modal } from './ui';

export default function NombreArchivoModal({ solicitud, onAceptar, onUsarSugerido }) {
  const [nombre, setNombre] = useState(solicitud?.nombreSugerido || '');

  useEffect(() => {
    setNombre(solicitud?.nombreSugerido || '');
  }, [solicitud?.id, solicitud?.nombreSugerido]);

  if (!solicitud) return null;

  return (
    <Modal
      abierto
      onCerrar={onUsarSugerido}
      titulo="Nombre del archivo"
      descripcion="Puedes ajustar el nombre antes de descargar."
      icono="fa-file-arrow-down"
      tamano="sm"
      pie={(
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variante="secondary" onClick={onUsarSugerido}>Usar nombre sugerido</Button>
          <Button variante="primary" icono="fa-download" onClick={() => onAceptar(nombre)}>Descargar</Button>
        </div>
      )}
    >
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); onAceptar(nombre); }}>
        <div className="space-y-1.5">
          <label htmlFor="nombre-archivo" className="text-label font-semibold text-content-2 uppercase tracking-wide">Nombre del archivo</label>
          <div className="flex items-center gap-2">
            <Input
              id="nombre-archivo"
              autoFocus
              autoComplete="off"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              className="min-w-0 flex-1"
              maxLength={64}
            />
            <span className="shrink-0 rounded-lg bg-surface-2 px-2.5 py-2 text-sm font-bold text-content-3">.{solicitud.extension}</span>
          </div>
          <p className="text-label text-content-3">La extensión se agrega automáticamente.</p>
        </div>
        <button type="submit" className="sr-only">Descargar</button>
      </form>
    </Modal>
  );
}
