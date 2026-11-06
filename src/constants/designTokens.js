// ============================================================================
// DESIGN TOKENS — Sistema Patrimonial UNP
// Tokens centralizados para consistencia visual en todo el sistema.
// Usar estos valores en lugar de hardcodear paddings, radios o tipografías.
// ============================================================================

// Espaciado (rem)
export const SPACE = {
  xs: '0.5rem',   // 8px
  sm: '0.75rem',  // 12px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
};

// Radio de borde
export const RADIUS = {
  sm: '0.375rem', // 6px
  md: '0.5rem',   // 8px
  lg: '0.75rem',  // 12px
  xl: '1rem',     // 16px
  full: '9999px',
};

// Tipografía (utilities de Tailwind como strings)
export const TYPO = {
  label: 'block text-[11px] font-bold uppercase tracking-wider text-content-3 dark:text-content-3 mb-2',
  labelSm: 'block text-[10px] font-bold uppercase tracking-wider text-content-3 dark:text-content-3 mb-1.5',
  field: 'text-sm font-medium text-content-1 dark:text-white',
  fieldSm: 'text-[11px] font-medium text-content-1 dark:text-white',
  caption: 'text-[11px] text-content-3 dark:text-content-3',
  heading: 'text-lg font-black tracking-tight text-content-1 dark:text-white',
  headingSm: 'text-sm font-bold tracking-tight text-content-1 dark:text-white',
};

// Modales
export const MODAL = {
  header: 'px-5 sm:px-6 py-4 border-b border-line dark:border-line bg-surface-1 dark:bg-surface-1 shrink-0 z-10',
  body: 'p-5 sm:p-6 overflow-y-auto space-y-5 bg-surface-1 custom-scrollbar',
  bodyCompact: 'p-4 sm:p-5 overflow-y-auto space-y-4 bg-surface-1 custom-scrollbar',
  footer: 'flex flex-wrap justify-end gap-2 px-5 sm:px-6 py-4 border-t border-line dark:border-line bg-surface-2 dark:bg-surface-1/[0.02] shrink-0 z-10',
  overlay: 'fixed inset-0 bg-slate-950/55 dark:bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-[300] transition-opacity animate-fade-in',
  content: 'bg-surface-1 rounded-panel shadow-pop w-full max-h-[90dvh] flex flex-col border border-line overflow-hidden relative animate-slide-up',
  contentWide: 'bg-surface-1 rounded-panel shadow-pop w-full max-h-[90dvh] flex flex-col border border-line overflow-hidden relative animate-slide-up max-w-6xl',
  contentNarrow: 'bg-surface-1 rounded-panel shadow-pop w-full max-h-[90dvh] flex flex-col border border-line overflow-hidden relative animate-slide-up max-w-md',
};

// Tarjetas (cards)
export const CARD = {
  base: 'rounded-card border border-line dark:border-line shadow-card bg-surface-1 dark:bg-surface-1',
  padding: 'p-6',
  paddingSm: 'p-4',
  paddingXs: 'p-3',
  gap: 'space-y-5',
  gapSm: 'space-y-4',
};

// Formularios
export const FORM = {
  label: 'block text-[11px] font-bold uppercase tracking-wider text-content-3 dark:text-content-3 mb-2',
  labelSm: 'block text-[10px] font-bold uppercase tracking-wider text-content-3 dark:text-content-3 mb-1.5',
  inputBase: 'block w-full rounded-control border border-line bg-surface-1 py-3 px-4 text-body text-content-1 placeholder:text-content-3 focus:border-brand focus:bg-surface-1 focus:ring-4 focus:ring-brand/10 font-medium transition-[border-color,box-shadow,background-color] duration-[var(--dur-fast)] outline-none disabled:bg-surface-2 disabled:text-content-3 disabled:cursor-not-allowed',
};

// Botones
export const BTN = {
  primary: 'inline-flex items-center justify-center gap-2 rounded-control bg-brand px-5 h-10 text-body font-bold text-content-inverse shadow-sm hover:bg-brand-hover hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 transition-[background-color,transform,box-shadow] duration-[var(--dur-fast)] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
  ghost: 'inline-flex items-center justify-center gap-2 rounded-control px-4 h-10 text-body font-semibold text-content-2 bg-surface-1 hover:bg-surface-2 border border-line hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand transition-[background-color,border-color,color,transform] duration-[var(--dur-fast)] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
  subtle: 'inline-flex items-center justify-center gap-2 rounded-control px-4 h-10 text-body font-semibold text-content-2 bg-surface-1 hover:bg-surface-2 border border-line hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand transition-[background-color,border-color,color,transform] duration-[var(--dur-fast)] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
};

// Densidad de tabla
export const DENSITY = {
  comoda: { row: 'py-4', cell: 'py-4', gap: 'gap-4', label: 'text-sm' },
  compacta: { row: 'py-2', cell: 'py-2', gap: 'gap-2', label: 'text-xs' },
};

// Contenedores de sección
export const SECTION = {
  header: 'flex items-center gap-2 mb-4',
  number: 'flex h-6 w-6 items-center justify-center rounded-lg bg-surface-3 dark:bg-surface-1/5 text-content-1 dark:text-white text-xs font-bold',
  title: 'text-xs font-semibold uppercase tracking-wider text-content-1 dark:text-white',
};

// Barra de herramientas
export const TOOLBAR = {
  container: 'flex items-center gap-2 min-w-0 overflow-x-auto hide-scrollbar py-0.5 -my-0.5',
  primary: 'flex justify-end gap-2',
};

// Empty states
export const EMPTY = {
  icon: 'text-xl text-content-3 dark:text-content-2 mb-2',
  title: 'text-xs font-bold text-warn',
  desc: 'text-xs text-content-3 dark:text-content-3 mt-1',
};
