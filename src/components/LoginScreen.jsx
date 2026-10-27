import React, { useState } from 'react';
import { APP_VERSION } from '../utils/helpers';
import Dialogo from './ui/Dialogo';
import Button from './ui/Button';

export default function LoginScreen({
  handleLogin,
  loginUser,
  setLoginUser,
  loginPass,
  setLoginPass,
  showPassword,
  setShowPassword,
  loginError,
  darkMode = false,
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
      className={`relative flex h-dvh min-h-dvh w-full items-start justify-center overflow-x-hidden overflow-y-auto bg-canvas px-4 py-8 font-sans antialiased text-content-1 selection:bg-brand/20 md:items-center sm:px-8 ${darkMode ? 'dark' : ''}`}
    >
      {/* Fondo decorativo sutil con tonos de marca */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute -left-32 -top-32 h-64 w-64 rounded-full bg-brand/10 blur-[100px]" />
        <span className="absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-brand/10 blur-[100px] dark:bg-brand/20" />
      </div>

      <div className="relative z-10 flex w-full items-center justify-center max-w-5xl">
        <div className="login-card-in grid w-full overflow-hidden rounded-3xl border border-line bg-surface-1 shadow-pop md:grid-cols-[0.95fr_1.05fr]">
          <aside className="relative hidden min-h-[620px] flex-col justify-between overflow-hidden bg-slate-950 p-10 text-white md:flex lg:p-14">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -right-32 -top-28 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
              <div className="absolute -bottom-36 -left-32 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
              <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:42px_42px]" />
            </div>
            <div className="relative z-10 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-2 shadow-card">
                {appLogo ? <img src={appLogo} alt="Logo institucional UNP" className="h-full w-full object-contain" /> : <i className="fa-solid fa-building-columns text-xl text-blue-200" aria-hidden="true" />}
              </span>
              <span>
                <span className="block text-sm font-bold tracking-wide">UNP · PATRIMONIO</span>
                <span className="mt-0.5 block text-label font-medium uppercase tracking-[0.16em] text-slate-300">Universidad Nacional de Pilar</span>
              </span>
            </div>

            <div className="relative z-10 my-12">
              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-label font-semibold text-blue-100">
                <i className="fa-solid fa-shield-halved" aria-hidden="true" /> Plataforma institucional
              </span>
              <h1 className="max-w-md text-3xl font-bold leading-tight tracking-tight lg:text-4xl">Tu gestión patrimonial, en un solo lugar.</h1>
              <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">Inventario, asignaciones y trazabilidad con la información organizada para cada dependencia.</p>
            </div>

            <div className="relative z-10 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300" aria-hidden="true"><i className="fa-solid fa-lock" /></span>
              <span><span className="block text-sm font-semibold">Acceso seguro</span><span className="mt-0.5 block text-xs text-slate-300">Solo para personal autorizado</span></span>
            </div>
          </aside>

          <section className="min-w-0 bg-surface-1">
          {/* Logo institucional prominente */}
          <div className="login-rise login-rise-1 flex items-center gap-3 border-b border-line px-6 py-5 md:hidden">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-soft text-brand-text ring-1 ring-brand/15">
              {appLogo ? (
                <img src={appLogo} alt="Logo UNP Patrimonio" className="h-full w-full object-contain" />
              ) : (
                <i className="fa-solid fa-university text-xl"></i>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-bold tracking-tight text-content-1">UNP <span className="font-medium text-content-3">· Patrimonio</span></span>
              <span className="mt-0.5 block text-label font-medium text-content-2">Sistema de Gestión Patrimonial</span>
            </div>
          </div>

          <div className="px-6 pb-7 pt-7 sm:px-10 sm:pb-9 md:px-12 md:pb-8 md:pt-12">
            <div className="login-rise login-rise-2 mb-6">
              <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand-text md:hidden" aria-hidden="true"><i className="fa-solid fa-right-to-bracket" /></span>
              <p className="text-label font-bold uppercase tracking-[0.16em] text-brand-text">Acceso institucional</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-content-1 sm:text-3xl">Iniciar sesión</h2>
              <p className="mt-2 text-sm leading-relaxed text-content-3">
                Ingresa con tu cuenta institucional para continuar.
              </p>
            </div>

            <form onSubmit={handleLogin} className="w-full space-y-5">
              {loginError && (
                <div id="login-error" role="alert" className="rounded-xl bg-danger-soft p-3.5 text-sm text-danger font-medium flex items-center gap-3 border border-danger/25 animate-slide-up shadow-sm">
                  <i className="fa-solid fa-circle-exclamation text-base text-danger shrink-0" aria-hidden="true"></i>
                  <span>No pudimos iniciar sesión. Revisa tu usuario y contraseña.</span>
                </div>
              )}

              <div className="login-rise login-rise-3 space-y-2 text-left">
                <label htmlFor="user" className="block text-xs font-semibold uppercase tracking-wider text-content-2">Usuario</label>
                <div className="relative group">
                  <i className="fa-solid fa-user absolute left-3 top-1/2 -translate-y-1/2 text-xs text-content-3 group-focus-within:text-brand transition-colors"></i>
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
                    className="block w-full rounded-control border border-line bg-surface-2/70 pl-11 pr-4 py-3.5 text-sm font-medium text-content-1 caret-brand placeholder:text-content-3 focus:border-brand focus:bg-surface-1 focus:ring-4 focus:ring-brand/10 motion disabled:opacity-60 outline-none"
                    placeholder="Escribe tu usuario"
                  />
                </div>
              </div>

              <div className="login-rise login-rise-3 space-y-2 text-left">
                <div className="flex justify-between items-center">
                  <label htmlFor="pass" className="block text-xs font-semibold uppercase tracking-wider text-content-2">Contraseña</label>
                  <button
                    type="button"
                    onClick={() => setShowRecoveryModal(true)}
                    className="text-xs font-semibold text-brand-text dark:text-brand hover:underline cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative group">
                  <i className="fa-solid fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-xs text-content-3 group-focus-within:text-brand transition-colors"></i>
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
                    className="block w-full rounded-control border border-line bg-surface-2/70 pl-11 pr-11 py-3.5 text-sm font-medium text-content-1 caret-brand placeholder:text-content-3 focus:border-brand focus:bg-surface-1 focus:ring-4 focus:ring-brand/10 motion disabled:opacity-60 outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-brand-text transition-colors cursor-pointer"
                    title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                  </button>
                </div>
                {capsLock && (
                  <p className="flex items-center gap-1.5 text-[10px] font-bold text-warn dark:text-amber-400">
                    <i className="fa-solid fa-triangle-exclamation text-[9px]"></i>
                    Bloq Mayús activado
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variante="primary"
                tamano="lg"
                cargando={isProcessing}
                disabled={isProcessing}
                className="!h-12 w-full !rounded-full shadow-md shadow-brand/20"
              >
                {isProcessing ? 'Verificando…' : 'Acceder'}
              </Button>
            </form>
          </div>

          <div className="border-t border-line bg-surface-2/50 px-6 py-4 sm:px-10 md:px-12">
            <div className="flex items-center justify-between gap-4 text-center sm:text-left">
              <Button
                variante="ghost"
                tamano="sm"
                icono="fa-circle-question"
                onClick={() => setShowAyudaModal(true)}
                className="text-xs"
              >
                Centro de Ayuda
              </Button>
              <span className="text-xs font-medium tracking-tight text-content-3">
                © {new Date().getFullYear()} UNP · v{version}
              </span>
            </div>
          </div>
          </section>
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
          <div className="w-full max-w-sm rounded-2xl bg-surface-1 p-6 shadow-pop border border-line text-center text-content-1 animate-slide-up">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-brand-text dark:text-brand border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-headset text-xl"></i>
            </div>
            <h3 className="text-lg font-bold text-content-1 tracking-tight">Recuperar acceso</h3>
            <p className="text-sm text-content-2 dark:text-content-3 font-medium mt-2 leading-relaxed">
              Para restablecer tu contraseña, solicita ayuda al equipo de soporte patrimonial. Incluye tu nombre de usuario para identificar la cuenta.
            </p>
            <div className="mt-4 p-3 rounded-xl bg-surface-2 dark:bg-surface-3/50 border border-line text-sm font-bold text-content-1 dark:text-content-3">
              <i className="fa-solid fa-envelope mr-2 text-brand-text dark:text-blue-400" aria-hidden="true"></i>
              <a href="mailto:patrimonio@unp.edu.py?subject=Recuperar%20acceso%20al%20sistema" className="text-brand-text underline-offset-2 hover:underline dark:text-brand">patrimonio@unp.edu.py</a>
            </div>
            <button
              onClick={() => setShowRecoveryModal(false)}
              className="mt-5 w-full py-3 rounded-xl bg-content-1 hover:bg-content-2 text-content-inverse text-sm font-bold motion cursor-pointer shadow-card active:scale-[0.98]"
            >
              Entendido
            </button>
          </div>
        </Dialogo>
      )}

      {/* MODAL CENTRO DE AYUDA */}
      {showAyudaModal && (
        <Dialogo className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-fade-in" onCerrar={() => setShowAyudaModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-surface-1 p-6 shadow-pop border border-line text-content-1 animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-brand-soft text-brand-text flex items-center justify-center">
                <i className="fa-solid fa-circle-question text-lg"></i>
              </div>
              <div>
                <h3 className="text-lg font-bold text-content-1 tracking-tight">Centro de Ayuda</h3>
                <p className="text-sm text-content-2">Respuestas prácticas para usar el sistema.</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-2 hover:bg-surface-3 cursor-pointer transition-colors motion" onClick={() => { window.location.href = '/ayuda'; setShowAyudaModal(false); }}>
                <i className="fa-solid fa-book-open mt-0.5 text-brand-text shrink-0 text-lg"></i>
                <div>
                  <p className="text-sm font-semibold text-content-1">Guía de uso del sistema</p>
                  <p className="text-[11px] text-content-3">Inventario, actas, firmas y trazabilidad QR</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-2 hover:bg-surface-3 cursor-pointer transition-colors motion" onClick={() => { setShowRecoveryModal(true); setShowAyudaModal(false); }}>
                <i className="fa-solid fa-headset mt-0.5 text-brand-text shrink-0 text-lg"></i>
                <div>
                  <p className="text-sm font-semibold text-content-1">Soporte técnico</p>
                  <p className="text-[11px] text-content-3">Escríbenos a patrimonio@unp.edu.py</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-2 hover:bg-surface-3 cursor-pointer transition-colors motion" onClick={() => { setShowAyudaModal(false); }}>
                <i className="fa-solid fa-keyboard mt-0.5 text-brand-text shrink-0 text-lg"></i>
                <div>
                  <p className="text-sm font-semibold text-content-1">Atajos de teclado</p>
                  <p className="text-[11px] text-content-3">Ctrl+K para búsqueda global, / para inventario, ? para atajos</p>
                </div>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-line">
              <button
                onClick={() => setShowAyudaModal(false)}
                className="w-full py-2.5 rounded-xl bg-brand text-content-inverse font-bold motion cursor-pointer hover:bg-brand-hover active:scale-[0.98]"
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
