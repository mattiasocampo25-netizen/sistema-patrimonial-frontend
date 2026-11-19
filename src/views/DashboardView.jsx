import React, { useState, useMemo, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import AnimatedNumber from '../components/AnimatedNumber';
import SimpleBar from '../components/SimpleBar';
import { pendienteDeFirma } from '../utils/fc10Firmas';
import { Card } from '../components/ui';
import { getLogoPorDependencia } from '../utils/helpers';
import { useResumenDependencias } from '../hooks/useResumenDependencias';
import useScopedPreference from '../hooks/useScopedPreference';
import { crearEventosAgenda, fechaAgenda } from '../utils/agenda';

const WIDGETS_INICIALES = { metricas: true, pendientes: true, accesos: true, tendencias: true, agenda: true };
const ACCESOS_INICIALES = ['nuevo', 'importar', 'exportar', 'qr', 'fc03'];
const WIDGETS_DASHBOARD = [['metricas', 'Métricas'], ['pendientes', 'Pendientes'], ['accesos', 'Accesos'], ['tendencias', 'Tendencias'], ['agenda', 'Agenda']];
const normalizarWidgets = value => ({ ...WIDGETS_INICIALES, ...(value && typeof value === 'object' ? value : {}) });
const normalizarAccesos = value => Array.isArray(value) ? value.filter(id => ACCESOS_INICIALES.includes(id)) : ACCESOS_INICIALES;

function claveDia(fecha) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

function AgendaPatrimonial({ bienes, fc10List, dependenciaActual, onAbrirBien, onAbrirFC10 }) {
  const [mes, setMes] = useState(() => {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  });
  const [diaSeleccionado, setDiaSeleccionado] = useState(() => claveDia(new Date()));
  const eventos = useMemo(() => crearEventosAgenda(bienes, fc10List, dependenciaActual), [bienes, fc10List, dependenciaActual]);
  const eventosPorDia = useMemo(() => {
    const mapa = new Map();
    for (const evento of eventos) mapa.set(evento.fecha, [...(mapa.get(evento.fecha) || []), evento]);
    return mapa;
  }, [eventos]);

  const anio = mes.getFullYear();
  const numeroMes = mes.getMonth();
  const inicio = (new Date(anio, numeroMes, 1).getDay() + 6) % 7;
  const dias = new Date(anio, numeroMes + 1, 0).getDate();
  const calendario = Array.from({ length: inicio + dias }, (_, indice) => indice < inicio ? null : new Date(anio, numeroMes, indice - inicio + 1));
  const tituloMes = new Intl.DateTimeFormat('es-PY', { month: 'long', year: 'numeric' }).format(mes);
  const eventosMes = eventos.filter((evento) => evento.fecha.startsWith(`${anio}-${String(numeroMes + 1).padStart(2, '0')}-`));
  const eventosDia = eventosPorDia.get(diaSeleccionado) || [];
  const hoy = claveDia(new Date());

  const cambiarMes = (delta) => {
    const nuevo = new Date(anio, numeroMes + delta, 1);
    setMes(nuevo);
    setDiaSeleccionado(claveDia(nuevo));
  };

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-control bg-brand-soft text-brand-text"><i className="fa-solid fa-calendar-days" aria-hidden="true" /></span>
          <div>
            <h2 className="text-sm font-bold text-content-1">Agenda patrimonial</h2>
            <p className="mt-0.5 text-label text-content-3">Altas, asignaciones y fin de vida útil estimado</p>
          </div>
        </div>
        <span className="rounded-full border border-line bg-surface-2 px-3 py-1.5 text-label font-semibold text-content-2">{eventosMes.length} {eventosMes.length === 1 ? 'hito' : 'hitos'} este mes</span>
      </div>

      <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(240px,0.85fr)]">
        <section aria-label="Calendario mensual">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold capitalize text-content-1">{tituloMes}</h3>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => cambiarMes(-1)} aria-label="Mes anterior" className="flex h-8 w-8 items-center justify-center rounded-full text-content-2 hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-brand"><i className="fa-solid fa-chevron-left text-xs" aria-hidden="true" /></button>
              <button type="button" onClick={() => { const fecha = new Date(); setMes(new Date(fecha.getFullYear(), fecha.getMonth(), 1)); setDiaSeleccionado(claveDia(fecha)); }} className="h-8 rounded-full px-3 text-label font-semibold text-brand-text hover:bg-brand-soft focus-visible:ring-2 focus-visible:ring-brand">Hoy</button>
              <button type="button" onClick={() => cambiarMes(1)} aria-label="Mes siguiente" className="flex h-8 w-8 items-center justify-center rounded-full text-content-2 hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-brand"><i className="fa-solid fa-chevron-right text-xs" aria-hidden="true" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia) => <span key={dia} className="py-1.5 text-[10px] font-bold uppercase tracking-wide text-content-3">{dia}</span>)}
            {calendario.map((fecha, indice) => {
              if (!fecha) return <span key={`vacio-${indice}`} aria-hidden="true" className="min-h-10" />;
              const key = claveDia(fecha);
              const cantidad = eventosPorDia.get(key)?.length || 0;
              return (
                <button key={key} type="button" onClick={() => setDiaSeleccionado(key)} aria-pressed={diaSeleccionado === key} aria-label={`${fecha.toLocaleDateString('es-PY', { dateStyle: 'full' })}${cantidad ? `, ${cantidad} ${cantidad === 1 ? 'actividad' : 'actividades'}` : ''}`} className={`relative flex min-h-10 flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-semibold tabular-nums transition-colors focus-visible:ring-2 focus-visible:ring-brand ${diaSeleccionado === key ? 'bg-brand text-content-inverse shadow-sm' : key === hoy ? 'bg-brand-soft text-brand-text' : 'text-content-2 hover:bg-surface-2'}`}>
                  {fecha.getDate()}
                  {cantidad > 0 && <span aria-hidden="true" className={`h-1 w-1 rounded-full ${diaSeleccionado === key ? 'bg-white' : 'bg-brand'}`} />}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[10px] text-content-3">Las fechas se calculan con los datos registrados. El sistema no tiene campos de agenda manual de mantenimiento.</p>
        </section>

        <section className="min-w-0 border-t border-line pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0" aria-live="polite">
          <h3 className="text-xs font-bold uppercase tracking-wide text-content-2">{fechaAgenda(diaSeleccionado)?.toLocaleDateString('es-PY', { dateStyle: 'full' }) || 'Actividades del día'}</h3>
          {eventosDia.length === 0 ? (
            <div className="mt-3 flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface-2/60 px-4 text-center">
              <i className="fa-regular fa-calendar text-lg text-content-3" aria-hidden="true" />
              <p className="mt-2 text-label font-medium text-content-3">No hay actividades registradas para este día.</p>
            </div>
          ) : (
            <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto custom-scrollbar">
              {eventosDia.map((evento, indice) => (
                <li key={`${evento.tipo}-${evento.bienId || evento.fecha}-${indice}`}>
                  <button type="button" onClick={() => evento.tipo === 'asignacion' ? onAbrirFC10(evento) : onAbrirBien(evento)} className="flex w-full items-start gap-2.5 rounded-xl p-2.5 text-left hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-brand">
                    <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${evento.tipo === 'vencimiento' ? 'bg-warn-soft text-warn' : evento.tipo === 'asignacion' ? 'bg-info-soft text-info' : 'bg-brand-soft text-brand-text'}`} aria-hidden="true"><i className={`fa-solid ${evento.tipo === 'vencimiento' ? 'fa-hourglass-end' : evento.tipo === 'asignacion' ? 'fa-file-signature' : 'fa-box'}`} /></span>
                    <span className="min-w-0 flex-1"><span className="block text-label font-bold text-content-1">{evento.titulo}</span><span className="mt-0.5 block truncate text-[10px] text-content-3">{evento.detalle}</span></span>
                    <i className="fa-solid fa-arrow-up-right-from-square mt-1 text-[9px] text-content-3" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Card>
  );
}

// Vista del panel principal (extraída de App.jsx, Fase 5).
export default function DashboardView({
  currentUser, isOnline = true, dependenciaActual, saludoBienvenida, stats, pendientes, isLoading,
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

  const identidadUsuario = currentUser?.username || currentUser?.id || 'anon';
  const [widgets, setWidgets] = useScopedPreference('dash_widgets', identidadUsuario, WIDGETS_INICIALES, normalizarWidgets);
  const [menuWidgets, setMenuWidgets] = useState(false);
  const widgetButtonRef = useRef(null);
  const [widgetMenuStyle, setWidgetMenuStyle] = useState(null);
  useLayoutEffect(() => {
    if (!menuWidgets) return undefined;
    const posicionar = () => {
      const rect = widgetButtonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const margen = 12;
      const ancho = Math.min(240, window.innerWidth - margen * 2);
      const abajo = window.innerHeight - rect.bottom - margen;
      const arriba = rect.top - margen;
      const desplegarAbajo = abajo >= 180 || abajo >= arriba;
      setWidgetMenuStyle({ position: 'fixed', left: Math.min(Math.max(margen, rect.right - ancho), window.innerWidth - ancho - margen), top: desplegarAbajo ? rect.bottom + 8 : undefined, bottom: desplegarAbajo ? undefined : window.innerHeight - rect.top + 8, width: ancho, maxHeight: Math.max(120, Math.min(340, (desplegarAbajo ? abajo : arriba) - 8)), zIndex: 101 });
    };
    posicionar();
    window.addEventListener('resize', posicionar);
    window.addEventListener('scroll', posicionar, true);
    const escapar = (event) => { if (event.key === 'Escape') setMenuWidgets(false); };
    document.addEventListener('keydown', escapar);
    return () => { window.removeEventListener('resize', posicionar); window.removeEventListener('scroll', posicionar, true); document.removeEventListener('keydown', escapar); };
  }, [menuWidgets]);
  const alternarWidget = (k) => {
    setWidgets(prev => ({ ...prev, [k]: !prev[k] }));
  };
  const ACCESOS = [
    ['nuevo', 'Nuevo registro'], ['importar', 'Importar CSV'], ['exportar', 'Exportar CSV'],
    ['qr', 'Lote de QRs'], ['fc03', 'Reporte FC-03'],
  ];
  const [accesosVisibles, setAccesosVisibles] = useScopedPreference('dash_accesos', identidadUsuario, ACCESOS_INICIALES, normalizarAccesos);
  const [menuAccesos, setMenuAccesos] = useState(false);
  const alternarAcceso = (id) => setAccesosVisibles((prev) => {
    return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
  });

  // Tarjetas de métrica con diseño consistente y simétrico.
  // Un solo sistema de tonos (StatTile): el estado se comunica con el tono
  // semántico, nunca con fondos de color ajenos a la marca.
  const METRIC_CARDS = [
    {
      id: 'activos',
      label: 'Bienes Activos',
      valor: stats.totalItems,
      sub: 'Total en ' + dependenciaActual,
      icono: 'fa-boxes-stacked',
      tono: 'brand',
      onClick: () => { clearAllFilters(); setActiveTab('inventario'); },
    },
    {
      id: 'qr',
      label: 'Bienes con QR',
      valor: stats.withQR,
      sub: stats.withQR + ' de ' + Number(stats.totalItems || 0).toLocaleString('es-PY') + ' con código',
      icono: 'fa-qrcode',
      tono: 'brand',
      progress: stats.percQR || 0,
      onClick: () => irInventario(() => setFiltroQR('YES')),
    },
    {
      id: 'sin-fc10',
      label: 'Sin FC-10',
      valor: stats.withoutFc10,
      sub: stats.fc10Pendientes > 0
        ? stats.fc10Pendientes + ' en firma · ' + Math.max(0, stats.withoutFc10 - stats.fc10Pendientes) + ' sin acta'
        : 'Pendientes de asignación',
      icono: 'fa-file-signature',
      tono: 'warn',
      onClick: () => irInventario(() => setFiltroFC10('NO')),
    },
    {
      id: 'pendiente-qr',
      label: 'Pendiente QR',
      valor: stats.withoutQR,
      sub: 'Sin etiqueta generada',
      icono: 'fa-triangle-exclamation',
      tono: 'warn',
      onClick: () => irInventario(() => setFiltroQR('NO')),
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
        asignados: r.asignados == null ? null : Number(r.asignados) || 0,
        pctAsignados: r.asignados == null || !Number(r.total) ? null : (Number(r.asignados) / Number(r.total)) * 100,
        pctBueno: Number(r.total) ? (Number(r.buenos) / Number(r.total)) * 100 : 0,
        logo: getLogoPorDependencia(r.dependencia, 'webp')
      })),
    [resumenDependencias]
  );
  const resumenActual = tilesPorDependencia.find(t => t.dep === dependenciaActual);
  // El RPC y la tarjeta de desglose comparten el mismo conteo; no estimar el
  // avance restando pendientes, porque eso incluye solo responsables vacíos y
  // no los valores de inventario que significan “libre/sin asignar”.
  const bienesVinculadosFuncionario = Number(resumenActual?.asignados) || 0;
  const totalBienesDashboard = Number(resumenActual?.total) || Number(stats?.totalItems) || 0;
  const porcentajeVinculadoFuncionario = totalBienesDashboard
    ? (bienesVinculadosFuncionario / totalBienesDashboard) * 100
    : 0;

  return (
    <div className="dashboard-stagger mx-auto w-full max-w-[1680px] space-y-6 pb-16">
      <header className="flex flex-col justify-between gap-5 border-b border-line pb-5 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-brand-text">
            <span className="h-1.5 w-7 rounded-full bg-brand" />
            Centro de control patrimonial
          </div>
          <h1 className="truncate font-display text-3xl font-black tracking-tight text-content-1 sm:text-4xl">
            {saludoBienvenida}, {currentUser?.nombre || 'Usuario'}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-content-2">
            <span className="font-semibold text-content-1">{dependenciaActual}</span>
            <span aria-hidden="true" className="text-content-3">·</span>
            <span>Resumen operativo de bienes, asignaciones y tareas</span>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-surface-1 px-3 text-xs font-bold text-content-2">
            <i className={'h-2 w-2 rounded-full ' + (isOnline ? 'bg-emerald-500' : 'bg-amber-500')} aria-hidden="true" />
            {isOnline ? 'Conexión activa' : 'Modo sin conexión'}
          </span>
          <div className="relative">
            <button
              ref={widgetButtonRef}
              type="button"
              onClick={() => setMenuWidgets(v => !v)}
              title="Personalizar panel"
              aria-label="Personalizar panel"
              aria-expanded={menuWidgets}
              className="flex h-10 items-center gap-2 rounded-xl border border-line bg-surface-1 px-3 text-xs font-bold text-content-2 transition hover:bg-surface-2 hover:text-content-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <i className="fa-solid fa-sliders" aria-hidden="true" />
              <span>Personalizar</span>
            </button>
            {menuWidgets && widgetMenuStyle && createPortal(
              <>
                <button type="button" aria-label="Cerrar personalización" className="fixed inset-0 z-[100] cursor-default" onClick={() => setMenuWidgets(false)} />
                <div style={widgetMenuStyle} role="dialog" aria-label="Widgets visibles" className="overflow-y-auto rounded-card border border-line bg-surface-1 p-1.5 text-content-1 shadow-pop animate-pop">
                  <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-content-3">Secciones visibles</p>
                  {WIDGETS_DASHBOARD.map(([key, label]) => (
                    <button key={key} type="button" onClick={() => alternarWidget(key)} className="flex w-full items-center gap-2.5 rounded-control px-3 py-2 text-left text-xs font-semibold text-content-1 transition-colors hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                      <span className={'flex h-4 w-4 items-center justify-center rounded border ' + (widgets[key] ? 'border-brand bg-brand text-white' : 'border-line-strong text-transparent')}>
                        <i className="fa-solid fa-check text-[9px]" aria-hidden="true" />
                      </span>
                      {label}
                    </button>
                  ))}
                </div>
              </>, document.body
            )}
          </div>
        </div>
      </header>

      {widgets.metricas && (
        <section className="overflow-hidden rounded-panel border border-line bg-surface-1 shadow-card" aria-label="Indicadores del inventario" data-tour="dash-stats">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3.5">
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-[0.14em] text-content-1">Indicadores del inventario</h2>
              <p className="mt-1 text-[11px] text-content-3">Selecciona un indicador para abrir el detalle</p>
            </div>
            <span className="text-[10px] font-semibold text-content-3">{Number(stats?.totalItems || 0).toLocaleString('es-PY')} bienes en {dependenciaActual}</span>
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-line md:grid-cols-4 md:divide-y-0">
            {METRIC_CARDS.map((card, index) => (
              <button key={card.id} type="button" onClick={card.onClick} className="group min-w-0 px-4 py-4 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand sm:px-5">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-[10px] font-extrabold uppercase tracking-wide text-content-3">{card.label}</span>
                  <i className={'fa-solid ' + card.icono + ' text-xs ' + (card.tono === 'warn' ? 'text-amber-600 dark:text-amber-400' : 'text-brand-text')} aria-hidden="true" />
                </span>
                <span className="mt-2 block text-2xl font-black leading-none tabular-nums text-content-1 sm:text-3xl">{isLoading ? '…' : <AnimatedNumber value={Number(card.valor) || 0} />}</span>
                <span className="mt-2 block truncate text-[10px] font-medium text-content-3">{card.sub}</span>
                {card.progress != null && <span className="mt-3 block h-1 overflow-hidden rounded-full bg-surface-3"><span className="block h-full rounded-full bg-brand transition-[width] duration-700" style={{ width: Number(card.progress) + '%' }} /></span>}
                <span className="sr-only">{index === 0 ? 'Ver todos los bienes' : 'Abrir filtro de ' + card.label}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="dashboard-workspaces-grid grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,.8fr)]">
        <section className="overflow-hidden rounded-panel border border-line bg-surface-1 shadow-card" aria-label="Trabajo pendiente" data-tour="dash-pendientes">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-brand-text">Bandeja de trabajo</p>
              <h2 className="mt-1 text-lg font-black tracking-tight text-content-1">Lo que requiere atención</h2>
            </div>
            <div className="flex items-center gap-2">
              {actasPorFirmar.length > 0 && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-extrabold text-amber-800 dark:bg-amber-400/10 dark:text-amber-300">{actasPorFirmar.length} firmas</span>}
              <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[10px] font-bold text-content-2">{pendientes.reduce((total, item) => total + Number(item.count || 0), 0).toLocaleString('es-PY')} tareas</span>
            </div>
          </div>
          {actasPorFirmar.length > 0 && (
            <div className="border-b border-line">
              <div className="flex items-center justify-between gap-3 bg-amber-50/70 px-5 py-3 dark:bg-amber-400/5">
                <span className="flex items-center gap-2 text-xs font-extrabold text-content-1"><i className="fa-solid fa-file-signature text-amber-600 dark:text-amber-400" aria-hidden="true" /> Actas FC-10 por firmar</span>
                <button type="button" onClick={() => setActiveTab('fc10')} className="rounded-lg px-2.5 py-1.5 text-[10px] font-extrabold text-brand-text hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">Abrir FC-10 <i className="fa-solid fa-arrow-right ml-1" aria-hidden="true" /></button>
              </div>
              <ul className="divide-y divide-line">
                {actasPorFirmar.slice(0, 4).map(({ fc, bien, pendiente }) => (
                  <li key={fc.id}>
                    <button type="button" onClick={() => setActiveTab('fc10')} className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"><i className="fa-solid fa-signature text-xs" aria-hidden="true" /></span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-content-1">{bien?.rotulo || bien?.descripcion || 'Bien sin rótulo'}</span><span className="mt-1 block truncate text-[10px] text-content-3">{fc.funcionarioNombre || 'Sin responsable'} · Falta firma {pendiente.orden}: {pendiente.puesto}</span></span>
                      <i className="fa-solid fa-chevron-right text-[10px] text-content-3" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
              {actasPorFirmar.length > 4 && <button type="button" onClick={() => setActiveTab('fc10')} className="w-full border-t border-line px-5 py-2.5 text-left text-[10px] font-bold text-brand-text hover:bg-surface-2">Ver las {actasPorFirmar.length} actas pendientes</button>}
            </div>
          )}
          {widgets.pendientes && (
            <div className="divide-y divide-line">
              {pendientes.map(p => (
                <button key={p.id} type="button" onClick={() => irInventario(() => setFiltroPendiente(p.id))} title={'Atender: ' + p.label} className="group flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand">
                  <span className={'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ' + p.box}><i className={'fa-solid ' + p.icon + ' text-xs'} aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-black tabular-nums text-content-1"><AnimatedNumber value={Number(p.count) || 0} /></span><span className="block truncate text-[11px] font-semibold text-content-3">{p.label}</span></span>
                  {p.count > 0 ? <span className="rounded-full bg-surface-2 px-2 py-1 text-[10px] font-extrabold tabular-nums text-content-2">Revisar</span> : <i className="fa-solid fa-check text-xs text-emerald-600 dark:text-emerald-400" aria-label="Completo" />}
                  <i className="fa-solid fa-arrow-right text-[10px] text-content-3 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </button>
              ))}
              {pendientes.length === 0 && actasPorFirmar.length === 0 && <p className="px-5 py-8 text-center text-xs text-content-3">No hay tareas pendientes para esta dependencia.</p>}
            </div>
          )}
          {!widgets.pendientes && actasPorFirmar.length === 0 && <div className="px-5 py-8 text-center text-xs text-content-3">La bandeja está oculta. Actívala desde “Personalizar”.</div>}
        </section>

        <aside className="space-y-4">
          <section className="rounded-panel border border-line bg-[#102d40] p-5 text-white shadow-card dark:bg-[#0f2635]" aria-label="Avance de asignación">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-teal-200">Responsables registrados</p><h2 className="mt-1 text-sm font-bold text-white">Avance de asignación</h2></div>
              <span className="font-display text-4xl font-black leading-none tabular-nums text-white">{resumenActual?.asignados == null ? '—' : Math.round(porcentajeVinculadoFuncionario) + '%'}</span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3"><span className="block text-[9px] font-bold uppercase tracking-wide text-white/60">Con responsable</span><span className="mt-1 block text-lg font-black tabular-nums text-white">{resumenActual?.asignados == null ? '—' : bienesVinculadosFuncionario.toLocaleString('es-PY')}</span></div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3"><span className="block text-[9px] font-bold uppercase tracking-wide text-white/60">Sin responsable</span><span className="mt-1 block text-lg font-black tabular-nums text-white">{resumenActual?.asignados == null ? '—' : Math.max(0, totalBienesDashboard - bienesVinculadosFuncionario).toLocaleString('es-PY')}</span></div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15" role={totalBienesDashboard ? 'progressbar' : undefined} aria-label="Avance de bienes con responsable" aria-valuemin={totalBienesDashboard ? 0 : undefined} aria-valuemax={totalBienesDashboard ? 100 : undefined} aria-valuenow={totalBienesDashboard ? Math.round(porcentajeVinculadoFuncionario) : undefined}><span className="block h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300 transition-[width] duration-700" style={{ width: Math.min(100, Math.max(0, porcentajeVinculadoFuncionario)) + '%' }} /></div>
            <p className="mt-3 text-[10px] leading-relaxed text-white/60">Según el responsable guardado en inventario; independiente de las firmas FC-10.</p>
          </section>

          {widgets.metricas && tilesPorDependencia.length > 0 && (
            <details open className="group overflow-hidden rounded-panel border border-line bg-surface-1 shadow-card">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-xs font-extrabold text-content-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                <span className="flex items-center gap-2"><i className="fa-solid fa-building-columns text-brand-text" aria-hidden="true" /> Dependencias</span>
                <span className="flex items-center gap-2 text-[10px] font-semibold text-content-3">{tilesPorDependencia.length} áreas <i className="fa-solid fa-chevron-down transition-transform group-open:rotate-180" aria-hidden="true" /></span>
              </summary>
              <div className="max-h-72 divide-y divide-line overflow-y-auto border-t border-line">
                {tilesPorDependencia.map(t => (
                  <button key={t.dep} type="button" disabled={!requestDependenciaChange || t.dep === dependenciaActual} onClick={() => requestDependenciaChange?.(t.dep)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2 disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-2 p-1.5">{t.logo ? <img src={t.logo} alt="" loading="lazy" className="max-h-full max-w-full object-contain" /> : <i className="fa-solid fa-building-columns text-brand-text" aria-hidden="true" />}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-bold text-content-1">{t.dep}</span><span className="mt-0.5 block text-[10px] text-content-3">{t.total.toLocaleString('es-PY')} bienes · {t.pctAsignados == null ? 'avance —' : Math.round(t.pctAsignados) + '% con responsable'}</span></span>
                    {t.dep === dependenciaActual ? <span className="rounded-full bg-brand-soft px-2 py-1 text-[9px] font-extrabold text-brand-text">Actual</span> : <i className="fa-solid fa-arrow-up-right-from-square text-[10px] text-content-3" aria-hidden="true" />}
                  </button>
                ))}
              </div>
            </details>
          )}
        </aside>
      </div>

      {widgets.accesos && (
        <section className="rounded-panel border border-line bg-surface-1 shadow-card" aria-label="Acciones rápidas">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
            <div><h2 className="text-xs font-extrabold uppercase tracking-[0.14em] text-content-1">Acciones rápidas</h2><p className="mt-1 text-[11px] text-content-3">Tareas frecuentes de inventario</p></div>
            <div className="relative">
              <button type="button" aria-expanded={menuAccesos} onClick={() => setMenuAccesos(v => !v)} className="flex h-9 items-center gap-2 rounded-lg px-3 text-[11px] font-bold text-content-2 transition hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><i className="fa-solid fa-sliders" aria-hidden="true" />Personalizar acciones</button>
              {menuAccesos && <div className="absolute right-0 z-30 mt-2 w-56 rounded-card border border-line bg-surface-1 p-2 shadow-pop" role="group" aria-label="Personalizar acciones rápidas">
                {ACCESOS.map(([id, label]) => <label key={id} className="flex cursor-pointer items-center gap-2 rounded-control px-2.5 py-2 text-xs font-medium text-content-1 hover:bg-surface-2"><input type="checkbox" checked={accesosVisibles.includes(id)} onChange={() => alternarAcceso(id)} className="h-4 w-4 accent-[var(--brand-primary)]" />{label}</label>)}
                <button type="button" onClick={() => setMenuAccesos(false)} className="mt-1 w-full rounded-control px-2 py-1.5 text-right text-[11px] font-bold text-brand-text hover:bg-surface-2">Listo</button>
              </div>}
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-line sm:grid-cols-3 lg:grid-cols-5 lg:divide-y-0">
            {accesosVisibles.includes('nuevo') && <button type="button" onClick={() => { setBienEditing(null); setIsBienModalOpen(true); }} className="group flex min-h-16 items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-white"><i className="fa-solid fa-plus" aria-hidden="true" /></span><span><span className="block text-xs font-extrabold text-content-1">Nuevo registro</span><span className="mt-1 block text-[10px] text-content-3">Agregar un bien</span></span></button>}
            {accesosVisibles.includes('importar') && <button type="button" onClick={() => fileInputRef.current?.click()} className="group flex min-h-16 items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><i className="fa-solid fa-file-import" aria-hidden="true" /></span><span><span className="block text-xs font-extrabold text-content-1">Importar CSV</span><span className="mt-1 block text-[10px] text-content-3">Cargar inventario</span></span></button>}
            {accesosVisibles.includes('exportar') && <button type="button" onClick={handleExportInventarioCSV} className="group flex min-h-16 items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300"><i className="fa-solid fa-file-export" aria-hidden="true" /></span><span><span className="block text-xs font-extrabold text-content-1">Exportar CSV</span><span className="mt-1 block text-[10px] text-content-3">Descargar datos</span></span></button>}
            {accesosVisibles.includes('qr') && <button type="button" onClick={() => { setIsBulkQR(true); setQrTargetBien(null); setIsQRModalOpen(true); }} className="group flex min-h-16 items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300"><i className="fa-solid fa-qrcode" aria-hidden="true" /></span><span><span className="block text-xs font-extrabold text-content-1">Lote de QRs</span><span className="mt-1 block text-[10px] text-content-3">Etiquetas masivas</span></span></button>}
            {accesosVisibles.includes('fc03') && <button type="button" onClick={openFC03Modal} className="group flex min-h-16 items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"><i className="fa-solid fa-print" aria-hidden="true" /></span><span><span className="block text-xs font-extrabold text-content-1">Reporte FC-03</span><span className="mt-1 block text-[10px] text-content-3">Inventario oficial</span></span></button>}
            {accesosVisibles.length === 0 && <p className="col-span-full px-4 py-6 text-center text-xs text-content-3">No hay acciones visibles. Usa «Personalizar acciones» para agregar alguna.</p>}
          </div>
        </section>
      )}

      {widgets.tendencias && (
        <details className="group overflow-hidden rounded-panel border border-line bg-surface-1 shadow-card">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-extrabold text-content-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
            <span><span className="block text-[10px] uppercase tracking-[0.15em] text-brand-text">Evolución</span><span className="mt-1 block">Cobertura y actividad</span></span>
            <i className="fa-solid fa-chevron-down text-content-3 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="grid gap-5 border-t border-line bg-surface-2/40 p-4 sm:p-5 lg:grid-cols-2">
            <section className="rounded-xl border border-line bg-surface-1 p-5">
              <h2 className="text-xs font-extrabold uppercase tracking-wide text-content-1">Cobertura</h2>
              <div className="mt-5 space-y-5">
                {[{ label: 'FC-10', count: stats.withFc10, pct: stats.percFC10, icon: 'fa-file-signature', color: 'bg-emerald-500' }, { label: 'Etiquetado QR', count: stats.withQR, pct: stats.percQR, icon: 'fa-qrcode', color: 'bg-brand' }].map(row => (
                  <div key={row.label}>
                    <div className="mb-2 flex items-end justify-between gap-3"><span><span className="flex items-center gap-2 text-xs font-bold text-content-1"><i className={'fa-solid ' + row.icon + ' text-content-3'} aria-hidden="true" />{row.label}</span><span className="mt-1 block text-[10px] text-content-3">{Number(row.count || 0).toLocaleString('es-PY')} de {Number(stats.totalItems || 0).toLocaleString('es-PY')} bienes</span></span><span className="text-lg font-black tabular-nums text-content-1">{Number(row.pct || 0).toFixed(1)}%</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-3"><span className={'block h-full rounded-full transition-[width] duration-700 ' + row.color} style={{ width: Math.max(1.5, Number(row.pct || 0)) + '%' }} /></div>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-xl border border-line bg-surface-1 p-5">
              <div className="flex items-center justify-between"><h2 className="text-xs font-extrabold uppercase tracking-wide text-content-1">Actividad anual</h2><span className="text-[10px] font-semibold text-content-3">Adquisiciones y FC-10</span></div>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div><h3 className="mb-3 text-[10px] font-bold uppercase tracking-wide text-content-3">Adquisiciones</h3><div className="space-y-3">{timeStats.adqByYear.length === 0 ? <p className="py-3 text-center text-[11px] text-content-3">Sin adquisiciones.</p> : timeStats.adqByYear.map((item, index) => <SimpleBar key={item.year} label={item.year} value={item.count} max={timeStats.adqMax} colorClass={index === 0 ? 'bg-brand' : 'bg-slate-400'} bgClass="bg-surface-3" title={'Filtrar inventario por año ' + item.year} onClick={() => irInventario(() => setFiltroAnio(item.year))} />)}</div></div>
                <div><h3 className="mb-3 text-[10px] font-bold uppercase tracking-wide text-content-3">Asignaciones FC-10</h3><div className="space-y-5"><SimpleBar label={'Actual (' + timeStats.currentMonthName + ')'} value={timeStats.asigCurrentMonth} max={timeStats.asigMax} colorClass="bg-emerald-500" bgClass="bg-surface-3" title="Ver asignaciones de este mes" onClick={() => { setFc10Year(timeStats.asigCurrent.year); setFc10Month(timeStats.asigCurrent.month); setActiveTab('fc10'); }} /><SimpleBar label={'Anterior (' + timeStats.prevMonthName + ')'} value={timeStats.asigPreviousMonth} max={timeStats.asigMax} colorClass="bg-slate-400" bgClass="bg-surface-3" title="Ver asignaciones del mes anterior" onClick={() => { setFc10Year(timeStats.asigPrev.year); setFc10Month(timeStats.asigPrev.month); setActiveTab('fc10'); }} /></div></div>
              </div>
            </section>
          </div>
        </details>
      )}

      {widgets.agenda && <AgendaPatrimonial bienes={bienes} fc10List={fc10List} dependenciaActual={dependenciaActual} onAbrirBien={evento => irInventario(() => setFiltroAnio(evento.anioAdquisicion || evento.fecha.slice(0, 4)))} onAbrirFC10={evento => { setFc10Year(evento.fecha.slice(0, 4)); setFc10Month(evento.fecha.slice(5, 7)); setActiveTab('fc10'); }} />}
    </div>
  );
}
