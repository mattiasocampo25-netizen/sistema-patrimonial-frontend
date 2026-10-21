import React from 'react';
import AppSidebar from './AppSidebar';
import AppTopbar from './AppTopbar';

/**
 * AppShell — el armazon de la aplicacion.
 *
 * Antes el layout estaba esparcido en App.jsx: el <aside> del Sidebar, el
 * <header> del Header y el <main> directos. Con el shell, la estructura queda
 * en un unico lugar y el responsive se decide una vez:
 *
 *   - `lg` y mas: sidebar fija de 264px + contenido
 *   - menos de `lg`: sidebar off-canvas (overlay) + contenido a pantalla
 *     completa, con la dependencia actual en la barra superior
 *
 * `children` es el contenido del modulo (la vista activa).
 */
export default function AppShell({
  children,
  // Sidebar
  isSidebarOpen,
  setIsSidebarOpen,
  appLogo,
  activeTab,
  setActiveTab,
  isAdmin,
  esDesarrollador,
  solicitudesBaja,
  dependenciaActual,
  onExportBackup,
  onOpenRestore,
  mantenimiento,
  onOpenMantenimiento,
  onOpenDependencias,
  // Topbar
  setIsScannerOpen,
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
  handleLogout,
  actasPorFirmarCount,
  // Contenido
  errorBanner
}) {
  return (
    <div className="flex h-dvh overflow-hidden bg-canvas text-content-1">
      <AppSidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        appLogo={appLogo}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={isAdmin}
        esDesarrollador={esDesarrollador}
        solicitudesBaja={solicitudesBaja}
        onExportBackup={onExportBackup}
        onOpenRestore={onOpenRestore}
        mantenimiento={mantenimiento}
        onOpenMantenimiento={onOpenMantenimiento}
        onOpenDependencias={onOpenDependencias}
      />

      <div className="flex flex-1 flex-col min-w-0">
        {errorBanner ? errorBanner : null}

        <AppTopbar
          setIsSidebarOpen={setIsSidebarOpen}
          setActiveTab={setActiveTab}
          setIsScannerOpen={setIsScannerOpen}
          dependenciaActual={dependenciaActual}
          setDependenciaActual={setDependenciaActual}
          todasDependencias={todasDependencias}
          clearAllFilters={clearAllFilters}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          isNotifOpen={isNotifOpen}
          setIsNotifOpen={setIsNotifOpen}
          unreadCount={unreadCount}
          misNotificaciones={misNotificaciones}
          markAsRead={markAsRead}
          onMarkAllRead={onMarkAllRead}
          currentUser={currentUser}
          isAdmin={isAdmin}
          handleLogout={handleLogout}
          actasPorFirmarCount={actasPorFirmarCount}
        />

        <main id="contenido" className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
