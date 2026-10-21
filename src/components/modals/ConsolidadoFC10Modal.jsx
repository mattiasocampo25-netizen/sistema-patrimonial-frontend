import React, { useState } from 'react';
import { formatCI, normalizeStr } from '../../utils/helpers';

export default function ConsolidadoFC10Modal({ isOpen, onClose, bienes, dependenciaActual, funcionariosPadron, handleGenerateConsolidatedFC10PDF, STYLES }) {
    const [searchConsolidadoModal, setSearchConsolidadoModal] = useState('');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    
    if (!isOpen) return null;

    return (
        <div className={STYLES.modalOverlay}>
            <div className={STYLES.modalContent + " max-w-2xl"}>
                
                <div className="px-8 py-6 border-b border-line dark:border-zinc-800 bg-surface-1 dark:bg-zinc-900 flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-card bg-surface-3 dark:bg-surface-1/10 text-content-1 dark:text-white shrink-0">
                            <i className="fa-solid fa-file-lines text-lg"></i>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold tracking-tight text-content-1 dark:text-white">Actas FC-10 Consolidadas</h2>
                            <p className="text-xs text-content-3 dark:text-content-3 mt-0.5">Seleccione o busque un funcionario para generar su acta agrupada en {dependenciaActual}</p>
                        </div>
                    </div>
                    <button title="Cerrar" aria-label="Cerrar" onClick={() => { onClose(); setSearchConsolidadoModal(''); }} className="flex h-9 w-9 items-center justify-center rounded-control text-content-3 hover:text-content-1 dark:hover:text-white hover:bg-surface-3 dark:hover:bg-surface-1/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary transition-colors cursor-pointer shrink-0">
                        <i className="fa-solid fa-xmark text-base"></i>
                    </button>
                </div>

                <div className="px-8 pt-6 pb-4 bg-surface-1 dark:bg-zinc-900 flex flex-col gap-4 border-b border-line dark:border-zinc-800">
                    <div className="relative">
                        <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-content-3 text-xs"></i>
                        <input 
                            type="text"
                            placeholder="Buscar por nombre o número de cédula..."
                            value={searchConsolidadoModal}
                            onChange={(e) => setSearchConsolidadoModal(e.target.value)}
                            className="block w-full rounded-control border border-line dark:border-zinc-800 bg-surface-2/50 dark:bg-zinc-950 py-3 pl-11 pr-4 text-xs font-bold text-content-1 dark:text-white placeholder:text-content-3 focus:border-brand-primary focus:bg-surface-1 dark:focus:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary outline-none transition-all"
                        />
                    </div>
                    
                    {/* FILTRO DE FECHAS */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-content-3 dark:text-content-3 mb-2">Bienes asignados Desde</label>
                            <input 
                                type="date" 
                                value={fechaDesde} 
                                onChange={(e) => setFechaDesde(e.target.value)} 
                                className="block w-full rounded-control border border-line dark:border-zinc-800 bg-surface-2/50 dark:bg-zinc-950 py-2.5 px-4 text-xs font-bold text-content-1 dark:text-white outline-none cursor-pointer tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary" 
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-content-3 dark:text-content-3 mb-2">Bienes asignados Hasta</label>
                            <input 
                                type="date" 
                                value={fechaHasta} 
                                onChange={(e) => setFechaHasta(e.target.value)} 
                                className="block w-full rounded-control border border-line dark:border-zinc-800 bg-surface-2/50 dark:bg-zinc-950 py-2.5 px-4 text-xs font-bold text-content-1 dark:text-white outline-none cursor-pointer tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary" 
                            />
                        </div>
                    </div>
                </div>

                <div className="p-8 pt-4 max-h-[300px] overflow-y-auto space-y-3 custom-scrollbar bg-surface-1 dark:bg-zinc-900">
                    {Array.from(new Set(
                        bienes.filter(b => b.dependencia === dependenciaActual && b.funcionario && b.estadoConservacion !== 'De Baja')
                              .map(b => b.funcionario)
                    ))
                    .filter(funcNombre => {
                        if (!searchConsolidadoModal || !searchConsolidadoModal.trim()) return true;
                        const termino = String(searchConsolidadoModal || '').toLowerCase().trim();
                        const infoPadron = funcionariosPadron.find(f => f.dependencia === dependenciaActual && normalizeStr(f.nombre) === normalizeStr(funcNombre));
                        const cedulaStr = infoPadron ? String(infoPadron.cedula || '').toLowerCase() : '';
                        return String(funcNombre || '').toLowerCase().includes(termino) || cedulaStr.includes(termino);
                    })
                    .map(funcNombre => {
                        let bienesFiltrados = bienes.filter(b => b.dependencia === dependenciaActual && normalizeStr(b.funcionario) === normalizeStr(funcNombre) && b.estadoConservacion !== 'De Baja');
                        
                        // Validar conteo visual con las fechas seleccionadas
                        if (fechaDesde) bienesFiltrados = bienesFiltrados.filter(b => b.fechaAdquisicion >= fechaDesde);
                        if (fechaHasta) bienesFiltrados = bienesFiltrados.filter(b => b.fechaAdquisicion <= fechaHasta);

                        const infoPadron = funcionariosPadron.find(f => f.dependencia === dependenciaActual && normalizeStr(f.nombre) === normalizeStr(funcNombre));

                        return (
                            <div key={funcNombre} className="flex items-center justify-between p-4 rounded-card bg-surface-2 dark:bg-zinc-950 border border-line/80 dark:border-zinc-800 hover:border-line-strong dark:hover:border-white/20 transition-all">
                                <div className="space-y-1">
                                    <p className="text-sm font-black text-content-1 dark:text-white">{funcNombre}</p>
                                    <p className="text-xs font-bold text-content-3 tabular-nums">
                                        C.I: {infoPadron ? formatCI(infoPadron.cedula) : 'S/D'} • <span className="text-content-1 dark:text-white">{bienesFiltrados.length} bienes encontrados</span>
                                    </p>
                                </div>
                                <button 
                                    onClick={() => handleGenerateConsolidatedFC10PDF(funcNombre, fechaDesde, fechaHasta)}
                                    disabled={bienesFiltrados.length === 0}
                                    className="inline-flex items-center justify-center gap-2 bg-zinc-900 dark:bg-surface-1 text-white dark:text-content-1 font-bold text-[13px] h-10 px-5 rounded-control hover:bg-zinc-800 dark:hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary transition-all active:scale-95 cursor-pointer disabled:opacity-50 tabular-nums"
                                >
                                    <i className="fa-solid fa-print"></i> Generar Acta
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-end px-8 py-5 border-t border-line dark:border-zinc-800 bg-surface-2/50 dark:bg-zinc-900">
                    <button onClick={() => { onClose(); setSearchConsolidadoModal(''); }} className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-control text-[13px] font-semibold text-content-2 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-1/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary transition-all active:scale-95 cursor-pointer">Cerrar</button>
                </div>
            </div>
        </div>
    );
}
