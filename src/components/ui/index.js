/**
 * frontend/src/components/ui/index.js
 * Barril de los primitives del sistema. Importar siempre desde aca:
 *
 *   import { Button, Card, PageHeader } from '../components/ui';
 *
 * Los primitives se van sosteniendo con los tokens de src/styles/tokens.css:
 * si un color, radio o sombra no esta en los tokens, no va hardcodeado.
 */
export { default as Button, IconButton, ButtonGroup } from './Button';
export { default as Card, CardHeader, CardBody, CardFooter, CardInteractive } from './Card';
export { default as PageHeader, Toolbar, ToolbarDivider } from './PageHeader';
export { default as Field, Input, Textarea, Select, SearchInput } from './Field';
export { default as Badge, Chip, ChipGroup } from './Badge';
export { default as EmptyState, Skeleton, SkeletonGroup } from './EmptyState';
export { default as Modal, Drawer } from './Modal';
export { default as StatTile, KpiGrid } from './StatTile';
export { Table, THead, TBody, TRow, TH, TD, Pagination } from './Table';
