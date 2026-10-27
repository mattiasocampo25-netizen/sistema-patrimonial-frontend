// Vista de gestión de usuarios -solo admin- (extraída de App.jsx, Fase 4).
import SkeletonLoader from '../components/SkeletonLoader';
import { Badge, Button, Card, EmptyState, PageHeader, Toolbar, Table, THead, TBody, TRow, TH, TD, IconButton } from '../components/ui';
export default function UsuariosView({
  usuariosList, setUsuarioEditing, setIsUsuarioModalOpen,
  esDesarrollador, currentUser, setItemToDelete, isLoading
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
          <Button variante="primary" tamano="md" icono="fa-user-plus" onClick={() => { setUsuarioEditing(null); setIsUsuarioModalOpen(true); }}>
            Nuevo Usuario
          </Button>
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
            <Table sinContenedor minWidth={false} className="min-w-[560px] text-left">
              <THead>
                <TRow className="text-[11px] font-bold text-content-2 dark:text-content-3 uppercase tracking-wider">
                  <TH className="py-3.5 pl-6 pr-4 w-1/3">Usuario y Nombre</TH>
                  <TH className="px-4 py-3.5 w-1/3">Rol de Sistema</TH>
                  <TH className="relative py-3.5 pl-4 pr-6 text-right"><span className="sr-only">Acciones</span></TH>
                </TRow>
              </THead>
              <TBody>
                {usuariosList.map(u => (
                  <TRow key={u.username} className="hover:bg-surface-2 dark:hover:bg-darkbg-hover/50 transition-colors border-b border-zinc-50 dark:border-line/30">
                      <TD className="py-3 pl-6 pr-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-3 dark:bg-surface-2 text-brand-text dark:text-brand font-bold text-sm border border-line/60 dark:border-line/60 shadow-sm">
                                {u.nombre ? u.nombre.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                                <div className="font-semibold text-content-1 dark:text-white text-sm">{u.nombre}</div>
                                <div className="text-xs text-content-3 mt-0.5">@{u.username}</div>
                            </div>
                          </div>
                      </TD>
                      <TD className="px-4 py-3 align-middle">
                          {u.cargo === 'desarrollador'
                              ? <Badge tono="brand" icono="fa-code">Desarrollador</Badge>
                              : u.cargo === 'admin'
                              ? <Badge tono="info" icono="fa-shield-halved">Administrador</Badge>
                              : <Badge icono="fa-user">Funcionario</Badge>
                          }
                      </TD>
                      <TD className="relative py-3 pl-4 pr-6 align-middle text-right">
                          <div className="flex items-center justify-end gap-1">
                            {u.cargo === 'desarrollador' && !esDesarrollador ? (
                                <IconButton titulo="Solo el Desarrollador gestiona esta cuenta" icono="fa-lock" variante="ghost" tamano="sm" disabled />
                            ) : (
                            <>
                            <IconButton titulo="Editar usuario" icono="fa-pen-to-square" variante="ghost" tamano="sm" onClick={() => { setUsuarioEditing(u); setIsUsuarioModalOpen(true); }} />
                            {u.username !== currentUser.username && (
                                <IconButton titulo="Eliminar usuario" icono="fa-trash-can" variante="danger" tamano="sm" onClick={() => setItemToDelete({type:'usuario', username: u.username, cargo: u.cargo, item: u})} />
                            )}
                            </>
                            )}
                          </div>
                      </TD>
                  </TRow>
                ))}
                {usuariosList.length === 0 && (
                  <TRow>
                    <TD colSpan="3">
                      <EmptyState
                        icon="fa-users-slash"
                        titulo="Sin usuarios registrados"
                        descripcion="Crea el primer usuario del sistema."
                      />
                    </TD>
                  </TRow>
                )}
              </TBody>
            </Table>
          </div>
      </div>
      )}
    </div>
  );
}
