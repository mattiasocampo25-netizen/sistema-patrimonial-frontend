import { normalizeStr } from './helpers.js';

export function componentesDe(bien) {
  let valor = bien?.componentes;
  if (typeof valor === 'string') { try { valor = JSON.parse(valor); } catch { return []; } }
  return Array.isArray(valor) ? valor : [];
}

export function piezasCoincidentes(bien, campo, valor) {
  const buscado = normalizeStr(valor || '');
  if (!buscado) return [];
  return componentesDe(bien).filter(pieza => normalizeStr(pieza?.[campo] || bien?.[campo] || '') === buscado);
}

export function coincideBienOPieza(bien, campo, valor) {
  return normalizeStr(bien?.[campo] || '') === normalizeStr(valor || '') || piezasCoincidentes(bien, campo, valor).length > 0;
}
