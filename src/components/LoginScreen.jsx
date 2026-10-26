import React, { useState } from 'react';
import rectoradoBg from '../assets/rectorado-pilar.webp';
import { APP_VERSION } from '../utils/helpers';
import Dialogo from './ui/Dialogo';

export default function LoginScreen({
  handleLogin,
  loginUser,
  setLoginUser,
  loginPass,
  setLoginPass,
  showPassword,
  setShowPassword,
  loginError,
  appLogo,
  toasts,
  isProcessing = false,
  quitarToast = () => {},
  version = APP_VERSION
}) {
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [showAyudaModal, setShowAyudaModal] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const detectarCaps = (e) => {
    try { setCapsLock(!!(e.getModifierState && e.getModifierState('CapsLock'))); } catch { /* noop */ }
  };

  return (
    <div
      className="dark relative flex min-h-dvh w-full items-center justify-center overflow-x-hidden bg-[#0a0f1a] px-4 py-8 font-sans antialiased text-content-1 selection:bg-brand/20 sm:px-8"
    >
      {/* Fondo decorativo premium */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-blue-500/8 blur-[120px]" />
        <span className="absolute -bottom-40 -right-28 h-[28rem] w-[28rem] rounded-full bg-indigo-500/8 blur-[120px]" />
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[20rem] w-[20rem] rounded-full bg-blue-400/5 blur-[80px]" />
      </div>

      <div className="relative z-10 flex w-full items-center justify-center">
        <div className="login-card-in grid w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#0f172a] shadow-pop shadow-black/50 lg:max-w-5xl lg:grid-cols-[1.1fr_0.9fr]">
          {/* Hero izquierdo */}
          <aside className="login-hero relative hidden min-h-[680px] flex-col justify-between overflow-hidden p-12 text-white lg:flex xl:p-14">
            <img src={rectoradoBg} alt="Rectorado de la Universidad Nacional de Pilar" loading="lazy" decoding="async" width="1200" height="800" className="login-kenburns absolute inset-0 h-full w-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-blue-950/70 to-indigo-950/95" />
            <span className="login-orb-a absolute -right-20 -top-16 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
            <span className="login-orb-b absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl" />

            <div className="relative z-10 flex items-center gap-3 mb-8">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 p-2.5 backdrop-blur-sm shadow-lg">
                {appLogo ? <img src={appLogo} alt="Logo UNP Patrimonio" className="h-full w-full object-contain" /> : <i className="fa-solid fa-building-columns text-xl" />}
              </span>
              <span>
                <span className="block text-base font-bold tracking-wide">UNP · Patrimonio</span>
                <span className="mt-0.5 block text-xs font-medium text-white/70">Universidad Nacional de Pilar</span>
              </span>
            </div>

            <div className="relative z-10 max-w-lg">
              <h1 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl text-white mb-5">
                Sistema de Gestión Patrimonial
              </h1>
              <p className="mt-4 max-w-md text-base leading-relaxed text-white/85">
                Controla el inventario de bienes, registra responsables y genera actas FC-04, FC-10 y FC-11 desde un mismo lugar.
              </p>
              <div className="mt-8 flex flex-wrap gap-2.5 text-xs font-semibold text-white/95">
                {['Inventario', 'Actas FC-04 · FC-10 · FC-11', 'Trazabilidad QR'].map(etiqueta => (
                  <span key={etiqueta} className="rounded-full border border-white/20 bg-white/12 px-4 py-2 backdrop-blur-sm shadow-sm">
                    {etiqueta}
                  </span>
                ))}
              </div>
            </div>

            <p className="relative z-10 mt-auto text-xs text-white/60">Universidad Nacional de Pilar · Dpto. Bienes Patrimoniales</p>
          </aside>

          {/* Panel derecho de login */}
          <div className={`relative flex flex-col justify-center bg-gradient-to-br from-[#0f172a] to-[#0a0f1a] p-8 text-content-1 sm:p-10 lg:p-12 ${loginError ? 'animate-shake' : ''}`}>

            {/* Logo institucional */}
            <div className="login-rise login-rise-1 flex items-center gap-3 mb-3">
              {appLogo ? (
                <img src={appLogo} alt="Logo UNP" className="h-10 w-10 object-contain rounded-xl" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 border border-brand/25 text-brand-text">
                  <i className="fa-solid fa-university text-lg"></i>
                </div>
              )}
              <span className="text-base font-bold tracking-tight text-content-1">UNP <span className="font-medium text-content-3">· Patrimonio</span></span>
            </div>

            <div className="login-rise login-rise-2 mt-6 mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-content-1">Iniciar sesión</h2>
              <p className="text-base mt-2 text-content-3">
                Ingresa con tu cuenta institucional para continuar.
              </p>
            </div>

            <form onSubmit={handleLogin} className="w-full space-y-6">
              {loginError && (
                <div id="login-error" role="alert" className="rounded-2xl bg-danger-soft p-4 text-sm text-danger font-medium flex items-center gap-3 border border-danger/25 animate-slide-up shadow-sm">
                  <i className="fa-solid fa-circle-exclamation text-base text-danger shrink-0" aria-hidden="true"></i>
                  <span>No pudimos iniciar sesión. Revisa tu usuario y contraseña.</span>
                </div>
              )}

              <div className="login-rise login-rise-3 space-y-2.5 text-left">
                <label htmlFor="user" className="block text-sm font-semibold uppercase tracking-wider text-content-2">Usuario</label>
                <div className="relative group">
                  <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-sm text-content-3 group-focus-within:text-brand transition-colors"></i>
                  <input
                    type="text"
                    id="user"
                    name="username"
                    value={loginUser}
                    onChange={e => setLoginUser(e.target.value)}
                    onKeyDown={detectarCaps}
                    required
                    autoComplete="username"
                    disabled={isProcessing}
                    aria-invalid={loginError || undefined}
                    aria-describedby={loginError ? 'login-error' : undefined}
                    className="block w-full rounded-2xl border border-line bg-surface-2 pl-12 pr-4 py-4 text-base font-medium text-content-1 caret-brand placeholder:text-content-3 focus:border-brand focus:bg-surface-1 focus:ring-2 focus:ring-brand/20 motion disabled:opacity-60 outline-none"
                    placeholder="Escribe tu usuario"
                  />
                </div>
              </div>

              <div className="login-rise login-rise-3 space-y-2.5 text-left">
                <div className="flex justify-between items-center">
                  <label htmlFor="pass" className="block text-sm font-semibold uppercase tracking-wider text-content-2">Contraseña</label>
                  <button
                    type="button"
                    onClick={() => setShowRecoveryModal(true)}
                    className="text-sm font-semibold text-brand-text dark:text-brand hover:underline cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative group">
                  <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-sm text-content-3 group-focus-within:text-brand transition-colors"></i>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="pass"
                    name="password"
                    value={loginPass}
                    onChange={e => setLoginPass(e.target.value)}
                    onKeyDown={detectarCaps}
                    onKeyUp={detectarCaps}
                    required
                    autoComplete="current-password"
                    disabled={isProcessing}
                    aria-invalid={loginError || undefined}
                    aria-describedby={loginError ? 'login-error' : undefined}
                    className="block w-full rounded-2xl border border-line bg-surface-2 pl-12 pr-12 py-4 text-base font-medium text-content-1 caret-brand placeholder:text-content-3 focus:border-brand focus:bg-surface-1 focus:ring-2 focus:ring-brand/20 motion disabled:opacity-60 outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 hover:text-brand-text transition-colors cursor-pointer"
                    title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                  </button>
                </div>
                {capsLock && (
                  <p className="flex items-center gap-1.5 text-xs font-bold text-warn dark:text-amber-400">
                    <i className="fa-solid fa-triangle-exclamation text-[10px]"></i>
                    Bloq Mayús activado
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                aria-busy={isProcessing || undefined}
                className="login-rise login-rise-4 w-full rounded-2xl bg-brand px-4 py-4 text-base font-bold text-content-inverse hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus:outline-none motion cursor-pointer shadow-lg shadow-brand/25 hover:shadow-brand/35 active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait"
              >
                {isProcessing ? (
                  <>
                    <span className="login-spinner" aria-hidden="true"></span>
                    <span>Verificando…</span>
                  </>
                ) : (
                  <span>Acceder</span>
                )}
              </button>
            </form>

            <div className="mt-8 border-t border-line pt-6">
              <div className="flex items-center justify-center gap-4 text-center">
                <button
                  onClick={() => setShowAyudaModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-brand-text hover:bg-brand/10 transition-colors cursor-pointer border border-brand/20 motion"
                >
                  <i className="fa-solid fa-circle-question text-sm"></i>
                  Centro de Ayuda
                </button>
                <span className="w-px h-5 bg-white/20"></span>
                <span className="text-sm font-medium tracking-tight text-content-3">
                  © {new Date().getFullYear()} UNP · v{version}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TOASTS FLOTANTES */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts?.map(t => (
          <div key={t.id} className="pointer-events-auto flex items-center gap-3 px-5 py-3 min-w-[280px] max-w-[calc(100vw-3rem)] rounded-2xl shadow-xl text-sm font-bold bg-surface-1 text-content-1 dark:bg-surface-1 dark:text-white border border-line dark:border-line motion animate-slide-up login-rise login-rise-2">
            <i className={`fa-solid ${t.type === 'success' ? 'fa-circle-check text-ok' : t.type === 'error' ? 'fa-circle-exclamation text-danger' : t.type === 'warning' ? 'fa-triangle-exclamation text-warn' : 'fa-circle-info text-brand-text'} text-base`}></i>
            <span className="flex-1">{t.message}</span>
            {t.action && (
              <button
                onClick={() => { try { t.action.onClick(); } catch {} quitarToast(t.id); }}
                className="shrink-0 px-3 py-1.5 rounded-2xl text-sm font-bold bg-brand text-content-inverse hover:bg-brand-hover motion cursor-pointer active:scale-95"
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* MODAL DE RECUPERACIÓN / SOPORTE */}
      {showRecoveryModal && (
        <Dialogo className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-fade-in" onCerrar={() => setShowRecoveryModal(false)}>
          <div className="w-full max-w-sm rounded-3xl bg-surface-1 p-8 shadow-pop border border-line text-center text-content-1 animate-slide-up">
            <div className="h-16 w-16 rounded-2xl bg-blue-500/10 text-brand-text dark:text-brand border border-blue-500/20 flex items-center justify-center mx-auto mb-5">
              <i className="fa-solid fa-headset text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold text-content-1 tracking-tight">Recuperar acceso</h3>
            <p className="text-base text-content-2 dark:text-content-3 font-medium mt-3 leading-relaxed">
              Para restablecer tu contraseña, solicita ayuda al equipo de soporte patrimonial. Incluye tu nombre de usuario para identificar la cuenta.
            </p>
            <div className="mt-5 p-4 rounded-2xl bg-surface-2 dark:bg-surface-3/50 border border-line text-sm font-bold text-content-1 dark:text-content-3">
              <i className="fa-solid fa-envelope mr-2 text-brand-text dark:text-blue-400" aria-hidden="true"></i>
              <a href="mailto:patrimonio@unp.edu.py?subject=Recuperar%20acceso%20al%20sistema" className="text-brand-text underline-offset-2 hover:underline dark:text-brand">patrimonio@unp.edu.py</a>
            </div>
            <button
              onClick={() => setShowRecoveryModal(false)}
              className="mt-6 w-full py-4 rounded-2xl bg-content-1 hover:bg-content-2 text-content-inverse text-base font-bold motion cursor-pointer shadow-card active:scale-[0.98]"
            >
              Entendido
            </button>
          </div>
        </Dialogo>
      )}

      {/* MODAL CENTRO DE AYUDA */}
      {showAyudaModal && (
        <Dialogo className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-fade-in" onCerrar={() => setShowAyudaModal(false)}>
          <div className="w-full max-w-md rounded-3xl bg-surface-1 p-8 shadow-pop border border-line text-content-1 animate-slide-up">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-12 w-12 rounded-2xl bg-brand-soft text-brand-text flex items-center justify-center">
                <i className="fa-solid fa-circle-question text-xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-content-1 tracking-tight">Centro de Ayuda</h3>
                <p className="text-base text-content-2">Respuestas prácticas para usar el sistema.</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-surface-2 hover:bg-surface-3 cursor-pointer transition-colors motion" onClick={() => { window.location.href = '/ayuda'; setShowAyudaModal(false); }}>
                <i className="fa-solid fa-book-open mt-0.5 text-brand-text shrink-0 text-lg"></i>
                <div>
                  <p className="text-base font-semibold text-content-1">Guía de uso del sistema</p>
                  <p className="text-sm text-content-3">Inventario, actas, firmas y trazabilidad QR</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-surface-2 hover:bg-surface-3 cursor-pointer transition-colors motion" onClick={() => { setShowRecoveryModal(true); setShowAyudaModal(false); }}>
                <i className="fa-solid fa-headset mt-0.5 text-brand-text shrink-0 text-lg"></i>
                <div>
                  <p className="text-base font-semibold text-content-1">Soporte técnico</p>
                  <p className="text-sm text-content-3">Escríbenos a patrimonio@unp.edu.py</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-surface-2 hover:bg-surface-3 cursor-pointer transition-colors motion" onClick={() => { setShowAyudaModal(false); }}>
                <i className="fa-solid fa-keyboard mt-0.5 text-brand-text shrink-0 text-lg"></i>
                <div>
                  <p className="text-base font-semibold text-content-1">Atajos de teclado</p>
                  <p className="text-sm text-content-3">Ctrl+K para búsqueda global, / para inventario, ? para atajos</p>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-line">
              <button
                onClick={() => setShowAyudaModal(false)}
                className="w-full py-3.5 rounded-2xl bg-brand text-content-inverse font-bold motion cursor-pointer hover:bg-brand-hover active:scale-[0.98]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Dialogo>
      )}
    </div>
  );
}
