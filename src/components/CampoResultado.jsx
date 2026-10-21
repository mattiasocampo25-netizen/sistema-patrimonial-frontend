// Resultado grande para modo campo: tras escanear muestra el bien con
// acciones claras (ver ficha o seguir escaneando). Pensado para móvil.
export default function CampoResultado({ escaneo, onVerFicha, onSeguir, onCerrar, STYLES }) {
  if (!escaneo?.bien) return null;
  const bien = escaneo.bien;
  return (
    <Dialogo className={STYLES.modalOverlay} onCerrar={onCerrar}>
      <div
        className={STYLES.modalContent + " max-w-md p-6 sm:p-8 text-center"}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="animate-pop mx-auto flex h-16 w-16 items-center justify-center rounded-panel bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-4">
          <i className="fa-solid fa-circle-check text-2xl"></i>
        </div>
        <p className="text-[11px] font-black uppercase tracking-widest text-content-3 dark:text-content-3">
          Activo localizado
        </p>
        <h3 className="mt-1 text-xl font-black tracking-tight text-content-1 dark:text-white font-mono">
          {bien.rotulo || 'S/R'}
        </h3>
        <p className="mt-1 text-sm font-semibold text-content-2 dark:text-content-3 line-clamp-2">
          {bien.descripcion || 'Sin descripción'}
        </p>
        <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-content-3 dark:text-content-3">
          <span className="rounded-lg bg-surface-3 dark:bg-surface-1/10 px-2.5 py-1">
            {bien.funcionario || 'Sin responsable'}
          </span>
          <span className="rounded-lg bg-surface-3 dark:bg-surface-1/10 px-2.5 py-1">
            {bien.ubicacion || 'Sin ubicación'}
          </span>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            onClick={() => onVerFicha(bien)}
            className="h-12 rounded-card bg-zinc-900 dark:bg-surface-1 text-white dark:text-content-1 text-sm font-black hover:bg-zinc-700 dark:hover:bg-surface-3 motion cursor-pointer active:scale-[0.98]"
          >
            Ver ficha
          </button>
          <button
            onClick={onSeguir}
            className="h-12 rounded-card border border-line dark:border-zinc-700 text-sm font-bold text-content-1 dark:text-zinc-200 hover:bg-surface-3 dark:hover:bg-surface-1/10 motion cursor-pointer active:scale-[0.98]"
          >
            Seguir
          </button>
        </div>
        <button
          onClick={onCerrar}
          className="mt-3 text-xs font-semibold text-content-3 hover:text-content-2 dark:hover:text-zinc-200 transition-colors cursor-pointer"
        >
          Cerrar
        </button>
      </div>
    </Dialogo>
  );
}
