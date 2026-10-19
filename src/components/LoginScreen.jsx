import React, { useState } from 'react';
import rectoradoBg from '../assets/rectorado-pilar.webp';
import { APP_VERSION } from '../utils/helpers';

const BULLETS = [
  { icon: 'fa-boxes-stacked', titulo: 'Inventario consolidado', texto: 'Bienes, traslados y asignaciones en un solo lugar.' },
  { icon: 'fa-file-signature', titulo: 'Actas FC-04 · FC-10 · FC-11', texto: 'Documentos oficiales en tamaño oficio, listos para firmar.' },
  { icon: 'fa-qrcode', titulo: 'Trazabilidad QR', texto: 'Cada activo identificado y verificable en campo.' },
];

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

  return (
    <div
      className={`${darkMode ? 'dark' : ''} min-h-dvh flex w-full font-sans antialiased selection:bg-brand-primary/20 relative overflow-hidden`}
      style={{
        backgroundColor: darkMode ? '#0b0f19' : '#f8fafc',
        color: darkMode ? '#f1f5f9' : '#0f172a'
      }}
    >

      {/* ===== Fondo institucional a pantalla completa ===== */}
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

      {/* Orbe decorativo sutil */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-[10%] left-[10%] -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-blue-600/10 dark:bg-blue-900/20 blur-[120px] mix-blend-overlay"
          style={{ filter: 'blur(100px)' }}
        ></div>
        <div
          className="absolute -bottom-[10%] right-[10%] -translate-x-1/2 translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-indigo-600/10 dark:bg-indigo-900/20 blur-[120px] mix-blend-overlay"
          style={{ filter: 'blur(100px)' }}
        ></div>
      </div>

      {/* ===== Contenido principal: sin cajas blancas, solo una tarjeta central ===== */}
      <div className="relative z-10 flex h-dvh w-full items-center justify-center p-6">

        {/* Tarjeta de acceso: pequeña, centrada, sin borde izquierdo ni divisiones */}
        <div className="w-full max-w-md login-card-in">
          <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-2xl border border-white/30 dark:border-zinc-800/50 shadow-2xl p-8 sm:p-12 relative flex flex-col ${loginError ? 'animate-shake border-rose-500/50' : ''}">
            {/* Acento superior */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-brand-primary via-brand-accent to-transparent"></div>

            <div className="flex flex-col mb-8 border-b border-zinc-100 dark:border-zinc-800/30 pb-6 text-left">
              <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-primary mb-3">
                <i className="fa-solid fa-shield-halved text-[10px]"></i>
                Portal de Acceso
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
                Iniciar Sesión
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-2">
                Ingrese sus credenciales autorizadas del sistema UNP.
              </p>
            </div>

            <form onSubmit={handleLogin} className="w-full space-y-6">
              {loginError && (
                <div id="login-error" role="alert" className="rounded-2xl bg-rose-50 dark:bg-rose-950/20 p-5 text-sm text-rose-700 dark:text-rose-300 font-medium flex items-center gap-3 border border-rose-200 dark:border-rose-900/50 animate-slide-up shadow-sm">
                  <i className="fa-solid fa-circle-exclamation text-base text-rose-500 shrink-0" aria-hidden="true"></i>
                  <span>Credenciales inválidas. Verifique su usuario y contraseña.</span>
                </div>
              )}

              <div className="space-y-2 text-left">
                <label htmlFor="user" className="block text-[10px] font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Usuario (ID)
                </label>
                <div className="relative group">
                  <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-brand-primary group-focus-within:scale-110 text-xs transition-all"></i>
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
                    className="block w-full rounded-2xl border border-zinc-200/90 bg-zinc-50 dark:bg-zinc-900/50 pl-11 pr-4 py-4 text-sm font-bold text-zinc-900 dark:text-white focus:border-brand-primary focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 dark:border-zinc-700 transition-all placeholder:text-zinc-400 placeholder:font-normal disabled:opacity-60"
                    placeholder="ej. admin"
                  />
                </div>
              </div>

              <div className="space-y-2 text-left">
                <div className="flex justify-between items-center">
                  <label htmlFor="pass" className="block text-[10px] font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRecoveryModal(true)}
                    className="text-[10px] font-bold text-brand-primary dark:text-brand-accent hover:underline cursor-pointer"
                  >
                    ¿Olvidó su clave?
                  </button>
                </div>
                <div className="relative group">
                  <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-brand-primary group-focus-within:scale-110 text-xs transition-all"></i>
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
                    className="block w-full rounded-2xl border border-zinc-200/90 bg-zinc-50 dark:bg-zinc-900/50 pl-11 pr-11 py-4 text-sm font-bold text-zinc-900 dark:text-white focus:border-brand-primary focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 dark:border-zinc-700 transition-all placeholder:text-zinc-400 placeholder:font-normal disabled:opacity-60"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer"
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

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  aria-busy={isProcessing || undefined}
                  className="group w-full rounded-2xl bg-brand-primary px-6 py-4 text-sm font-black text-white hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus:outline-none transition-all cursor-pointer flex justify-center items-center gap-2 shadow-lg shadow-brand-primary/25 hover:shadow-xl hover:-translate-y-px active:translate-y-0 disabled:opacity-70 disabled:cursor-wait disabled:hover:translate-y-0"
                >
                  {isProcessing ? (
                    <>
                      <span className="login-spinner" aria-hidden="true"></span>
                      <span>Verificando credenciales…</span>
                    </>
                  ) : (
                    <>
                      <span>Acceder a la Plataforma</span>
                      <i className="fa-solid fa-arrow-right-to-bracket text-xs ml-1 transition-transform duration-300 group-hover:translate-x-1"></i>
                    </>
                  )}
                </button>
                <p className="mt-6 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  <i className="fa-solid fa-shield-halved text-[10px] text-emerald-500"></i>
                  Acceso restringido · UNP
                </p>
              </div>
            </form>

            {/* Beneficios pequeños al final de la tarjeta */}
            <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800/30">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-3 text-center">
                Características del sistema
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {BULLETS.map((b) => (
                  <div key={b.titulo} className="flex flex-col items-center gap-2 text-center">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/15 text-brand-accent backdrop-blur-sm">
                      <i className={`fa-solid ${b.icon} text-[12px]`}></i>
                    </span>
                    <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 leading-tight">
                      {b.titulo}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-[10px] font-medium text-white/50">
                © {new Date().getFullYear()} Universidad Nacional de Pilar &nbsp;·&nbsp; v{APP_VERSION}
              </p>
            </div>
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
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-darkbg-card p-7 shadow-2xl border border-zinc-200 dark:border-darkbg-border text-center animate-slide-up">
            <div className="h-14 w-14 rounded-2xl bg-blue-500/10 text-brand-primary dark:text-brand-accent border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-headset text-xl"></i>
            </div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
              Recuperación de Acceso
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 font-medium mt-2 leading-relaxed">
              Por políticas de seguridad patrimonial de la UNP, el restablecimiento de contraseñas es gestionado por el Desarrollador del sistema.
            </p>
            <div className="mt-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-darkbg-border text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
              <i className="fa-solid fa-envelope mr-2 text-brand-primary dark:text-blue-400"></i>
              Contacto: patrimonio@unp.edu.py
            </div>
            <button
              onClick={() => setShowRecoveryModal(false)}
              className="mt-6 w-full py-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 text-sm font-black transition-all cursor-pointer shadow-md active:scale-[0.98]"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}