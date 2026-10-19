import React, { useState } from 'react';
import rectoradoBg from '../assets/rectorado-pilar.webp';
import { APP_VERSION } from '../utils/helpers';

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

  const bgColor = darkMode ? '#0b0f19' : '#ffffff';
  const cardColor = darkMode ? '#111827' : '#f8fafc';
  const inputColor = darkMode ? '#1f2937' : '#ffffff';
  const textMain = darkMode ? '#f3f4f6' : '#111827';
  const textDim = darkMode ? '#9ca3af' : '#6b7280';
  const borderColor = darkMode ? '#374151' : '#e5e7eb';

  return (
    <div
      className={`${darkMode ? 'dark' : ''} min-h-dvh flex w-full font-sans antialiased selection:bg-brand-primary/20 relative overflow-hidden`}
      style={{ backgroundColor: bgColor, color: textMain }}
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
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-2xl p-8 sm:p-10 relative flex flex-col ${loginError ? 'animate-shake' : ''}" style={{ backgroundColor: cardColor, color: textMain }}>

            {/* Logo institucional */}
            <div className="flex items-center gap-2 mb-2">
              {appLogo ? (
                <img src={appLogo} alt="Logo UNP" className="h-9 w-9 object-contain" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
                  <i className="fa-solid fa-university text-base"></i>
                </div>
              )}
              <span className="text-sm font-bold tracking-tight text-brand-primary">UNP · Patrimonio</span>
            </div>

            <div className="mt-6 mb-8">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: textMain }}>Iniciar sesión</h2>
              <p className="text-sm text-[color:var(--login-subtitle, #6b7280)] mt-1" style={{ color: textDim }}>
                Acceso al Sistema de Gestión Patrimonial
              </p>
            </div>

            <form onSubmit={handleLogin} className="w-full space-y-6">
              {loginError && (
                <div id="login-error" role="alert" className="rounded-xl bg-rose-50 dark:bg-rose-900/30 p-4 text-sm text-rose-700 dark:text-rose-300 font-medium flex items-center gap-3 border border-rose-100 dark:border-rose-800/50 animate-slide-up shadow-sm" style={{ color: loginError ? (darkMode ? '#fb7185' : '#dc2626') : 'inherit' }}>
                  <i className="fa-solid fa-circle-exclamation text-base text-rose-500 shrink-0" aria-hidden="true"></i>
                  <span>Credenciales inválidas. Verifique su usuario y contraseña.</span>
                </div>
              )}

              <div className="space-y-2 text-left">
                <label htmlFor="user" className="block text-xs font-semibold text-[color:var(--login-label, #6b7280)] uppercase tracking-wider" style={{ color: textDim }}>Usuario (ID)</label>
                <div className="relative group">
                  <i className="fa-solid fa-user absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--login-icon, #9ca3af)] text-xs group-focus-within:text-brand-primary transition-colors" style={{ color: textDim }}></i>
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
                    className="block w-full rounded-xl border pl-10 pr-4 py-3.5 text-sm font-medium placeholder:text-[color:var(--login-placeholder, #9ca3af)] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all disabled:opacity-60 outline-none"
                    style={{
                      backgroundColor: inputColor,
                      borderColor: borderColor,
                      color: textMain,
                      caretColor: '#1d4ed8'
                    }}
                    placeholder="ej. admin"
                  />
                </div>
              </div>

              <div className="space-y-2 text-left">
                <div className="flex justify-between items-center">
                  <label htmlFor="pass" className="block text-xs font-semibold text-[color:var(--login-label, #6b7280)] uppercase tracking-wider" style={{ color: textDim }}>Contraseña</label>
                  <button
                    type="button"
                    onClick={() => setShowRecoveryModal(true)}
                    className="text-xs font-semibold text-brand-primary dark:text-brand-accent hover:underline cursor-pointer"
                  >
                    ¿Olvidó su clave?
                  </button>
                </div>
                <div className="relative group">
                  <i className="fa-solid fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--login-icon, #9ca3af)] text-xs group-focus-within:text-brand-primary transition-colors" style={{ color: textDim }}></i>
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
                    className="block w-full rounded-xl border pl-10 pr-10 py-3.5 text-sm font-medium placeholder:text-[color:var(--login-placeholder, #9ca3af)] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all disabled:opacity-60 outline-none"
                    style={{
                      backgroundColor: inputColor,
                      borderColor: borderColor,
                      color: textMain,
                      caretColor: '#1d4ed8'
                    }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--login-icon, #9ca3af)] hover:text-brand-primary transition-colors cursor-pointer"
                    title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                  </button>
                </div>
                {capsLock && (
                  <p className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    <i className="fa-solid fa-triangle-exclamation text-[9px]"></i>
                    Bloq Mayús activado
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                aria-busy={isProcessing || undefined}
                className="w-full rounded-xl bg-brand-primary px-4 py-3.5 text-sm font-bold text-white hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus:outline-none transition-all cursor-pointer shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30 active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait"
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

            <p className="mt-8 text-center text-xs font-medium text-[color:var(--login-footer, #9ca3af)] tracking-tight uppercase" style={{ color: textDim }}>
              © {new Date().getFullYear()} Universidad Nacional de Pilar · v{APP_VERSION}
            </p>
          </div>
        </div>
      </div>

      {/* TOASTS FLOTANTES */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts?.map(t => (
          <div key={t.id} className="pointer-events-auto flex items-center gap-3 px-5 py-3 min-w-[280px] max-w-[calc(100vw-3rem)] rounded-2xl shadow-xl text-xs font-bold bg-white text-zinc-900 dark:bg-darkbg-card dark:text-white border border-zinc-200 dark:border-darkbg-border transition-all animate-slide-up login-rise login-rise-2">
            <i className={`fa-solid ${t.type === 'success' ? 'fa-circle-check text-emerald-500' : t.type === 'error' ? 'fa-circle-exclamation text-rose-500' : t.type === 'warning' ? 'fa-triangle-exclamation text-amber-500' : 'fa-circle-info text-brand-primary'} text-base`}></i>
            <span className="flex-1">{t.message}</span>
            {t.action && (
              <button
                onClick={() => { try { t.action.onClick(); } catch {} quitarToast(t.id); }}
                className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-darkbg-hover dark:text-zinc-900 dark:hover:bg-white transition-all cursor-pointer active:scale-95"
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* MODAL DE RECUPERACIÓN / SOPORTE */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-darkbg-card p-7 shadow-2xl border border-zinc-100 dark:border-darkbg-border text-center animate-slide-up">
            <div className="h-14 w-14 rounded-2xl bg-blue-500/10 text-brand-primary dark:text-brand-accent border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-headset text-xl"></i>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Recuperación de Acceso</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 font-medium mt-2 leading-relaxed">
              Por políticas de seguridad patrimonial de la UNP, el restablecimiento de contraseñas es gestionado por el Desarrollador del sistema.
            </p>
            <div className="mt-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-darkbg-border text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
              <i className="fa-solid fa-envelope mr-2 text-brand-primary dark:text-blue-400"></i>
              Contacto: patrimonio@unp.edu.py
            </div>
            <button
              onClick={() => setShowRecoveryModal(false)}
              className="mt-6 w-full py-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 text-sm font-bold transition-all cursor-pointer shadow-md active:scale-[0.98]"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
