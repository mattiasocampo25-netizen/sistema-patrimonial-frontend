import { useMemo } from 'react';
import { Badge, Button, Card } from '../components/ui';
import KioskBar, { BotonPantallaCompleta } from '../components/KioskBar';
import { formatCurrency, formatDateText } from '../utils/helpers';

const texto = (valor) => String(valor ?? '').trim();
const componentesDe = (valor) => {
  if (Array.isArray(valor)) return valor;
  if (!valor) return [];
  try { const parsed = typeof valor === 'string' ? JSON.parse(valor) : valor; return Array.isArray(parsed) ? parsed : []; } catch { return []; }
};

function Dato({ etiqueta, valor, icono, destacado = false }) {
  return <div className={`min-w-0 rounded-2xl border p-4 ${destacado ? 'border-brand/25 bg-brand-soft/45' : 'border-line bg-surface-1'}`}>
    <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-content-3"><i className={`fa-solid ${icono} text-brand-text`} aria-hidden="true" />{etiqueta}</p>
    <p className="mt-2 break-words text-sm font-bold leading-relaxed text-content-1">{texto(valor) || 'Sin registrar'}</p>
  </div>;
}

export default function BienQrPublicoView({ bien, autorizado, appLogo, publicBienId, kioscoActivo, kioscoIdle }) {
  const componentes = useMemo(() => componentesDe(bien?.componentes), [bien?.componentes]);
  const tieneValor = bien?.valorUnitario !== undefined && bien?.valorUnitario !== null && texto(bien.valorUnitario) !== '';
  const estado = texto(bien?.estadoConservacion) || 'Sin estado registrado';
  const badgeEstado = estado === 'De Baja' ? 'danger' : estado === 'Sin estado registrado' ? 'neutral' : 'ok';
  const fecha = texto(bien?.fechaAdquisicion) ? formatDateText(bien.fechaAdquisicion) : '';
  const camposClasificacion = [
    ['Cuenta patrimonial', bien?.cuenta, 'fa-book'],
    ['Subcuenta', bien?.subcuenta, 'fa-list-ol'],
    ['Analítico 1', bien?.analitico1, 'fa-layer-group'],
    ['Analítico 2', bien?.analitico2, 'fa-diagram-project'],
    ['Fecha de adquisición', fecha, 'fa-calendar-days'],
  ].filter(([, valor]) => texto(valor));

  return <main className="min-h-dvh overflow-y-auto bg-canvas px-3 py-5 text-content-1 sm:px-6 sm:py-8 lg:px-8 custom-scrollbar">
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface-1 px-4 py-3 shadow-sm sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          {appLogo ? <img src={appLogo} alt="Universidad Nacional de Pilar" className="h-10 max-w-32 object-contain" /> : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-text"><i className="fa-solid fa-building-columns" aria-hidden="true" /></span>}
          <div className="min-w-0"><p className="truncate text-xs font-extrabold text-content-1 sm:text-sm">Universidad Nacional de Pilar</p><p className="mt-0.5 truncate text-[10px] font-medium text-content-3 sm:text-xs">Gestión patrimonial · Consulta de activo</p></div>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold ${autorizado ? 'border-ok/20 bg-ok-soft text-ok' : 'border-brand/20 bg-brand-soft text-brand-text'}`}><i className={`fa-solid ${autorizado ? 'fa-lock-open' : 'fa-shield-halved'}`} aria-hidden="true" />{autorizado ? 'Ficha completa autorizada' : 'Ficha pública del activo'}</span>
      </header>

      <Card className="mt-5 overflow-hidden border border-line shadow-card">
        <section className="relative overflow-hidden bg-gradient-to-br from-brand to-brand-hover px-5 py-6 text-white sm:px-8 sm:py-8">
          <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full border-[28px] border-white/10" aria-hidden="true" />
          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">Código patrimonial</p>
              <h1 className="mt-2 break-all font-mono text-2xl font-black tracking-tight sm:text-4xl">{bien?.rotulo || (bien ? 'Sin rótulo' : 'Consultando…')}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85">{bien?.descripcion || 'Consulta los datos registrados del bien.'}</p>
            </div>
            {bien && <Badge tono={badgeEstado} icono={estado === 'De Baja' ? 'fa-triangle-exclamation' : 'fa-circle-check'}>{estado}</Badge>}
          </div>
        </section>

        {!bien ? <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center" role="status"><i className="fa-solid fa-circle-notch fa-spin text-2xl text-brand" aria-hidden="true" /><p className="text-sm font-semibold text-content-2">Consultando los datos oficiales del QR…</p><p className="text-xs text-content-3">Identificador: {publicBienId}</p></div> : <div className="space-y-5 p-4 sm:p-7">
          <section aria-labelledby="qr-datos-operativos">
            <div className="mb-3"><h2 id="qr-datos-operativos" className="text-sm font-extrabold text-content-1">Responsable y ubicación</h2><p className="mt-1 text-xs text-content-3">Datos principales para identificar y localizar físicamente el bien.</p></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Dato etiqueta="Responsable" valor={bien.funcionario || 'Sin responsable asignado'} icono="fa-user" destacado />
              <Dato etiqueta="Ubicación" valor={bien.ubicacion || 'Sin ubicación registrada'} icono="fa-location-dot" destacado />
            </div>
          </section>

          {camposClasificacion.length > 0 && <section aria-labelledby="qr-clasificacion">
            <div className="mb-3"><h2 id="qr-clasificacion" className="text-sm font-extrabold text-content-1">Datos patrimoniales</h2><p className="mt-1 text-xs text-content-3">Clasificación y adquisición registradas para este activo.</p></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{camposClasificacion.map(([etiqueta, valor, icono]) => <Dato key={etiqueta} etiqueta={etiqueta} valor={valor} icono={icono} />)}</div>
          </section>}

          {autorizado && <section className="space-y-4 border-t border-line pt-5" aria-labelledby="qr-ficha-completa">
            <div><div className="flex items-center gap-2"><i className="fa-solid fa-lock-open text-ok" aria-hidden="true" /><h2 id="qr-ficha-completa" className="text-sm font-extrabold text-content-1">Información completa disponible en tu sesión</h2></div><p className="mt-1 text-xs text-content-3">Se muestra porque el bien está disponible en el inventario autorizado de tu cuenta.</p></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {texto(bien.dependencia) && <Dato etiqueta="Dependencia" valor={bien.dependencia} icono="fa-building" />}
              {texto(bien.area) && <Dato etiqueta="Área" valor={bien.area} icono="fa-door-open" />}
              {texto(bien.funcionarioCargo) && <Dato etiqueta="Cargo del responsable" valor={bien.funcionarioCargo} icono="fa-briefcase" />}
              {texto(bien.funcionarioDoc) && <Dato etiqueta="Documento del responsable" valor={bien.funcionarioDoc} icono="fa-id-card" />}
              {texto(bien.funcionarioAlternativo) && <Dato etiqueta="Responsable alternativo" valor={bien.funcionarioAlternativo} icono="fa-user-group" />}
              {texto(bien.funcionarioAlternativoDoc) && <Dato etiqueta="Documento alternativo" valor={bien.funcionarioAlternativoDoc} icono="fa-id-card" />}
              {texto(bien.estadoConservacion) && <Dato etiqueta="Estado de conservación" valor={bien.estadoConservacion} icono="fa-clipboard-check" />}
              {texto(bien.vidaUtil) && <Dato etiqueta="Vida útil" valor={bien.vidaUtil} icono="fa-hourglass-half" />}
              {tieneValor && <Dato etiqueta="Valor registrado" valor={`${formatCurrency(bien.valorUnitario)} Gs.`} icono="fa-coins" />}
            </div>
            {texto(bien.observaciones) && <div className="rounded-2xl border border-warn/25 bg-warn-soft/40 p-4"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-warn"><i className="fa-solid fa-note-sticky" aria-hidden="true" />Observaciones</p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-content-1">{bien.observaciones}</p></div>}
            {componentes.length > 0 && <div className="rounded-2xl border border-line p-4"><h3 className="text-xs font-extrabold text-content-1">Componentes del bien · {componentes.length}</h3><div className="mt-3 grid gap-3 sm:grid-cols-2">{componentes.map((componente, index) => <article key={componente.id || `${componente.nombre}-${index}`} className="rounded-xl bg-surface-2 p-3"><p className="text-sm font-bold text-content-1">{componente.nombre || `Componente ${index + 1}`}<span className="ml-2 text-xs font-semibold text-content-3">× {componente.cantidad || 1}</span></p><div className="mt-2 space-y-1 text-xs text-content-2">{componente.ubicacion && <p><b>Ubicación:</b> {componente.ubicacion}</p>}{componente.funcionario && <p><b>Encargado:</b> {componente.funcionario}</p>}{componente.estadoConservacion && <p><b>Estado:</b> {componente.estadoConservacion}</p>}{componente.observaciones && <p className="whitespace-pre-wrap break-words"><b>Observación:</b> {componente.observaciones}</p>}</div></article>)}</div></div>}
          </section>}

          <footer className="border-t border-line pt-4"><Button variante="primary" tamano="md" onClick={() => { window.location.href = window.location.origin; }} className="w-full sm:w-auto"><i className="fa-solid fa-arrow-left text-xs" aria-hidden="true" />Volver al sistema</Button></footer>
        </div>}
      </Card>

      <div className="mt-3 flex items-center gap-2"><span className="flex-1" /><BotonPantallaCompleta />{!kioscoActivo && <a href={`?id=${encodeURIComponent(publicBienId)}&kiosk=1`} title="Abrir en modo kiosco" className="inline-flex h-9 items-center justify-center gap-2 rounded-control border border-line bg-surface-1 px-3 text-xs font-semibold text-content-2 hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"><i className="fa-solid fa-display text-[10px]" aria-hidden="true" /><span>Kiosco</span></a>}</div>
      {kioscoActivo && <KioskBar idleSegundos={kioscoIdle} onSalir={() => { window.location.href = window.location.origin; }} onEscanearOtro={() => { window.location.href = window.location.origin; }} />}
    </div>
  </main>;
}
