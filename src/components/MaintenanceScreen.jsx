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
    <div className="maintenance-screen dark relative flex min-h-dvh w-full flex-col overflow-hidden font-sans antialiased text-white selection:bg-teal-300/30">
      <div aria-hidden="true" className="maintenance-orb maintenance-orb-one" />
      <div aria-hidden="true" className="maintenance-orb maintenance-orb-two" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8 sm:py-7">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div className="flex h-12 w-36 shrink-0 items-center justify-center rounded-xl bg-white px-3 shadow-lg sm:h-14 sm:w-44">
            <img src="/UNP-Site-Logo-negro.webp" alt="Universidad Nacional de Pilar" className="max-h-full max-w-full object-contain" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/UNP-Site-Logo-negro.png'; }} />
          </div>
          <div className="hidden min-w-0 border-l border-white/20 pl-4 sm:block">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-teal-100">Patrimonio</p>
            <p className="mt-1 text-xs text-slate-300">Universidad Nacional de Pilar</p>
          </div>
        </div>
        <span className="rounded-full border border-white/15 bg-white/[.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-slate-200 sm:text-xs">SIGEP · v{version}</span>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-center px-5 py-8 sm:px-8 sm:py-12">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)] lg:gap-16">
          <section className="maintenance-copy max-w-2xl">
            <div role="status" aria-live="polite" className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-teal-200/20 bg-teal-200/[.08] px-4 py-2 text-[10px] font-bold uppercase tracking-[.16em] text-teal-100 sm:mb-8 sm:text-xs">
              <span className="maintenance-status-dot" aria-hidden="true" /> Mejoras en curso
            </div>
            <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-[-.04em] text-white sm:text-5xl lg:text-6xl">
              {config?.titulo || 'Estamos preparando una nueva versión'}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:mt-6 sm:text-lg sm:leading-8">
              {config?.mensaje || 'Estamos trabajando en mejoras para ofrecerte una experiencia más clara, rápida y cómoda. El sistema volverá a estar disponible pronto.'}
            </p>
            <div className="maintenance-progress mt-8 max-w-md sm:mt-10" aria-label="Actualización en curso">
              <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-slate-300">
                <span>Preparando la actualización</span><span className="text-teal-200">En progreso</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="maintenance-progress-bar h-full w-2/5 rounded-full bg-gradient-to-r from-teal-300 to-cyan-200" /></div>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row">
              <button type="button" onClick={() => window.location.reload()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-teal-400 px-5 text-sm font-bold text-slate-950 shadow-lg shadow-teal-950/20 transition hover:-translate-y-0.5 hover:bg-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-100 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">
                <i className="fa-solid fa-rotate-right" aria-hidden="true" /> Comprobar disponibilidad
              </button>
              <a href="mailto:patrimonio@unp.edu.py?subject=Consulta%20sobre%20mantenimiento%20del%20sistema" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[.06] px-5 text-sm font-semibold text-white transition hover:bg-white/[.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-200">
                <i className="fa-regular fa-envelope text-teal-200" aria-hidden="true" /> Contactar a Patrimonio
              </a>
            </div>
            {onAccesoDesarrollador && <button onClick={onAccesoDesarrollador} className="mt-5 inline-flex items-center gap-2 rounded-lg px-1 py-2 text-xs font-semibold text-slate-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-200" title="Acceso del desarrollador del sistema"><i className="fa-solid fa-key text-[10px]" aria-hidden="true" /> Acceso desarrollador</button>}
          </section>

          <aside className="maintenance-card rounded-3xl border border-white/10 bg-white/[.06] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-7 lg:p-8">
            <div className="flex items-start gap-4 border-b border-white/10 pb-5 sm:pb-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-300/10 text-teal-200"><i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true" /></span>
              <div><h2 className="text-base font-bold text-white sm:text-lg">Una mejor experiencia está en camino</h2><p className="mt-1 text-sm leading-6 text-slate-300">Estamos actualizando el sistema para que trabajar con el patrimonio sea más sencillo.</p></div>
            </div>
            {(transcurrido || estimado) && <dl className="grid grid-cols-2 gap-3 border-b border-white/10 py-5 sm:py-6">
              {transcurrido && <div className="rounded-xl bg-white/[.05] p-3"><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tiempo transcurrido</dt><dd className="mt-1.5 text-sm font-semibold text-white">{transcurrido}</dd></div>}
              {estimado && <div className="rounded-xl bg-white/[.05] p-3"><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tiempo estimado</dt><dd className="mt-1.5 text-sm font-semibold text-white">{estimado}</dd></div>}
            </dl>}
            <div className="pt-5 sm:pt-6">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[.16em] text-teal-200">Qué estamos mejorando</p>
              {mejoras.length > 0 ? <ul className="space-y-3">
                {mejoras.map((m, i) => <li key={i} className="flex min-w-0 items-start gap-3 text-sm leading-6 text-slate-200">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-300/10 text-teal-200"><i className="fa-solid fa-check text-[10px]" aria-hidden="true" /></span><span>{m}</span>
                </li>)}
              </ul> : <ul className="space-y-3 text-sm text-slate-200">
                {['Interfaz más clara y consistente', 'Mejoras de uso y rendimiento', 'Nuevas animaciones sutiles'].map(item => <li key={item} className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-300/10 text-teal-200"><i className="fa-solid fa-check text-[10px]" aria-hidden="true" /></span>{item}</li>)}
              </ul>}
            </div>
            <p className="mt-6 rounded-xl border border-white/10 bg-slate-950/20 px-4 py-3 text-xs leading-5 text-slate-400">Gracias por tu paciencia. Tus datos permanecen protegidos durante la actualización.</p>
          </aside>
        </div>
      </main>

      <footer className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-2 border-t border-white/10 px-5 py-5 text-center text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:text-left">
        <p>Universidad Nacional de Pilar · Departamento de Bienes Patrimoniales</p>
        <a href="mailto:patrimonio@unp.edu.py" className="font-medium text-slate-300 hover:text-white">patrimonio@unp.edu.py</a>
      </footer>
    </div>
  );
}
