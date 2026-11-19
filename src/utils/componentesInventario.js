import { normalizeStr } from './helpers.js';

export function componentesDe(bien) {
  let valor = bien?.componentes;
  if (typeof valor === 'string') { try { valor = JSON.parse(valor); } catch { return []; } }
  return Array.isArray(valor) ? valor : [];
}

// IDs internos, orden de persistencia y datos derivados del padrón (documento
// y cargo) no son cambios hechos por quien edita el componente.
export function componentesComparables(valor) {
  let lista = valor;
  if (typeof lista === 'string') { try { lista = JSON.parse(lista); } catch { lista = []; } }
  if (!Array.isArray(lista)) return [];
  return lista.map(pieza => ({
    nombre: String(pieza?.nombre || '').trim(),
    cantidad: Math.max(1, Number.parseInt(pieza?.cantidad, 10) || 1),
    ubicacion: String(pieza?.ubicacion || '').trim(),
    funcionario: String(pieza?.funcionario || '').trim(),
    estadoConservacion: String(pieza?.estadoConservacion || '').trim(),
    observaciones: String(pieza?.observaciones || '').trim()
  }));
}

export function componentesEquivalentes(a, b) {
  return JSON.stringify(componentesComparables(a)) === JSON.stringify(componentesComparables(b));
}

export function piezasCoincidentes(bien, campo, valor) {
  const buscado = normalizeStr(valor || '');
  if (!buscado) return [];
  return componentesDe(bien).filter(pieza => normalizeStr(pieza?.[campo] || bien?.[campo] || '') === buscado);
}

export function coincideBienOPieza(bien, campo, valor) {
  return normalizeStr(bien?.[campo] || '') === normalizeStr(valor || '') || piezasCoincidentes(bien, campo, valor).length > 0;
}
