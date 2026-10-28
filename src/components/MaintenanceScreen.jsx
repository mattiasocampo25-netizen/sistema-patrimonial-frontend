import React from 'react';
import { APP_VERSION } from '../utils/helpers';

export default function MaintenanceScreen({ config, onAccesoDesarrollador }) {
  const mejoras = Array.isArray(config?.mejoras)
    ? config.mejoras
    : String(config?.mejoras || '').split('\n').map(s => s.trim()).filter(Boolean);

  const version = (typeof config?.ultima_version === 'string' && config.ultima_version.trim())
    ? config.ultima_version.trim()
    : APP_VERSION;

  const transcurrido = config?.transcurrido || '';
  const estimado = config?.estimado || '';

  return (
    <div className="min-h-dvh flex flex-col w-full bg-canvas font-sans antialiased relative overflow-hidden selection:bg-brand/30">
      {/* Fondo decorativo premium */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 h-96 w-[44rem] rounded-full bg-brand/10 blur-[100px]"></div>
        <div className="absolute top-1/3 -right-40 h-80 w-80 rounded-full bg-brand/10 blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-brand/10 blur-[80px]"></div>
      </div>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-2xl text-center">
          <img
            src="/UNP-Site-Logo.webp"
            alt="Universidad Nacional de Pilar"
            className="h-14 w-auto mx-auto object-contain drop-shadow-lg mb-6 sm:mb-8"
            onError={(e) => { e.target.onerror = null; e.target.src = '/UNP-Site-Logo.png'; }}
          />

          {/* Estado del mantenimiento con indicador animado */}
          <div role="status" aria-live="polite" className="inline-flex items-center gap-3 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-[0.14em] bg-warn-soft text-warn border border-warn/25 mb-6 backdrop-blur-sm">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warn opacity-70"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-warn"></span>
            </span>
            Sistema en mantenimiento
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-content-1 dark:text-white tracking-tight mb-4">
            {config?.titulo || 'Estamos mejorando el sistema'}
          </h1>
          <p className="text-base text-content-2 leading-relaxed mt-2 max-w-xl mx-auto mb-7 sm:mb-9">
            {config?.mensaje || 'El sistema está pausado por unos minutos mientras aplicamos mejoras. Vuelve pronto.'}
          </p>

          {/* Información de progreso */}
          {(transcurrido || estimado) && <dl className="mb-7 grid grid-cols-1 gap-3 rounded-panel border border-line bg-surface-1 p-4 text-left sm:grid-cols-2 sm:p-5">
            {transcurrido && <div><dt className="text-[10px] font-bold uppercase tracking-wider text-content-3">Tiempo transcurrido</dt><dd className="mt-1 text-sm font-semibold text-content-1">{transcurrido}</dd></div>}
            {estimado && <div><dt className="text-[10px] font-bold uppercase tracking-wider text-content-3">Tiempo estimado</dt><dd className="mt-1 text-sm font-semibold text-content-1">{estimado}</dd></div>}
          </dl>}

          {mejoras.length > 0 && (
            <div className="mb-7 rounded-panel border border-line bg-surface-1 p-4 text-left shadow-card sm:mb-9 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-content-3 mb-5">
                Mejoras en curso
              </p>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {mejoras.map((m, i) => (
                  <li key={i} className="flex min-w-0 items-start gap-3 rounded-xl border border-line bg-surface-2/70 p-3 text-sm text-content-1">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-text">
                      <span className="text-xs font-bold tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                    </span>
                    <span className="leading-relaxed">{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="mailto:patrimonio@unp.edu.py?subject=Consulta%20sobre%20mantenimiento%20del%20sistema" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-line bg-surface-1 px-4 text-sm font-semibold text-content-2 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
              <i className="fa-solid fa-envelope text-brand-text" aria-hidden="true" /> Contactar a Patrimonio
            </a>
            <button type="button" onClick={() => window.location.reload()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-brand px-4 text-sm font-bold text-content-inverse hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
              <i className="fa-solid fa-rotate-right" aria-hidden="true" /> Volver a comprobar
            </button>
          </div>
          <p className="mt-3 text-xs text-content-3">
            ¿Necesitas ayuda? <a href="mailto:patrimonio@unp.edu.py" className="font-semibold text-brand-text underline underline-offset-2">patrimonio@unp.edu.py</a>
          </p>
          {onAccesoDesarrollador && (
            <button
              onClick={onAccesoDesarrollador}
              className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-content-3 hover:text-slate-300 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded-lg px-4 py-2.5"
              title="Acceso del desarrollador del sistema"
            >
              <i className="fa-solid fa-key text-[10px]"></i>
              Acceso desarrollador
            </button>
          )}
        </div>
      </main>

      <footer className="relative z-10 mt-8 flex flex-col items-center justify-between gap-2 border-t border-line/70 px-6 py-5 text-center sm:flex-row sm:text-left">
        <p className="text-xs font-medium text-content-3">
          Universidad Nacional de Pilar · Dpto. Bienes Patrimoniales
        </p>
        <p className="text-xs font-bold text-content-3">
          Sistema de Gestión Patrimonial v{version}
        </p>
      </footer>
    </div>
  );
}
