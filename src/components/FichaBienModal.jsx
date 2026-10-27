import Dialogo from './ui/Dialogo';
import React, { useState } from 'react';
import { Button, IconButton, Badge } from './ui';
import { camposIncompletos } from '../utils/dataCompleteness';

const TIPO_TONO = {
  alta: 'ok',
  asignacion: 'brand',
  traslado: 'warn',
  modificacion: 'neutral',
  baja: 'danger',
  otro: 'info',
};

const TIPO_ICONO = {
  alta: 'fa-plus',
  asignacion: 'fa-file-signature',
  traslado: 'fa-truck-fast',
  modificacion: 'fa-pen-to-square',
  baja: 'fa-flag',
  otro: 'fa-circle-info',
};

export default function FichaBienModal({ isOpen, onClose, bien, eventos, formatCurrency, formatDateText, onAgregarFoto, onEliminarFoto, subiendoFoto, esAdmin, STYLES, onVerEnInventario }) {
  const [fotoAmpliada, setFotoAmpliada] = useState(null);
  if (!isOpen || !bien) return null;
  const incompletos = camposIncompletos(bien);
  const Dato = ({ label, value }) => (
    <div className="rounded-control bg-surface-2 dark:bg-surface-1/5 border border-line/60 dark:border-white/10 px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-content-3 dark:text-content-3">{label}</p>
      <p className="text-xs font-bold text-content-1 dark:text-white mt-0.5 truncate" title={String(value ?? '')}>{value || '-'}</p>
    </div>
  );

  return (
    <Dialogo className={STYLES.modalOverlay} onCerrar={onClose}>
      <div className={STYLES.modalContent + " max-w-2xl"} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-5 border-b border-line dark:border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-card bg-surface-2 dark:bg-surface-1/5 text-content-1 dark:text-content-1">
              <i className="fa-solid fa-id-card text-lg"></i>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-content-1 dark:text-white tracking-tight font-mono">
                  {bien.rotulo || 'S/R'}
                </h2>
                {bien.estadoConservacion && (
                  <Badge tono={bien.estadoConservacion === 'De Baja' ? 'danger' : 'ok'} icono={bien.estadoConservacion === 'De Baja' ? 'fa-triangle-exclamation' : 'fa-check'}>
                    {bien.estadoConservacion}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-content-3 dark:text-content-3 mt-0.5 truncate" title={bien.descripcion}>{bien.descripcion || 'Sin descripción'}</p>
            </div>
            <div className="text-right shrink-0 hidden sm:block">
              <p className="text-[10px] font-bold uppercase tracking-widest text-content-3 dark:text-content-3">Valor</p>
              <p className="text-base font-black tabular-nums text-content-1 dark:text-white">Gs. {formatCurrency(bien.valorUnitario || '0')}</p>
            </div>
          </div>
          <IconButton titulo="Cerrar" icono="fa-xmark" variante="ghost" tamano="sm" onClick={onClose} />
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {incompletos.length > 0 && (
            <section aria-label="Datos incompletos del bien" className="rounded-card border border-warn/25 bg-warn-soft px-4 py-3.5">
              <div className="flex items-start gap-3">
                <i className="fa-solid fa-circle-exclamation mt-0.5 text-warn" aria-hidden="true" />
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-warn">Faltan {incompletos.length} datos por completar</h3>
                  <p className="mt-1 text-label leading-relaxed text-content-2">{incompletos.join(' · ')}</p>
                </div>
              </div>
            </section>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <Dato label="Cuenta" value={[bien.cuenta, bien.subcuenta, bien.analitico1, bien.analitico2].filter(Boolean).join('.')} />
            <Dato label="Adquisición" value={bien.fechaAdquisicion ? formatDateText(bien.fechaAdquisicion) : null} />
            <Dato label="Vida útil" value={bien.vidaUtil ? `${bien.vidaUtil} años` : null} />
            <Dato label="Ubicación" value={bien.ubicacion} />
            <Dato label="Responsable" value={bien.funcionario} />
            <Dato label="Dependencia" value={bien.dependencia} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-content-3 dark:text-content-3">
                Evidencia fotográfica · {(bien.fotos || []).length}/5
              </p>
              <label
                className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-control text-xs font-bold motion cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${subiendoFoto ? 'opacity-50 pointer-events-none bg-surface-3 dark:bg-surface-1/10 text-content-3' : 'bg-brand text-content-inverse hover:bg-brand-hover dark:bg-brand dark:hover:bg-brand-hover shadow-sm'}`}
                title="Tomar o subir foto del estado físico"
              >
                <i className={`fa-solid ${subiendoFoto ? 'fa-circle-notch fa-spin' : 'fa-camera'}`}></i>
                {subiendoFoto ? 'Subiendo...' : 'Agregar foto'}
                <input
                  type="file" accept="image/*" capture="environment" className="hidden"
                  disabled={subiendoFoto}
                  onChange={(e) => { if (e.target.files?.[0]) onAgregarFoto(e.target.files[0]); e.target.value = ''; }}
                />
              </label>
            </div>
            {(bien.fotos || []).length === 0 ? (
              <p className="text-xs text-content-3 font-medium rounded-card border border-dashed border-line dark:border-zinc-800 p-5 text-center">
                Sin fotos. Agrega la primera como evidencia del estado físico.
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {(bien.fotos || []).map((f, i) => (
                  <div key={f.url || i} className="relative group/foto rounded-control overflow-hidden border border-line dark:border-zinc-800 bg-surface-3 dark:bg-surface-1/5 aspect-square">
                    <IconButton titulo="Ampliar foto" icono="fa-expand" variante="ghost" tamano="sm" onClick={() => setFotoAmpliada(f.url)} className="w-full h-full absolute inset-0 bg-surface-1/30 dark:bg-white/5" />
                    <img src={f.url} alt={`Foto ${i + 1} del bien`} loading="lazy" decoding="async" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    {esAdmin && (
                      <IconButton
                        titulo="Eliminar foto"
                        icono="fa-xmark"
                        variante="danger"
                        tamano="xs"
                        onClick={() => onEliminarFoto(f)}
                        className="absolute top-1 right-1 h-6 w-6 hidden group-hover/foto:flex"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-content-3 dark:text-content-3 mb-3">
              Trazabilidad · {eventos.length} evento{eventos.length === 1 ? '' : 's'}
            </p>
            {eventos.length === 0 ? (
              <div className="text-center rounded-card border border-dashed border-line dark:border-zinc-800 p-6">
                <i className="fa-solid fa-timeline text-xl text-content-3 dark:text-content-2 mb-2"></i>
                <p className="text-xs text-content-3 font-semibold">Sin movimientos registrados para este bien.</p>
              </div>
            ) : (
              <ol className="relative ml-2 border-l-2 border-line dark:border-white/10">
                {eventos.map((ev, i) => {
                  const tono = TIPO_TONO[ev.tipo] || TIPO_TONO.otro;
                  const icono = TIPO_ICONO[ev.tipo] || TIPO_ICONO.otro;
                  return (
                    <li key={i} className="relative pl-6 pb-5 last:pb-1">
                      <span className={`absolute -left-[7px] top-2 h-3 w-3 rounded-full bg-surface-3 dark:bg-surface-1/5 ring-4 ring-white dark:ring-zinc-900`}></span>
                      <div className="rounded-card border border-line dark:border-white/10 bg-surface-2/60 dark:bg-surface-1/[0.03] px-3.5 py-3 hover:border-line dark:hover:border-white/20 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <Badge tono={tono} icono={icono} className="shrink-0">
                            {ev.titulo}
                          </Badge>
                          <span className="shrink-0 text-[10px] font-bold tabular-nums uppercase tracking-wider text-content-3 dark:text-content-3 bg-surface-1 dark:bg-surface-1/5 border border-line/70 dark:border-white/10 rounded-lg px-2 py-0.5">
                            {ev.fechaFmt || ev.fecha || ''}
                          </span>
                        </div>
                        {ev.detalle && <p className="text-xs text-content-3 dark:text-content-3 mt-2 leading-relaxed pl-[38px]">{ev.detalle}</p>}
                        {ev.usuario && <p className="text-[10px] font-semibold text-content-3 mt-2 pl-[38px]">Registrado por {ev.usuario}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-5 border-t border-line dark:border-zinc-800/80 shrink-0">
          {onVerEnInventario && (
            <Button variante="subtle" tamano="md" icono="fa-boxes-stacked" onClick={() => onVerEnInventario(bien)}>
              Ver en inventario
            </Button>
          )}
          <Button variante="primary" tamano="md" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
      {fotoAmpliada && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-surface-1/90 backdrop-blur-xl animate-fade-in" onClick={() => setFotoAmpliada(null)}>
          <img src={fotoAmpliada} alt="Foto ampliada del bien" className="max-h-[90dvh] max-w-full rounded-panel shadow-2xl object-contain" />
          <IconButton titulo="Cerrar" icono="fa-xmark" variante="ghost" tamano="sm" onClick={() => setFotoAmpliada(null)} className="absolute top-4 right-4 bg-surface-1 text-content-1 border border-line shadow-lg" />
        </div>
      )}
    </Dialogo>
  );
}
