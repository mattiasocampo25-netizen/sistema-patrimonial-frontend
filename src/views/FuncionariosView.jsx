import { formatCI } from '../utils/helpers';
import SkeletonLoader from '../components/SkeletonLoader';
import { Card, EmptyState, PageHeader, Toolbar, Table, THead, TBody, TRow, TH, TD } from '../components/ui';

// Vista del plantel de funcionarios (extraída de App.jsx, Fase 5).
export default function FuncionariosView({
  funcionariosPurosDependencia, dependenciaActual,
  sincronizarBienesConPadron, handleDownloadTemplateFuncionarios,
  fileInputFuncionariosRef, isAdmin, setIsUbicacionesModalOpen,
  setIsNewFuncionarioModalOpen, searchFuncionarioInput, setSearchFuncionarioInput,
  setCurrentPaginaFuncionarios, funcionariosPaginados,
  handleEditFuncionario, handleDeleteFuncionario, renderPaginationFuncionarios,
  isLoading
}) {
  return (
    <div className="flex flex-col flex-1 space-y-6 pb-12">

      {/* CABECERA DE SECCIÓN */}
      <div className="bg-surface-1 dark:bg-surface-1/[0.04] p-5 sm:p-6 rounded-panel border border-line/70 dark:border-white/10 shadow-sm">
        <Card className="p-0">
          <div className="p-5 sm:p-6">
            <PageHeader
              titulo={'Plantel de Funcionarios'}
              descripcion={'Directorio oficial de personal asignado a <strong className=\'text-content-1 dark:text-white font-semibold\'>{dependenciaActual}</strong>'}
              icono="fa-address-book"
              contador={(
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums bg-surface-3 dark:bg-surface-1/10 text-content-2 dark:text-content-3 border border-line dark:border-white/10">
                  {funcionariosPurosDependencia.length}
                </span>
              )}
            />
            <Toolbar className="mt-4">
  
            {/* Botones de Acción Principal */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={sincronizarBienesConPadron}
                className="inline-flex shrink-0 items-center gap-2 px-4 h-10 rounded-control text-[13px] font-semibold text-content-2 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-1/10 border border-transparent hover:border-line dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
                title="Sincronizar custodios con inventario"
              >
                <i className="fa-solid fa-rotate"></i>
                <span>Sincronizar</span>
              </button>
  
              <button
                onClick={handleDownloadTemplateFuncionarios}
                className="inline-flex shrink-0 items-center gap-2 px-4 h-10 rounded-control text-[13px] font-semibold text-content-2 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-1/10 border border-transparent hover:border-line dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
                title="Descargar plantilla de funcionarios"
              >
                <i className="fa-solid fa-file-excel text-emerald-600 dark:text-emerald-400"></i>
                <span>Plantilla</span>
              </button>
  
              <button
                onClick={() => fileInputFuncionariosRef.current?.click()}
                className="inline-flex shrink-0 items-center gap-2 px-4 h-10 rounded-control text-[13px] font-semibold text-content-2 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-1/10 border border-transparent hover:border-line dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
                title="Importar lista de funcionarios desde CSV"
              >
                <i className="fa-solid fa-file-import text-emerald-600 dark:text-emerald-400"></i>
                <span>Importar CSV</span>
              </button>
  
              {isAdmin && (
              <button
                onClick={() => setIsUbicacionesModalOpen(true)}
                className="inline-flex shrink-0 items-center gap-2 px-4 h-10 rounded-control text-[13px] font-semibold text-content-2 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-1/10 border border-transparent hover:border-line dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
                title="Gestionar catálogo de ubicaciones"
              >
                <i className="fa-solid fa-location-dot text-sky-600 dark:text-sky-400"></i>
                <span>Ubicaciones</span>
              </button>
              )}
  
              <span className="hidden sm:block h-6 w-px bg-surface-3 dark:bg-surface-1/10 mx-1"></span>
  
              <button
                onClick={() => setIsNewFuncionarioModalOpen(true)}
                title="Registrar nuevo funcionario"
                className="inline-flex items-center gap-2 px-5 h-10 rounded-control bg-zinc-900 dark:bg-surface-1 hover:bg-zinc-700 dark:hover:bg-surface-3 text-white dark:text-content-1 text-[13px] font-bold shadow-sm transition-all active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
              >
                <i className="fa-solid fa-user-plus text-xs"></i>
                <span>Nuevo Funcionario</span>
              </button>
            </div>
  
            </Toolbar>
          </div>
        </Card>

        {/* Barra de búsqueda del padrón */}
        <div className="mt-4 pt-4 border-t border-line dark:border-white/10">
  <div className="relative w-full">
    <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-content-3 text-sm pointer-events-none"></i>
    <input
      type="text"
      placeholder="Buscar funcionario por nombre, apellido o número de cédula..."
      value={searchFuncionarioInput}
      onChange={(e) => {
        setSearchFuncionarioInput(e.target.value);
        setCurrentPaginaFuncionarios(1); // Resetea la paginación para mostrar resultados desde la página 1
      }}
      className="w-full rounded-control border border-line dark:border-white/10 bg-surface-2 dark:bg-surface-1/5 h-11 pl-11 pr-4 text-sm font-medium text-content-1 dark:text-white placeholder:text-content-3 focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/10 outline-none transition-all"
    />
  </div>
</div>

      </div>

      {/* TABLA DE FUNCIONARIOS */}
      {isLoading ? (
        /* Durante la carga inicial se muestra el esqueleto en vez del estado
           vacío: "No hay funcionarios en esta dependencia" era falso mientras
           los datos aún no llegaban. */
        <SkeletonLoader />
      ) : (
      <div className="flex-1 bg-surface-1 dark:bg-surface-1/[0.04] shadow-sm border border-line/70 dark:border-white/10 rounded-panel flex flex-col overflow-hidden relative min-h-[450px]">
          <div className="flex-1 overflow-auto custom-scrollbar">
            <Table sinContenedor minWidth={false} className="min-w-full text-left border-collapse">
              <THead>
                <TRow className="text-[11px] font-bold text-content-3 dark:text-content-3 uppercase tracking-[0.14em]">
                  <TH className="py-4 pl-8 pr-4">Cédula de Identidad</TH>
                  <TH className="px-4 py-4 w-1/3">Nombre Completo</TH>
                  <TH className="px-4 py-4 w-1/3">Cargo Institucional</TH>
                  <TH className="relative py-4 pl-4 pr-8 text-right">Acciones</TH>
                </TRow>
              </THead>
              <TBody>
                {funcionariosPaginados.map((f, idx) => {
                  if (f.esSeparador) {
                      return (
                          <TRow key={`sep-${f.letra}-${idx}`}>
                              <TD colSpan="4" className="py-2.5 pl-8 pr-4 bg-surface-2/70 dark:bg-surface-1/[0.02] border-y border-line dark:border-white/5">
                                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-zinc-900 dark:bg-surface-1 text-white dark:text-content-1 text-[11px] font-bold">
                                      {f.letra}
                                  </span>
                              </TD>
                          </TRow>
                      );
                  }

                  const inicial = f.nombre ? f.nombre.charAt(0).toUpperCase() : 'F';

                  return (
                    <TRow key={f.id} className="hover:bg-surface-2/80 dark:hover:bg-surface-1/[0.03] transition-colors group">
                        <TD className="py-4 pl-8 pr-4 align-middle tabular-nums font-semibold text-content-1 dark:text-content-3 text-sm">
                            {formatCI(f.cedula)}
                        </TD>
                        <TD className="px-4 py-4 align-middle">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-surface-3 dark:bg-surface-1/10 text-content-1 dark:text-zinc-200 font-bold text-xs">
                                    {inicial}
                                </div>
                                <span className="font-bold text-content-1 dark:text-white text-sm">{f.nombre}</span>
                            </div>
                        </TD>
                        <TD className="px-4 py-4 align-middle">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-surface-3 dark:bg-surface-1/10 text-content-2 dark:text-content-3">
                                {f.cargo || 'Funcionario'}
                            </span>
                        </TD>
                        <TD className="relative py-4 pl-4 pr-8 align-middle text-right">
                            <div className="flex items-center justify-end gap-1">
                                <button
                                    onClick={() => handleEditFuncionario(f)}
                                    className="h-8 w-8 flex items-center justify-center rounded-lg text-content-3 hover:text-content-1 hover:bg-surface-3 dark:hover:text-white dark:hover:bg-surface-1/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary outline-none"
                                    title="Editar funcionario" aria-label="Editar funcionario"
                                >
                                    <i className="fa-solid fa-pen-to-square text-xs"></i>
                                </button>
                                <button
                                    onClick={() => handleDeleteFuncionario(f.id)}
                                    className="h-8 w-8 flex items-center justify-center rounded-lg text-content-3 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 outline-none"
                                    title={isAdmin ? 'Eliminar funcionario' : 'Solicitar eliminación al administrador'}
                                >
                                    <i className={`fa-solid ${isAdmin ? 'fa-trash-can' : 'fa-paper-plane'} text-xs`}></i>
                                </button>
                            </div>
                        </TD>
                    </TRow>
                  );
                })}
                {funcionariosPurosDependencia.length === 0 && (
                  <TRow>
                    <TD colSpan="4">
                        <EmptyState
                          icon="fa-users-slash"
                          titulo="No hay funcionarios en esta dependencia"
                          descripcion="Registra el primero manualmente o importa el padrón desde un CSV."
                          accionLabel="Registrar el primero"
                          onAccion={() => setIsNewFuncionarioModalOpen(true)}
                        />
                    </TD>
                  </TRow>
                )}
              </TBody>
            </Table>
          </div>

          {renderPaginationFuncionarios()}
      </div>
      )}
    </div>
  );
}
