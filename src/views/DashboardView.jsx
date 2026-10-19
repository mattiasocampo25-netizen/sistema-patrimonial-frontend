import React, { useState, useMemo } from 'react';
import AnimatedNumber from '../components/AnimatedNumber';
import SimpleBar from '../components/SimpleBar';
import { pendienteDeFirma } from '../utils/fc10Firmas';

// Vista del panel principal (extraída de App.jsx, Fase 5).
export default function DashboardView({
  currentUser, dependenciaActual, saludoBienvenida, stats, pendientes, isLoading,
  timeStats, clearAllFilters, setActiveTab,
  setFiltroQR, setFiltroFC10, setFiltroPendiente, setFiltroAnio, setFiltroMes, setCurrentPage,
  setBienEditing, setIsBienModalOpen, fileInputRef, handleExportInventarioCSV,
  setIsBulkQR, setQrTargetBien, setIsQRModalOpen, openFC03Modal,
  setFc10Year, setFc10Month,
  fc10List, bienes, registrarAmbasFirmas, firmandoId
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
      iconBg: 'bg-zinc-900 dark:bg-white',
      iconColor: 'text-white dark:text-zinc-900',
      border: 'border-zinc-200/80 dark:border-white/20',
      hoverBorder: 'hover:border-zinc-300 dark:hover:border-white/30',
      ring: 'focus-visible:ring-brand-primary',
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
      border: 'border-zinc-200/80 dark:border-white/20',
      hoverBorder: 'hover:border-zinc-300 dark:hover:border-white/30',
      ring: 'focus-visible:ring-brand-primary',
      numero: <><AnimatedNumber value={stats.withQR} /><span className="text-base text-zinc-400 font-semibold"> / {Number(stats.totalItems || 0).toLocaleString('es-PY')}</span></>,
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
      subColor: stats.fc10Pendientes > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-amber-600 dark:text-amber-400',
      icon: 'fa-file-signature',
      iconBg: 'bg-amber-500 text-white',
      iconColor: 'text-white',
      border: 'border-amber-200/80 dark:border-amber-500/35',
      hoverBorder: 'hover:border-amber-300 dark:hover:border-amber-500/40',
      ring: 'focus-visible:ring-amber-500',
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

  return (
    <div className="space-y-6 sm:space-y-7 animate-fade-in pb-16">

      {/* 1. ENCABEZADO DE PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex h-13 w-13 sm:h-15 sm:w-15 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-xl sm:text-2xl shadow-md shadow-zinc-900/25 dep-accent-ring">
            {currentUser?.nombre ? currentUser.nombre.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400 truncate">
              Panel General · {dependenciaActual}
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight truncate mt-0.5">
              {saludoBienvenida}, {currentUser?.nombre || 'Usuario'}!
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <div className="relative">
            <button
              onClick={() => setMenuWidgets(v => !v)}
              title="Personalizar panel" aria-label="Personalizar panel"
              className="flex items-center gap-2 h-11 px-4 rounded-2xl bg-white dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 shadow-sm text-[13px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/10 transition-all cursor-pointer"
            >
              <i className="fa-solid fa-sliders text-xs"></i> <span className="hidden sm:inline">Personalizar</span>
            </button>
            {menuWidgets && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuWidgets(false)}></div>
                <div className="absolute right-0 z-50 mt-1.5 w-52 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl p-1.5 animate-pop">
                  <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Widgets visibles</p>
                  {WIDGETS.map(([k, label]) => (
                    <button
                      key={k} onClick={() => alternarWidget(k)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <span className={'flex h-4 w-4 items-center justify-center rounded border ' + (widgets[k] ? 'bg-brand-primary border-brand-primary text-white' : 'border-zinc-300 dark:border-zinc-600 text-transparent')}>
                        <i className="fa-solid fa-check text-[9px]"></i>
                      </span>
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2.5 rounded-2xl bg-white dark:bg-white/5 px-4 py-2.5 border border-zinc-200/80 dark:border-white/10 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">Sistema Sincronizado</span>
              <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 leading-tight">Conexión activa</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TARJETAS DE MÉTRICAS ACCIONABLES */}
      {widgets.metricas && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3" data-tour="dash-stats">
        {METRIC_CARDS.map((card) => (
          <button
            key={card.id}
            onClick={card.onClick}
            title={card.label}
            className={`group relative text-left bg-white dark:bg-darkbg-card/60 rounded-2xl border ${card.border} p-3 sm:p-4 shadow-sm hover:shadow-sm hover:-translate-y-0 focus-visible:ring-2 ${card.ring} outline-none transition-all duration-200 cursor-pointer`}
          >
            <div className="flex items-center justify-between gap-1.5 mb-2">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${card.iconBg} shadow-xs`}>
                <i className={`fa-solid ${card.icon} text-sm ${card.iconColor}`}></i>
              </div>
              <i className="fa-solid fa-chevron-right text-[10px] text-zinc-300 dark:text-zinc-500 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 group-hover:translate-x-0 transition-all"></i>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight tabular-nums leading-snug">
              {isLoading ? '…' : card.numero}
            </p>
            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-300 mt-1 uppercase tracking-[0.12em]">
              {card.label}
            </p>
            <p className={`text-[10px] font-medium ${card.subColor} mt-1.5 truncate`}>
              {card.sublabel}
            </p>
            {card.showProgress && (
              <div className="mt-2 h-1.5 w-full bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full ${card.progressColor} rounded-full transition-all duration-1000 shadow-xs shadow-${card.progressColor === 'bg-violet-500' ? 'violet-500/40' : 'emerald-500/40'} ${card.pct > 0 ? '' : 'w-0'}`} style={{ width: card.pct > 0 ? card.pct + '%' : '0%' }}></div>
              </div>
            )}
          </button>
        ))}
      </div>
      )}

      {/* 2A. ACTAS POR FIRMAR */}
      {actasPorFirmar.length > 0 && (
        <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-amber-200/60 dark:border-amber-400/20 shadow-sm overflow-hidden" data-tour="dash-firmas">
          <div className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 bg-amber-500/[0.05] border-b border-amber-500/20">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs shadow-amber-500/20">
                <i className="fa-solid fa-file-signature text-[10px]"></i>
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                    Actas por firmar
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black tabular-nums bg-amber-500 text-white">
                    {actasPorFirmar.length}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {actasPorFirmar.length === 1
                    ? 'Un acta esperando firma.'
                    : actasPorFirmar.length + ' actas esperando firma.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('fc10')}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-black shadow-xs shadow-amber-500/25 transition-all active:scale-95 cursor-pointer shrink-0"
            >
              Gestionar →
            </button>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-white/5">
            {actasPorFirmar.slice(0, 5).map(({ fc, bien, pendiente }) => (
              <div key={fc.id} className="flex items-center gap-2.5 px-5 sm:px-6 py-3 hover:bg-amber-500/[0.02] transition-colors">
                <button
                  onClick={() => setActiveTab('fc10')}
                  className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <i className="fa-solid fa-file-signature text-[9px]"></i>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-zinc-900 dark:text-white truncate">
                      {bien?.rotulo || 'S/R'}
                      <span className="font-semibold text-zinc-400 dark:text-zinc-500"> · {pendiente.nombre || pendiente.puesto}</span>
                    </span>
                    <span className="block text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                      Falta firma {pendiente.orden}: {pendiente.puesto}
                    </span>
                  </span>
                </button>
                {registrarAmbasFirmas && (
                  <button
                    onClick={() => registrarAmbasFirmas(fc)}
                    disabled={firmandoId === fc.id}
                    title="Registrar las dos firmas"
                    className="shrink-0 inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-60"
                  >
                    {firmandoId === fc.id
                      ? <i className="fa-solid fa-circle-notch fa-spin text-[9px]"></i>
                      : <><i className="fa-solid fa-circle-check text-[9px]"></i> Firmaron ambos</>}
                  </button>
                )}
              </div>
            ))}
            {actasPorFirmar.length > 5 && (
              <button
                onClick={() => setActiveTab('fc10')}
                className="w-full px-5 sm:px-6 py-2.5 text-left text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-500/[0.02] transition-colors cursor-pointer"
              >
                Ver las {actasPorFirmar.length} actas en FC-10
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2B. BANDEJA DE PENDIENTES */}
      {widgets.pendientes && (
      <div className="bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 p-6 sm:p-7 shadow-sm" data-tour="dash-pendientes">
          <div className="flex items-center justify-between gap-3 mb-5">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <i className="fa-solid fa-list-check text-zinc-400"></i> Atención requerida
              </h2>
              {pendientes.every(p => p.count === 0) && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      <i className="fa-solid fa-circle-check"></i> Todo al día
                  </span>
              )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              {pendientes.map(p => (
                  <button
                      key={p.id}
                      onClick={() => { irInventario(() => setFiltroPendiente(p.id)); }}
                      title={`Atender: ${p.label}`}
                      className="group flex items-center gap-3 rounded-2xl border border-zinc-200/70 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 hover:bg-zinc-50 dark:hover:bg-white/[0.05] px-4 py-3.5 text-left transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
                  >
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ` + p.box}>
                          <i className={`fa-solid ${p.icon} text-sm`}></i>
                      </span>
                      <span className="min-w-0 flex-1">
                          <span className="block text-xl font-black tabular-nums text-zinc-900 dark:text-white leading-tight"><AnimatedNumber value={p.count} /></span>
                          <span className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 truncate">{p.label}</span>
                      </span>
                      <i className="fa-solid fa-chevron-right text-[10px] text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 group-hover:translate-x-0.5 transition-all shrink-0"></i>
                  </button>
              ))}
          </div>
      </div>
      )}

      {/* 3. ACCESOS DIRECTOS */}
      {widgets.accesos && (
      <div className="bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 shadow-sm p-5 sm:p-6">
          <p className="px-2 pb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">Accesos directos</p>
          <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => { setBienEditing(null); setIsBienModalOpen(true); }} title="Añadir nuevo registro" className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-black text-[13px] transition-all shadow-lg shadow-zinc-900/25 active:scale-95 cursor-pointer">
                  <i className="fa-solid fa-plus text-xs"></i> Nuevo registro
              </button>
              <span className="hidden sm:block h-6 w-px bg-zinc-200 dark:bg-white/10 mx-1.5"></span>
              <button onClick={() => fileInputRef.current?.click()} title="Importar archivo CSV" className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-transparent hover:border-zinc-200 dark:hover:border-white/10 text-zinc-600 dark:text-zinc-300 font-semibold text-[13px] transition-all active:scale-95 cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/5">
                  <i className="fa-solid fa-file-import text-emerald-600 dark:text-emerald-400"></i> Importar
              </button>
              <button onClick={handleExportInventarioCSV} title="Exportar archivo CSV" className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-transparent hover:border-zinc-200 dark:hover:border-white/10 text-zinc-600 dark:text-zinc-300 font-semibold text-[13px] transition-all active:scale-95 cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/5">
                  <i className="fa-solid fa-file-export text-sky-600 dark:text-sky-400"></i> Exportar
              </button>
              <button onClick={() => { setIsBulkQR(true); setQrTargetBien(null); setIsQRModalOpen(true); }} title="Generar lote masivo de QRs" className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-transparent hover:border-zinc-200 dark:hover:border-white/10 text-zinc-600 dark:text-zinc-300 font-semibold text-[13px] transition-all active:scale-95 cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/5">
                  <i className="fa-solid fa-qrcode text-violet-600 dark:text-violet-400"></i> Lote QRs
              </button>
              <button onClick={openFC03Modal} title="Generar reporte FC-03" className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-transparent hover:border-zinc-200 dark:hover:border-white/10 text-zinc-600 dark:text-zinc-300 font-semibold text-[13px] transition-all active:scale-95 cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/5">
                  <i className="fa-solid fa-print text-amber-600 dark:text-amber-400"></i> FC-03
              </button>
          </div>
      </div>
      )}

      {/* 4. GRÁFICOS Y TENDENCIAS */}
      {widgets.tendencias && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Estado de Regularización */}
        <div className="bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 shadow-sm flex flex-col overflow-hidden p-6 sm:p-7">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
               <i className="fa-solid fa-chart-pie text-emerald-500"></i> Metas de Cobertura
            </h2>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider bg-zinc-100 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-white/5">Metas</span>
          </div>

          <div className="flex flex-1 flex-col gap-8 justify-center">
            <div>
              <div className="flex justify-between items-end mb-3">
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Cobertura FC-10</p>
                  <p className="text-[11px] text-zinc-500 font-medium mt-1">{stats.withFc10} de {stats.totalItems} activos asignados</p>
                </div>
                <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{stats.percFC10.toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full bg-zinc-200/50 dark:bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-sm shadow-emerald-500/40" style={{ width: `${Math.max(1.5, stats.percFC10)}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-3">
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Etiquetado QR</p>
                  <p className="text-[11px] text-zinc-500 font-medium mt-1">{stats.withQR} de {stats.totalItems} activos con código</p>
                </div>
                <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{stats.percQR.toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full bg-zinc-200/50 dark:bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-brand-primary rounded-full transition-all duration-1000 shadow-sm shadow-brand-primary/40" style={{ width: `${Math.max(1.5, stats.percQR)}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Tendencias Operativas */}
        <div className="bg-white dark:bg-white/[0.04] rounded-3xl border border-zinc-200/70 dark:border-white/10 shadow-sm flex flex-col overflow-hidden p-6 sm:p-7">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
               <i className="fa-solid fa-chart-line text-brand-primary"></i> Gestión Anual
            </h2>
          </div>
          <div className="flex flex-1 flex-col sm:flex-row gap-8">

            <div className="flex-1 flex flex-col border-b sm:border-b-0 sm:border-r border-zinc-200/60 dark:border-white/10 pb-6 sm:pb-0 sm:pr-6">
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6">Adquisiciones Anuales</h3>
              <div className="flex-1 flex flex-col justify-center gap-5">
                {timeStats.adqByYear.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-4 opacity-50">
                        <p className="text-xs font-medium text-zinc-500">Sin adquisiciones.</p>
                    </div>
                ) : timeStats.adqByYear.map((item, idx) => {
                    const colors = ["bg-zinc-900 dark:bg-white", "bg-zinc-600 dark:bg-zinc-400", "bg-zinc-400 dark:bg-zinc-600", "bg-zinc-300 dark:bg-zinc-700"];
                    return <SimpleBar key={item.year} label={item.year} value={item.count} max={timeStats.adqMax} colorClass={colors[idx] || "bg-zinc-400"} bgClass="bg-zinc-100 dark:bg-white/5" title={`Filtrar inventario por año ${item.year}`} onClick={() => { irInventario(() => setFiltroAnio(item.year)); }} />;
                })}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6">Asignaciones (FC-10)</h3>
              <div className="flex-1 flex flex-col justify-center gap-7">
                <SimpleBar label={`Actual (${timeStats.currentMonthName})`} value={timeStats.asigCurrentMonth} max={timeStats.asigMax} colorClass="bg-emerald-500" bgClass="bg-zinc-100 dark:bg-white/5" title="Ver asignaciones de este mes" onClick={() => { setFc10Year(timeStats.asigCurrent.year); setFc10Month(timeStats.asigCurrent.month); setActiveTab('fc10'); }} />
                <SimpleBar label={`Anterior (${timeStats.prevMonthName})`} value={timeStats.asigPreviousMonth} max={timeStats.asigMax} colorClass="bg-zinc-300 dark:bg-zinc-600" bgClass="bg-zinc-100 dark:bg-white/5" title="Ver asignaciones del mes anterior" onClick={() => { setFc10Year(timeStats.asigPrev.year); setFc10Month(timeStats.asigPrev.month); setActiveTab('fc10'); }} />
              </div>
            </div>

          </div>
        </div>

      </div>
      )}

    </div>
  );
}