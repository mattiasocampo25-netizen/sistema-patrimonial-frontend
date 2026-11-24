import React, { useEffect, useState } from 'react';
import { Button, Input, Modal } from './ui';

export default function NombreArchivoModal({ solicitud, onAceptar, onUsarSugerido, onCancelar }) {
  const [nombre, setNombre] = useState(solicitud?.nombreSugerido || '');

  useEffect(() => {
    setNombre(solicitud?.nombreSugerido || '');
  }, [solicitud?.id, solicitud?.nombreSugerido]);

  if (!solicitud) return null;

  return (
    <Modal
      abierto
      onCerrar={onCancelar}
      titulo="Nombre del archivo"
      descripcion="Puedes ajustar el nombre antes de descargar."
      icono="fa-file-arrow-down"
      tamano="md"
      className="file-name-modal"
      pie={(
        <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:justify-end">
          <Button variante="secondary" className="w-full sm:w-auto" onClick={onUsarSugerido}>Usar nombre sugerido</Button>
          <Button variante="primary" icono="fa-download" className="w-full sm:w-auto" onClick={() => onAceptar(nombre)}>Descargar</Button>
        </div>
      )}
    >
      <form className="space-y-4 p-5 sm:p-6" onSubmit={(event) => { event.preventDefault(); onAceptar(nombre); }}>
        <div className="min-w-0 space-y-2.5">
          <label htmlFor="nombre-archivo" className="block text-label font-semibold text-content-2 uppercase tracking-wide">Nombre del archivo</label>
          <div className="flex min-w-0 items-stretch gap-2">
            <Input
              id="nombre-archivo"
              autoFocus
              autoComplete="off"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              className="min-w-0 flex-1 font-medium"
              maxLength={64}
            />
            <span className="inline-flex shrink-0 items-center rounded-control border border-line bg-surface-2 px-3 text-sm font-bold text-content-3">.{solicitud.extension}</span>
          </div>
          <p className="text-label text-content-3">La extensión se agrega automáticamente.</p>
        </div>
        <button type="submit" className="sr-only">Descargar</button>
      </form>
    </Modal>
  );
}
