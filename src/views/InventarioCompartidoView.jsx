import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const fechaCorta = (valor) => {
  if (!valor) return 'No registrada';
  const [anio, mes, dia] = String(valor).slice(0, 10).split('-');
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : String(valor);
};

export default function InventarioCompartidoView({ token }) {
  const [estado, setEstado] = useState({ cargando: true, datos: null, error: false });

  useEffect(() => {
    let vigente = true;
    supabase.rpc('obtener_inventario_compartido', { p_token: token })
      .then(({ data, error }) => {
        if (!vigente) return;
        setEstado({ cargando: false, datos: error ? null : data, error: Boolean(error) || !data });
      })
      .catch(() => {
        if (vigente) setEstado({ cargando: false, datos: null, error: true });
      });
    return () => { vigente = false; };
  }, [token]);

  return (
    <main className="min-h-dvh bg-canvas px-4 py-8 text-content-1 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-text">
            <i className="fa-solid fa-boxes-stacked" aria-hidden="true" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-content-3">Universidad Nacional de Pilar</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Bienes compartidos</h1>
          <p className="mt-2 text-sm text-content-2">Vista de solo lectura. Este enlace no permite ingresar ni realizar cambios en el sistema.</p>
        </header>

        {estado.cargando ? (
          <section className="rounded-panel border border-line bg-surface-1 p-10 text-center shadow-card" role="status">
            <i className="fa-solid fa-circle-notch fa-spin text-2xl text-brand" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-content-2">Consultando los bienes compartidos…</p>
          </section>
        ) : estado.error ? (
          <section className="rounded-panel border border-line bg-surface-1 p-8 text-center shadow-card">
            <i className="fa-solid fa-link-slash text-3xl text-content-3" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-bold">Enlace no disponible</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-content-2">El enlace venció, no existe o no se pudo consultar. Solicita a quien lo compartió que genere uno nuevo.</p>
          </section>
        ) : (
          <>
            <section className="mb-4 rounded-panel border border-line bg-surface-1 p-5 shadow-card sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">{estado.datos.titulo}</h2>
                  <p className="mt-1 text-sm text-content-2">{estado.datos.dependencia}</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-ok/20 bg-ok-soft px-3 py-1.5 text-xs font-bold text-ok">
                  <i className="fa-solid fa-eye" aria-hidden="true" /> Solo lectura
                </span>
              </div>
              <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-content-3">
                Enlace temporal válido hasta el {fechaCorta(estado.datos.venceEn)}. Se muestra una copia de los datos compartidos al generar el enlace.
              </p>
            </section>

            <p className="mb-3 px-1 text-sm font-semibold text-content-2" aria-live="polite">
              {estado.datos.bienes?.length || 0} {(estado.datos.bienes?.length || 0) === 1 ? 'bien compartido' : 'bienes compartidos'}
            </p>
            <ol className="space-y-3">
              {(estado.datos.bienes || []).map((bien, indice) => (
                <li key={`${bien.rotulo || 'bien'}-${indice}`} className="rounded-card border border-line bg-surface-1 p-4 shadow-xs sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-content-3">Rótulo</p>
                      <h3 className="mt-1 break-words font-mono text-base font-bold">{bien.rotulo || 'Sin rótulo'}</h3>
                    </div>
                    {bien.estado && <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-content-2">{bien.estado}</span>}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-content-2">{bien.descripcion || 'Sin descripción registrada'}</p>
                  <dl className="mt-4 grid grid-cols-1 gap-3 border-t border-line pt-3 text-sm sm:grid-cols-2">
                    {bien.funcionario && <div><dt className="text-xs font-medium text-content-3">Responsable</dt><dd className="mt-0.5 font-semibold">{bien.funcionario}</dd></div>}
                    {bien.ubicacion && <div><dt className="text-xs font-medium text-content-3">Ubicación</dt><dd className="mt-0.5 font-semibold">{bien.ubicacion}</dd></div>}
                    <div><dt className="text-xs font-medium text-content-3">Fecha de asignación</dt><dd className="mt-0.5 font-semibold">{fechaCorta(bien.fechaAsignacion)}</dd></div>
                  </dl>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-center text-xs leading-relaxed text-content-3">El enlace permite consultar únicamente estos bienes y vence automáticamente. No incluye cédulas, valores ni acceso a otras funciones.</p>
          </>
        )}
      </div>
    </main>
  );
}
