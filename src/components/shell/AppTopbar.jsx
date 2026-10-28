import React, { useState, useEffect, useRef } from 'react';
import { useIdioma } from '../../utils/i18n';
import FiltroCombo from '../FiltroCombo';
import { IconButton } from '../ui';
import { agruparNotificacionesPorDia } from '../../utils/notificationGroups';

/**
 * AppTopbar — barra superior del sistema.
 *
 * Lo que cambia respecto del Header anterior:
 *
 * 1. LA DEPENDENCIA ACTUAL SIEMPRE SE VE. Antes el selector vivia dentro de
 *    un `hidden lg:flex`: en tablet y movil el administrador se quedaba
 *    atascado en una dependencia sin poder cambiar. Ahora va en la barra y,
 *    en pantallas chicas, baja a una barra secundaria con el mismo dato.
 *
 * 2. La barra es una fila que puede ENCOGER, no una fila que se desborda:
 *    todo lleva `min-w-0` + `truncate`, y el bloque de acciones tiene
 *    `flex-wrap`. El problema de la cabecera del FC-10 (cinco bloques en
 *    fila con `shrink-0` y sin wrap) no puede repetirse aca.
 *
 * 3. Los `data-tour` se conservan (el tour los usa).
 */

export default function AppTopbar({
  isSidebarOpen,
  setIsSidebarOpen,
  setActiveTab,
  setIsScannerOpen,
  dependenciaActual,
  setDependenciaActual,
  todasDependencias,
  clearAllFilters,
  darkMode,
  setDarkMode,
  isNotifOpen,
  setIsNotifOpen,
  unreadCount,
  misNotificaciones,
  markAsRead,
  onMarkAllRead,
  currentUser,
  isAdmin,
  handleLogout,
  actasPorFirmarCount,
  ultimoSyncBienes
}) {
  const [filtroNotif, setFiltroNotif] = useState('todas');
  const { lang, setLang, t } = useIdioma();
  const [menuApariencia, setMenuApariencia] = useState(false);
  const [textoGrande, setTextoGrande] = useState(() => {
    try { return localStorage.getItem('ap_texto_grande') === '1'; } catch { return false; }
  });
  const [contrasteAlto, setContrasteAlto] = useState(() => {
    try { return localStorage.getItem('ap_contraste') === '1'; } catch { return false; }
  });
  const [reducirAnim, setReducirAnim] = useState(() => {
    try { return localStorage.getItem('ap_reduce_motion') === '1'; } catch { return false; }
  });
  const [densidadCompacta, setDensidadCompacta] = useState(() => {
    try { return localStorage.getItem('ap_densidad_compacta') === '1'; } catch { return false; }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('font-lg', textoGrande);
    try { localStorage.setItem('ap_texto_grande', textoGrande ? '1' : '0'); } catch { /* ignore */ }
  }, [textoGrande]);

  useEffect(() => {
    document.documentElement.classList.toggle('contrast-more', contrasteAlto);
    try { localStorage.setItem('ap_contraste', contrasteAlto ? '1' : '0'); } catch { /* ignore */ }
  }, [contrasteAlto, darkMode]);

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reducirAnim);
    try { localStorage.setItem('ap_reduce_motion', reducirAnim ? '1' : '0'); } catch { /* ignore */ }
  }, [reducirAnim]);

  useEffect(() => {
    document.documentElement.classList.toggle('density-compact', densidadCompacta);
    try { localStorage.setItem('ap_densidad_compacta', densidadCompacta ? '1' : '0'); } catch { /* ignore */ }
  }, [densidadCompacta]);

  const notifsVisibles =
    filtroNotif === 'noleidas'
      ? (misNotificaciones || []).filter((n) => !n.leido)
      : (misNotificaciones || []);
  const gruposNotificaciones = agruparNotificacionesPorDia(notifsVisibles);

  const RefMenu = useRef(null);
  useEffect(() => {
    if (!menuApariencia) return undefined;
    const cerrar = (e) => {
      if (RefMenu.current && !RefMenu.current.contains(e.target)) setMenuApariencia(false);
    };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, [menuApariencia]);

  return (
    <>
      <header className="topbar-premium sticky top-0 z-[120] shrink-0 mx-3 mt-3 sm:mx-4 sm:mt-4 lg:mx-4 lg:mt-4 rounded-2xl lg:rounded-3xl border backdrop-blur-xl shadow-card">
        <div className="flex min-h-16 items-center gap-2 sm:gap-3 px-3 sm:px-5">
          {/* Menu (solo movil) */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            aria-controls="sidebar-navigation"
            aria-expanded={!!isSidebarOpen}
            className="lg:hidden h-10 w-10 shrink-0 rounded-control flex items-center justify-center text-content-2 hover:bg-surface-2 transition-[color,background-color,transform] duration-[var(--dur-fast)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            title="Abrir menú"
            aria-label="Abrir menú"
          >
            <i className="fa-solid fa-bars" aria-hidden="true" />
          </button>

          {/* Contexto: la dependencia en la que se esta trabajando.
              Con `min-w-0` + `truncate`: en pantallas chicas se recorta en vez
              de empujar el resto de la barra fuera de la pantalla. */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-text" aria-hidden="true">
              <i className="fa-solid fa-building-columns text-xs" />
            </span>
            {isAdmin ? (
              <div className="min-w-0 max-w-[min(220px,42vw)] sm:max-w-[280px]">
                <FiltroCombo
                  valor={dependenciaActual}
                  opciones={todasDependencias}
                  onElegir={(v) => {
                    if (!v) return;
                    setDependenciaActual(v);
                    if (clearAllFilters) clearAllFilters();
                  }}
                  etiquetaTodos="Elegí dependencia"
                  titulo="Cambiar entorno de trabajo"
                  ancho="w-full"
                  className="!h-9 !rounded-full !border-transparent !bg-surface-2/70 font-semibold hover:!border-line hover:!bg-surface-2"
                />
              </div>
            ) : (
              <span
                title="Su cuenta está restringida a esta dependencia"
                className="inline-flex items-center gap-2 h-10 min-w-0 max-w-[min(200px,42vw)] px-3 rounded-full bg-surface-2/70 border border-line text-body font-semibold text-content-2"
              >
                <i className="fa-solid fa-lock text-[0.7em] shrink-0" aria-hidden="true" />
                <span className="truncate">{dependenciaActual}</span>
              </span>
            )}
          </div>

          <span
            title={ultimoSyncBienes ? `Inventario sincronizado el ${new Date(ultimoSyncBienes).toLocaleString('es-PY')}` : 'Aún no hay una sincronización confirmada para esta dependencia'}
            className="hidden xl:inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line/70 bg-surface-2/60 px-2.5 py-1.5 text-[10px] font-semibold text-content-3"
            aria-live="polite"
          >
            <i className={`fa-solid ${ultimoSyncBienes ? 'fa-cloud-check text-ok' : 'fa-cloud-arrow-down'}`} aria-hidden="true" />
            {ultimoSyncBienes ? `Actualizado ${new Date(ultimoSyncBienes).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}` : 'Sincronizando'}
          </span>

          {/* Acciones */}
          <div className="flex items-center gap-1.5 shrink-0">
            {actasPorFirmarCount > 0 ? (
              <button
                type="button"
                onClick={() => setActiveTab && setActiveTab('fc10')}
                title={`${actasPorFirmarCount} actas con firmas pendientes`}
                className="relative inline-flex items-center gap-2 h-10 px-3 rounded-full bg-brand-soft text-brand-text border border-brand/20 hover:bg-brand/10 transition-colors"
              >
                <i className="fa-solid fa-file-signature text-xs" aria-hidden="true" />
                <span className="hidden sm:inline text-body font-bold tabular-nums">{actasPorFirmarCount}</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              title="Escanear código QR"
              data-tour="scan"
              className="hidden md:inline-flex items-center gap-2 h-10 px-4 rounded-full bg-brand text-content-inverse font-bold shadow-sm shadow-brand/20 hover:bg-brand-hover hover:-translate-y-px transition-[background-color,transform,box-shadow]"
            >
              <i className="fa-solid fa-qrcode text-xs" aria-hidden="true" />
              Escanear QR
            </button>

            <IconButton
              titulo="Escanear código QR"
              icono="fa-qrcode"
              className="md:hidden rounded-full"
              onClick={() => setIsScannerOpen(true)}
            />

            <span aria-hidden="true" className="hidden sm:block w-px h-6 bg-line mx-1" />

            <IconButton
              titulo="Alternar tema claro / oscuro"
              icono={darkMode ? 'fa-sun' : 'fa-moon'}
              onClick={() => setDarkMode(!darkMode)}
              className="rounded-full"
            />

            {/* Apariencia */}
            <div className="relative" ref={RefMenu}>
              <IconButton
                titulo="Apariencia: texto, contraste y animaciones"
                icono="fa-wand-magic-sparkles"
                onClick={() => setMenuApariencia((v) => !v)}
                aria-expanded={menuApariencia}
                aria-haspopup="menu"
                className="rounded-full"
              />
              {menuApariencia ? (
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-1.5 w-64 rounded-panel border border-line bg-surface-1 shadow-pop p-1.5 animate-pop"
                >
                  <p className="px-3 py-2 text-label font-bold uppercase tracking-widest text-content-3">
                    {t('hdr.apariencia')}
                  </p>

                  <div className="flex items-center gap-2 px-3 py-2">
                    <span className="text-label font-semibold text-content-2 flex-1">{t('hdr.idioma')}</span>
                    <div className="flex rounded-control border border-line overflow-hidden">
                      {['es', 'gn'].map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => setLang(l)}
                          aria-pressed={lang === l}
                          className={`px-2.5 h-7 text-label font-black uppercase transition-colors ${ lang === l ? 'bg-brand text-content-inverse' : 'text-content-3 hover:bg-surface-2 hover:text-content-1' }`}
                        >
                          {l === 'es' ? 'ES' : 'GN'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {[
                    ['Texto grande', textoGrande, setTextoGrande, 'fa-text-height'],
                    ['Contraste alto', contrasteAlto, setContrasteAlto, 'fa-circle-half-stroke'],
                    ['Reducir animaciones', reducirAnim, setReducirAnim, 'fa-film'],
                    ['Tablas compactas', densidadCompacta, setDensidadCompacta, 'fa-table-cells']
                  ].map(([label, val, set, icon]) => (
                    <button
                      key={label}
                      type="button"
                      role="menuitemcheckbox"
                      aria-checked={val}
                      onClick={() => set((v) => !v)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-control text-label font-semibold text-content-1 hover:bg-surface-2 transition-colors"
                    >
                      <i className={`fa-solid ${icon} text-[10px] text-content-3 shrink-0`} aria-hidden="true" />
                      <span className="flex-1 text-left">{label}</span>
                      <span
                        className={`relative inline-flex h-5 w-9 items-center rounded-pill transition-colors ${ val ? 'bg-brand' : 'bg-surface-3' }`}
                        aria-hidden="true"
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-surface-1 shadow transition-transform ${ val ? 'translate-x-4' : 'translate-x-0.5' }`}
                        />
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Notificaciones */}
            <div className="relative">
              <IconButton
                titulo="Notificaciones"
                icono="fa-bell"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                aria-expanded={isNotifOpen}
                aria-haspopup="dialog"
                className="relative rounded-full"
              />
              {unreadCount > 0 ? (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-danger pointer-events-none" aria-hidden="true" />
              ) : null}

              {isNotifOpen ? (
                <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} aria-hidden="true" />
              ) : null}

              {isNotifOpen ? (
                <div className="absolute right-0 top-12 w-[min(22rem,calc(100vw-1.5rem))] bg-surface-1 shadow-pop border border-line rounded-panel z-50 overflow-hidden flex flex-col animate-slide-up origin-top-right">
                  <div className="px-5 py-4 border-b border-line bg-surface-2">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-body font-black tracking-tight text-content-1 uppercase">
                        Notificaciones
                      </h3>
                      {unreadCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => onMarkAllRead && onMarkAllRead()}
                          className="text-label font-bold text-brand-text hover:underline"
                        >
                          Marcar leídas
                        </button>
                      ) : (
                        <span className="text-label font-semibold text-content-3">Al día</span>
                      )}
                    </div>
                    <div className="flex gap-1.5 rounded-control bg-surface-3 p-1">
                      {[
                        { id: 'todas', label: `Todas (${(misNotificaciones || []).length})` },
                        { id: 'noleidas', label: `No leídas (${unreadCount})` }
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFiltroNotif(f.id)}
                          aria-pressed={filtroNotif === f.id}
                          className={`flex-1 h-8 rounded-control text-label font-bold transition-colors ${ filtroNotif === f.id ? 'bg-surface-1 text-content-1 shadow-sm' : 'text-content-3 hover:text-content-1' }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-y-auto max-h-[350px] custom-scrollbar">
                    {notifsVisibles.length === 0 ? (
                      <div className="p-8 text-center flex flex-col items-center justify-center opacity-60">
                        <i className="fa-regular fa-bell-slash text-2xl mb-3 text-content-3" aria-hidden="true" />
                        <span className="text-label font-bold text-content-2">
                          {filtroNotif === 'noleidas' ? 'Sin notificaciones pendientes' : 'Bandeja vacía'}
                        </span>
                      </div>
                    ) : (
                      gruposNotificaciones.map((grupo) => (
                        <section key={grupo.clave} aria-label={grupo.etiqueta}>
                          <h4 className="sticky top-0 z-10 border-y border-line/70 bg-surface-1/95 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-content-3 backdrop-blur-sm">
                            <span>{grupo.etiqueta}</span><span className="ml-2 font-medium tabular-nums">{grupo.notificaciones.length}</span>
                          </h4>
                          {grupo.notificaciones.map((n) => (
                            <button
                              key={n.id}
                              type="button"
                              onClick={() => {
                                markAsRead(n);
                                if (n.esSolicitud && setActiveTab) {
                                  setActiveTab('aprobaciones');
                                  setIsNotifOpen(false);
                                }
                              }}
                              className={`relative w-full border-b border-line/60 p-4 text-left transition-colors hover:bg-surface-2 ${!n.leido ? 'bg-surface-2' : ''}`}
                            >
                              {!n.leido ? <span className="absolute bottom-0 left-0 top-0 w-1 bg-brand" aria-hidden="true" /> : null}
                              <span className="flex items-start gap-3 pl-1">
                                <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-control ${n.esSolicitud ? 'bg-warn-soft text-warn' : n.accion === 'anuncio' ? 'bg-info-soft text-info' : n.accion === 'aprobar' ? 'bg-ok-soft text-ok' : 'bg-danger-soft text-danger'}`} aria-hidden="true">
                                  <i className={`fa-solid ${n.esSolicitud ? 'fa-paper-plane' : n.accion === 'anuncio' ? 'fa-bullhorn' : n.accion === 'aprobar' ? 'fa-check' : 'fa-xmark'} text-xs`} />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="flex items-center justify-between gap-2">
                                    <span className={`text-body leading-tight tracking-tight text-content-1 ${!n.leido ? 'font-black' : 'font-bold'}`}>{n.titulo}</span>
                                    {n.esSolicitud ? <span className="shrink-0 rounded-full border border-warn/25 bg-warn-soft px-1.5 py-0.5 text-label font-bold text-warn">Revisar</span> : null}
                                  </span>
                                  <span className="mt-1 block text-label font-medium leading-relaxed text-content-2">{n.mensaje}</span>
                                  <span className="mt-2 block text-label font-semibold tabular-nums text-content-3">
                                    {new Date(n.fecha).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </span>
                              </span>
                            </button>
                          ))}
                        </section>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Perfil */}
            <div className="flex items-center gap-2 pl-2 ml-1 border-l border-line">
              <div className="hidden xl:flex flex-col text-right leading-tight">
                <span className="text-label font-bold text-content-3 uppercase tracking-[0.14em] mt-0.5">
                  {isAdmin ? (currentUser?.role === 'dev' ? 'Desarrollador' : 'Administrador') : 'Funcionario'}
                </span>
              </div>
              <div
                title={currentUser?.nombre || 'Usuario'}
                className="flex h-10 w-10 items-center justify-center rounded-control bg-brand text-content-inverse font-bold select-none"
              >
                {currentUser?.nombre ? currentUser.nombre.charAt(0).toUpperCase() : 'U'}
              </div>
              <IconButton titulo="Cerrar sesión" icono="fa-power-off" variante="ghost" onClick={handleLogout} />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
