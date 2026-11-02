// Vista de solicitudes de aprobación (bajas, firmas, etc.) - solo admin/desarrollador.
// Incluye estados claros (Pendiente, Aprobado, Rechazado, En Revisión) y auditoría básica.
import React, { useMemo, useState } from 'react';
import { normalizeStr } from '../utils/helpers';
import FiltroCombo from '../components/FiltroCombo';
import { Card, Chip, ChipGroup, EmptyState, PageHeader, Toolbar, Table, THead, TBody, TRow, TH, TD } from '../components/ui';

const ESTADO_INFO = {
  PENDIENTE: { label: 'Pendiente', color: 'bg-warn-soft dark:bg-amber-950/20 text-warn dark:text-amber-400 border border-warn/25 dark:border-amber-900/30', dot: 'bg-amber-500' },
  APROBADO: { label: 'Aprobado', color: 'bg-ok-soft dark:bg-emerald-950/20 text-ok dark:text-emerald-400 border border-ok/25 dark:border-emerald-900/30', dot: 'bg-emerald-500' },
  RECHAZADO: { label: 'Rechazado', color: 'bg-danger-soft dark:bg-rose-950/20 text-danger dark:text-rose-400 border border-danger/25 dark:border-rose-900/30', dot: 'bg-rose-500' },
  EN_REVISION: { label: 'En Revisión', color: 'bg-info-soft dark:bg-sky-950/20 text-info dark:text-sky-400 border border-info/25 dark:border-sky-900/30', dot: 'bg-sky-500' }
};

const escaparHTML = valor => String(valor ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const imprimirInformeSolicitud = (solicitud, bien, historial) => {
  const fecha = valor => valor && !Number.isNaN(new Date(valor).getTime()) ? new Date(valor).toLocaleString('es-PY') : 'No registrada';
  const estado = ESTADO_INFO[solicitud.estado || 'PENDIENTE']?.label || 'Pendiente';
  const campos = [['Rótulo / código patrimonial', bien.rotulo], ['Descripción', bien.descripcion], ['Marca', bien.marca], ['Modelo', bien.modelo], ['Número de serie', bien.numeroSerie || bien.serie], ['Ubicación', bien.ubicacion], ['Estado registrado', bien.estadoConservacion]];
  const detalles = campos.filter(([, v]) => v).map(([k, v]) => `<tr><th>${escaparHTML(k)}</th><td>${escaparHTML(v)}</td></tr>`).join('');
  const eventos = historial.map((e, i) => `<tr><td>${i + 1}</td><td>${escaparHTML(ESTADO_INFO[e.estado]?.label || e.estado || 'Actuación')}</td><td>${escaparHTML(e.usuario || 'No registrado')}</td><td>${escaparHTML(fecha(e.fecha))}</td><td>${escaparHTML(e.motivo || '—')}</td></tr>`).join('');
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Informe de solicitud ${escaparHTML(bien.rotulo)}</title><style>@page{size:A4;margin:18mm}*{box-sizing:border-box}body{font:11pt Arial,sans-serif;color:#172033;line-height:1.45;margin:0}.head{border-bottom:3px solid #243b67;padding-bottom:14px;margin-bottom:18px}.brand{font-size:9pt;color:#526078;text-transform:uppercase;letter-spacing:.08em}.head h1{font-size:19pt;margin:8px 0 2px}.sub{color:#526078;font-size:10pt}.notice{border:1px solid #c98c29;background:#fff8e8;padding:12px 14px;margin:16px 0;font-weight:600}.section{font-size:12pt;color:#243b67;border-bottom:1px solid #cbd2dd;padding-bottom:5px;margin:20px 0 8px}table{width:100%;border-collapse:collapse;margin:8px 0 14px}th,td{border:1px solid #d5dbe5;padding:7px 8px;text-align:left;vertical-align:top}th{width:30%;background:#f3f5f8}thead th{background:#e9edf4;font-size:9pt}.sign{display:grid;grid-template-columns:1fr 1fr;gap:50px;margin-top:55px}.line{text-align:center;border-top:1px solid #526078;padding-top:8px;font-size:9pt}.foot{margin-top:25px;color:#6b7280;font-size:8pt;border-top:1px solid #d5dbe5;padding-top:8px}@media print{.no-print{display:none}}</style></head><body><header class="head"><div class="brand">Gestión patrimonial · Centro de Aprobaciones</div><h1>Informe de solicitud de baja</h1><div class="sub">Documento de consulta y seguimiento administrativo</div></header>
  <div class="notice">Este informe documenta una solicitud y su tramitación en el sistema. La solicitud o su aprobación no constituyen la baja patrimonial del bien ni autorizan su eliminación del inventario. La baja patrimonial requiere el procedimiento administrativo, las verificaciones y los actos aprobatorios correspondientes, y debe registrarse por separado.</div>
  <h2 class="section">1. Identificación de la solicitud</h2><table><tbody><tr><th>N.º de solicitud</th><td>${escaparHTML(solicitud.id || 'No asignado')}</td></tr><tr><th>Tipo</th><td>${solicitud.tipo === 'BAJA_FUNCIONARIO' ? 'Solicitud relacionada con funcionario' : 'Solicitud de baja de bien'}</td></tr><tr><th>Estado</th><td>${escaparHTML(estado)}</td></tr><tr><th>Fecha de presentación</th><td>${escaparHTML(fecha(solicitud.created_at || solicitud.fecha))}</td></tr><tr><th>Dependencia</th><td>${escaparHTML(solicitud.dependencia || 'No indicada')}</td></tr><tr><th>Solicitante</th><td>${escaparHTML(solicitud.solicitante || 'No indicado')}</td></tr><tr><th>Responsable</th><td>${escaparHTML(solicitud.responsable || 'Sin asignar')}</td></tr></tbody></table>
  <h2 class="section">2. Identificación del bien relacionado</h2><table><tbody>${detalles || `<tr><th>Rótulo / código</th><td>${escaparHTML(bien.rotulo || 'No indicado')}</td></tr><tr><th>Descripción</th><td>${escaparHTML(bien.descripcion || 'No indicada')}</td></tr>`}</tbody></table>
  <h2 class="section">3. Fundamento de la solicitud</h2><p>${escaparHTML(solicitud.motivo || 'No se registró un motivo.')}</p>
  <h2 class="section">4. Resolución registrada en el sistema</h2><table><tbody><tr><th>Resultado</th><td>${escaparHTML(estado)}</td></tr><tr><th>Registrado por</th><td>${escaparHTML(solicitud.resueltoPor || solicitud.revisionPor || 'No registrado')}</td></tr><tr><th>Fecha y hora</th><td>${escaparHTML(fecha(solicitud.resueltoEn || solicitud.resueltoFecha || solicitud.revisionEn))}</td></tr><tr><th>Observación</th><td>${escaparHTML(solicitud.motivoResolucion || 'Sin observaciones')}</td></tr></tbody></table>
  <h2 class="section">5. Historial de actuaciones</h2><table><thead><tr><th>#</th><th>Actuación</th><th>Usuario</th><th>Fecha y hora</th><th>Observación</th></tr></thead><tbody>${eventos || '<tr><td colspan="5">Sin actuaciones registradas.</td></tr>'}</tbody></table><div class="sign"><div class="line">Responsable de Patrimonio<br>Nombre, firma y fecha</div><div class="line">Autoridad competente<br>Nombre, firma y fecha</div></div><footer class="foot">Generado desde el sistema patrimonial el ${escaparHTML(fecha(new Date().toISOString()))}. Este informe no sustituye el expediente ni los actos administrativos requeridos para la baja patrimonial.</footer><div class="no-print" style="margin-top:20px"><button onclick="window.print()">Imprimir o guardar como PDF</button></div></body></html>`;
  const ventana = window.open('', '_blank');
  if (!ventana) { window.alert('Permite las ventanas emergentes de este sitio para generar el informe.'); return; }
  ventana.document.open(); ventana.document.write(html); ventana.document.close();
};

export default function AprobacionesView({
  dependenciaActual,
  solicitudesBaja, bienes,
  openResolucionModal, marcarSolicitudEnRevision, actualizarSolicitud, currentUser,
 
}) {
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [filtroDependencia, setFiltroDependencia] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [bandeja, setBandeja] = useState(() => { try { return localStorage.getItem('aprobaciones_bandeja') || 'todos'; } catch { return 'todos'; } });
  const [vistaGuardada, setVistaGuardada] = useState(() => { try { return JSON.parse(localStorage.getItem('aprobaciones_vista') || 'null'); } catch { return null; } });
  const [detalleId, setDetalleId] = useState(null);
  const [responsables, setResponsables] = useState({});
  const [asignandoId, setAsignandoId] = useState(null);
  const usuarioActual = currentUser?.username || '';
  const [revisandoIds, setRevisandoIds] = useState(() => new Set());

  const iniciarRevision = async (solicitud) => {
    if (revisandoIds.has(solicitud.id)) return;
    setRevisandoIds(prev => new Set(prev).add(solicitud.id));
    try { await marcarSolicitudEnRevision(solicitud); }
    finally {
      setRevisandoIds(prev => {
        const siguiente = new Set(prev);
        siguiente.delete(solicitud.id);
        return siguiente;
      });
    }
  };

  const conteo = solicitudesBaja.reduce(
    (acc, n) => {
      const e = n.estado || 'PENDIENTE';
      acc[e] = (acc[e] || 0) + 1;
      return acc;
    },
    { PENDIENTE: 0, APROBADO: 0, RECHAZADO: 0, EN_REVISION: 0 }
  );

  const listaFiltrada = solicitudesBaja.filter(n => {
    const estadoOK = filtroEstado === 'todos' || (n.estado || 'PENDIENTE') === filtroEstado;
    const tipoOK = filtroTipo === 'todos' || n.tipo === filtroTipo;
    const texto = normalizeStr(`${n.rotulo || ''} ${n.descripcion || ''} ${n.nombre || ''} ${n.cedula || ''} ${n.solicitante || ''} ${n.motivo || ''}`);
    const fecha = String(n.created_at || n.fecha || '').slice(0, 10);
    const dependenciaOK = !filtroDependencia || normalizeStr(n.dependencia) === normalizeStr(filtroDependencia);
    const activa = !['APROBADO', 'RECHAZADO'].includes(n.estado);
    const asignadaAMi = !n.responsable || normalizeStr(n.responsable) === normalizeStr(usuarioActual);
    const bandejaOK = bandeja === 'todos' || (bandeja === 'mis_pendientes' && activa && asignadaAMi) || (bandeja === 'sin_asignar' && activa && !n.responsable);
    return estadoOK && tipoOK && dependenciaOK && bandejaOK && (!desde || fecha >= desde) && (!hasta || fecha <= hasta) && (!busqueda.trim() || texto.includes(normalizeStr(busqueda)));
  }).sort((a, b) => {
    const prioridad = n => n.estado === 'PENDIENTE' ? 0 : n.estado === 'EN_REVISION' ? 1 : 2;
    const porEstado = prioridad(a) - prioridad(b);
    if (porEstado) return porEstado;
    return new Date(b.created_at || b.fecha || 0).getTime() - new Date(a.created_at || a.fecha || 0).getTime();
  });
  const dependenciasSolicitud = [...new Set(solicitudesBaja.map(n => n.dependencia).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  const asignarResponsable = async (solicitud) => {
    const responsable = (responsables[solicitud.id] || '').trim();
    if (!actualizarSolicitud || !responsable) return;
    const fecha = new Date().toISOString();
    const historial = Array.isArray(solicitud.historial) && solicitud.historial.length ? solicitud.historial : [{ estado: solicitud.estado || 'PENDIENTE', usuario: solicitud.solicitante || 'Usuario', fecha: solicitud.created_at || solicitud.fecha || null, motivo: solicitud.motivo || '' }];
    const actualizada = { ...solicitud, responsable, asignadoPor: usuarioActual, asignadoEn: fecha, historial: [...historial, { estado: solicitud.estado || 'PENDIENTE', usuario: usuarioActual, fecha, motivo: `Responsable asignado: ${responsable}` }] };
    setAsignandoId(solicitud.id);
    try { await actualizarSolicitud(actualizada); setResponsables(prev => ({ ...prev, [solicitud.id]: '' })); }
    finally { setAsignandoId(null); }
  };
  const guardarVistaActual = () => {
    const vista = { filtroEstado, filtroTipo, filtroDependencia, desde, hasta, bandeja };
    try { localStorage.setItem('aprobaciones_vista', JSON.stringify(vista)); } catch {}
    setVistaGuardada(vista);
  };
  const aplicarVista = () => { if (!vistaGuardada) return; setFiltroEstado(vistaGuardada.filtroEstado || 'todos'); setFiltroTipo(vistaGuardada.filtroTipo || 'todos'); setFiltroDependencia(vistaGuardada.filtroDependencia || ''); setDesde(vistaGuardada.desde || ''); setHasta(vistaGuardada.hasta || ''); setBandeja(vistaGuardada.bandeja || 'todos'); };
  const exportarCSV = () => {
    const filas = [['Tipo', 'Bien/funcionario', 'Descripción', 'Solicitante', 'Dependencia', 'Responsable', 'Estado', 'Fecha', 'Motivo']];
    listaFiltrada.forEach(n => filas.push([n.tipo || '', n.rotulo || n.cedula || '', n.descripcion || n.nombre || '', n.solicitante || '', n.dependencia || '', n.responsable || '', n.estado || 'PENDIENTE', n.created_at || n.fecha || '', n.motivo || '']));
    const csv = '\ufeff' + filas.map(f => f.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `aprobaciones-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };
  const solicitudesVencidas = useMemo(() => listaFiltrada.filter(n => !['APROBADO', 'RECHAZADO'].includes(n.estado) && n.created_at && Date.now() - new Date(n.created_at).getTime() >= 7 * 86400000).length, [listaFiltrada]);

  const ETAPAS = [
    { id: 'todos', label: 'Todos', n: solicitudesBaja.length },
    { id: 'PENDIENTE', label: 'Pendientes', n: conteo.PENDIENTE },
    { id: 'APROBADO', label: 'Aprobados', n: conteo.APROBADO },
    { id: 'RECHAZADO', label: 'Rechazados', n: conteo.RECHAZADO },
    { id: 'EN_REVISION', label: 'En Revisión', n: conteo.EN_REVISION }
  ];

  return (
    <div className="flex flex-col flex-1 space-y-6">
      <Card className="p-0">
        <div className="p-5 sm:p-6">
          <PageHeader
            titulo={'Centro de Aprobaciones'}
            descripcion={<>Gestión y seguimiento de solicitudes de baja en <strong className='text-content-1 dark:text-white font-semibold'>{dependenciaActual}</strong>. Su aprobación no da de baja automáticamente el bien.</>}
            icono="fa-check-to-slot"
            contador={(
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums bg-surface-3 dark:bg-surface-1/10 text-content-2 dark:text-content-3 border border-line dark:border-white/10">
                {conteo.PENDIENTE} pendientes
              </span>
            )}
          />
          <Toolbar className="mt-4">
          <div className="flex flex-wrap items-center gap-1.5 -mb-1">
            <ChipGroup>
              {ETAPAS.map(et => (
                <Chip
                  key={et.id}
                  activo={filtroEstado === et.id}
                  conteo={et.n}
                  onClick={() => setFiltroEstado(et.id)}
                >
                  {et.label}
                </Chip>
              ))}
            </ChipGroup>
          </div>
          </Toolbar>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="aprobaciones-bandeja">Bandeja de solicitudes</label>
            <select id="aprobaciones-bandeja" value={bandeja} onChange={e => { setBandeja(e.target.value); try { localStorage.setItem('aprobaciones_bandeja', e.target.value); } catch {} }} className="h-9 rounded-control border border-line bg-surface-1 px-3 text-xs font-semibold text-content-1"><option value="todos">Todas las solicitudes</option><option value="mis_pendientes">Mis pendientes / sin asignar</option><option value="sin_asignar">Pendientes sin responsable</option></select>
            <button type="button" onClick={guardarVistaActual} className="h-9 rounded-control border border-line px-3 text-xs font-semibold text-content-2 hover:bg-surface-2">Guardar filtros</button>
            {vistaGuardada && <button type="button" onClick={aplicarVista} className="h-9 rounded-control border border-brand/25 px-3 text-xs font-semibold text-brand-text hover:bg-brand/5">Aplicar filtros guardados</button>}
            <button type="button" onClick={exportarCSV} className="h-9 rounded-control border border-line px-3 text-xs font-semibold text-content-2 hover:bg-surface-2"><i className="fa-solid fa-download mr-1.5"/>Exportar CSV ({listaFiltrada.length})</button>
          </div>
          {solicitudesVencidas > 0 && <div role="status" className="mt-3 flex items-center gap-2 rounded-control border border-warn/25 bg-warn-soft px-3 py-2 text-xs font-semibold text-warn"><i className="fa-solid fa-bell"/>Hay {solicitudesVencidas} solicitudes abiertas con 7 días o más; requieren seguimiento.</div>}
          <div className="mt-3 grid gap-2 lg:grid-cols-[minmax(220px,1fr)_auto_auto_auto_auto]">
            <label htmlFor="aprobaciones-search" className="sr-only">Buscar solicitud</label>
            <input id="aprobaciones-search" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por bien, funcionario, solicitante o motivo…" className="h-10 w-full rounded-control border border-line bg-surface-2 px-3 text-sm text-content-1 outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" />
            <div className="flex gap-1 rounded-control border border-line bg-surface-2 p-1" role="group" aria-label="Tipo de solicitud">
              {[['todos', 'Todos'], ['BAJA_BIEN', 'Bienes'], ['BAJA_FUNCIONARIO', 'Funcionarios']].map(([id, label]) => <button key={id} type="button" aria-pressed={filtroTipo === id} onClick={() => setFiltroTipo(id)} className={`rounded px-3 text-xs font-semibold ${filtroTipo === id ? 'bg-surface-1 text-brand-text shadow-sm' : 'text-content-3 hover:text-content-1'}`}>{label}</button>)}
            </div>
            <FiltroCombo valor={filtroDependencia} opciones={dependenciasSolicitud} onElegir={setFiltroDependencia} etiquetaTodos="Todas las dependencias" titulo="Filtrar por dependencia" ancho="min-w-[210px]" />
            <label className="flex h-10 items-center gap-2 rounded-control border border-line bg-surface-1 px-2 text-[10px] font-semibold text-content-3">Desde<input type="date" value={desde} max={hasta || undefined} onChange={e => setDesde(e.target.value)} aria-label="Solicitudes desde" className="w-[112px] bg-transparent text-xs text-content-1" /></label>
            <label className="flex h-10 items-center gap-2 rounded-control border border-line bg-surface-1 px-2 text-[10px] font-semibold text-content-3">Hasta<input type="date" value={hasta} min={desde || undefined} onChange={e => setHasta(e.target.value)} aria-label="Solicitudes hasta" className="w-[112px] bg-transparent text-xs text-content-1" /></label>
            {(busqueda || filtroDependencia || desde || hasta || filtroTipo !== 'todos') && <button type="button" onClick={() => { setBusqueda(''); setFiltroDependencia(''); setDesde(''); setHasta(''); setFiltroTipo('todos'); }} className="h-10 rounded-control px-3 text-xs font-bold text-content-3 hover:bg-surface-2">Limpiar filtros</button>}
          </div>
        </div>
      </Card>

      <div className={`bg-surface-1 dark:bg-surface-1 border border-line/70 dark:border-line rounded-panel shadow-sm overflow-hidden ${listaFiltrada.length ? 'flex-1 min-h-[400px]' : ''}`}>
        <div className="overflow-x-auto custom-scrollbar">
          <Table sinContenedor minWidth={false} className="w-full text-left border-collapse min-w-[700px]">
            <THead>
              <TRow className="text-[10px] sm:text-[11px] font-semibold text-content-3 dark:text-content-3 uppercase tracking-widest">
                <TH className="py-4 pl-6 sm:pl-8 pr-4">Bien / Solicitud</TH>
                <TH className="px-4 py-4">Solicitante</TH>
                <TH className="px-4 py-4">Fecha</TH>
                <TH className="px-4 py-4">Estado</TH>
                <TH className="py-4 pl-4 pr-6 sm:pr-8 text-right">Decisión</TH>
              </TRow>
            </THead>
            <TBody>
              {listaFiltrada.map((notif) => {
                // Dos tipos de solicitud: la baja de un bien y la eliminacion de
                // un funcionario del padron. Cada una muestra los datos de su
                // entidad, no los del bien (que en el caso del funcionario no
                // existe).
                const esSolicitudFuncionario = notif.tipo === 'BAJA_FUNCIONARIO';
                const bienAsociado = esSolicitudFuncionario
                  ? {
                      id: notif.funcionarioId,
                      rotulo: notif.cedula || 'S/C',
                      descripcion: notif.nombre || 'Funcionario del padrón'
                    }
                  : bienes.find(b => b.id === (notif.bienId || notif.bien_id)) || {
                      id: notif.bienId || notif.bien_id,
                      rotulo: notif.rotulo || 'S/R',
                      descripcion: notif.descripcion || 'Sin descripción'
                    };
                const estado = notif.estado || 'PENDIENTE';
                const info = ESTADO_INFO[estado] || ESTADO_INFO.PENDIENTE;
                const estaResuelto = estado === 'APROBADO' || estado === 'RECHAZADO';
                const fechaSolicitud = notif.created_at || notif.fecha;
                const diasAbierta = fechaSolicitud ? Math.max(0, Math.floor((Date.now() - new Date(fechaSolicitud).getTime()) / 86400000)) : 0;
                const historial = Array.isArray(notif.historial) && notif.historial.length
                  ? notif.historial
                  : [
                      { estado: 'PENDIENTE', usuario: notif.solicitante || 'Usuario', fecha: notif.created_at || notif.fecha || null, motivo: notif.motivo || '' },
                      ...(notif.estado === 'EN_REVISION' ? [{ estado: 'EN_REVISION', usuario: notif.revisionPor, fecha: notif.revisionEn }] : []),
                      ...(estaResuelto ? [{ estado, usuario: notif.resueltoPor, fecha: notif.resueltoEn || notif.resueltoFecha, motivo: notif.motivoResolucion }] : [])
                    ];
                const bienParaInforme = esSolicitudFuncionario ? bienAsociado : (bienes.find(b => b.id === (notif.bienId || notif.bien_id)) || bienAsociado);

                return (
                  <TRow key={notif.id} className={`hover:bg-surface-2/50 dark:hover:bg-surface-1/[0.02] transition-colors ${estaResuelto ? 'opacity-80' : ''}`}>
                    <TD className="py-4 pl-6 sm:pl-8 pr-4 align-top">
                      <div className="space-y-1">
                        <span className="font-mono font-semibold text-xs text-content-1 dark:text-white bg-surface-3 dark:bg-surface-1/10 px-2 py-0.5 rounded-lg">
                          {bienAsociado.rotulo}
                        </span>
                        <p className="font-semibold text-content-1 dark:text-white text-sm line-clamp-2">
                          {bienAsociado.descripcion}
                        </p>
                        {notif.motivo && (
                          <div className="mt-2 flex items-start gap-2 text-xs text-warn dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-control px-3 py-2">
                            <i className="fa-solid fa-comment-dots text-xs mt-0.5 shrink-0 text-warn"></i>
                            <div className="flex-1">
                              <span className="font-bold">Motivo:</span> {notif.motivo}
                            </div>
                          </div>
                        )}
                        {estaResuelto && notif.resueltoPor && (
                          <div className="mt-2 flex items-start gap-2 text-xs text-content-3 dark:text-content-3">
                            <i className="fa-solid fa-user-check text-[10px] shrink-0 text-content-3"></i>
                            <span className="font-semibold">Resuelto por: {notif.resueltoPor}</span>
                            {(notif.resueltoEn || notif.resueltoFecha) && <span className="ml-2">· {new Date(notif.resueltoEn || notif.resueltoFecha).toLocaleDateString('es-PY')}</span>}
                          </div>
                        )}
                        {notif.responsable && <p className="mt-2 text-xs text-content-2"><i className="fa-solid fa-user-tag mr-1.5 text-brand-text"/>Responsable: <strong>{notif.responsable}</strong></p>}
                        {!estaResuelto && <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <label className="sr-only" htmlFor={`responsable-${notif.id}`}>Asignar responsable</label>
                          <input id={`responsable-${notif.id}`} value={responsables[notif.id] ?? notif.responsable ?? ''} onChange={e => setResponsables(prev => ({ ...prev, [notif.id]: e.target.value }))} placeholder="Usuario responsable" className="h-8 w-40 rounded border border-line bg-surface-1 px-2 text-xs" />
                          <button type="button" disabled={asignandoId === notif.id || !(responsables[notif.id] || '').trim()} onClick={() => asignarResponsable(notif)} className="h-8 rounded border border-line px-2 text-xs font-semibold disabled:opacity-50">{asignandoId === notif.id ? 'Guardando…' : 'Asignar'}</button>
                        </div>}
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1"><button type="button" onClick={() => setDetalleId(detalleId === notif.id ? null : notif.id)} className="text-xs font-semibold text-brand-text hover:underline" aria-expanded={detalleId === notif.id}>{detalleId === notif.id ? 'Ocultar detalle' : 'Ver detalle'}</button><button type="button" onClick={() => imprimirInformeSolicitud(notif, bienParaInforme, historial)} className="text-xs font-semibold text-brand-text hover:underline"><i className="fa-solid fa-file-pdf mr-1"/>Informe / Imprimir PDF</button></div>
                        {detalleId === notif.id && <div className="mt-2 rounded-control border border-line bg-surface-2 p-3 text-xs text-content-2 space-y-1"><p><strong>Tipo:</strong> {notif.tipo === 'BAJA_FUNCIONARIO' ? 'Baja de funcionario' : 'Baja de bien'}</p><p><strong>Dependencia:</strong> {notif.dependencia || 'No indicada'}</p><p><strong>Solicitante:</strong> {notif.solicitante || 'No indicado'}</p><p><strong>Motivo:</strong> {notif.motivo || 'Sin motivo'}</p><p><strong>Responsable:</strong> {notif.responsable || 'Sin asignar'}</p></div>}
                        <details className="mt-2 text-xs text-content-2">
                          <summary className="cursor-pointer select-none font-semibold text-brand-text hover:underline">Historial ({historial.length})</summary>
                          <ol className="mt-2 space-y-2 border-l border-line pl-3">
                            {historial.map((evento, indice) => {
                              const infoEvento = ESTADO_INFO[evento.estado] || ESTADO_INFO.PENDIENTE;
                              const fechaEvento = evento.fecha ? new Date(evento.fecha) : null;
                              const fechaValida = fechaEvento && !Number.isNaN(fechaEvento.getTime());
                              return (
                                <li key={`${evento.estado}-${evento.fecha || indice}-${indice}`} className="relative">
                                  <span className={`absolute -left-[17px] top-1.5 h-2 w-2 rounded-full ${infoEvento.dot}`} />
                                  <span className="font-bold">{infoEvento.label}</span>
                                  {evento.usuario && <span> · {evento.usuario}</span>}
                                  {fechaValida && <div className="text-[11px] text-content-3">{fechaEvento.toLocaleString('es-PY')}</div>}
                                  {evento.motivo && <div className="mt-0.5 text-[11px] text-content-2">{evento.motivo}</div>}
                                </li>
                              );
                            })}
                          </ol>
                        </details>
                      </div>
                    </TD>
                    <TD className="px-4 py-4 align-top text-xs font-medium text-content-1 dark:text-content-3">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-user text-content-3"></i>
                        <span>{notif.solicitante || 'Funcionario'}</span>
                      </div>
                    </TD>
                    <TD className="px-4 py-4 align-top text-xs text-content-3 font-mono">
                      {fechaSolicitud ? new Date(fechaSolicitud).toLocaleDateString('es-PY') : 'Reciente'}
                      {!estaResuelto && diasAbierta >= 7 && <span className="mt-1 block rounded bg-warn-soft px-2 py-1 text-[10px] font-bold text-warn">{diasAbierta} días pendiente · requiere seguimiento</span>}
                    </TD>
                    <TD className="px-4 py-4 align-top">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${info.color}`}>
                        <span className={`h-2 w-2 rounded-full ${info.dot}`}></span>
                        {info.label}
                      </span>
                    </TD>
                    <TD className="py-4 pl-4 pr-6 sm:pr-8 align-top text-right">
                      {!estaResuelto && (
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {estado === 'PENDIENTE' && <button
                            type="button"
                            onClick={() => iniciarRevision(notif)}
                            disabled={revisandoIds.has(notif.id)}
                            className="px-3 h-10 rounded-control text-[13px] font-semibold text-info hover:bg-info-soft border border-info/25 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-info outline-none disabled:opacity-60 disabled:cursor-wait"
                          >
                            {revisandoIds.has(notif.id) ? 'Guardando…' : 'Marcar en revisión'}
                          </button>}
                          <button
                            type="button"
                            onClick={() => openResolucionModal(bienAsociado, 'rechazar', notif)}
                            className="px-4 h-10 rounded-control text-[13px] font-semibold text-content-2 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-1/[0.05] border border-transparent hover:border-line dark:hover:border-white/10 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand outline-none"
                          >
                            Rechazar
                          </button>
                          <button
                            type="button"
                            onClick={() => openResolucionModal(bienAsociado, 'aprobar', notif)}
                            className="px-4 h-10 rounded-control text-[13px] font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 outline-none"
                          >
                            {esSolicitudFuncionario ? 'Aprobar Eliminación' : 'Aprobar solicitud'}
                          </button>
                        </div>
                      )}
                      {estaResuelto && (
                        <span className="text-[10px] font-bold text-content-3 uppercase tracking-wider">
                          Decisión registrada
                        </span>
                      )}
                    </TD>
                  </TRow>
                );
              })}

              {listaFiltrada.length === 0 && (
                <TRow>
                  <TD colSpan="5">
                    <EmptyState
                      icon="fa-check-double"
                      titulo="Bandeja de aprobaciones al día"
                      descripcion="No hay solicitudes pendientes con el filtro seleccionado."
                      className="py-8 sm:py-10"
                    />
                  </TD>
                </TRow>
              )}
            </TBody>
          </Table>
        </div>
      </div>

      {/* Leyenda de estados */}
      <div className="flex flex-wrap gap-2 text-[10px] font-bold text-content-3 dark:text-content-3 uppercase tracking-wider">
        {Object.entries(ESTADO_INFO).map(([key, info]) => (
          <span key={key} className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${info.dot}`}></span>
            {info.label}
          </span>
        ))}
      </div>
    </div>
  );
}
