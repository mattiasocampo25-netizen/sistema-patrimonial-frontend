import React from 'react';
import { formatCurrency, formatDateText } from '../utils/helpers';

// Comparador lado a lado de 2 o 3 bienes seleccionados.
export default function CompararBienesModal({ bienes = [], onClose, STYLES }) {
  if (!bienes || bienes.length === 0) return null;
  const filas = [
    ['Rótulo', b => b.rotulo || 'S/R'],
    ['Descripción', b => b.descripcion || '-'],
    ['Cuenta', b => [b.cuenta, b.subcuenta, b.analitico1, b.analitico2].filter(Boolean).join(' · ') || '-'],
    ['Valor (Gs.)', b => (b.valorUnitario ? formatCurrency(b.valorUnitario) : '-')],
    ['Custodio', b => b.funcionario || 'Sin asignación'],
    ['Ubicación', b => b.ubicacion || 'Sin ubicación'],
    ['Estado', b => b.estadoConservacion || '-'],
    ['Adquisición', b => (b.fechaAdquisicion ? formatDateText(b.fechaAdquisicion) : '-')],
    ['Vida útil', b => (b.vidaUtil ? `${b.vidaUtil} años` : '-')],
    ['FC-10', b => (b.hasFC10 ? 'Con acta' : 'Sin acta')],
    ['QR', b => (b.hasQR ? 'Con QR' : 'Sin QR')],
  ];
  return (
    <div className={STYLES.modalOverlay} onClick={onClose}>
      <div className={STYLES.modalContent + ' max-w-3xl'} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Comparar bienes">
        <div className="flex justify-between items-center px-6 py-5 border-b border-line dark:border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-surface-3 dark:bg-surface-1/10 text-content-1 dark:text-white">
              <i className="fa-solid fa-columns-compare text-base"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold text-content-1 dark:text-white tracking-tight">Comparar bienes ({bienes.length})</h2>
              <p className="text-xs text-content-3 dark:text-content-3 mt-0.5">Diferencias lado a lado</p>
            </div>
          </div>
          <button onClick={onClose} title="Cerrar" aria-label="Cerrar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-content-3 hover:text-content-1 dark:hover:text-zinc-200 hover:bg-surface-3 dark:hover:bg-surface-1/10 transition-colors cursor-pointer">
            <i className="fa-solid fa-xmark text-base"></i>
          </button>
        </div>
        <div className="p-6 overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[520px]">
            <thead>
              <tr>
                <th className="p-3 text-[11px] font-bold uppercase tracking-wider text-content-3 w-32">Atributo</th>
                {bienes.map(b => (
                  <th key={b.id} className="p-3 font-mono text-xs font-bold text-content-1 dark:text-white">{b.rotulo || 'S/R'}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
              {filas.map(([label, get]) => {
                const vals = bienes.map(get);
                const difieren = new Set(vals).size > 1;
                return (
                  <tr key={label} className={difieren ? 'bg-amber-500/[0.06]' : ''}>
                    <td className="p-3 text-[11px] font-bold uppercase tracking-wider text-content-3">{label}</td>
                    {vals.map((v, i) => (
                      <td key={bienes[i].id} className={`p-3 text-[13px] font-semibold ${difieren ? 'text-amber-700 dark:text-amber-300' : 'text-content-1 dark:text-zinc-200'}`}>{v}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end px-6 py-4 border-t border-line dark:border-zinc-800/80 shrink-0">
          <button onClick={onClose} className="h-10 px-5 rounded-control bg-zinc-900 dark:bg-surface-1 text-white dark:text-content-1 font-bold text-[13px] hover:bg-zinc-700 dark:hover:bg-surface-3 motion cursor-pointer">Cerrar</button>
        </div>
      </div>
    </div>
  );
}
