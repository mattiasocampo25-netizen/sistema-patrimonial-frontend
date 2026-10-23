import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useIdioma } from '../../utils/i18n';

/**
 * AppSidebar — navegación principal.
 *
 * Reorganiza los 12 destinos en grupos (Operación, Documentos, Administración,
 * Ayuda) para que se entienda de un vistazo qué es uso diario y qué es
 * administración. Antes era una lista plana de 12 botones, con un bloque de
 * "Administración" aparte al final que se mezclaba con la navegación.
 *
 * Los `data-tour` se conservan: el tour guiado los usa para señalar elementos.
 */

const GRUPOS = [
  {
    titulo: 'Operación',
    items: [
      { id: 'dashboard', label: 'nav.dashboard', icon: 'fa-chart-pie' },
      { id: 'resumen', label: 'nav.resumen', icon: 'fa-house-user' },
      { id: 'inventario', label: 'nav.inventario', icon: 'fa-boxes-stacked' },
      { id: 'funcionarios', label: 'nav.funcionarios', icon: 'fa-address-book' }
    ]
  },
  {
    titulo: 'Documentos',
    items: [
      { id: 'fc04', label: 'nav.fc04', icon: 'fa-file-invoice' },
      { id: 'fc10', label: 'nav.fc10', icon: 'fa-file-signature' },
      { id: 'fc11', label: 'nav.fc11', icon: 'fa-truck-fast' }
    ]
  },
  {
    titulo: 'Administración',
    soloAdmin: true,
    items: [
      { id: 'aprobaciones', label: 'nav.aprobaciones', icon: 'fa-check-to-slot' },
      { id: 'auditoria', label: 'nav.auditoria', icon: 'fa-magnifying-glass-chart' },
      { id: 'usuarios', label: 'nav.usuarios', icon: 'fa-users-gear' }
    ]
  },
  {
    titulo: 'Avisos',
    soloDesarrollador: true,
    items: [{ id: 'anuncios', label: 'nav.anuncios', icon: 'fa-bullhorn' }]
  },
  {
    titulo: 'Ayuda',
    items: [{ id: 'ayuda', label: 'nav.ayuda', icon: 'fa-circle-question' }]
  }
];

/**
 * Item de navegacion.
 *
 * OJO: esta fuera del componente a proposito. Si se definiera dentro del
 * cuerpo de AppSidebar, React crearia un TIPO DE COMPONENTE nuevo en cada
 * render: desmonta y remonta todo el subarbol, y el clic se pierde si hay un
 * re-render entre que se busca el boton y se lo pulsa (pasaba con FC-04).
 */
function ItemNav({ item, activo, onIr, solicitudes, t, compacta }) {
  const [tooltip, setTooltip] = useState(null);
  const ubicarTooltip = (event) => {
    if (!compacta || window.innerWidth < 1024) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({ left: rect.right + 10, top: rect.top + rect.height / 2 });
  };
  return (
    <>
    <button
      type="button"
      onClick={() => onIr(item.id)}
      aria-current={activo ? 'page' : undefined}
      title={compacta ? t(item.label) : undefined}
      onMouseEnter={ubicarTooltip}
      onMouseLeave={() => setTooltip(null)}
      onFocus={ubicarTooltip}
      onBlur={() => setTooltip(null)}
      data-tour={`nav-${item.id}`}
      className={`group relative flex w-full items-center ${compacta ? 'gap-3 px-3 lg:justify-center lg:px-0' : 'gap-3 px-3'} h-10 rounded-control text-body transition-[color,background-color,transform,box-shadow] duration-[var(--dur-fast)] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand ${ activo ? 'bg-gradient-to-r from-brand to-blue-700 text-white font-semibold shadow-md shadow-brand/20 dark:to-indigo-600' : 'text-sidebar-content-2 font-normal hover:bg-brand/5 dark:hover:bg-surface-1/[0.07] hover:text-sidebar-content' }`}
    >
      <span className={`flex items-center justify-center w-6 shrink-0 transition-transform duration-[var(--dur-fast)] group-hover:scale-110 ${activo ? 'text-brand-text' : 'text-sidebar-content-2 group-hover:text-sidebar-content'}`}>
        <i className={`fa-solid ${item.icon} text-[13px] ${activo ? 'text-white' : ''}`} aria-hidden="true" />
      </span>
      <span className={`flex-1 text-left tracking-tight truncate ${compacta ? 'lg:hidden' : ''}`}>{t(item.label)}</span>

      {item.id === 'aprobaciones' && solicitudes && solicitudes.length > 0 ? (
        <span className="flex h-5 min-w-5 px-1 shrink-0 items-center justify-center rounded-pill text-label font-bold bg-danger-soft text-danger">
          {solicitudes.length}
        </span>
      ) : null}
    </button>
    {compacta && tooltip && createPortal(
      <span aria-hidden="true" style={{ left: tooltip.left, top: tooltip.top, transform: 'translateY(-50%)' }} className="pointer-events-none fixed z-[100] whitespace-nowrap rounded-lg bg-zinc-950 px-3 py-2 text-xs font-semibold text-white shadow-xl animate-fade-in">
        {t(item.label)}
      </span>, document.body
    )}
    </>
  );
}

/** Utilidad de administracion (copia, restaurar, etc). */
function ItemHerramienta({ icono, titulo, onClick, badge, compacta }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={titulo}
      className={`group relative flex w-full items-center ${compacta ? 'gap-3 px-3 lg:justify-center lg:px-0' : 'gap-3 px-3'} h-10 rounded-control text-body font-normal text-sidebar-content-2 hover:bg-brand/5 dark:hover:bg-surface-1/[0.06] hover:text-sidebar-content transition-[color,background-color,transform] duration-[var(--dur-fast)] hover:translate-x-0.5 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand`}
    >
      <span className="flex items-center justify-center w-6 shrink-0 text-sidebar-content-2 group-hover:text-sidebar-content">
        <i className={`fa-solid ${icono} text-[13px]`} aria-hidden="true" />
      </span>
      <span className={`flex-1 text-left tracking-tight truncate ${compacta ? 'lg:hidden' : ''}`}>{titulo}</span>
      {badge ? <span className={compacta ? 'lg:absolute lg:right-1 lg:top-1' : ''}>{badge}</span> : null}
    </button>
  );
}

export default function AppSidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  compacta = false,
  darkMode = false,
  onToggleCompacta,
  appLogo,
  activeTab,
  setActiveTab,
  isAdmin,
  esDesarrollador,
  solicitudesBaja,
  onExportBackup,
  onOpenRestore,
  mantenimiento,
  onOpenMantenimiento,
  onOpenDependencias,
  currentUser
}) {
  // El menu se puede desplazar cuando la ventana es baja. Sin avisar, el
  // elemento del borde queda cortado a la mitad y no se ve que hay mas: se
  // difumina el borde (arriba y/o abajo) segun lo que haya fuera de vista.
  const navRef = useRef(null);
  const [desbordes, setDesbordes] = useState({ arriba: false, abajo: false });

  useEffect(() => {
    const el = navRef.current;
    if (!el) return undefined;
    const medir = () => {
      const arriba = el.scrollTop > 2;
      const abajo = el.scrollTop + el.clientHeight < el.scrollHeight - 2;
      setDesbordes((prev) => (prev.arriba === arriba && prev.abajo === abajo ? prev : { arriba, abajo }));
    };
    medir();
    el.addEventListener('scroll', medir, { passive: true });
    const observador = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(medir) : null;
    observador?.observe(el);
    return () => {
      el.removeEventListener('scroll', medir);
      observador?.disconnect();
    };
  }, [isSidebarOpen]);
  const { t } = useIdioma();
  const LOGO_SISTEMA = darkMode ? '/UNP-Site-Logo.webp' : '/UNP-Site-Logo-negro.webp';
  const LOGO_SISTEMA_PNG = darkMode ? '/UNP-Site-Logo.png' : '/UNP-Site-Logo-negro.png';

  const cerrar = () => setIsSidebarOpen && setIsSidebarOpen(false);

  const irA = (id) => {
    setActiveTab(id);
    cerrar();
  };

  return (
    <>
      {isSidebarOpen ? (
        <div
          onClick={cerrar}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden animate-fade-in-fast backdrop-blur-sm"
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={`sidebar-premium fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-sidebar border-r border-sidebar-line shadow-panel shrink-0 transition-[width,transform,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-standard)] lg:static lg:my-3 lg:ml-3 lg:rounded-2xl lg:translate-x-0 ${compacta ? 'lg:w-[76px]' : 'lg:w-[264px]'} ${ isSidebarOpen ? 'translate-x-0' : '-translate-x-full' }`}
        id="sidebar-navigation"
        aria-label="Navegación principal"
      >
        {/* Identidad */}
        <div className={`relative flex shrink-0 items-center border-b border-sidebar-line ${compacta ? 'min-h-[112px] justify-center px-3 pb-12 pt-3' : 'min-h-[76px] px-5 py-4'}`}>
          {appLogo ? (
            <div className={`flex min-w-0 items-center gap-3 ${compacta ? 'pr-8 lg:justify-center lg:pr-0' : 'pr-8'}`}>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-surface-1/10 shadow-card border border-white/10 overflow-hidden p-1.5">
                <img src={appLogo} alt="Logo Institucional" className="w-full h-full object-contain" />
              </div>
              <div className={`min-w-0 flex-1 animate-fade-in ${compacta ? 'lg:hidden' : ''}`}>
                <h2 className="text-body font-bold tracking-tight leading-snug text-sidebar-content truncate">
                  Dpto. Bienes Patrimoniales
                </h2>
                <p className="text-label font-medium text-sidebar-content-3 uppercase tracking-[0.12em] mt-0.5 truncate">
                  Universidad Nacional de Pilar
                </p>
              </div>
            </div>
          ) : (
            <div className={`flex items-center gap-3 ${compacta ? 'pr-8 lg:justify-center lg:pr-0' : 'pr-8'}`}>
              {/* El logotipo acompaña el tono del sidebar en ambos temas. */}
              {compacta ? <>
                <span className="hidden lg:flex h-10 w-10 items-center justify-center rounded-control border border-sidebar-line bg-surface-1/10 text-sm font-black tracking-tight text-sidebar-content" aria-label="Universidad Nacional de Pilar" title="Universidad Nacional de Pilar">UNP</span>
                <img src={LOGO_SISTEMA} alt="Universidad Nacional de Pilar" className="h-8 w-auto max-w-[150px] object-contain object-left lg:hidden" onError={(e) => { e.target.onerror = null; e.target.src = LOGO_SISTEMA_PNG; }} />
              </> : (
                <img src={LOGO_SISTEMA} alt="Universidad Nacional de Pilar" className="h-9 w-auto max-w-[150px] object-contain object-left" onError={(e) => { e.target.onerror = null; e.target.src = LOGO_SISTEMA_PNG; }} />
              )}
              {!compacta ? <div className="flex-1" /> : null}
            </div>
          )}
          <button
            type="button"
            onClick={onToggleCompacta}
            className={`absolute hidden h-8 w-8 items-center justify-center rounded-control text-sidebar-content-2 transition-colors hover:bg-brand/10 hover:text-sidebar-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand lg:inline-flex ${compacta ? 'bottom-2 left-1/2 right-auto top-auto -translate-x-1/2 translate-y-0' : 'right-3 top-1/2 -translate-y-1/2'}`}
            title={compacta ? 'Expandir navegación' : 'Contraer navegación'}
            aria-label={compacta ? 'Expandir navegación' : 'Contraer navegación'}
            aria-expanded={!compacta}
          >
            <i className={`fa-solid ${compacta ? 'fa-angles-right' : 'fa-angles-left'} text-xs`} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={cerrar}
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-control text-sidebar-content-2 transition-colors hover:bg-white/[0.08] hover:text-sidebar-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand lg:hidden"
            title="Cerrar menú"
            aria-label="Cerrar menú"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        {/* Navegación por grupos */}
        <nav
          ref={navRef}
          className={`flex-1 overflow-y-auto ${compacta ? 'px-3 py-4 space-y-4 lg:px-2 lg:space-y-3' : 'px-3 py-4 space-y-4'} custom-scrollbar ${desbordes.arriba ? 'nav-desborde-arriba' : ''} ${desbordes.abajo ? 'nav-desborde-abajo' : ''}`}
        >
          {GRUPOS.map((grupo) => {
            if (grupo.soloAdmin && !isAdmin) return null;
            if (grupo.soloDesarrollador && !esDesarrollador) return null;
            const visibles = grupo.items;
            if (!visibles.length) return null;
            return (
              <div key={grupo.titulo}>
                <p className={`px-3 pb-1.5 text-label font-semibold text-sidebar-content-3 uppercase tracking-[0.13em] animate-fade-in ${compacta ? 'lg:hidden' : ''}`}>
                  {grupo.titulo}
                </p>
                {compacta ? <div className="mx-auto mb-2 hidden h-px w-8 bg-sidebar-line lg:block" aria-hidden="true" /> : null}
                <div className="space-y-1">
                  {visibles.map((item) => (
                    <ItemNav
                      key={item.id}
                      item={item}
                      activo={activeTab === item.id}
                      onIr={irA}
                      solicitudes={solicitudesBaja}
                      t={t}
                      compacta={compacta}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Herramientas de administración */}
        {isAdmin ? (
          <div className={`shrink-0 border-t border-sidebar-line py-3 space-y-0.5 ${compacta ? 'px-3 lg:px-2' : 'px-3'}`}>
            <p className={`px-3 pb-1.5 text-label font-semibold text-sidebar-content-3 uppercase tracking-[0.13em] ${compacta ? 'lg:hidden' : ''}`}>
              Utilidades
            </p>
            <ItemHerramienta
              icono="fa-database"
              titulo="Copia de seguridad"
              compacta={compacta}
              onClick={() => {
                if (onExportBackup) onExportBackup();
                cerrar();
              }}
            />
            <ItemHerramienta
              icono="fa-clock-rotate-left"
              titulo="Restaurar respaldo"
              compacta={compacta}
              onClick={() => {
                if (onOpenRestore) onOpenRestore();
                cerrar();
              }}
            />
            <ItemHerramienta
              icono="fa-building-columns"
              titulo="Dependencias"
              compacta={compacta}
              onClick={() => {
                if (onOpenDependencias) onOpenDependencias();
                cerrar();
              }}
            />
            <ItemHerramienta
              icono="fa-screwdriver-wrench"
              titulo="Mantenimiento"
              compacta={compacta}
              onClick={() => {
                if (onOpenMantenimiento) onOpenMantenimiento();
                cerrar();
              }}
              badge={
                mantenimiento && mantenimiento.en_mantenimiento ? (
                  <span className="h-2 w-2 rounded-full bg-warn shrink-0" aria-label="Mantenimiento activo" />
                ) : null
              }
            />
          </div>
        ) : null}

        <div className={`shrink-0 border-t border-sidebar-line ${compacta ? 'p-3 lg:px-2' : 'p-3.5'} `}>
          <div className={`flex min-w-0 items-center gap-3 rounded-xl ${compacta ? 'lg:justify-center lg:px-0' : 'px-2 py-1.5'}`}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white shadow-sm">
              {(currentUser?.nombre || currentUser?.username || 'U').charAt(0).toUpperCase()}
            </span>
            <span className={`min-w-0 flex-1 ${compacta ? 'lg:hidden' : ''}`}>
              <span className="block truncate text-xs font-bold text-sidebar-content">{currentUser?.nombre || currentUser?.username || 'Usuario'}</span>
              <span className="block truncate text-[10px] font-medium text-sidebar-content-3">{isAdmin ? 'Administrador' : esDesarrollador ? 'Desarrollador' : 'Usuario del sistema'}</span>
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
