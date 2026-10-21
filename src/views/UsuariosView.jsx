// Vista de gestión de usuarios -solo admin- (extraída de App.jsx, Fase 4).
import SkeletonLoader from '../components/SkeletonLoader';
import { Card, EmptyState, PageHeader, Toolbar } from '../components/ui';
export default function UsuariosView({
  usuariosList, setUsuarioEditing, setIsUsuarioModalOpen,
  esDesarrollador, currentUser, setItemToDelete, STYLES, isLoading
}) {
  return (
    <div className="flex flex-col flex-1 space-y-6">
      <Card className="p-0">
        <div className="p-5 sm:p-6">
          <PageHeader
            titulo={'Gestión de Usuarios'}
            descripcion={'Gestión de cuentas y roles de acceso al sistema'}
            icono="fa-users-gear"
            contador={(
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums bg-surface-3 dark:bg-surface-1/10 text-content-2 dark:text-content-3 border border-line dark:border-white/10">
                {usuariosList.length}
              </span>
            )}
          />
          <Toolbar className="mt-4">
  
          <button onClick={() => { setUsuarioEditing(null); setIsUsuarioModalOpen(true); }} className={STYLES.btnPrimary}>
            <i className="fa-solid fa-user-plus text-xs"></i> Nuevo Usuario
          </button>
          </Toolbar>
        </div>
      </Card>

      {isLoading ? (
        /* Durante la carga inicial se muestra el esqueleto en vez del estado
           vacío: "Sin usuarios registrados" era falso mientras los datos
           aún no llegaban. */
        <SkeletonLoader />
      ) : (
      <div className="flex-1 bg-surface-1 dark:bg-surface-1/[0.04] border border-line/70 dark:border-white/10 rounded-panel flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="min-w-full text-left">
              <thead className="sticky top-0 bg-surface-2/95 dark:bg-surface-2/95 backdrop-blur-md z-10 border-b border-line/80 dark:border-line">
                <tr className="text-[11px] font-bold text-content-2 dark:text-content-3 uppercase tracking-wider">
                  <th className="py-3.5 pl-6 pr-4 w-1/3">Usuario y Nombre</th>
                  <th className="px-4 py-3.5 w-1/3">Rol de Sistema</th>
                  <th className="relative py-3.5 pl-4 pr-6 text-right"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody className="bg-surface-1 dark:bg-surface-1 divide-y divide-zinc-100 dark:divide-darkbg-border/60">
                {usuariosList.map(u => (
                  <tr key={u.username} className="hover:bg-surface-2 dark:hover:bg-darkbg-hover/50 transition-colors border-b border-zinc-50 dark:border-line/30">
                      <td className="py-3 pl-6 pr-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-3 dark:bg-surface-2 text-brand-primary dark:text-brand-accent font-bold text-sm border border-line/60 dark:border-line/60 shadow-sm">
                                {u.nombre ? u.nombre.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                                <div className="font-semibold text-content-1 dark:text-white text-sm">{u.nombre}</div>
                                <div className="text-xs text-content-3 mt-0.5">@{u.username}</div>
                            </div>
                          </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                          {u.cargo === 'desarrollador'
                              ? <span className="inline-flex items-center gap-1.5 rounded-md bg-violet-500/10 px-2 py-1 text-[11px] font-semibold text-violet-700 dark:text-violet-300 ring-1 ring-inset ring-violet-500/20 shadow-sm"><i className="fa-solid fa-code text-[10px]"></i> Desarrollador</span>
                              : u.cargo === 'admin'
                              ? <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/20 dark:bg-indigo-900/20 dark:text-indigo-400 shadow-sm"><i className="fa-solid fa-shield-halved text-[10px]"></i> Administrador</span>
                              : <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-3 px-2 py-1 text-[11px] font-semibold text-content-2 ring-1 ring-inset ring-zinc-500/20 dark:bg-zinc-800 dark:text-content-3 shadow-sm"><i className="fa-solid fa-user text-[10px]"></i> Funcionario</span>
                          }
                      </td>
                      <td className="relative py-3 pl-4 pr-6 align-middle text-right">
                          <div className="flex items-center justify-end gap-1">
                            {u.cargo === 'desarrollador' && !esDesarrollador ? (
                                <span title="Solo el Desarrollador gestiona esta cuenta" className="flex h-8 w-8 items-center justify-center rounded-lg text-content-3 dark:text-content-2">
                                    <i className="fa-solid fa-lock text-[13px]"></i>
                                </span>
                            ) : (
                            <>
                            <button onClick={() => { setUsuarioEditing(u); setIsUsuarioModalOpen(true); }} className="flex h-8 w-8 items-center justify-center rounded-lg text-content-3 hover:text-content-1 hover:bg-surface-3 dark:hover:text-white dark:hover:bg-surface-1/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none" title="Editar usuario" aria-label="Editar usuario">
                                <i className="fa-solid fa-pen-to-square text-[13px]"></i>
                            </button>
                            {u.username !== currentUser.username && (
                                <button onClick={() => setItemToDelete({type:'usuario', username: u.username, cargo: u.cargo, item: u})} className="flex h-8 w-8 items-center justify-center rounded-lg text-content-3 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 outline-none" title="Eliminar usuario" aria-label="Eliminar usuario">
                                    <i className="fa-solid fa-trash-can text-[13px]"></i>
                                </button>
                            )}
                            </>
                            )}
                          </div>
                      </td>
                  </tr>
                ))}
                {usuariosList.length === 0 && (
                  <tr>
                    <td colSpan="3">
                      <EmptyState
                        icon="fa-users-slash"
                        titulo="Sin usuarios registrados"
                        descripcion="Crea el primer usuario del sistema."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      </div>
      )}
    </div>
  );
}
