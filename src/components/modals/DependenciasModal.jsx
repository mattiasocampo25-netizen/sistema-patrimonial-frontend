import FiltroCombo from '../FiltroCombo';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Dialogo from '../ui/Dialogo';
import { normalizeStr } from '../../utils/helpers';

// Gestor de dependencias v4: maestro-detalle con búsqueda unificada.
// Mejoras v4:
// - Jerarquía visual más clara entre dependencias oficiales y detectadas.
// - Tarjetas de departamento más limpias y fáciles de leer.
// - Estados de fusión y acciones más visibles.
// - Mejor contraste y accesibilidad en modo oscuro.
export default function DependenciasModal({
  isOpen, onClose, dependencias, detectadas, conteos,
  onSave, onDelete, onFusionar, isSaving,
  dependenciaActual, onVerPadron,
  ubicacionesList, funcionarios,
  onGuardarUbicacion, onEliminarUbicacion, onAsignarFuncionario,
  STYLES
}) {
  const [busqueda, setBusqueda] = useState('');
  const [selId, setSelId] = useState(null);
  const [selDetectada, setSelDetectada] = useState(null);
  const [editDepNombre, setEditDepNombre] = useState('');
  const [editDepCod, setEditDepCod] = useState('');
  const [editandoDep, setEditandoDep] = useState(false);
  const [nuevo, setNuevo] = useState('');
  const [nuevoCod, setNuevoCod] = useState('');
  const [nuevaUbic, setNuevaUbicacion] = useState('');
  const [editUbicId, setEditUbicId] = useState(null);
  const [editUbicNombre, setEditUbicNombre] = useState('');
  const [buscaFunc, setBuscaFunc] = useState('');
  const [vistaDetalle, setVistaDetalle] = useState('departamentos');
  const inicializadaRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      inicializadaRef.current = false;
      return;
    }
    // Inicializar solo al abrir el modal. App recrea algunos arrays en cada
    // render; usarlos como disparador borraba la búsqueda durante la escritura.
    if (!inicializadaRef.current) {
      inicializadaRef.current = true;
      setBusqueda('');
      setEditandoDep(false);
      setNuevo('');
      setNuevaUbicacion('');
      setEditUbicId(null);
      setBuscaFunc('');
      setVistaDetalle('departamentos');
      const actual = dependencias.find(d => d.nombre === dependenciaActual);
      setSelId(actual ? actual.id : (dependencias[0]?.id || null));
      setSelDetectada(null);
    }
  }, [isOpen, dependencias, dependenciaActual]);

  useEffect(() => {
    if (!isOpen || selDetectada || (selId && dependencias.some(d => d.id === selId))) return;
    const actual = dependencias.find(d => d.nombre === dependenciaActual);
    setSelId(actual?.id || dependencias[0]?.id || null);
  }, [isOpen, dependencias, dependenciaActual, selId, selDetectada]);

  const q = useMemo(() => normalizeStr(busqueda), [busqueda]);
  const qfBusca = useMemo(() => normalizeStr(buscaFunc), [buscaFunc]);

  const depsFiltradas = useMemo(
    () => dependencias.filter(d => !q || normalizeStr(d.nombre).includes(q)),
    [dependencias, q]
  );
  const detFiltradas = useMemo(
    () => detectadas.filter(d => !q || normalizeStr(d.nombre).includes(q)),
    [detectadas, q]
  );
  const depSel = useMemo(
    () => dependencias.find(d => d.id === selId) || null,
    [dependencias, selId]
  );
  const detSel = useMemo(
    () => (selDetectada ? detectadas.find(d => d.nombre === selDetectada) : null),
    [detectadas, selDetectada]
  );

  const normDepSel = depSel ? normalizeStr(depSel.nombre) : '';

  const funcsPorUbic = useMemo(() => {
    const mapa = new Map();
    if (!depSel) return mapa;
    for (const f of funcionarios) {
      if (normalizeStr(f.dependencia || '') !== normDepSel) continue;
      const key = normalizeStr(f.ubicacion || '');
      if (!mapa.has(key)) mapa.set(key, []);
      mapa.get(key).push(f);
    }
    return mapa;
  }, [funcionarios, depSel, normDepSel]);

  const funcsDeSel = useMemo(() => {
    if (!depSel) return [];
    return funcionarios.filter(f => normalizeStr(f.dependencia || '') === normDepSel);
  }, [funcionarios, depSel, normDepSel]);

  const ubicsDeSel = useMemo(() => {
    if (!depSel) return [];
    return ubicacionesList.filter(u => normalizeStr(u.dependencia || '') === normDepSel);
  }, [ubicacionesList, depSel, normDepSel]);

  const ubicsFiltradas = useMemo(() => {
    if (!depSel) return [];
    return ubicsDeSel.filter(u => {
      if (!q) return true;
      if (normalizeStr(u.nombre).includes(q)) return true;
      const enUbic = funcsPorUbic.get(normalizeStr(u.nombre)) || [];
      return enUbic.some(f => normalizeStr(`${f.nombre || ''} ${f.cedula || ''}`).includes(q));
    });
  }, [ubicsDeSel, funcsPorUbic, depSel, q]);

  const funcsFiltrados = useMemo(
    () => funcsDeSel.filter(f =>
      !qfBusca || normalizeStr(`${f.nombre || ''} ${f.cedula || ''} ${f.ubicacion || ''}`).includes(qfBusca)
    ),
    [funcsDeSel, qfBusca]
  );

  if (!isOpen) return null;

  const ItemDep = ({ d, detectada }) => {
    const activo = !detectada && selId === d.id && !selDetectada;
    const activoDet = detectada && selDetectada === d.nombre;
    return (
      <button
        onClick={() => {
          if (detectada) { setSelDetectada(d.nombre); setSelId(null); }
          else { setSelId(d.id); setSelDetectada(null); }
        }}
        title={d.nombre}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-control text-left motion cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${ activo || activoDet ? 'bg-brand-soft dark:bg-brand/10 border border-brand/30 border-l-4 border-brand text-content-1 dark:text-white shadow-sm' : 'hover:bg-surface-3 dark:hover:bg-surface-1/5 text-content-1 dark:text-zinc-100 border border-transparent' }`}
      >
        <span className={`flex h-2.5 w-2.5 shrink-0 rounded-full ${detectada ? 'bg-amber-500 ring-1 ring-amber-900/20' : (activo || activoDet ? 'bg-brand ring-1 ring-brand/50' : 'bg-zinc-400 dark:bg-zinc-600 ring-1 ring-zinc-900/10')}`}></span>
        <span className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`flex-1 min-w-0 block text-[13px] font-bold leading-snug truncate ${detectada ? 'text-warn dark:text-amber-400' : 'text-content-1 dark:text-white'}`} title={d.nombre}>
              {d.nombre}
            </span>
            {d.codigo && (
              <span className="flex-shrink-0 font-mono text-[10px] font-bold text-content-3 dark:text-content-3 whitespace-nowrap">
                {d.codigo}
              </span>
            )}
          </div>
          <span className={`block text-[10px] tabular-nums mt-0.5 ${(activo || activoDet) ? 'text-content-2 dark:text-content-3 font-medium' : 'text-content-3 dark:text-content-3'}`}>
            {detectada ? `${d.bienes + d.funcionarios} registros por fusionar` : `${(conteos[d.nombre]?.bienes || 0)} bienes · ${(conteos[d.nombre]?.funcionarios || 0)} func.`}
          </span>
        </span>
      </button>
    );
  };

  return (
    <Dialogo className={STYLES.modalOverlay} onCerrar={onClose}>
      <div className={STYLES.modalContent + " max-w-7xl !max-h-[94dvh] overflow-hidden !rounded-[28px] shadow-2xl"} onClick={(e) => e.stopPropagation()}>
        <div className="relative flex flex-wrap items-center justify-between gap-4 overflow-visible border-b border-line bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 px-5 py-5 text-white sm:px-7">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-inner">
              <i className="fa-solid fa-sitemap text-lg" aria-hidden="true"></i>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-200">Estructura institucional</p>
              <h2 className="mt-0.5 truncate text-xl font-black tracking-tight sm:text-2xl">Dependencias</h2>
              <p className="mt-0.5 text-xs text-slate-300">Organiza departamentos y funcionarios en un solo lugar</p>
            </div>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="relative min-w-0 flex-1 sm:w-[min(36vw,420px)] sm:flex-none">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" aria-hidden="true"></i>
              <input
                type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar dependencia, departamento o funcionario..."
                className="h-11 w-full rounded-2xl border border-white/15 bg-white/10 pl-10 pr-3 text-[13px] font-medium text-white outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-300/30"
              />
            </div>
            <button onClick={onClose} title="Cerrar" aria-label="Cerrar" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              <i className="fa-solid fa-xmark text-base"></i>
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 overflow-hidden bg-surface-2/50 dark:bg-surface-2/30 md:grid-cols-[300px_minmax(0,1fr)]">
          {/* Panel izquierdo: lista de dependencias */}
          <div className="flex max-h-52 min-h-0 flex-col border-b border-line bg-surface-1 p-4 dark:bg-surface-1/80 md:max-h-none md:border-b-0 md:border-r">
            <div className="mb-3 flex items-center justify-between gap-2 px-1">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-content-3">Catálogo</p>
                <h3 className="mt-0.5 text-sm font-black text-content-1 dark:text-white">Unidades</h3>
              </div>
              <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold tabular-nums text-brand-text">{depsFiltradas.length}</span>
            </div>
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-1">
              {depsFiltradas.map(d => <ItemDep key={d.id} d={d} />)}
            {detFiltradas.length > 0 && (
              <>
                <div className="mt-3 border-t border-line px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-warn dark:text-amber-400">
                  Detectadas ({detFiltradas.length})
                </div>
                {detFiltradas.map(d => <ItemDep key={'det-' + d.nombre} d={d} detectada />)}
              </>
            )}
            {(depsFiltradas.length + detFiltradas.length) === 0 && (
              <div className="flex min-h-28 flex-col items-center justify-center rounded-2xl border border-dashed border-line px-4 text-center">
                <i className="fa-solid fa-magnifying-glass text-content-3" aria-hidden="true" />
                <p className="mt-2 text-xs font-semibold text-content-3">No hay coincidencias</p>
              </div>
            )}
            </div>
            <div className="mt-3 rounded-2xl border border-line bg-surface-2/70 p-3 dark:bg-surface-2">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-content-3">Nueva dependencia</p>
              <div className="grid grid-cols-[minmax(0,1fr)_72px_40px] gap-2">
                <input
                  type="text" value={nuevo} onChange={(e) => setNuevo(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && nuevo.trim()) { onSave(null, nuevo.trim(), nuevoCod.trim()); setNuevo(''); setNuevoCod(''); } }}
                  placeholder="Nombre"
                  className="h-10 min-w-0 rounded-xl border border-line bg-surface-1 px-3 text-xs font-medium text-content-1 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 dark:bg-surface-1/5 dark:text-white"
                />
                <input
                  type="text" value={nuevoCod} onChange={(e) => setNuevoCod(e.target.value)}
                  placeholder="Código"
                  className="h-10 min-w-0 rounded-xl border border-line bg-surface-1 px-2 text-center font-mono text-[10px] font-bold text-content-1 outline-none focus:border-brand dark:bg-surface-1/5 dark:text-white"
                />
                <button
                  onClick={() => { if (nuevo.trim()) { onSave(null, nuevo.trim(), nuevoCod.trim()); setNuevo(''); setNuevoCod(''); } }}
                  disabled={isSaving || !nuevo.trim()}
                  title="Agregar dependencia" aria-label="Agregar dependencia"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-content-inverse shadow-sm transition hover:bg-brand-hover active:scale-95 disabled:opacity-40"
                >
                  <i className="fa-solid fa-plus text-xs"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Panel derecho: detalle y gestión */}
          <div className="min-w-0 overflow-y-auto custom-scrollbar p-4 sm:p-6">
            {detSel ? (
              <div className="space-y-6">
                {/* Banner de posible duplicado */}
                <div className="rounded-card border border-amber-200 dark:border-amber-900/30 bg-warn-soft dark:bg-amber-900/10 p-4 flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-amber-100 dark:bg-amber-900/30 text-warn dark:text-amber-300">
                    <i className="fa-solid fa-triangle-exclamation text-sm"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-warn dark:text-amber-400 mb-1">Nombre detectado en datos (posible duplicado)</p>
                    <h3 className="text-base font-bold text-content-1 dark:text-white">{detSel.nombre}</h3>
                    <p className="text-xs text-content-3 dark:text-content-3 mt-1 tabular-nums">{detSel.bienes} bienes · {detSel.funcionarios} funcionarios con este nombre</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <FiltroCombo
                    valor=""
                    opciones={dependencias.map(o => ({ label: o.nombre, value: o.nombre }))}
                    onElegir={(v) => { if (v) onFusionar(detSel.nombre, v); }}
                    etiquetaTodos="Fusionar en..."
                    titulo="Fusionar en una dependencia oficial"
                    ancho="max-w-[280px]"
                  />
                  <button
                    onClick={() => onSave(null, detSel.nombre)}
                    title="Agregar como dependencia oficial"
                    className="h-10 px-4 rounded-control text-[13px] font-bold bg-brand text-content-inverse hover:bg-brand-hover motion cursor-pointer shadow-sm shadow-blue-500/20"
                  >
                    Agregar como oficial
                  </button>
                </div>
              </div>
            ) : depSel ? (
              <div className="space-y-5">
                <div className="rounded-3xl border border-line bg-surface-1 p-5 shadow-sm dark:bg-surface-1/80 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    {editandoDep ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text" value={editDepNombre} autoFocus
                          onChange={(e) => setEditDepNombre(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && editDepNombre.trim()) { onSave(depSel.id, editDepNombre.trim(), editDepCod.trim()); setEditandoDep(false); }
                            if (e.key === 'Escape') setEditandoDep(false);
                          }}
                          className="rounded-control border border-line-strong dark:border-zinc-700 bg-surface-1 dark:bg-surface-2 px-3 h-9 text-sm font-bold outline-none focus:border-brand min-w-0"
                        />
                        <input
                          type="text" value={editDepCod}
                          onChange={(e) => setEditDepCod(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && editDepNombre.trim()) { onSave(depSel.id, editDepNombre.trim(), editDepCod.trim()); setEditandoDep(false); }
                            if (e.key === 'Escape') setEditandoDep(false);
                          }}
                          placeholder="Cód."
                          className="min-w-[56px] rounded-control border border-line-strong dark:border-zinc-700 bg-surface-1 dark:bg-surface-2 px-2 h-9 text-[10px] font-mono font-bold outline-none focus:border-brand text-center"
                        />
                        <button onClick={() => { if (editDepNombre.trim()) { onSave(depSel.id, editDepNombre.trim(), editDepCod.trim()); setEditandoDep(false); } }} title="Guardar" aria-label="Guardar" className="flex h-9 w-9 items-center justify-center rounded-control bg-brand text-content-inverse cursor-pointer shrink-0 transition-colors">
                          <i className="fa-solid fa-check text-xs"></i>
                        </button>
                      </div>
                    ) : (
                      <h3 className="text-xl font-black tracking-tight text-content-1 dark:text-white sm:text-2xl" title={depSel.nombre}>
                        {depSel.nombre}
                        {depSel.codigo && (
                          <span className="flex-shrink-0 font-mono text-[10px] font-bold text-content-3 dark:text-content-3 ml-1.5">
                            {depSel.codigo}
                          </span>
                        )}
                      </h3>
                    )}
                    <p className="mt-1 text-xs text-content-3">Dependencia activa en el catálogo institucional</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => onVerPadron(depSel.nombre)} title="Ver padrón y bienes" className="flex h-10 items-center gap-2 rounded-xl border border-line px-3 text-xs font-bold text-content-2 transition hover:bg-surface-2 dark:text-content-3">
                      <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i><span>Padrón</span>
                    </button>
                    <button onClick={() => { setEditandoDep(true); setEditDepNombre(depSel.nombre); setEditDepCod(depSel.codigo || ''); }} title="Renombrar (actualiza todo)" aria-label="Renombrar (actualiza todo)" className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-content-3 transition hover:bg-surface-2 hover:text-content-1 dark:hover:text-white">
                      <i className="fa-solid fa-pen text-xs"></i>
                    </button>
                    <button onClick={() => onDelete(depSel.id, depSel.nombre)} title="Eliminar (solo si está vacía)" aria-label="Eliminar (solo si está vacía)" className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-content-3 transition hover:border-danger/30 hover:bg-danger-soft hover:text-danger dark:hover:text-rose-400">
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { label: 'Bienes', value: conteos[depSel.nombre]?.bienes || 0, icon: 'fa-boxes-stacked', tone: 'text-brand-text bg-brand-soft' },
                    { label: 'Funcionarios', value: conteos[depSel.nombre]?.funcionarios || 0, icon: 'fa-users', tone: 'text-info bg-info-soft' },
                    { label: 'Departamentos', value: ubicsDeSel.length, icon: 'fa-diagram-project', tone: 'text-ok bg-ok-soft' }
                  ].map(m => (
                    <div key={m.label} className="min-w-0 rounded-2xl border border-line bg-surface-2/60 p-3 dark:bg-surface-2 sm:p-4">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${m.tone}`}><i className={`fa-solid ${m.icon} text-xs`} aria-hidden="true" /></span>
                      <p className="mt-2 truncate text-[10px] font-semibold uppercase tracking-wide text-content-3 sm:text-[11px]">{m.label}</p>
                      <p className="mt-0.5 text-lg font-black tabular-nums text-content-1 dark:text-white">{Number(m.value).toLocaleString('es-PY')}</p>
                    </div>
                  ))}
                </div>
                </div>

                <div className="flex gap-2 rounded-2xl border border-line bg-surface-1 p-1.5 dark:bg-surface-1/80" role="tablist" aria-label="Contenido de la dependencia">
                  <button type="button" role="tab" aria-selected={vistaDetalle === 'departamentos'} onClick={() => setVistaDetalle('departamentos')} className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition sm:text-sm ${vistaDetalle === 'departamentos' ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-950' : 'text-content-3 hover:bg-surface-2 hover:text-content-1'}`}>
                    <i className="fa-solid fa-diagram-project" aria-hidden="true" /> Departamentos <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] tabular-nums dark:bg-white/10">{ubicsDeSel.length}</span>
                  </button>
                  <button type="button" role="tab" aria-selected={vistaDetalle === 'funcionarios'} onClick={() => setVistaDetalle('funcionarios')} className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition sm:text-sm ${vistaDetalle === 'funcionarios' ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-950' : 'text-content-3 hover:bg-surface-2 hover:text-content-1'}`}>
                    <i className="fa-solid fa-users" aria-hidden="true" /> Funcionarios <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] tabular-nums dark:bg-white/10">{funcsDeSel.length}</span>
                  </button>
                </div>

                {vistaDetalle === 'departamentos' && <div className="rounded-3xl border border-line bg-surface-1 p-4 shadow-sm dark:bg-surface-1/80 sm:p-5">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand-text"><i className="fa-solid fa-diagram-project" aria-hidden="true" /></span>
                    <div><h4 className="text-sm font-black text-content-1 dark:text-white">Departamentos</h4><p className="text-[11px] text-content-3">Espacios dentro de esta dependencia</p></div>
                  </div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <input
                      type="text" value={nuevaUbic} onChange={(e) => setNuevaUbicacion(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && nuevaUbic.trim()) { onGuardarUbicacion(null, nuevaUbic.trim(), depSel.nombre); setNuevaUbicacion(''); } }}
                      placeholder={`Nuevo departamento en ${depSel.nombre}...`}
                      className="h-11 flex-1 rounded-xl border border-line bg-surface-2 px-4 text-[13px] font-medium outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15 placeholder:text-content-3 dark:bg-surface-2"
                    />
                    <button
                      onClick={() => { if (nuevaUbic.trim()) { onGuardarUbicacion(null, nuevaUbic.trim(), depSel.nombre); setNuevaUbicacion(''); } }}
                      disabled={isSaving || !nuevaUbic.trim()}
                      title="Agregar departamento" aria-label="Agregar departamento"
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-content-inverse shadow-sm transition hover:bg-brand-hover active:scale-95 disabled:opacity-40"
                    >
                      <i className="fa-solid fa-plus text-xs"></i>
                    </button>
                  </div>
                  <div className="grid gap-3 xl:grid-cols-2">
                    {ubicsFiltradas.map(u => (
                      <TarjetaDepartamento
                        key={u.id}
                        u={u}
                        asignados={funcsPorUbic.get(normalizeStr(u.nombre)) || []}
                        candidatos={funcsDeSel}
                        onAsignarFuncionario={onAsignarFuncionario}
                        onGuardarUbicacion={onGuardarUbicacion}
                        onEliminarUbicacion={onEliminarUbicacion}
                        depNombre={depSel.nombre}
                        editando={editUbicId === u.id}
                        editNombre={editUbicNombre}
                        onEditNombre={setEditUbicNombre}
                        onEmpezarEditar={() => { setEditUbicId(u.id); setEditUbicNombre(u.nombre); }}
                        onTerminarEditar={() => setEditUbicId(null)}
                      />
                    ))}
                    {ubicsFiltradas.length === 0 && (
                      <p className="text-xs text-content-3 font-medium text-center py-3">Sin departamentos aquí. Agrega el primero arriba.</p>
                    )}
                  </div>
                </div>}

                {vistaDetalle === 'funcionarios' && <div className="rounded-3xl border border-line bg-surface-1 p-4 shadow-sm dark:bg-surface-1/80 sm:p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-info-soft text-info"><i className="fa-solid fa-users" aria-hidden="true" /></span>
                      <div><h4 className="text-sm font-black text-content-1 dark:text-white">Funcionarios</h4><p className="text-[11px] text-content-3">Asigna a cada persona a un departamento</p></div>
                    </div>
                    <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-bold tabular-nums text-content-2">{funcsFiltrados.length} visibles</span>
                  </div>
                  <div className="relative mb-3">
                    <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-content-3 text-xs pointer-events-none"></i>
                    <input
                      type="text" value={buscaFunc} onChange={(e) => setBuscaFunc(e.target.value)}
                      placeholder="Buscar funcionario por nombre o cédula..."
                      className="h-11 w-full rounded-xl border border-line bg-surface-2 pl-10 pr-3 text-[13px] font-medium outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15 placeholder:text-content-3 dark:bg-surface-2"
                    />
                  </div>
                  <div className="max-h-[52vh] overflow-y-auto custom-scrollbar rounded-2xl border border-line divide-y divide-line/60 dark:divide-white/5">
                    {funcsFiltrados.slice(0, 60).map(f => (
                      <div key={f.id} className="flex items-center gap-3 px-3.5 py-3 transition hover:bg-surface-2/60">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-info-soft text-info font-black text-sm">
                          {(f.nombre || '?').charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-bold text-content-1 dark:text-zinc-200 truncate" title={f.nombre}>{f.nombre}</span>
                          <span className="block text-[11px] text-content-3 truncate tabular-nums">CI {f.cedula || 'S/C'}{f.ubicacion ? ` · ${f.ubicacion}` : ' · Sin ubicación'}</span>
                        </span>
                        <ComboUbicacion
                          valor={f.ubicacion || ''}
                          ubicaciones={ubicsDeSel}
                          onElegir={(nombreUbic) => onAsignarFuncionario(f.id, nombreUbic)}
                          titulo="Cambiar departamento"
                          compacto
                        />
                      </div>
                    ))}
                    {funcsFiltrados.length > 60 && (
                      <p className="px-3.5 py-2 text-[11px] font-semibold text-content-3 text-center">
                        Mostrando 60 de {funcsFiltrados.length}. Afina la búsqueda para ver más.
                      </p>
                    )}
                    {funcsFiltrados.length === 0 && (
                      <p className="px-3.5 py-4 text-xs font-semibold text-content-3 text-center">Sin coincidencias.</p>
                    )}
                  </div>
                </div>}
              </div>
            ) : (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8">
                <i className="fa-solid fa-building-columns text-3xl text-zinc-200 dark:text-content-1 mb-3"></i>
                <p className="text-sm font-bold text-content-3">Elige una dependencia a la izquierda</p>
                <p className="text-xs text-content-3 mt-1">Verás sus departamentos y funcionarios para gestionarlos.</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-line bg-surface-1 px-5 py-3 dark:bg-surface-1/80 sm:px-7">
          <button onClick={onClose} className="h-10 rounded-xl bg-slate-900 px-5 text-[13px] font-bold text-white transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
            Listo
          </button>
        </div>
      </div>
    </Dialogo>
  );
}

// Tarjeta de departamento memoizada: solo se re-renderiza si cambian sus
// propios datos, no cuando se escribe en otro buscador.
const TarjetaDepartamento = React.memo(function TarjetaDepartamento({
  u, asignados, candidatos, onAsignarFuncionario,
  onGuardarUbicacion, onEliminarUbicacion, depNombre,
  editando, editNombre, onEditNombre, onEmpezarEditar, onTerminarEditar
}) {
  return (
    <div className="rounded-card bg-surface-2 dark:bg-surface-1/[0.03] border border-line/70 dark:border-white/10 px-3.5 py-2.5">
      <div className="flex items-center gap-2">
        {editando ? (
          <>
            <input
              type="text" value={editNombre} autoFocus
              onChange={(e) => onEditNombre(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && editNombre.trim()) { onGuardarUbicacion(u.id, editNombre.trim(), depNombre); onTerminarEditar(); }
                if (e.key === 'Escape') onTerminarEditar();
              }}
              className="flex-1 rounded-lg border border-line-strong dark:border-zinc-700 bg-surface-1 dark:bg-surface-2 px-2 h-8 text-xs font-medium outline-none focus:border-brand"
            />
            <button onClick={() => { if (editNombre.trim()) { onGuardarUbicacion(u.id, editNombre.trim(), depNombre); onTerminarEditar(); } }} title="Guardar" aria-label="Guardar" className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-content-inverse cursor-pointer shrink-0 transition-colors">
              <i className="fa-solid fa-check text-[10px]"></i>
            </button>
          </>
        ) : (
          <>
            <span className="flex-1 min-w-0 text-[13px] font-bold text-content-1 dark:text-zinc-200 leading-snug text-balance" title={u.nombre}>{u.nombre}</span>
            <span className="text-[10px] tabular-nums text-content-3 shrink-0">{asignados.length} func.</span>
            <button onClick={onEmpezarEditar} title="Renombrar" aria-label="Renombrar" className="flex h-7 w-7 items-center justify-center rounded-lg text-content-3 hover:text-content-1 hover:bg-surface-3/70 dark:hover:text-white dark:hover:bg-surface-1/10 cursor-pointer shrink-0">
              <i className="fa-solid fa-pen text-[10px]"></i>
            </button>
            <button onClick={() => onEliminarUbicacion(u.id, u.nombre)} title="Eliminar" aria-label="Eliminar" className="flex h-7 w-7 items-center justify-center rounded-lg text-content-3 hover:text-danger hover:bg-danger-soft dark:hover:text-rose-400 dark:hover:bg-rose-500/10 cursor-pointer shrink-0">
              <i className="fa-solid fa-trash-can text-[10px]"></i>
            </button>
          </>
        )}
      </div>
      {asignados.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {asignados.map(f => (
            <span key={f.id} className="inline-flex items-center gap-1 rounded-lg bg-surface-1 dark:bg-surface-1/10 border border-line/70 dark:border-white/10 px-2 py-0.5 text-[10px] font-bold text-content-2 dark:text-content-3" title={`${f.nombre} · CI ${f.cedula || 'S/C'}`}>
              <span className="max-w-[180px] truncate">{f.nombre}</span>
              <button onClick={() => onAsignarFuncionario(f.id, '')} title={`Quitar a ${f.nombre} de ${u.nombre}`} className="text-content-3 hover:text-danger cursor-pointer shrink-0">
                <i className="fa-solid fa-xmark text-[9px]"></i>
              </button>
            </span>
          ))}
        </div>
      )}
      <ComboFuncionarios
        candidatos={candidatos}
        excluirUbicacion={u.nombre}
        onElegir={(id) => onAsignarFuncionario(id, u.nombre)}
        titulo={`Asignar funcionario a ${u.nombre}`}
      />
    </div>
  );
});

// Combo con buscador para asignar funcionarios: reemplaza al select nativo.
function ComboFuncionarios({ candidatos, excluirUbicacion, onElegir, titulo }) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const cajaRef = useRef(null);

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e) => { if (cajaRef.current && !cajaRef.current.contains(e.target)) setAbierto(false); };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, [abierto]);

  const normExcluir = normalizeStr(excluirUbicacion || '');
  const q = normalizeStr(texto);
  const lista = useMemo(() => {
    const base = candidatos.filter(f => normalizeStr(f.ubicacion || '') !== normExcluir);
    if (!q) return base;
    return base.filter(f => normalizeStr(`${f.nombre || ''} ${f.cedula || ''}`).includes(q));
  }, [candidatos, normExcluir, q]);

  return (
    <div ref={cajaRef} className="mt-1.5">
      {!abierto ? (
        <button
          onClick={() => { setTexto(''); setAbierto(true); }}
          title={titulo}
          className="w-full h-8 rounded-lg border border-dashed border-line-strong dark:border-zinc-700 bg-transparent px-2 text-[11px] font-semibold text-content-3 hover:text-content-2 dark:hover:text-zinc-200 hover:border-zinc-400 text-left outline-none cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-brand"
        >
          <i className="fa-solid fa-plus mr-1.5 text-[9px]"></i>
          Asignar funcionario ({candidatos.filter(f => normalizeStr(f.ubicacion || '') !== normExcluir).length} disponibles)...
        </button>
      ) : (
        <div className="rounded-lg border border-line-strong dark:border-zinc-600 bg-surface-1 dark:bg-surface-2 overflow-hidden">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-content-3 text-[10px] pointer-events-none"></i>
            <input
              autoFocus
              type="text" value={texto} onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setAbierto(false);
                if (e.key === 'Enter' && lista.length > 0) { onElegir(lista[0].id); setAbierto(false); }
              }}
              placeholder="Escribe para buscar por nombre o cédula..."
              className="w-full h-8 pl-8 pr-2 text-[11px] font-semibold outline-none bg-transparent text-content-1 dark:text-zinc-200 placeholder:text-content-3 placeholder:font-normal"
            />
          </div>
          <div className="max-h-44 overflow-y-auto custom-scrollbar border-t border-line dark:border-white/10">
            {lista.slice(0, 50).map(f => (
              <button
                key={f.id}
                onClick={() => { onElegir(f.id); setAbierto(false); }}
                title={`${f.nombre} · CI ${f.cedula || 'S/C'}`}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-brand/10 dark:hover:bg-brand/20 transition-colors cursor-pointer"
              >
                <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-content-1 dark:text-zinc-200">{f.nombre}</span>
                <span className="shrink-0 text-[10px] tabular-nums text-content-3">CI {f.cedula || 'S/C'}</span>
              </button>
            ))}
            {lista.length === 0 && (
              <p className="px-2.5 py-2 text-[11px] font-semibold text-content-3">Sin coincidencias.</p>
            )}
            {lista.length > 50 && (
              <p className="px-2.5 py-1.5 text-[10px] font-semibold text-content-3 border-t border-line dark:border-white/10">
                {lista.length - 50} más… afina la búsqueda.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Combo con buscador para cambiar el departamento de un funcionario.
function ComboUbicacion({ valor, ubicaciones, onElegir, titulo, compacto }) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const cajaRef = useRef(null);

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e) => { if (cajaRef.current && !cajaRef.current.contains(e.target)) setAbierto(false); };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, [abierto]);

  const q = normalizeStr(texto);
  const lista = useMemo(() => {
    if (!q) return ubicaciones;
    return ubicaciones.filter(u => normalizeStr(u.nombre).includes(q));
  }, [ubicaciones, q]);
  const actual = ubicaciones.find(u => u.nombre === valor);

  return (
    <div ref={cajaRef} className={`relative shrink-0 ${compacto ? 'w-[170px]' : 'w-full'}`}>
      <button
        onClick={() => { setTexto(''); setAbierto(v => !v); }}
        title={titulo}
        className="w-full h-8 rounded-lg border border-line dark:border-zinc-700 bg-surface-1 dark:bg-surface-2 px-2 text-[11px] font-semibold text-content-2 dark:text-content-3 outline-none cursor-pointer flex items-center gap-1.5 hover:border-line-strong focus-visible:ring-2 focus-visible:ring-brand"
      >
        <span className="flex-1 min-w-0 truncate text-left">{actual ? actual.nombre : 'Sin ubicación'}</span>
        <i className="fa-solid fa-chevron-down text-[9px] text-content-3 shrink-0"></i>
      </button>
      {abierto && (
        <div className="absolute right-0 z-30 mt-1 w-56 rounded-control border border-line dark:border-zinc-700 bg-surface-1 dark:bg-surface-2 shadow-xl overflow-hidden">
          <input
            autoFocus
            type="text" value={texto} onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') setAbierto(false); }}
            placeholder="Buscar departamento..."
            className="w-full h-8 px-2.5 text-[11px] font-semibold outline-none bg-transparent text-content-1 dark:text-zinc-200 placeholder:text-content-3 placeholder:font-normal"
          />
          <div className="max-h-44 overflow-y-auto custom-scrollbar border-t border-line dark:border-white/10">
            <button
              onClick={() => { onElegir(''); setAbierto(false); }}
              className="w-full px-2.5 py-1.5 text-left text-[11px] font-bold text-content-3 hover:bg-surface-3 dark:hover:bg-surface-1/10 cursor-pointer"
            >
              Sin ubicación
            </button>
            {lista.map(u => (
              <button
                key={u.id}
                onClick={() => { onElegir(u.nombre); setAbierto(false); }}
                title={u.nombre}
                className={`w-full px-2.5 py-1.5 text-left text-[11px] font-bold truncate cursor-pointer hover:bg-brand/10 dark:hover:bg-brand/20 ${u.nombre === valor ? 'text-brand-text dark:text-brand' : 'text-content-1 dark:text-zinc-200'}`}
              >
                {u.nombre}
              </button>
            ))}
            {lista.length === 0 && (
              <p className="px-2.5 py-2 text-[11px] font-semibold text-content-3">Sin coincidencias.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
