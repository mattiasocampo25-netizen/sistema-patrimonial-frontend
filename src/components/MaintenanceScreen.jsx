import React from 'react';
import { APP_VERSION } from '../utils/helpers';

export default function MaintenanceScreen({ config, onAccesoDesarrollador }) {
  const mejoras = Array.isArray(config?.mejoras)
    ? config.mejoras
    : String(config?.mejoras || '').split('\n').map(s => s.trim()).filter(Boolean);

  const version = (typeof config?.ultima_version === 'string' && config.ultima_version.trim())
    ? config.ultima_version.trim()
    : APP_VERSION;

  const _fechaInicio = config?.fechaInicio || new Date().toISOString();
  const transcurrido = config?.transcurrido || '';
  const estimado = config?.estimado || '';

  return (
    <div className="min-h-dvh flex flex-col w-full bg-canvas font-sans antialiased relative overflow-hidden selection:bg-brand/30">
      <span className="absolute bottom-4 right-5 z-10 text-xs font-semibold text-content-3">v{version}</span>
      {/* Fondo decorativo premium */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 h-96 w-[44rem] rounded-full bg-brand/10 blur-[100px]"></div>
        <div className="absolute top-1/3 -right-40 h-80 w-80 rounded-full bg-brand/10 blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-brand/10 blur-[80px]"></div>
      </div>

      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg text-center">
          <img
            src="/UNP-Site-Logo.webp"
            alt="Universidad Nacional de Pilar"
            className="h-16 w-auto mx-auto object-contain drop-shadow-lg mb-8"
            onError={(e) => { e.target.onerror = null; e.target.src = '/UNP-Site-Logo.png'; }}
          />

          {/* Estado del mantenimiento con indicador animado */}
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-[0.18em] bg-warn-soft text-warn border border-warn/25 mb-8 backdrop-blur-sm shadow-lg">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warn opacity-70"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-warn"></span>
            </span>
            Sistema en mantenimiento
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-content-1 dark:text-white tracking-tight mb-4">
            {config?.titulo || 'Estamos mejorando el sistema'}
          </h1>
          <p className="text-base text-content-1 leading-relaxed mt-2 max-w-md mx-auto mb-10">
            {config?.mensaje || 'El sistema está pausado por unos minutos mientras aplicamos mejoras. Vuelve pronto.'}
          </p>

          {/* Información de progreso */}
          {(transcurrido || estimado) && (
            <div className="mb-8 rounded-panel bg-surface-1 border border-line p-6 text-left backdrop-blur-sm">
              <div className="flex justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-content-3">Tiempo transcurrido</span>
                <span className="text-sm text-content-1 font-mono">{transcurrido}</span>
              </div>
              <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                <div className="h-full bg-brand rounded-full motion duration-[var(--dur-slow)]" style={{ width: '60%' }}></div>
              </div>
              {estimado && (
                <div className="mt-3 flex justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-content-3">Tiempo estimado restante</span>
                  <span className="text-sm text-content-1 font-mono">{estimado}</span>
                </div>
              )}
            </div>
          )}

          {mejoras.length > 0 && (
            <div className="mb-10 rounded-3xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm text-left">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-content-3 mb-5">
                Novedades en este momento
              </p>
              <ul className="space-y-4">
                {mejoras.map((m, i) => (
                  <li key={i} className="flex items-start gap-4 text-base text-slate-200">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30 mt-0.5">
                      <i className="fa-solid fa-check text-xs text-emerald-400"></i>
                    </span>
                    <span className="leading-relaxed">{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-sm text-content-3 mb-10">
            ¿Necesitas ayuda? Escríbenos a <span className="font-bold text-slate-300">patrimonio@unp.edu.py</span>
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

      <footer className="relative z-10 text-center pb-8 px-6">
        <p className="text-xs font-medium text-content-3">
          Universidad Nacional de Pilar · Dpto. Bienes Patrimoniales
        </p>
        <p className="text-xs font-bold text-content-3 mt-1.5">
          Sistema de Gestión Patrimonial v{version}
        </p>
      </footer>
    </div>
  );
}
