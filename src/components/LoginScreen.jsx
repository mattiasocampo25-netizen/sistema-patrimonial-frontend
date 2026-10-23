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
  // Version que muestra el pie. Viene de `app_config` (la fuente de verdad);
  // `APP_VERSION` queda como respaldo si la configuracion no llego.
  version = APP_VERSION
}) {
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const detectarCaps = (e) => {
    try { setCapsLock(!!(e.getModifierState && e.getModifierState('CapsLock'))); } catch { /* noop */ }
  };

  // Los colores salen de los tokens (styles/tokens.css), igual que en el
  // resto de la aplicacion. Antes este archivo traia los suyos y el login
  // se veía como un sistema aparte.

  return (
    <div
      className="dark relative flex min-h-dvh w-full items-center justify-center overflow-x-hidden bg-[#091426] px-4 py-8 font-sans antialiased text-content-1 selection:bg-brand/20 sm:px-8"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl" />
        <span className="absolute -bottom-40 -right-28 h-[28rem] w-[28rem] rounded-full bg-indigo-400/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full items-center justify-center">
        <div className="login-card-in grid w-full max-w-md overflow-hidden rounded-panel border border-white/10 bg-[#101f34] shadow-pop shadow-black/40 lg:max-w-5xl lg:grid-cols-[1.05fr_0.95fr]">
          <aside className="login-hero relative hidden min-h-[640px] flex-col justify-between overflow-hidden p-10 text-white lg:flex xl:p-12">
            <img src={rectoradoBg} alt="" loading="lazy" decoding="async" className="login-kenburns absolute inset-0 h-full w-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/65 via-blue-950/65 to-indigo-950/90" />
            <span className="login-orb-a absolute -right-20 -top-16 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
            <span className="login-orb-b absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl" />
            <div className="relative z-10 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-card border border-white/20 bg-white/10 p-2 backdrop-blur-sm">
                {appLogo ? <img src={appLogo} alt="" className="h-full w-full object-contain" /> : <i className="fa-solid fa-building-columns text-lg" />}
              </span>
              <span>
                <span className="block text-sm font-bold tracking-wide">UNP · Patrimonio</span>
                <span className="mt-0.5 block text-label font-medium text-white/70">Universidad Nacional de Pilar</span>
              </span>
            </div>
            <div className="relative z-10 max-w-lg">
              <p className="mb-3 text-label font-bold uppercase tracking-[0.2em] text-blue-200">Gestión institucional</p>
              <h1 className="text-3xl font-bold leading-tight tracking-tight xl:text-4xl">Control claro para cada bien.</h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/80">Consulta el inventario, registra responsables y sigue cada movimiento desde un mismo lugar.</p>
              <div className="mt-7 flex flex-wrap gap-2 text-label font-semibold text-white/90">
                {['Inventario', 'Actas FC-04 · FC-10 · FC-11', 'Trazabilidad QR'].map(etiqueta => <span key={etiqueta} className="rounded-pill border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-sm">{etiqueta}</span>)}
              </div>
            </div>
            <p className="relative z-10 text-label text-white/60">Sistema de Gestión Patrimonial · Universidad Nacional de Pilar</p>
          </aside>

          <div className={`relative flex flex-col justify-center bg-gradient-to-br from-[#101f34] to-[#0c192c] p-7 text-content-1 sm:p-10 lg:p-12 ${loginError ? 'animate-shake' : ''}`}>

            {/* Logo institucional */}
            <div className="login-rise login-rise-1 flex items-center gap-2 mb-2">
              {appLogo ? (
                <img src={appLogo} alt="Logo UNP" className="h-9 w-9 object-contain" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-control bg-brand/10 border border-brand/20 text-brand-text">
                  <i className="fa-solid fa-university text-base"></i>
                </div>
              )}
              <span className="text-sm font-bold tracking-tight text-content-1">UNP <span className="font-medium text-content-3">· Patrimonio</span></span>
            </div>

            <div className="login-rise login-rise-2 mt-6 mb-8">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-content-1">Iniciar sesión</h2>
              <p className="text-sm mt-1 text-content-3">
                Ingresa con tu cuenta institucional para continuar.
              </p>
            </div>

            <form onSubmit={handleLogin} className="w-full space-y-6">
              {loginError && (
                <div id="login-error" role="alert" className="rounded-control bg-danger-soft p-4 text-sm text-danger font-medium flex items-center gap-3 border border-danger/25 animate-slide-up shadow-sm">
                  <i className="fa-solid fa-circle-exclamation text-base text-danger shrink-0" aria-hidden="true"></i>
                  <span>No pudimos iniciar sesión. Revisa tu usuario y contraseña.</span>
                </div>
              )}

              <div className="login-rise login-rise-3 space-y-2 text-left">
                <label htmlFor="user" className="block text-label font-semibold uppercase tracking-wider text-content-2">Usuario</label>
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
                    className="block w-full rounded-control border border-line bg-surface-2 pl-10 pr-4 py-3.5 text-body font-medium text-content-1 caret-brand placeholder:text-content-3 focus:border-brand focus:bg-surface-1 focus:ring-2 focus:ring-brand/20 motion disabled:opacity-60 outline-none"
                    placeholder="Escribe tu usuario"
                  />
                </div>
              </div>

              <div className="login-rise login-rise-3 space-y-2 text-left">
                <div className="flex justify-between items-center">
                  <label htmlFor="pass" className="block text-label font-semibold uppercase tracking-wider text-content-2">Contraseña</label>
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
                    className="block w-full rounded-control border border-line bg-surface-2 pl-10 pr-10 py-3.5 text-body font-medium text-content-1 caret-brand placeholder:text-content-3 focus:border-brand focus:bg-surface-1 focus:ring-2 focus:ring-brand/20 motion disabled:opacity-60 outline-none"
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

              <button
                type="submit"
                disabled={isProcessing}
                aria-busy={isProcessing || undefined}
                className="login-rise login-rise-4 w-full rounded-control bg-brand px-4 py-3.5 text-sm font-bold text-content-inverse hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus:outline-none motion cursor-pointer shadow-lg shadow-brand/20 hover:shadow-brand/30 active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait"
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

            <p className="mt-7 border-t border-line pt-5 text-center text-label font-medium tracking-tight text-content-3">
              © {new Date().getFullYear()} Universidad Nacional de Pilar · v{version}
            </p>
          </div>
        </div>
      </div>

      {/* TOASTS FLOTANTES */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts?.map(t => (
          <div key={t.id} className="pointer-events-auto flex items-center gap-3 px-5 py-3 min-w-[280px] max-w-[calc(100vw-3rem)] rounded-card shadow-xl text-xs font-bold bg-surface-1 text-content-1 dark:bg-surface-1 dark:text-white border border-line dark:border-line motion animate-slide-up login-rise login-rise-2">
            <i className={`fa-solid ${t.type === 'success' ? 'fa-circle-check text-ok' : t.type === 'error' ? 'fa-circle-exclamation text-danger' : t.type === 'warning' ? 'fa-triangle-exclamation text-warn' : 'fa-circle-info text-brand-text'} text-base`}></i>
            <span className="flex-1">{t.message}</span>
            {t.action && (
              <button
                onClick={() => { try { t.action.onClick(); } catch {} quitarToast(t.id); }}
                className="shrink-0 px-3 py-1.5 rounded-control text-label font-bold bg-brand text-content-inverse hover:bg-brand-hover motion cursor-pointer active:scale-95"
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
          <div className="w-full max-w-sm rounded-panel bg-surface-1 p-7 shadow-pop border border-line text-center text-content-1 animate-slide-up">
            <div className="h-14 w-14 rounded-card bg-blue-500/10 text-brand-text dark:text-brand border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-headset text-xl"></i>
            </div>
            <h3 className="text-lg font-bold text-content-1 tracking-tight">Recuperar acceso</h3>
            <p className="text-sm text-content-2 dark:text-content-3 font-medium mt-2 leading-relaxed">
              Para restablecer tu contraseña, solicita ayuda al equipo de soporte patrimonial. Incluye tu nombre de usuario para identificar la cuenta.
            </p>
            <div className="mt-4 p-4 rounded-card bg-surface-2 dark:bg-surface-3/50 border border-line dark:border-line text-[11px] font-bold text-content-1 dark:text-content-3">
              <i className="fa-solid fa-envelope mr-2 text-brand-text dark:text-blue-400" aria-hidden="true"></i>
              <a href="mailto:patrimonio@unp.edu.py?subject=Recuperar%20acceso%20al%20sistema" className="text-brand-text underline-offset-2 hover:underline dark:text-brand">patrimonio@unp.edu.py</a>
            </div>
            <button
              onClick={() => setShowRecoveryModal(false)}
              className="mt-6 w-full py-4 rounded-control bg-content-1 hover:bg-content-2 text-content-inverse text-body font-bold motion cursor-pointer shadow-card active:scale-[0.98]"
            >
              Entendido
            </button>
          </div>
        </Dialogo>
      )}
    </div>
  );
}
