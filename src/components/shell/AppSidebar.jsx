import React, { useEffect, useRef, useState } from 'react';
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
function ItemNav({ item, activo, onIr, solicitudes, t }) {
  return (
    <button
      type="button"
      onClick={() => onIr(item.id)}
      aria-current={activo ? 'page' : undefined}
      title={t(item.label)}
      data-tour={`nav-${item.id}`}
      className={`group relative flex w-full items-center gap-3 rounded-control px-3 h-10 text-body transition-colors duration-[var(--dur-fast)] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand ${ activo ? 'bg-surface-1/[0.10] text-sidebar-content font-semibold' : 'text-sidebar-content-2 font-normal hover:bg-surface-1/[0.06] hover:text-sidebar-content' }`}
    >
      {activo ? (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-pill bg-brand" aria-hidden="true" />
      ) : null}
      <span className={`flex items-center justify-center w-6 shrink-0 ${activo ? 'text-brand-text' : 'text-sidebar-content-2 group-hover:text-sidebar-content'}`}>
        <i className={`fa-solid ${item.icon} text-[13px]`} aria-hidden="true" />
      </span>
      <span className="flex-1 text-left tracking-tight truncate">{t(item.label)}</span>

      {item.id === 'aprobaciones' && solicitudes && solicitudes.length > 0 ? (
        <span className="flex h-5 min-w-5 px-1 shrink-0 items-center justify-center rounded-pill text-label font-bold bg-danger-soft text-danger">
          {solicitudes.length}
        </span>
      ) : null}
    </button>
  );
}

/** Utilidad de administracion (copia, restaurar, etc). */
function ItemHerramienta({ icono, titulo, onClick, badge }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={titulo}
      className="group flex w-full items-center gap-3 rounded-control px-3 h-10 text-body font-normal text-sidebar-content-2 hover:bg-surface-1/[0.06] hover:text-sidebar-content transition-colors duration-[var(--dur-fast)] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <span className="flex items-center justify-center w-6 shrink-0 text-sidebar-content-2 group-hover:text-sidebar-content">
        <i className={`fa-solid ${icono} text-[13px]`} aria-hidden="true" />
      </span>
      <span className="flex-1 text-left tracking-tight truncate">{titulo}</span>
      {badge}
    </button>
  );
}

export default function AppSidebar({
  isSidebarOpen,
  setIsSidebarOpen,
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
  onOpenDependencias
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
  const LOGO_SISTEMA = '/UNP-Site-Logo.webp';
  const LOGO_SISTEMA_PNG = '/UNP-Site-Logo.png';

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
          className="fixed inset-0 z-40 bg-black/60 lg:hidden animate-fade-in backdrop-blur-sm"
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col bg-sidebar border-r border-sidebar-line shrink-0 transition-transform duration-[var(--dur-base)] ease-[var(--ease-standard)] lg:static lg:translate-x-0 ${ isSidebarOpen ? 'translate-x-0 shadow-panel' : '-translate-x-full' }`}
        aria-label="Navegación principal"
      >
        {/* Identidad */}
        <div className="shrink-0 border-b border-sidebar-line px-5 py-4">
          {appLogo ? (
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-surface-1/10 shadow-card border border-white/10 overflow-hidden p-1.5">
                <img src={appLogo} alt="Logo Institucional" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-body font-bold tracking-tight leading-snug text-sidebar-content truncate">
                  Dpto. Bienes Patrimoniales
                </h2>
                <p className="text-label font-medium text-sidebar-content-3 uppercase tracking-[0.12em] mt-0.5 truncate">
                  Universidad Nacional de Pilar
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {/* El menu lateral es siempre oscuro (bg-sidebar no cambia con
                  el tema), asi que el logo tiene que ser el BLANCO siempre.
                  Antes se elegia segun el tema de la aplicacion y en modo
                  claro salia el logo negro sobre el panel negro. */}
              <img
                src={LOGO_SISTEMA}
                alt="Universidad Nacional de Pilar"
                className="h-9 w-auto max-w-[150px] object-contain object-left"
                onError={(e) => { e.target.onerror = null; e.target.src = LOGO_SISTEMA_PNG; }}
              />
              <div className="flex-1" />
            </div>
          )}
        </div>

        {/* Navegación por grupos */}
        <nav
          ref={navRef}
          className={`flex-1 overflow-y-auto px-3 py-4 space-y-4 custom-scrollbar ${desbordes.arriba ? 'nav-desborde-arriba' : ''} ${desbordes.abajo ? 'nav-desborde-abajo' : ''}`}
        >
          {GRUPOS.map((grupo) => {
            if (grupo.soloAdmin && !isAdmin) return null;
            if (grupo.soloDesarrollador && !esDesarrollador) return null;
            const visibles = grupo.items;
            if (!visibles.length) return null;
            return (
              <div key={grupo.titulo}>
                <p className="px-3 pb-1.5 text-label font-semibold text-sidebar-content-3 uppercase tracking-[0.13em]">
                  {grupo.titulo}
                </p>
                <div className="space-y-0.5">
                  {visibles.map((item) => (
                    <ItemNav
                      key={item.id}
                      item={item}
                      activo={activeTab === item.id}
                      onIr={irA}
                      solicitudes={solicitudesBaja}
                      t={t}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Herramientas de administración */}
        {isAdmin ? (
          <div className="shrink-0 border-t border-sidebar-line px-3 py-3 space-y-0.5">
            <p className="px-3 pb-1.5 text-label font-semibold text-sidebar-content-3 uppercase tracking-[0.13em]">
              Utilidades
            </p>
            <ItemHerramienta
              icono="fa-database"
              titulo="Copia de seguridad"
              onClick={() => {
                if (onExportBackup) onExportBackup();
                cerrar();
              }}
            />
            <ItemHerramienta
              icono="fa-clock-rotate-left"
              titulo="Restaurar respaldo"
              onClick={() => {
                if (onOpenRestore) onOpenRestore();
                cerrar();
              }}
            />
            <ItemHerramienta
              icono="fa-building-columns"
              titulo="Dependencias"
              onClick={() => {
                if (onOpenDependencias) onOpenDependencias();
                cerrar();
              }}
            />
            <ItemHerramienta
              icono="fa-screwdriver-wrench"
              titulo="Mantenimiento"
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
      </aside>
    </>
  );
}
