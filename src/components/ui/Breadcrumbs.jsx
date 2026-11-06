import React from 'react';

/**
 * Breadcrumbs — ruta de navegación en la parte superior del contenido.
 * Muestra dónde está el usuario y permite volver a secciones anteriores.
 *
 * Uso:
 *   <Breadcrumbs activeTab="inventario" />
 *   <Breadcrumbs activeTab="inventario" bienRotulo="104523" onNavigate={setActiveTab} />
 */
const LABELS_POR_TAB = {
  dashboard: 'Panel',
  resumen: 'Mi Dependencia',
  inventario: 'Inventario',
  funcionarios: 'Funcionarios',
  fc04: 'FC-04',
  fc10: 'FC-10',
  fc11: 'FC-11',
  aprobaciones: 'Aprobaciones',
  auditoria: 'Auditoría',
  usuarios: 'Usuarios',
  anuncios: 'Anuncios',
  ayuda: 'Ayuda',
};

export default function Breadcrumbs({
  activeTab,
  bienRotulo,
  onNavigate,
}) {
  const label = LABELS_POR_TAB[activeTab] || activeTab;
  const items = bienRotulo
    ? [
        { label: 'Panel', to: 'dashboard' },
        { label: 'Inventario', to: 'inventario' },
        { label: label },
        { label: bienRotulo, current: true },
      ]
    : activeTab === 'dashboard'
      ? [{ label: 'Panel', current: true }]
      : [{ label: 'Panel', to: 'dashboard' }, { label: label, current: true }];

  return (
    <nav
      className="hidden sm:flex items-center gap-1 px-4 py-1.5 bg-surface-1/50 border-b border-line/60 dark:border-white/10"
      aria-label="Ruta de navegación"
    >
      <ol className="flex items-center gap-1">
        {items.map((item, i) => {
          const esUltimo = i === items.length - 1;
          const tieneLink = item.to && !esUltimo && onNavigate;
          return (
            <li key={item.label || i} className="flex items-center gap-1">
              {i > 0 && (
                <span className="text-content-2 dark:text-content-2 select-none">/</span>
              )}
              {esUltimo ? (
                <span className="text-content-1 dark:text-white font-semibold truncate">
                  {item.label}
                </span>
              ) : tieneLink ? (
                <button
                  type="button"
                  onClick={() => onNavigate(item.to)}
                  className="text-content-3 dark:text-content-3 hover:text-content-1 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              ) : (
                <span className="text-content-3 dark:text-content-3 truncate">{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
