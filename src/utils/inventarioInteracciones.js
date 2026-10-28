import { normalizeStr } from './helpers.js';

export function construirLinkInventario(urlActual, bienesSeleccionados = []) {
  try {
    const url = new URL(urlActual);
    url.searchParams.set('tab', 'inventario');
    const ids = [...new Set((bienesSeleccionados || []).filter(Boolean).map(String))];
    if (ids.length) url.searchParams.set('sel', ids.join(','));
    else url.searchParams.delete('sel');
    return url.href;
  } catch {
    return '';
  }
}

export async function copiarAlPortapapeles(texto) {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch { /* cae al método compatible con permisos/contextos restringidos */ }

  if (typeof document === 'undefined' || !document.body || typeof document.execCommand !== 'function') return false;
  const campo = document.createElement('textarea');
  campo.value = String(texto || '');
  campo.setAttribute('readonly', '');
  campo.style.position = 'fixed';
  campo.style.opacity = '0';
  campo.style.pointerEvents = 'none';
  document.body.appendChild(campo);
  try {
    campo.focus();
    campo.select();
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    campo.remove();
  }
}

export function idsEntre(ids, desdeId, hastaId) {
  const desde = ids.indexOf(desdeId);
  const hasta = ids.indexOf(hastaId);
  if (desde < 0 || hasta < 0) return [hastaId].filter(Boolean);
  return ids.slice(Math.min(desde, hasta), Math.max(desde, hasta) + 1);
}

export function aplicarSeleccionRango(seleccionados, idsRango, seleccionado) {
  const actuales = new Set(seleccionados);
  idsRango.forEach((id) => seleccionado ? actuales.add(id) : actuales.delete(id));
  return [...actuales];
}

export function detectarBienesSimilares(candidato, bienes, excluirId) {
  const descripcion = normalizeStr(candidato?.descripcion);
  if (descripcion.length < 8) return [];
  const cuenta = [candidato?.cuenta, candidato?.subcuenta, candidato?.analitico1, candidato?.analitico2].filter(Boolean).join('.');
  const anio = String(candidato?.fechaAdquisicion || '').slice(0, 4);
  const valor = Number(String(candidato?.valorUnitario || '').replace(/\D/g, '')) || 0;
  return (bienes || []).filter((bien) => bien.id !== excluirId).map((bien) => {
    const mismoDetalle = normalizeStr(bien.descripcion) === descripcion;
    const otraCuenta = [bien.cuenta, bien.subcuenta, bien.analitico1, bien.analitico2].filter(Boolean).join('.');
    const mismaCuenta = cuenta && otraCuenta === cuenta;
    const mismoAnio = anio && String(bien.fechaAdquisicion || '').slice(0, 4) === anio;
    const otroValor = Number(String(bien.valorUnitario || '').replace(/\D/g, '')) || 0;
    const valorSimilar = valor > 0 && otroValor > 0 && Math.abs(valor - otroValor) / Math.max(valor, otroValor) <= 0.05;
    const puntos = Number(mismoDetalle) * 3 + Number(mismaCuenta) + Number(mismoAnio) + Number(valorSimilar);
    return { bien, puntos, razones: [mismoDetalle && 'descripción igual', mismaCuenta && 'misma cuenta', mismoAnio && 'mismo año', valorSimilar && 'valor similar'].filter(Boolean) };
  }).filter((x) => x.puntos >= 3).sort((a, b) => b.puntos - a.puntos).slice(0, 3);
}
