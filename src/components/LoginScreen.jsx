import React, { useEffect, useState } from 'react';
import { APP_VERSION } from '../utils/helpers';
import Dialogo from './ui/Dialogo';
import Button from './ui/Button';
import rectoradoPilar from '../assets/rectorado-pilar.webp';

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
  const [showPrivacidadModal, setShowPrivacidadModal] = useState(false);
  const [recordarUsuario, setRecordarUsuario] = useState(() => {
    try { return Boolean(localStorage.getItem('unp_login_usuario_recordado')); } catch { return false; }
  });
  const [capsLock, setCapsLock] = useState(false);

  useEffect(() => {
    try {
      const guardado = localStorage.getItem('unp_login_usuario_recordado');
      if (guardado) setLoginUser(guardado);
    } catch { /* el acceso funciona aunque el almacenamiento esté deshabilitado */ }
  }, [setLoginUser]);

  useEffect(() => {
    try {
      if (recordarUsuario && loginUser.trim()) localStorage.setItem('unp_login_usuario_recordado', loginUser.trim());
      else if (!recordarUsuario) localStorage.removeItem('unp_login_usuario_recordado');
    } catch { /* preferencia opcional */ }
  }, [recordarUsuario, loginUser]);

  const detectarCaps = (e) => {
    try { setCapsLock(!!(e.getModifierState && e.getModifierState('CapsLock'))); } catch { /* noop */ }
  };

  return (
    <div
      className={`relative flex h-dvh min-h-dvh w-full items-center justify-center overflow-x-hidden overflow-y-auto bg-canvas px-4 py-5 font-sans antialiased text-content-1 selection:bg-brand/20 sm:px-8 md:py-8 ${darkMode ? 'dark' : ''}`}
    >
      {/* Fondo limpio: el campus queda como acento dentro del panel institucional. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-brand/10 blur-[110px]" />
        <span className="absolute -bottom-48 -right-40 h-[32rem] w-[32rem] rounded-full bg-brand/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex w-full max-w-5xl items-center justify-center">
        <div className="login-card-in login-experience grid w-full overflow-hidden rounded-3xl border border-white/70 bg-surface-1 shadow-pop md:grid-cols-[.88fr_1.12fr]">
            <aside className="relative hidden min-h-[500px] flex-col justify-between overflow-hidden bg-[#25211c] p-8 text-white md:flex lg:p-10">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
              <img src={rectoradoPilar} alt="" className="absolute inset-0 h-full w-full object-cover object-[58%_center] opacity-65" />
              <div className="absolute inset-0 bg-gradient-to-b from-[#1b1814]/75 via-[#27221b]/60 to-[#151311]/95" />
              <div className="absolute -right-32 -top-28 h-96 w-96 rounded-full bg-brand/25 blur-3xl" />
              <div className="absolute -bottom-36 -left-32 h-96 w-96 rounded-full bg-brand/15 blur-3xl" />
              <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:42px_42px]" />
            </div>
            <div className="relative z-10 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/50 bg-white p-2 shadow-card">
                {appLogo ? <img src={appLogo} alt="Logo institucional UNP" className="h-full w-full object-contain" /> : <i className="fa-solid fa-building-columns text-xl text-teal-100" aria-hidden="true" />}
              </span>
              <span>
                <span className="block text-sm font-bold tracking-wide">UNP · PATRIMONIO</span>
                <span className="mt-0.5 block text-label font-medium uppercase tracking-[0.16em] text-slate-300">Universidad Nacional de Pilar</span>
              </span>
            </div>

            <div className="relative z-10 my-8 lg:my-10">
              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-200/20 bg-teal-300/10 px-3 py-1.5 text-label font-semibold text-teal-100">
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

          <div className="px-6 pb-6 pt-6 sm:px-9 sm:pb-7 md:px-10 md:py-8">
            <div className="login-rise login-rise-2 mb-5">
              <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand-text md:hidden" aria-hidden="true"><i className="fa-solid fa-right-to-bracket" /></span>
              <p className="text-label font-bold uppercase tracking-[0.16em] text-brand-text">Acceso institucional</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-content-1 sm:text-3xl">Iniciar sesión</h2>
              <p className="mt-2 text-sm leading-relaxed text-content-3">
                Ingresa con tu cuenta institucional para continuar.
              </p>
            </div>

            <form onSubmit={handleLogin} className="w-full space-y-4">
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
                    autoCapitalize="none"
                    spellCheck={false}
                    disabled={isProcessing}
                    aria-invalid={loginError || undefined}
                    aria-describedby={loginError ? 'login-error' : undefined}
                    className="block w-full rounded-control border border-line bg-surface-2/70 pl-11 pr-4 py-3.5 text-sm font-medium text-content-1 caret-brand placeholder:text-content-3 focus:border-brand focus:bg-surface-1 focus:ring-4 focus:ring-brand/10 motion disabled:opacity-60 outline-none"
                    placeholder="Escribe tu usuario"
                  />
                </div>
              </div>

              <label htmlFor="remember-username" className="inline-flex min-h-8 cursor-pointer items-center gap-2 text-xs font-medium text-content-2">
                <input id="remember-username" type="checkbox" checked={recordarUsuario} onChange={e => setRecordarUsuario(e.target.checked)} className="h-4 w-4 rounded border-line-strong text-brand-text focus:ring-brand" />
                Recordar mi usuario en este dispositivo <span className="text-content-3">(no guarda la contraseña)</span>
              </label>

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
              <p className="-mt-2 text-center text-[11px] leading-relaxed text-content-3">El acceso está limitado a usuarios autorizados. La información del padrón se muestra según tus permisos.</p>
            </form>
          </div>

          <div className="border-t border-line bg-surface-2/50 px-6 py-3 sm:px-9 md:px-10">
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
              <button type="button" onClick={() => setShowPrivacidadModal(true)} className="rounded-control px-2 py-2 text-xs font-semibold text-content-2 hover:bg-surface-3 hover:text-content-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">Privacidad</button>
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
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-brand/20 bg-brand-soft text-brand-text">
              <i className="fa-solid fa-headset text-xl"></i>
            </div>
            <h3 className="text-lg font-bold text-content-1 tracking-tight">Recuperar acceso</h3>
            <p className="text-sm text-content-2 dark:text-content-3 font-medium mt-2 leading-relaxed">
              Para restablecer tu contraseña, solicita ayuda al equipo de soporte patrimonial. Incluye tu nombre de usuario para identificar la cuenta.
            </p>
            <div className="mt-4 p-3 rounded-xl bg-surface-2 dark:bg-surface-3/50 border border-line text-sm font-bold text-content-1 dark:text-content-3">
              <i className="fa-solid fa-envelope mr-2 text-brand-text" aria-hidden="true"></i>
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
      {showPrivacidadModal && (
        <Dialogo className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-fade-in" onCerrar={() => setShowPrivacidadModal(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-line bg-surface-1 p-6 text-content-1 shadow-pop animate-slide-up">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-text"><i className="fa-solid fa-shield-halved" aria-hidden="true" /></span>
              <div><h3 className="text-lg font-bold">Privacidad y datos personales</h3><p className="mt-2 text-sm leading-relaxed text-content-2">Este sistema utiliza datos de funcionarios para administrar bienes, asignaciones y trazabilidad institucional. Solo deben consultarse y descargarse los datos necesarios para las tareas autorizadas; el acceso queda limitado por permisos.</p></div>
            </div>
            <p className="mt-4 rounded-xl border border-line bg-surface-2 p-3 text-xs leading-relaxed text-content-3">Para consultar o solicitar la corrección de información, contacta al área de Patrimonio: <a href="mailto:patrimonio@unp.edu.py?subject=Consulta%20sobre%20datos%20personales" className="font-semibold text-brand-text underline underline-offset-2">patrimonio@unp.edu.py</a>. La Universidad debe completar este aviso con la base legal, los plazos de conservación y el canal formal que establezca su política institucional.</p>
            <p className="mt-3 text-[11px] leading-relaxed text-content-3">Referencia normativa: Ley N.º 7593/2025 de Protección de Datos Personales, sujeta a su entrada en vigor y reglamentación. Consulta con el área jurídica institucional para el aviso definitivo.</p>
            <Button variante="primary" className="mt-5 w-full" onClick={() => setShowPrivacidadModal(false)}>Entendido</Button>
          </div>
        </Dialogo>
      )}
    </div>
  );
}
