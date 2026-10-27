import React, { useState } from 'react';

export default function InlineInventoryField({ bien, campo, valor, etiqueta, onSave }) {
  const [editando, setEditando] = useState(false);
  const [valorTemporal, setValorTemporal] = useState(valor || '');
  const [guardando, setGuardando] = useState(false);

  const cancelar = () => { setValorTemporal(valor || ''); setEditando(false); };
  const guardar = async () => {
    if (guardando) return;
    const siguiente = valorTemporal.trim();
    if (siguiente === String(valor || '').trim()) return cancelar();
    setGuardando(true);
    try { if (await onSave?.(bien, campo, siguiente)) setEditando(false); }
    finally { setGuardando(false); }
  };

  if (!editando) return (
    <span className="group/inline flex min-w-0 items-center gap-1">
      <span className="min-w-0 truncate" title={valor || `Sin ${etiqueta.toLowerCase()}`}>{valor || `Sin ${etiqueta.toLowerCase()}`}</span>
      <button type="button" onClick={() => { setValorTemporal(valor || ''); setEditando(true); }} title={`Editar ${etiqueta.toLowerCase()}`} aria-label={`Editar ${etiqueta.toLowerCase()} de ${bien.rotulo || 'bien'}`} className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-control text-content-3 opacity-0 transition-opacity group-hover/inline:opacity-100 hover:bg-surface-3 hover:text-content-1 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
        <i className="fa-solid fa-pen text-[10px]" aria-hidden="true" />
      </button>
    </span>
  );

  return (
    <span className="inline-flex min-w-0 items-center gap-1" role="group" aria-label={`Editar ${etiqueta}`}>
      <input autoFocus value={valorTemporal} onChange={(e) => setValorTemporal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); guardar(); } if (e.key === 'Escape') cancelar(); }} className="h-8 min-w-0 w-full rounded-control border border-line bg-surface-1 px-2 text-label font-semibold text-content-1 focus:outline-none focus:ring-2 focus:ring-brand/25" aria-label={etiqueta} />
      <button type="button" disabled={guardando} onClick={guardar} title="Guardar" aria-label="Guardar cambio" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-ok-soft text-ok disabled:opacity-50"><i className={`fa-solid ${guardando ? 'fa-circle-notch fa-spin' : 'fa-check'} text-xs`} aria-hidden="true" /></button>
      <button type="button" disabled={guardando} onClick={cancelar} title="Cancelar" aria-label="Cancelar edición" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-content-3 hover:bg-surface-3 disabled:opacity-50"><i className="fa-solid fa-xmark text-xs" aria-hidden="true" /></button>
    </span>
  );
}
