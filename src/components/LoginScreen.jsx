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
  darkMode,
  setDarkMode,
  appLogo,
  toasts,
  isProcessing = false,
  quitarToast = () => {}
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
      className={`${darkMode ? 'dark' : ''} min-h-dvh flex w-full font-sans antialiased selection:bg-brand/20 relative overflow-hidden bg-canvas text-content-1`}
    >

      {/* Fondo institucional: imagen del Rectorado (siempre visible) */}
      <div className="absolute inset-0 z-0">
        <img
          src={rectoradoBg}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1c38]/20 via-[#0a1c38]/50 to-[#0a1c38]/90 dark:from-[#0a1c38]/40 dark:via-[#0a1c38]/70 dark:to-[#0a1c38]/95"></div>
      </div>

      {/* Orbes decorativos sutiles (solo modo claro) */}
      {!darkMode && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[10%] left-[10%] -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-blue-50/40 blur-[120px]" style={{ filter: 'blur(100px)' }}></div>
          <div className="absolute -bottom-[10%] right-[10%] -translate-x-1/2 translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-indigo-50/40 blur-[120px]" style={{ filter: 'blur(100px)' }}></div>
        </div>
      )}

      {/* Contenido centrado, estilo Google */}
      <div className="relative z-10 flex h-dvh w-full items-center justify-center p-6">
        <div className="w-full max-w-sm login-card-in">
          <div className={`bg-surface-1 rounded-panel border border-line shadow-pop p-8 sm:p-10 relative flex flex-col text-content-1 ${loginError ? 'animate-shake' : ''}`}>

            {/* Logo institucional */}
            <div className="flex items-center gap-2 mb-2">
              {appLogo ? (
                <img src={appLogo} alt="Logo UNP" className="h-9 w-9 object-contain" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-control bg-brand/10 border border-brand/20 text-brand-text">
                  <i className="fa-solid fa-university text-base"></i>
                </div>
              )}
              <span className="text-sm font-bold tracking-tight text-brand-text">UNP · Patrimonio</span>
            </div>

            <div className="mt-6 mb-8">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-content-1">Iniciar sesión</h2>
              <p className="text-sm mt-1 text-content-3">
                Acceso al Sistema de Gestión Patrimonial
              </p>
            </div>

            <form onSubmit={handleLogin} className="w-full space-y-6">
              {loginError && (
                <div id="login-error" role="alert" className="rounded-control bg-danger-soft p-4 text-sm text-danger font-medium flex items-center gap-3 border border-danger/25 animate-slide-up shadow-sm">
                  <i className="fa-solid fa-circle-exclamation text-base text-danger shrink-0" aria-hidden="true"></i>
                  <span>Credenciales inválidas. Verifique su usuario y contraseña.</span>
                </div>
              )}

              <div className="space-y-2 text-left">
                <label htmlFor="user" className="block text-label font-semibold uppercase tracking-wider text-content-2">Usuario (ID)</label>
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
                    placeholder="ej. admin"
                  />
                </div>
              </div>

              <div className="space-y-2 text-left">
                <div className="flex justify-between items-center">
                  <label htmlFor="pass" className="block text-label font-semibold uppercase tracking-wider text-content-2">Contraseña</label>
                  <button
                    type="button"
                    onClick={() => setShowRecoveryModal(true)}
                    className="text-xs font-semibold text-brand-text dark:text-brand hover:underline cursor-pointer"
                  >
                    ¿Olvidó su clave?
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
                className="w-full rounded-control bg-brand px-4 py-3.5 text-sm font-bold text-content-inverse hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus:outline-none motion cursor-pointer shadow-lg shadow-brand/20 hover:shadow-brand/30 active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait"
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

            <p className="mt-8 text-center text-label font-medium tracking-tight uppercase text-content-3">
              © {new Date().getFullYear()} Universidad Nacional de Pilar · v{APP_VERSION}
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
                className="shrink-0 px-3 py-1.5 rounded-control text-[10px] font-black uppercase tracking-wider bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-darkbg-hover dark:text-content-1 dark:hover:bg-surface-1 motion cursor-pointer active:scale-95"
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* MODAL DE RECUPERACIÓN / SOPORTE */}
      {showRecoveryModal && (
        <Dialogo className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onCerrar={() => setShowRecoveryModal(false)}>
          <div className="w-full max-w-sm rounded-panel bg-surface-1 p-7 shadow-pop border border-line text-center text-content-1 animate-slide-up">
            <div className="h-14 w-14 rounded-card bg-blue-500/10 text-brand-text dark:text-brand border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-headset text-xl"></i>
            </div>
            <h3 className="text-lg font-bold text-content-1 dark:text-white tracking-tight">Recuperación de Acceso</h3>
            <p className="text-sm text-content-2 dark:text-content-3 font-medium mt-2 leading-relaxed">
              Por políticas de seguridad patrimonial de la UNP, el restablecimiento de contraseñas es gestionado por el Desarrollador del sistema.
            </p>
            <div className="mt-4 p-4 rounded-card bg-surface-2 dark:bg-zinc-800/50 border border-line dark:border-line text-[11px] font-bold text-content-1 dark:text-content-3">
              <i className="fa-solid fa-envelope mr-2 text-brand-text dark:text-blue-400"></i>
              Contacto: patrimonio@unp.edu.py
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
