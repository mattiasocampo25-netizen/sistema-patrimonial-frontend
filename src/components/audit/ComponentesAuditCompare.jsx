import React from 'react';

const CAMPOS = [
  ['nombre', 'Componente'],
  ['cantidad', 'Cantidad'],
  ['ubicacion', 'Ubicación'],
  ['funcionario', 'Responsable'],
  ['estadoConservacion', 'Estado'],
  ['observaciones', 'Observación']
];

function normalizarLista(value) {
  let parsed = value;
  if (typeof parsed === 'string') { try { parsed = JSON.parse(parsed); } catch { parsed = []; } }
  if (!Array.isArray(parsed)) return [];
  return parsed.map(item => ({
    id: item?.id ? String(item.id) : '',
    nombre: String(item?.nombre || '').trim(),
    cantidad: String(Math.max(1, Number.parseInt(item?.cantidad, 10) || 1)),
    ubicacion: String(item?.ubicacion || '').trim(),
    funcionario: String(item?.funcionario || '').trim(),
    estadoConservacion: String(item?.estadoConservacion || '').trim(),
    observaciones: String(item?.observaciones || '').trim()
  }));
}

function compararListas(antes, despues) {
  const previos = normalizarLista(antes);
  const nuevos = normalizarLista(despues);
  const usados = new Set();
  const cambios = [];
  let sinCambios = 0;

  nuevos.forEach(nuevo => {
    let previoIndex = nuevo.id ? previos.findIndex((item, i) => !usados.has(i) && item.id === nuevo.id) : -1;
    if (previoIndex < 0 && nuevo.nombre) {
      previoIndex = previos.findIndex((item, i) => !usados.has(i) && item.nombre.toLocaleLowerCase('es') === nuevo.nombre.toLocaleLowerCase('es'));
    }
    if (previoIndex < 0) {
      cambios.push({ tipo: 'agregado', antes: null, despues: nuevo, campos: CAMPOS.filter(([campo]) => nuevo[campo]) });
      return;
    }

    usados.add(previoIndex);
    const previo = previos[previoIndex];
    const campos = CAMPOS.filter(([campo]) => previo[campo] !== nuevo[campo]);
    if (campos.length) cambios.push({ tipo: 'modificado', antes: previo, despues: nuevo, campos });
    else sinCambios += 1;
  });

  previos.forEach((previo, indice) => {
    if (!usados.has(indice)) cambios.push({ tipo: 'quitado', antes: previo, despues: null, campos: CAMPOS.filter(([campo]) => previo[campo]) });
  });
  return { cambios, sinCambios, totalAntes: previos.length, totalDespues: nuevos.length };
}

const TEMA = {
  agregado: { label: 'Agregado', tone: 'border-ok/25 bg-ok-soft/60 text-ok', icon: 'fa-plus' },
  modificado: { label: 'Modificado', tone: 'border-warn/25 bg-warn-soft/60 text-warn', icon: 'fa-pen' },
  quitado: { label: 'Quitado', tone: 'border-danger/20 bg-danger-soft/60 text-danger', icon: 'fa-minus' }
};

export default function ComponentesAuditCompare({ antes, despues }) {
  const resultado = compararListas(antes, despues);
  if (!resultado.cambios.length) return null;

  return (
    <div className="mt-3 rounded-xl border border-line/70 bg-surface-1 p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h5 className="text-xs font-extrabold text-content-1">Cambios en las piezas</h5>
          <p className="mt-0.5 text-[10px] text-content-3">{resultado.totalAntes} antes · {resultado.totalDespues} después</p>
        </div>
        {resultado.sinCambios > 0 && <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[10px] font-semibold text-content-3">{resultado.sinCambios} sin cambio</span>}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {resultado.cambios.map((cambio, index) => {
          const estado = TEMA[cambio.tipo];
          const pieza = cambio.despues || cambio.antes;
          return (
            <article key={`${cambio.tipo}-${pieza.id || pieza.nombre}-${index}`} className="min-w-0 rounded-lg border border-line/70 bg-surface-2/50 p-2.5">
              <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-content-1" title={pieza.nombre}>{pieza.nombre || 'Componente sin nombre'}</p>
                  {cambio.antes && cambio.despues && cambio.antes.nombre !== cambio.despues.nombre && <p className="mt-0.5 truncate text-[10px] text-content-3" title={`Antes: ${cambio.antes.nombre}`}>Antes: {cambio.antes.nombre || 'Sin nombre'}</p>}
                </div>
                <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold ${estado.tone}`}><i className={`fa-solid ${estado.icon}`} aria-hidden="true" />{estado.label}</span>
              </div>
              <div className="mt-2 space-y-1.5">
                {cambio.campos.map(([campo, etiqueta]) => {
                  const anterior = cambio.antes?.[campo] || (campo === 'cantidad' && cambio.antes ? '1' : '');
                  const nuevo = cambio.despues?.[campo] || (campo === 'cantidad' && cambio.despues ? '1' : '');
                  return (
                    <div key={campo} className="grid min-w-0 grid-cols-[76px_minmax(0,1fr)] gap-2 text-[10px]">
                      <span className="font-semibold text-content-3">{etiqueta}</span>
                      <span className="min-w-0 break-words text-content-2">
                        {cambio.tipo === 'modificado' ? <><span className="text-danger">{anterior || '—'}</span><i className="fa-solid fa-arrow-right mx-1 text-[8px] text-content-3" aria-hidden="true" /><span className="font-semibold text-content-1">{nuevo || '—'}</span></> : (cambio.tipo === 'agregado' ? nuevo : anterior) || '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
