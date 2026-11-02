// Vista de gestión de usuarios -solo admin- (extraída de App.jsx, Fase 4).
import { useMemo, useState } from 'react';
import { normalizeStr } from '../utils/helpers';
import SkeletonLoader from '../components/SkeletonLoader';
import { Badge, Button, Card, EmptyState, PageHeader, Toolbar, Table, THead, TBody, TRow, TH, TD, IconButton } from '../components/ui';
export default function UsuariosView({
  usuariosList, setUsuarioEditing, setIsUsuarioModalOpen,
  esDesarrollador, currentUser, setItemToDelete, isLoading
}) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('todos');
  const [pagina, setPagina] = useState(1);
  const porPagina = 10;
  const usuariosVisibles = useMemo(() => usuariosList.filter(u => {
    const coincideTexto = normalizeStr(`${u.username || ''} ${u.nombre || ''} ${u.cargo || ''} ${u.dependencia || ''}`).includes(normalizeStr(busqueda));
    const coincideRol = filtroRol === 'todos' || (filtroRol === 'admin' ? ['admin', 'desarrollador'].includes(u.cargo) : u.cargo === 'funcionario');
    return coincideTexto && coincideRol;
  }), [usuariosList, busqueda, filtroRol]);
  const paginas = Math.max(1, Math.ceil(usuariosVisibles.length / porPagina));
  const paginaActual = Math.min(pagina, paginas);
  const usuariosPagina = usuariosVisibles.slice((paginaActual - 1) * porPagina, paginaActual * porPagina);
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
                {usuariosVisibles.length} / {usuariosList.length}
              </span>
            )}
          />
          <Toolbar className="mt-4">
          <Button variante="primary" tamano="md" icono="fa-user-plus" onClick={() => { setUsuarioEditing(null); setIsUsuarioModalOpen(true); }}>
            Nuevo Usuario
          </Button>
          </Toolbar>
          <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <label className="sr-only" htmlFor="usuarios-search">Buscar usuarios</label>
            <input id="usuarios-search" value={busqueda} onChange={e => { setBusqueda(e.target.value); setPagina(1); }} placeholder="Buscar por nombre, usuario o dependencia…" className="h-10 w-full rounded-control border border-line bg-surface-2 px-3 text-sm text-content-1 outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" />
            <div className="flex gap-1 rounded-control border border-line bg-surface-2 p-1" role="group" aria-label="Filtrar usuarios por rol">
              {[['todos', 'Todos'], ['admin', 'Administración'], ['funcionario', 'Funcionarios']].map(([id, label]) => <button key={id} type="button" aria-pressed={filtroRol === id} onClick={() => { setFiltroRol(id); setPagina(1); }} className={`rounded px-3 text-xs font-semibold ${filtroRol === id ? 'bg-surface-1 text-brand-text shadow-sm' : 'text-content-3 hover:text-content-1'}`}>{label}</button>)}
            </div>
          </div>
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
                {usuariosPagina.map(u => (
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
                {usuariosVisibles.length === 0 && (
                  <TRow>
                    <TD colSpan="3">
                      <EmptyState
                        icon="fa-users-slash"
                        titulo={usuariosList.length === 0 ? 'Sin usuarios registrados' : 'Sin coincidencias'}
                        descripcion={usuariosList.length === 0 ? 'Crea el primer usuario del sistema.' : 'Prueba otra búsqueda o cambia el filtro de rol.'}
                      />
                    </TD>
                  </TRow>
                )}
              </TBody>
            </Table>
          </div>
          {usuariosVisibles.length > porPagina && (
            <nav aria-label="Paginación de usuarios" className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm text-content-2">
              <span>Mostrando {(paginaActual - 1) * porPagina + 1}–{Math.min(paginaActual * porPagina, usuariosVisibles.length)} de {usuariosVisibles.length}</span>
              <div className="flex items-center gap-2">
                <Button variante="secondary" tamano="sm" disabled={paginaActual <= 1} onClick={() => setPagina(p => Math.max(1, p - 1))}>Anterior</Button>
                <span aria-live="polite" className="tabular-nums">{paginaActual} / {paginas}</span>
                <Button variante="secondary" tamano="sm" disabled={paginaActual >= paginas} onClick={() => setPagina(p => Math.min(paginas, p + 1))}>Siguiente</Button>
              </div>
            </nav>
          )}
      </div>
      )}
    </div>
  );
}
