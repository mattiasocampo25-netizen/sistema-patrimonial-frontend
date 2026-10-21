// Constantes globales del sistema (extraídas de App.jsx, Fase 0 del split).
// Sin lógica ni dependencias: importar libremente desde cualquier módulo.

export const STYLES = {
    input: "block w-full rounded-control border border-line bg-surface-2/50 py-3 px-4 text-content-1 shadow-sm placeholder:text-content-3 focus:border-brand-primary focus:bg-surface-1 dark:focus:bg-zinc-900 focus:ring-2 focus:ring-brand-primary/20 sm:text-sm font-medium dark:border-line dark:bg-surface-2 dark:text-white transition-all outline-none",
    label: "block text-[11px] font-bold text-content-3 dark:text-content-3 uppercase tracking-wider mb-2",
    btnPrimary: "inline-flex items-center justify-center gap-2 rounded-control bg-zinc-900 dark:bg-zinc-800 px-5 h-10 text-[13px] font-bold text-white dark:text-white hover:bg-zinc-700 dark:hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-brand-primary focus:outline-none transition-all active:scale-95 cursor-pointer disabled:opacity-50",
    btnSecondary: "inline-flex items-center justify-center gap-2 rounded-control px-4 h-10 text-[13px] font-semibold text-content-2 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-1/10 border border-transparent hover:border-line dark:hover:border-white/10 focus-visible:ring-2 focus-visible:ring-brand-primary focus:outline-none transition-all active:scale-95 cursor-pointer",
    card: "bg-surface-1 dark:bg-surface-1/[0.04] rounded-panel border border-line/70 dark:border-white/10 shadow-sm transition-all duration-300",
    modalOverlay: "fixed inset-0 bg-zinc-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[300] transition-opacity animate-fade-in",
    modalContent: "bg-surface-1 dark:bg-surface-1 rounded-[24px] shadow-2xl w-full max-h-[90dvh] flex flex-col border border-line dark:border-line overflow-hidden relative animate-slide-up",
    modalHeader: "flex justify-between items-center px-8 py-6 border-b border-line dark:border-line bg-surface-1 dark:bg-surface-1 shrink-0 z-10",
    modalBody: "p-8 overflow-y-auto space-y-8 bg-surface-2/30 dark:bg-surface-1 custom-scrollbar",
    modalFooter: "flex justify-end gap-3 px-8 py-6 border-t border-line dark:border-line bg-surface-1 dark:bg-surface-2 shrink-0 z-10",
    sectionTitle: "text-lg font-black text-content-1 dark:text-white mb-6 flex items-center gap-3 border-b border-line dark:border-line pb-4"
};

export const DEPENDENCIAS_UNP = ["Rectorado", "Facultad de Ciencias Aplicadas", "Facultad de Humanidades y Ciencias de la Educación", "Facultad de Ciencias Contables, Administrativas y Económicas", "Facultad de Derecho, Ciencias Políticas y Sociales", "Facultad de Ciencias Agropecuarias y Desarrollo Rural", "Facultad de Ciencias Biomédicas", "Facultad de Ciencias, Tecnologías y Artes"];

export const ESTADOS_CONSERVACION = ["Muy bueno", "Bueno", "Regular", "Malo", "Inutilizable", "De Baja"];

export const ORIGENES_FC04 = [{ id: "A", nombre: "Alta" }, { id: "B", nombre: "Baja" }, { id: "T", nombre: "Traspaso" }, { id: "C/D", nombre: "Compra o Donación" }];

// Límite de inactividad de sesión (15 minutos).
export const INACTIVITY_LIMIT_MS = 15 * 60 * 1000;

// Formato único de papel para todos los PDF del sistema: oficio (216 x 330 mm).
export const FORMATO_PDF = [216, 330];

// Etiquetas de la bandeja de pendientes del inventario.
export const PENDIENTE_LABELS = { sinQR: 'Sin etiqueta QR', sinFC10: 'Sin acta FC-10', sinUbicacion: 'Sin ubicación', sinFuncionario: 'Sin responsable', vidaVencida: 'Vida útil vencida', porVencer: 'Vida útil por vencer' };

// Atajos de teclado globales (se muestran en el modal de atajos y en Ayuda).
export const SHORTCUTS = [
    { teclas: ['Ctrl', 'K'], accion: 'Búsqueda global (bienes, funcionarios, acciones)' },
    { teclas: ['/'], accion: 'Enfocar el buscador del inventario' },
    { teclas: ['N'], accion: 'Nuevo registro de bien (desde Inventario)' },
    { teclas: ['?'], accion: 'Abrir esta lista de atajos' },
    { teclas: ['G', 'letra'], accion: 'Ir a sección (G+D panel, G+I inventario, G+F funcionarios, …)' },
    { teclas: ['Esc'], accion: 'Cerrar paleta y diálogos' },
    { teclas: ['↑', '↓', 'Enter'], accion: 'Navegar y elegir en la búsqueda global' },
];
