import { normalizeStr } from './helpers.js';

const lista = (valor) => Array.isArray(valor) ? valor : [];
const tiene = (valor) => String(valor ?? '').trim().length > 0;
const numeroPositivo = (valor) => Number.isFinite(Number(valor)) && Number(valor) > 0;
const fechaPartes = (valor) => {
  const partes = String(valor || '').trim().split(/[T ]/)[0].split(/[/-]/);
  if (partes.length !== 3) return null;
  const [a, b, c] = partes;
  const [anio, mes, dia] = a.length === 4 ? [Number(a), Number(b), Number(c)] : [Number(c), Number(b), Number(a)];
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia ? fecha : null;
};

/** Revisión local y de solo lectura. Devuelve alertas con ejemplos accionables. */
export function analizarSaludDatos({ bienes = [], fc10List = [], fc11List = [], funcionariosPadron = [], hoy = new Date() } = {}) {
  const assets = lista(bienes);
  const fc10 = lista(fc10List);
  const fc11 = lista(fc11List);
  const personas = lista(funcionariosPadron);
  const ids = new Set(assets.map((b) => String(b.id)));
  const porRotulo = new Map();
  const porCedula = new Map();
  const porNombre = new Map();
  const cedulasPadron = new Set();
  const nombresPadron = new Set();
  const duplicadosBien = [];
  const duplicadosCedula = [];
  const duplicadosNombre = [];
  for (const bien of assets) {
    const rotulo = normalizeStr(bien.rotulo || '');
    if (!rotulo || rotulo === 's/r') continue;
    const key = `${normalizeStr(bien.dependencia)}||${rotulo}`;
    if (porRotulo.has(key)) duplicadosBien.push(bien);
    else porRotulo.set(key, bien.id);
  }
  for (const persona of personas) {
    const cedula = String(persona.cedula || persona.documento || '').replace(/\D/g, '');
    if (cedula) {
      cedulasPadron.add(cedula);
      if (porCedula.has(cedula)) duplicadosCedula.push(persona);
      else porCedula.set(cedula, persona.id);
    }
    const nombre = normalizeStr(persona.nombre || '');
    if (nombre) {
      nombresPadron.add(nombre);
      if (porNombre.has(nombre)) duplicadosNombre.push(persona);
      else porNombre.set(nombre, persona.id);
    }
  }
  const categoria = (id, label, detalle, icon, box, entidad = 'bien') => ({
    id, label, count: detalle.length, detalle: detalle.slice(0, 100), icon, box, entidad,
  });
  const componentesInvalidos = [];
  for (const bien of assets) {
    if (!bien.componentes) continue;
    let comps = bien.componentes;
    if (typeof comps === 'string') {
      try { comps = JSON.parse(comps); } catch { componentesInvalidos.push(bien); continue; }
    }
    if (!Array.isArray(comps) || comps.some((c) => !c || !tiene(c.nombre) || !numeroPositivo(c.cantidad))) componentesInvalidos.push(bien);
  }
  const responsableSinPadron = assets.filter((bien) => {
    const doc = String(bien.funcionarioDoc || '').replace(/\D/g, '');
    const nombre = normalizeStr(bien.funcionario || '');
    if (!doc && !nombre) return false;
    return !(doc && cedulasPadron.has(doc)) && !(nombre && nombresPadron.has(nombre));
  });
  const responsableAlternativoSinPadron = assets.filter((bien) => {
    const doc = String(bien.funcionarioAlternativoDoc || '').replace(/\D/g, '');
    const nombre = normalizeStr(bien.funcionarioAlternativo || '');
    if (!doc && !nombre) return false;
    return !(doc && cedulasPadron.has(doc)) && !(nombre && nombresPadron.has(nombre));
  });
  const hoyUTC = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const fechaAdquisicionInvalida = assets.filter((bien) => tiene(bien.fechaAdquisicion) && !fechaPartes(bien.fechaAdquisicion));
  const fechaAdquisicionFutura = assets.filter((bien) => {
    const fecha = fechaPartes(bien.fechaAdquisicion);
    return fecha && fecha.getTime() > hoyUTC;
  });
  const montoInvalido = assets.filter((bien) => {
    if (!tiene(bien.valorUnitario ?? bien.valorAdquisicion ?? bien.valor)) return false;
    const raw = String(bien.valorUnitario ?? bien.valorAdquisicion ?? bien.valor).trim();
    const numero = Number(raw.replace(/[^\d-]/g, ''));
    return !Number.isFinite(numero) || numero < 0;
  });
  const fcSinBien = (formularios) => formularios.filter((fc) => {
    const id = fc.bienId || fc.bien_id || fc.idBien;
    return id && !ids.has(String(id));
  });
  const estilo = {
    duplicado: 'bg-rose-500/10 text-danger dark:text-rose-400 border-rose-500/20',
    advertencia: 'bg-amber-500/10 text-warn dark:text-amber-400 border-amber-500/20',
    informativo: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    neutro: 'bg-zinc-500/10 text-content-2 dark:text-content-3 border-zinc-500/20',
  };
  return [
    categoria('dup', 'Rótulos duplicados', duplicadosBien, 'fa-clone', estilo.duplicado),
    categoria('dupfunc', 'Documentos duplicados en padrón', duplicadosCedula, 'fa-user-group', estilo.duplicado, 'funcionario'),
    categoria('dupnombre', 'Nombres repetidos para revisar', duplicadosNombre, 'fa-user-tag', estilo.advertencia, 'funcionario'),
    categoria('fc10', 'FC-10 sin bien asociado', fcSinBien(fc10), 'fa-file-signature', estilo.advertencia, 'fc10'),
    categoria('fc11', 'FC-11 sin bien asociado', fcSinBien(fc11), 'fa-truck-fast', estilo.advertencia, 'fc11'),
    categoria('sinrotulo', 'Bienes sin rótulo', assets.filter((b) => !tiene(b.rotulo) || normalizeStr(b.rotulo) === 's/r'), 'fa-tag', estilo.advertencia),
    categoria('sindep', 'Bienes sin dependencia', assets.filter((b) => !tiene(b.dependencia)), 'fa-building-columns', estilo.neutro),
    categoria('sinubicacion', 'Bienes sin ubicación', assets.filter((b) => !tiene(b.ubicacion)), 'fa-location-dot', estilo.neutro),
    categoria('sinfecha', 'Bienes sin fecha de adquisición', assets.filter((b) => !tiene(b.fechaAdquisicion)), 'fa-calendar-xmark', estilo.informativo),
    categoria('sinestado', 'Bienes sin estado de conservación', assets.filter((b) => !tiene(b.estadoConservacion)), 'fa-circle-question', estilo.neutro),
    categoria('sindescripcion', 'Bienes sin descripción', assets.filter((b) => !tiene(b.descripcion)), 'fa-align-left', estilo.neutro),
    categoria('sinresponsable', 'Sin responsable (posible bien libre)', assets.filter((b) => !tiene(b.funcionario)), 'fa-user-minus', estilo.informativo),
    categoria('responsablepadron', 'Responsable no localizado en padrón', responsableSinPadron, 'fa-user-slash', estilo.advertencia),
    categoria('componentes', 'Componentes con datos incompletos', componentesInvalidos, 'fa-cubes-stacked', estilo.advertencia),
    categoria('fechaInvalida', 'Fechas de adquisición inválidas', fechaAdquisicionInvalida, 'fa-calendar-xmark', estilo.advertencia),
    categoria('fechaFutura', 'Fechas de adquisición futuras', fechaAdquisicionFutura, 'fa-calendar-days', estilo.informativo),
    categoria('montoInvalido', 'Valores patrimoniales inválidos', montoInvalido, 'fa-coins', estilo.advertencia),
    categoria('funcionariosSinCI', 'Funcionarios sin documento', personas.filter((p) => !tiene(p.cedula || p.documento)), 'fa-id-card', estilo.neutro, 'funcionario'),
    categoria('funcionariosSinDependencia', 'Funcionarios sin dependencia', personas.filter((p) => !tiene(p.dependencia)), 'fa-building-user', estilo.neutro, 'funcionario'),
    categoria('alternativoPadron', 'Encargados alternativos no localizados', responsableAlternativoSinPadron, 'fa-user-slash', estilo.advertencia),
  ];
}
