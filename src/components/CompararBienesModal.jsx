import React from 'react';
import Dialogo from './ui/Dialogo';
import { IconButton, Button } from './ui';
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
    <Dialogo className={STYLES.modalOverlay} onCerrar={onClose}>
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
          <IconButton titulo="Cerrar" icono="fa-xmark" variante="ghost" tamano="sm" onClick={onClose} />
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
                  <tr key={label} className={difieren ? 'bg-warn-soft' : ''}>
                    <td className="p-3 text-[11px] font-bold uppercase tracking-wider text-content-3">{label}</td>
                    {vals.map((v, i) => (
                      <td key={bienes[i].id} className={`p-3 text-[13px] font-semibold ${difieren ? 'text-warn dark:text-amber-300' : 'text-content-1 dark:text-zinc-200'}`}>{v}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end px-6 py-4 border-t border-line dark:border-zinc-800/80 shrink-0">
          <Button variante="primary" tamano="md" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Dialogo>
  );
}
