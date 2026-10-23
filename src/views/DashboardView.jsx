import React, { useState, useMemo } from 'react';
import AnimatedNumber from '../components/AnimatedNumber';
import SimpleBar from '../components/SimpleBar';
import { pendienteDeFirma } from '../utils/fc10Firmas';
import { Card, Tile } from '../components/ui';
import { getLogoPorDependencia } from '../utils/helpers';
import { useResumenDependencias } from '../hooks/useResumenDependencias';

// Vista del panel principal (extraída de App.jsx, Fase 5).
export default function DashboardView({
  currentUser, dependenciaActual, saludoBienvenida, stats, pendientes, isLoading,
  timeStats, clearAllFilters, setActiveTab,
  setFiltroQR, setFiltroFC10, setFiltroPendiente, setFiltroAnio, setCurrentPage,
  setBienEditing, setIsBienModalOpen, fileInputRef, handleExportInventarioCSV,
  setIsBulkQR, setQrTargetBien, setIsQRModalOpen, openFC03Modal,
  setFc10Year, setFc10Month,
  fc10List, bienes, requestDependenciaChange
}) {
  const actasPorFirmar = useMemo(() => (fc10List || [])
    .filter(fc => !fc.devolucionFecha && pendienteDeFirma(fc))
    .map(fc => ({ fc, bien: (bienes || []).find(b => b.id === fc.bienId) || null, pendiente: pendienteDeFirma(fc) }))
    .sort((a, b) => (a.pendiente.orden - b.pendiente.orden)
      || String(a.fc.entregadoFecha || '').localeCompare(String(b.fc.entregadoFecha || ''))), [fc10List, bienes]);

  const irInventario = (aplicar) => {
    clearAllFilters();
    if (aplicar) aplicar();
    if (setCurrentPage) setCurrentPage(1);
    setActiveTab('inventario');
  };

  const [widgets, setWidgets] = useState(() => {
    try { return { metricas: true, pendientes: true, accesos: true, tendencias: true, ...JSON.parse(localStorage.getItem('dash_widgets') || '{}') }; }
    catch { return { metricas: true, pendientes: true, accesos: true, tendencias: true }; }
  });
  const [menuWidgets, setMenuWidgets] = useState(false);
  const alternarWidget = (k) => {
    setWidgets(prev => {
      const n = { ...prev, [k]: !prev[k] };
      try { localStorage.setItem('dash_widgets', JSON.stringify(n)); } catch {}
      return n;
    });
  };
  const WIDGETS = [['metricas', 'Métricas'], ['pendientes', 'Pendientes'], ['accesos', 'Accesos'], ['tendencias', 'Tendencias']];

  // Tarjetas de métrica con diseño consistente y simétrico
  const METRIC_CARDS = [
    {
      id: 'activos',
      label: 'Bienes Activos',
      valor: stats.totalItems,
      sublabel: 'Total en ' + dependenciaActual,
      icon: 'fa-boxes-stacked',
      iconBg: 'bg-brand-soft',
      iconColor: 'text-brand-text',
      border: 'border-line',
      hoverBorder: 'hover:border-line-strong',
      ring: 'focus-visible:ring-brand',
      numero: <AnimatedNumber value={stats.totalItems} />,
      onClick: () => { clearAllFilters(); setActiveTab('inventario'); },
      showProgress: false,
    },
    {
      id: 'qr',
      label: 'Bienes con QR',
      valor: stats.withQR,
      total: stats.totalItems,
      sublabel: stats.withQR + ' de ' + Number(stats.totalItems || 0).toLocaleString('es-PY') + ' con código',
      icon: 'fa-qrcode',
      iconBg: 'bg-violet-500/10 backdrop-blur border border-violet-500/25',
      iconColor: 'text-violet-600 dark:text-violet-300',
      border: 'border-line',
      hoverBorder: 'hover:border-line-strong',
      ring: 'focus-visible:ring-brand',
      numero: <><AnimatedNumber value={stats.withQR} /><span className="text-base text-content-3 font-semibold"> / {Number(stats.totalItems || 0).toLocaleString('es-PY')}</span></>,
      onClick: () => irInventario(() => setFiltroQR('YES')),
      showProgress: true,
      pct: stats.percQR || 0,
      progressColor: 'bg-violet-500',
    },
    {
      id: 'sin-fc10',
      label: 'Sin FC-10',
      valor: stats.withoutFc10,
      sublabel: stats.fc10Pendientes > 0
        ? stats.fc10Pendientes + ' en firma · ' + Math.max(0, stats.withoutFc10 - stats.fc10Pendientes) + ' sin acta'
        : 'Pendientes de asignación',
      subColor: 'text-brand-text dark:text-brand',
      icon: 'fa-file-signature',
      iconBg: 'bg-brand text-content-inverse',
      iconColor: 'text-content-inverse',
      border: 'border-brand/20 dark:border-brand/25',
      hoverBorder: 'hover:border-brand/40 dark:hover:border-brand/45',
      ring: 'focus-visible:ring-brand',
      numero: <AnimatedNumber value={stats.withoutFc10} />,
      onClick: () => irInventario(() => setFiltroFC10('NO')),
      showProgress: false,
    },
    {
      id: 'pendiente-qr',
      label: 'Pendiente QR',
      valor: stats.withoutQR,
      sublabel: 'Sin etiqueta generada',
      icon: 'fa-triangle-exclamation',
      iconBg: 'bg-rose-500 text-white',
      iconColor: 'text-white',
      border: 'border-rose-200/80 dark:border-rose-500/35',
      hoverBorder: 'hover:border-rose-300 dark:hover:border-rose-500/40',
      ring: 'focus-visible:ring-rose-500',
      numero: <AnimatedNumber value={stats.withoutQR} />,
      onClick: () => irInventario(() => setFiltroQR('NO')),
      showProgress: false,
    },
  ];

  // Tiles por dependencia. El resumen (total, buenos, valor) lo calcula el
  // servidor con el RPC resumen_por_dependencia: traer las 13.673 filas al
  // navegador para sacar ocho numeros no tiene sentido (egress y row budget).
  const { resumen: resumenDependencias } = useResumenDependencias();
  const tilesPorDependencia = useMemo(
    () =>
      (resumenDependencias || []).map((r, i) => ({
        dep: r.dependencia,
        indice: i,
        total: Number(r.total) || 0,
        buenos: Number(r.buenos) || 0,
        pctBueno: Number(r.total) ? (Number(r.buenos) / Number(r.total)) * 100 : 0,
        logo: getLogoPorDependencia(r.dependencia, 'webp')
      })),
    [resumenDependencias]
  );

  return (
    <div className="dashboard-stagger space-y-6 sm:space-y-7 pb-16">

      {/* 1. ENCABEZADO DE PÁGINA */}
      <Card className="dashboard-welcome-card p-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex h-13 w-13 sm:h-15 sm:w-15 shrink-0 items-center justify-center rounded-card bg-brand-soft text-brand-text font-bold text-xl sm:text-2xl shadow-card dep-accent-ring">
            {currentUser?.nombre ? currentUser.nombre.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-content-3 dark:text-content-3 truncate">
              Panel General · {dependenciaActual}
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-content-1 dark:text-white tracking-tight truncate mt-0.5">
              {saludoBienvenida}, {currentUser?.nombre || 'Usuario'}!
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <div className="relative">
            <button
              onClick={() => setMenuWidgets(v => !v)}
              title="Personalizar panel" aria-label="Personalizar panel"
              className="flex items-center gap-2 h-11 px-4 rounded-card bg-surface-1 dark:bg-surface-1/5 border border-line/80 dark:border-white/10 shadow-sm text-[13px] font-bold text-content-2 dark:text-content-3 hover:bg-surface-2 dark:hover:bg-surface-1/10 motion cursor-pointer"
            >
              <i className="fa-solid fa-sliders text-xs"></i> <span className="hidden sm:inline">Personalizar</span>
            </button>
            {menuWidgets && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuWidgets(false)}></div>
                <div className="absolute right-0 z-50 mt-1.5 w-52 rounded-card border border-line bg-surface-1 shadow-pop p-1.5 animate-pop">
                  <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-content-3">Widgets visibles</p>
                  {WIDGETS.map(([k, label]) => (
                    <button
                      key={k} onClick={() => alternarWidget(k)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-control text-xs font-semibold text-content-1 hover:bg-surface-3 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    >
                      <span className={'flex h-4 w-4 items-center justify-center rounded border' + (widgets[k] ? 'bg-brand border-brand text-content-inverse' : 'border-line-strong dark:border-zinc-600 text-transparent')}>
                        <i className="fa-solid fa-check text-[9px]"></i>
                      </span>
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2.5 rounded-card bg-surface-1 dark:bg-surface-1/5 px-4 py-2.5 border border-line/80 dark:border-white/10 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-content-1 dark:text-white leading-tight">Sistema Sincronizado</span>
              <span className="text-[10px] font-medium text-content-3 dark:text-content-3 leading-tight">Conexión activa</span>
            </div>
          </div>
        </div>
      </div>
      </Card>

      {/* 2. TARJETAS DE MÉTRICAS ACCIONABLES */}
      {widgets.metricas && (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3" data-tour="dash-stats">
        {METRIC_CARDS.map((card) => (
          <button
            key={card.id}
            onClick={card.onClick}
            title={card.label}
            className={`dashboard-metric-card group relative text-left bg-surface-1 rounded-card border ${card.border} p-4 sm:p-5 shadow-card hover:shadow-panel hover:-translate-y-0.5 focus-visible:ring-2 ${card.ring} outline-none transition-[transform,box-shadow,border-color] duration-[var(--dur-base)] ease-[var(--ease-out)] cursor-pointer`}
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${card.iconBg} shadow-xs`}>
                <i className={`fa-solid ${card.icon} text-sm ${card.iconColor}`}></i>
              </div>
              <i className="fa-solid fa-chevron-right text-[10px] text-content-3 dark:text-content-3 group-hover:text-content-3 dark:group-hover:text-content-3 group-hover:translate-x-0 motion"></i>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-content-1 tracking-tight tabular-nums leading-snug">
              {isLoading ? '…' : card.numero}
            </p>
            <p className="text-label font-bold text-content-2 mt-1.5 uppercase tracking-[0.1em]">
              {card.label}
            </p>
            <p className={`text-label font-medium ${card.subColor || 'text-content-3'} mt-1 truncate`}>
              {card.sublabel}
            </p>
            {card.showProgress && (
              <div className="mt-1.5 h-1 w-full bg-surface-3 dark:bg-surface-1/5 rounded-full overflow-hidden">
                <div className={`h-full ${card.progressColor} rounded-full motion duration-[var(--dur-slow)] shadow-xs shadow-${card.progressColor === 'bg-violet-500' ? 'violet-500/40' : 'emerald-500/40'} ${card.pct > 0 ? '' : 'w-0'}`} style={{ width: card.pct > 0 ? card.pct + '%' : '0%' }}></div>
              </div>
            )}
          </button>
        ))}
      </div>
      )}

      {/* 2A. ACTAS POR FIRMAR */}
      {actasPorFirmar.length > 0 && (
        <div className="bg-surface-1 rounded-card border border-brand/20 shadow-sm overflow-hidden" data-tour="dash-firmas">
          <div className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 bg-brand/5 border-b border-brand/15">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-brand text-content-inverse shadow-xs shadow-brand/20">
                <i className="fa-solid fa-file-signature text-[10px]"></i>
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-content-1 dark:text-white tracking-tight">
                    Actas por firmar
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black tabular-nums bg-brand text-content-inverse">
                    {actasPorFirmar.length}
                  </span>
                </div>
                <p className="text-[10px] text-content-3 dark:text-content-3 mt-0.5">
                  {actasPorFirmar.length === 1
                    ? 'Una firma pendiente. Revisa el acta antes de registrarla.'
                    : `${actasPorFirmar.length} actas con una firma pendiente. Revisa el documento en FC-10.`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('fc10')}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-control bg-brand hover:bg-brand-hover text-content-inverse text-[11px] font-black shadow-xs shadow-brand/25 motion active:scale-95 cursor-pointer shrink-0"
            >
              Revisar actas
            </button>
          </div>

          <div className="divide-y divide-line">
            {actasPorFirmar.slice(0, 5).map(({ fc, bien, pendiente }) => (
              <div key={fc.id} className="flex items-center gap-2.5 px-5 sm:px-6 py-3 hover:bg-brand/5 transition-colors">
                <button
                  onClick={() => setActiveTab('fc10')}
                  className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-text dark:text-brand">
                    <i className="fa-solid fa-file-signature text-[9px]"></i>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-content-1 dark:text-white truncate" title={bien?.descripcion || bien?.rotulo || 'Bien sin rótulo'}>
                      {bien?.rotulo || 'Bien sin rótulo'}
                    </span>
                    <span className="block text-[10px] text-content-3 dark:text-content-3 truncate">
                      {fc.funcionarioNombre || 'Sin responsable'} · Falta la firma {pendiente.orden}: {pendiente.puesto}
                    </span>
                  </span>
                </button>
              </div>
            ))}
            {actasPorFirmar.length > 5 && (
              <button
                onClick={() => setActiveTab('fc10')}
                className="w-full px-5 sm:px-6 py-2.5 text-left text-[11px] font-bold text-brand-text dark:text-brand hover:bg-brand/5 transition-colors cursor-pointer"
              >
                Ver las {actasPorFirmar.length} actas en FC-10
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2B. BANDEJA DE PENDIENTES */}
      {widgets.pendientes && (
      <div className="bg-surface-1 rounded-panel border border-line shadow-card p-4 sm:p-5" data-tour="dash-pendientes">
          <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-sm font-bold text-content-1 dark:text-white flex items-center gap-2">
                  <i className="fa-solid fa-list-check text-content-3"></i> Atención requerida
              </h2>
              {pendientes.every(p => p.count === 0) && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-ok dark:text-emerald-400">
                      <i className="fa-solid fa-circle-check"></i> Todo al día
                  </span>
              )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {pendientes.map(p => (
                  <button
                      key={p.id}
                      onClick={() => { irInventario(() => setFiltroPendiente(p.id)); }}
                      title={`Atender: ${p.label}`}
                      className="group flex items-center gap-3 rounded-card border border-line hover:border-line-strong hover:bg-surface-2 px-3.5 py-3 text-left motion cursor-pointer focus-visible:ring-2 focus-visible:ring-brand outline-none"
                  >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-control border` + p.box}>
                          <i className={`fa-solid ${p.icon} text-xs`}></i>
                      </span>
                      <span className="min-w-0 flex-1">
                          <span className="block text-lg font-black tabular-nums text-content-1 leading-tight"><AnimatedNumber value={p.count} /></span>
                          <span className="block text-[11px] font-semibold text-content-3 dark:text-content-3 truncate">{p.label}</span>
                      </span>
                      <i className="fa-solid fa-chevron-right text-[10px] text-content-3 dark:text-content-2 group-hover:text-content-3 group-hover:translate-x-0.5 motion shrink-0"></i>
                  </button>
              ))}
          </div>
      </div>
      )}


      {/* 2b. TILES POR DEPENDENCIA */}
      {widgets.metricas && tilesPorDependencia.length > 0 && (
        <details className="group overflow-hidden rounded-panel border border-line bg-surface-1 shadow-card">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-bold text-content-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
            <span className="flex items-center gap-2.5"><i className="fa-solid fa-building-columns text-brand-text"></i> Desglose por dependencia</span>
            <span className="flex items-center gap-2 text-[11px] font-semibold text-content-3"><span>{tilesPorDependencia.length} áreas</span><i className="fa-solid fa-chevron-down transition-transform group-open:rotate-180"></i></span>
          </summary>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 border-t border-line bg-surface-2/50 p-4">
            {tilesPorDependencia.map((t) => (
              <Tile
                key={t.dep}
                titulo={t.dep}
                subtitulo={t.total.toLocaleString('es-PY') + ' bienes'}
                estado={t.buenos + ' en buen estado'}
                porcentaje={t.pctBueno}
                indice={t.indice}
                logo={t.logo}
                onClick={
                  requestDependenciaChange && t.dep !== dependenciaActual
                    ? () => requestDependenciaChange(t.dep)
                    : undefined
                }
              />
            ))}
          </div>
        </details>
      )}

      {/* 3. ACCESOS DIRECTOS */}
      {widgets.accesos && (
      <div className="bg-surface-1 dark:bg-surface-1/[0.04] rounded-panel border border-line/70 dark:border-white/10 shadow-sm p-5 sm:p-6">
          <p className="px-2 pb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-content-3 dark:text-content-3">Accesos directos</p>
          <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => { setBienEditing(null); setIsBienModalOpen(true); }} title="Añadir nuevo registro" className="flex items-center gap-2 px-5 py-3 rounded-control bg-brand hover:bg-brand-hover text-content-inverse font-bold text-body transition-[background-color,transform,box-shadow] duration-[var(--dur-fast)] shadow-card active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 cursor-pointer">
                  <i className="fa-solid fa-plus text-xs"></i> Nuevo registro
              </button>
              <span className="hidden sm:block h-6 w-px bg-surface-3 dark:bg-surface-1/10 mx-1.5"></span>
              <button onClick={() => fileInputRef.current?.click()} title="Importar archivo CSV" className="flex items-center gap-2 px-4 py-3 rounded-card border border-transparent hover:border-line dark:hover:border-white/10 text-content-2 dark:text-content-3 font-semibold text-[13px] motion active:scale-95 cursor-pointer hover:bg-surface-2 dark:hover:bg-surface-1/5">
                  <i className="fa-solid fa-file-import text-ok dark:text-emerald-400"></i> Importar
              </button>
              <button onClick={handleExportInventarioCSV} title="Exportar archivo CSV" className="flex items-center gap-2 px-4 py-3 rounded-card border border-transparent hover:border-line dark:hover:border-white/10 text-content-2 dark:text-content-3 font-semibold text-[13px] motion active:scale-95 cursor-pointer hover:bg-surface-2 dark:hover:bg-surface-1/5">
                  <i className="fa-solid fa-file-export text-sky-600 dark:text-sky-400"></i> Exportar
              </button>
              <button onClick={() => { setIsBulkQR(true); setQrTargetBien(null); setIsQRModalOpen(true); }} title="Generar lote masivo de QRs" className="flex items-center gap-2 px-4 py-3 rounded-card border border-transparent hover:border-line dark:hover:border-white/10 text-content-2 dark:text-content-3 font-semibold text-[13px] motion active:scale-95 cursor-pointer hover:bg-surface-2 dark:hover:bg-surface-1/5">
                  <i className="fa-solid fa-qrcode text-violet-600 dark:text-violet-400"></i> Lote QRs
              </button>
              <button onClick={openFC03Modal} title="Generar reporte FC-03" className="flex items-center gap-2 px-4 py-3 rounded-card border border-transparent hover:border-line dark:hover:border-white/10 text-content-2 dark:text-content-3 font-semibold text-[13px] motion active:scale-95 cursor-pointer hover:bg-surface-2 dark:hover:bg-surface-1/5">
                  <i className="fa-solid fa-print text-warn dark:text-amber-400"></i> FC-03
              </button>
          </div>
      </div>
      )}

      {/* 4. GRÁFICOS Y TENDENCIAS */}
      {widgets.tendencias && (
      <details className="group overflow-hidden rounded-panel border border-line bg-surface-1 shadow-card">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-bold text-content-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
          <span className="flex items-center gap-2.5"><i className="fa-solid fa-chart-line text-brand-text"></i> Tendencias y cobertura</span>
          <i className="fa-solid fa-chevron-down text-content-3 transition-transform group-open:rotate-180"></i>
        </summary>
        <div className="border-t border-line bg-surface-2/40 p-4 sm:p-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Estado de Regularización */}
        <div className="bg-surface-1 dark:bg-surface-1/[0.04] rounded-panel border border-line/70 dark:border-white/10 shadow-sm flex flex-col overflow-hidden p-6 sm:p-7">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-sm font-bold text-content-1 dark:text-white flex items-center gap-2">
               <i className="fa-solid fa-chart-pie text-ok"></i> Metas de Cobertura
            </h2>
            <span className="text-[10px] font-bold text-content-3 uppercase tracking-wider bg-surface-3 dark:bg-surface-1/5 px-2.5 py-1 rounded-lg border border-line dark:border-white/5">Metas</span>
          </div>

          <div className="flex flex-1 flex-col gap-8 justify-center">
            <div>
              <div className="flex justify-between items-end mb-3">
                <div>
                  <p className="text-xs font-bold text-content-1 dark:text-white uppercase tracking-wider">Cobertura FC-10</p>
                  <p className="text-[11px] text-content-3 font-medium mt-1">{stats.withFc10} de {stats.totalItems} activos asignados</p>
                </div>
                <span className="text-2xl font-black text-content-1 dark:text-white tracking-tight">{stats.percFC10.toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full bg-surface-3/50 dark:bg-surface-1/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full motion duration-[var(--dur-slow)] shadow-sm shadow-emerald-500/40" style={{ width: `${Math.max(1.5, stats.percFC10)}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-3">
                <div>
                  <p className="text-xs font-bold text-content-1 dark:text-white uppercase tracking-wider">Etiquetado QR</p>
                  <p className="text-[11px] text-content-3 font-medium mt-1">{stats.withQR} de {stats.totalItems} activos con código</p>
                </div>
                <span className="text-2xl font-black text-content-1 dark:text-white tracking-tight">{stats.percQR.toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full bg-surface-3/50 dark:bg-surface-1/5 rounded-full overflow-hidden">
                <div className="h-full bg-brand rounded-full motion duration-[var(--dur-slow)] shadow-sm shadow-brand/40" style={{ width: `${Math.max(1.5, stats.percQR)}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Tendencias Operativas */}
        <div className="bg-surface-1 dark:bg-surface-1/[0.04] rounded-panel border border-line/70 dark:border-white/10 shadow-sm flex flex-col overflow-hidden p-6 sm:p-7">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-sm font-bold text-content-1 dark:text-white flex items-center gap-2">
               <i className="fa-solid fa-chart-line text-brand-text"></i> Gestión Anual
            </h2>
          </div>
          <div className="flex flex-1 flex-col sm:flex-row gap-8">

            <div className="flex-1 flex flex-col border-b sm:border-b-0 sm:border-r border-line/60 dark:border-white/10 pb-6 sm:pb-0 sm:pr-6">
              <h3 className="text-[10px] font-bold text-content-3 uppercase tracking-widest mb-6">Adquisiciones Anuales</h3>
              <div className="flex-1 flex flex-col justify-center gap-5">
                {timeStats.adqByYear.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-4 opacity-50">
                        <p className="text-xs font-medium text-content-3">Sin adquisiciones.</p>
                    </div>
                ) : timeStats.adqByYear.map((item, idx) => {
                    const colors = ["bg-zinc-900 dark:bg-surface-1", "bg-zinc-600 dark:bg-zinc-400", "bg-zinc-400 dark:bg-zinc-600", "bg-zinc-300 dark:bg-zinc-700"];
                    return <SimpleBar key={item.year} label={item.year} value={item.count} max={timeStats.adqMax} colorClass={colors[idx] || "bg-zinc-400"} bgClass="bg-surface-3 dark:bg-surface-1/5" title={`Filtrar inventario por año ${item.year}`} onClick={() => { irInventario(() => setFiltroAnio(item.year)); }} />;
                })}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <h3 className="text-[10px] font-bold text-content-3 uppercase tracking-widest mb-6">Asignaciones (FC-10)</h3>
              <div className="flex-1 flex flex-col justify-center gap-7">
                <SimpleBar label={`Actual (${timeStats.currentMonthName})`} value={timeStats.asigCurrentMonth} max={timeStats.asigMax} colorClass="bg-emerald-500" bgClass="bg-surface-3 dark:bg-surface-1/5" title="Ver asignaciones de este mes" onClick={() => { setFc10Year(timeStats.asigCurrent.year); setFc10Month(timeStats.asigCurrent.month); setActiveTab('fc10'); }} />
                <SimpleBar label={`Anterior (${timeStats.prevMonthName})`} value={timeStats.asigPreviousMonth} max={timeStats.asigMax} colorClass="bg-zinc-300 dark:bg-zinc-600" bgClass="bg-surface-3 dark:bg-surface-1/5" title="Ver asignaciones del mes anterior" onClick={() => { setFc10Year(timeStats.asigPrev.year); setFc10Month(timeStats.asigPrev.month); setActiveTab('fc10'); }} />
              </div>
            </div>

          </div>
        </div>

      </div>
        </div>
      </details>
      )}

    </div>
  );
}
