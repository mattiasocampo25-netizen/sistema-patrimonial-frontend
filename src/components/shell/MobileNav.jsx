import React from 'react';

const DESTINOS = [
  { id: 'dashboard', label: 'Panel', icon: 'fa-chart-pie' },
  { id: 'inventario', label: 'Inventario', icon: 'fa-boxes-stacked' },
  { id: 'fc10', label: 'FC-10', icon: 'fa-file-signature' },
  { id: 'funcionarios', label: 'Funcionarios', icon: 'fa-address-book' },
];

export default function MobileNav({ activeTab, setActiveTab, setIsSidebarOpen, solicitudesBaja = [] }) {
  return (
    <nav className="mobile-nav lg:hidden" aria-label="Navegación rápida">
      {DESTINOS.map((destino) => {
        const activo = activeTab === destino.id;
        return (
          <button
            key={destino.id}
            type="button"
            onClick={() => { setActiveTab(destino.id); setIsSidebarOpen(false); }}
            aria-current={activo ? 'page' : undefined}
            className={`mobile-nav-item ${activo ? 'is-active' : ''}`}
          >
            <span className="mobile-nav-icon-wrap">
              <i className={`fa-solid ${destino.icon}`} aria-hidden="true" />
              {destino.id === 'fc10' && solicitudesBaja.length > 0 && <span className="mobile-nav-badge" aria-label={`${solicitudesBaja.length} solicitudes pendientes`}>{solicitudesBaja.length > 9 ? '9+' : solicitudesBaja.length}</span>}
            </span>
            <span>{destino.label}</span>
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => setIsSidebarOpen(true)}
        aria-controls="sidebar-navigation"
        aria-expanded="false"
        className="mobile-nav-item"
      >
        <span className="mobile-nav-icon-wrap"><i className="fa-solid fa-ellipsis" aria-hidden="true" /></span>
        <span>Más</span>
      </button>
    </nav>
  );
}
