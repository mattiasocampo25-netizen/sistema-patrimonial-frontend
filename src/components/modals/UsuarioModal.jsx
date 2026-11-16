// src/components/modals/UsuarioModal.jsx
import React, { useEffect, useRef, useState } from 'react';
import Dialogo from '../ui/Dialogo';
import FiltroCombo from '../FiltroCombo';
import { FORM } from '../../constants/designTokens';

const LABEL = FORM.label;

export default function UsuarioModal({ isOpen, onClose, usuarioEditing, saveUsuario, todasDependencias, esDesarrollador, currentUser, STYLES }) {
    const formRef = useRef(null);
    const [errorImpresion, setErrorImpresion] = useState('');
    const [rolSeleccionado, setRolSeleccionado] = useState(usuarioEditing?.cargo || 'user');
    const [dependenciaSeleccionada, setDependenciaSeleccionada] = useState(usuarioEditing?.dependencia || 'Rectorado');
    useEffect(() => {
      setRolSeleccionado(usuarioEditing?.cargo || 'user');
      setDependenciaSeleccionada(usuarioEditing?.dependencia || 'Rectorado');
    }, [usuarioEditing, isOpen]);
    if (!isOpen) return null;
    const permisosPorRol = {
      user: ['Gestionar bienes y funcionarios de su dependencia', 'Crear y consultar formularios FC-04, FC-10 y FC-11', 'Enviar solicitudes para revisión administrativa'],
      admin: ['Gestionar bienes y movimientos de las dependencias', 'Revisar solicitudes e informes administrativos', 'Administrar usuarios, catálogos y auditoría'],
      desarrollador: ['Incluye permisos de administrador', 'Gestionar avisos y mantenimiento del sistema']
    };
    const imprimirSolicitudAlta = () => {
      const form = formRef.current;
      if (!form?.reportValidity()) return;
      const valores = new FormData(form);
      const nombre = String(valores.get('nombre') || '').trim();
      const username = String(valores.get('username') || '').trim();
      const rol = rolSeleccionado === 'admin' ? 'Administrador General' : rolSeleccionado === 'desarrollador' ? 'Desarrollador del sistema' : 'Funcionario Local';
      const dependencia = dependenciaSeleccionada || 'Sin dependencia seleccionada';
      const solicitante = currentUser?.nombre || currentUser?.username || '';
      const escapar = (valor) => String(valor || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
      const logo = new URL('/UNP-Site-Logo.png', window.location.origin).href;
      const pagina = window.open('', '_blank');
      if (!pagina) { setErrorImpresion('El navegador bloqueó la ventana de impresión. Permite ventanas emergentes para este sitio e inténtalo otra vez.'); return; }
      setErrorImpresion('');
      pagina.document.open();
      pagina.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Solicitud de alta de usuario</title><style>
        @page{size:A4;margin:18mm}*{box-sizing:border-box}body{font:12px Arial,sans-serif;color:#182334;margin:0}.hoja{max-width:800px;margin:0 auto}.encabezado{display:grid;grid-template-columns:100px 1fr 100px;align-items:center;gap:14px;border-bottom:3px solid #173b68;padding-bottom:14px}.logo{width:94px;max-height:74px;object-fit:contain}.institucion{text-align:center}.institucion h1{font-size:15px;margin:0 0 5px}.institucion p{margin:2px 0;font-size:11px}.folio{text-align:right;font-size:10px;color:#5b6573}.titulo{text-align:center;margin:24px 0 6px;font-size:19px}.subtitulo{text-align:center;color:#596779;margin:0 0 22px}.nota{background:#f1f5f9;border:1px solid #cbd5e1;padding:12px;line-height:1.5;margin:16px 0}.seccion{font-weight:bold;color:#173b68;margin:22px 0 8px;border-bottom:1px solid #cbd5e1;padding-bottom:6px}.datos{display:grid;grid-template-columns:1fr 1fr;border:1px solid #cbd5e1}.dato{padding:11px 12px;border-bottom:1px solid #e2e8f0}.dato:nth-child(odd){border-right:1px solid #e2e8f0}.dato span{display:block;font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px}.dato b{font-size:12px;overflow-wrap:anywhere}.firmas{display:grid;grid-template-columns:1fr 1fr;gap:50px;margin-top:70px}.firma{text-align:center;border-top:1px solid #263548;padding-top:10px;min-height:62px}.firma b{display:block;font-size:11px}.firma span{display:block;color:#64748b;font-size:10px;margin-top:4px}.pie{margin-top:35px;border-top:1px solid #cbd5e1;padding-top:9px;color:#64748b;font-size:9px;display:flex;justify-content:space-between}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
      </style></head><body><main class="hoja"><header class="encabezado"><img class="logo" src="${logo}" alt="Logo de la Universidad Nacional de Pilar"><div class="institucion"><h1>UNIVERSIDAD NACIONAL DE PILAR</h1><p>DIRECCIÓN DE CONTABILIDAD</p><p><b>DEPARTAMENTO DE BIENES PATRIMONIALES</b></p></div><div class="folio">Gestión de usuarios<br>Fecha: ${new Date().toLocaleDateString('es-PY')}</div></header><h2 class="titulo">SOLICITUD DE ALTA DE USUARIO</h2><p class="subtitulo">Formulario para habilitar un nuevo acceso al Sistema de Gestión Patrimonial</p><div class="nota">La presente solicitud registra los datos y el nivel de acceso requerido. La cuenta solo podrá habilitarse después de la autorización correspondiente y de la creación de las credenciales institucionales.</div><div class="seccion">1. Datos del usuario solicitado</div><div class="datos"><div class="dato"><span>Nombre completo</span><b>${escapar(nombre)}</b></div><div class="dato"><span>Usuario / identificador</span><b>${escapar(username)}</b></div><div class="dato"><span>Correo institucional sugerido</span><b>${escapar(username)}@unp.edu.py</b></div><div class="dato"><span>Perfil de acceso</span><b>${escapar(rol)}</b></div><div class="dato" style="grid-column:1/-1;border-right:0"><span>Dependencia asignada</span><b>${escapar(dependencia)}</b></div></div><div class="seccion">2. Justificación y observaciones</div><div style="height:70px;border:1px solid #cbd5e1;padding:10px;color:#64748b">________________________________________________________________________________<br><br>________________________________________________________________________________</div><div class="seccion">3. Autorización</div><p>Solicito la creación del perfil y confirmo que la dependencia y los permisos indicados corresponden a las funciones institucionales requeridas.</p><div class="firmas"><div class="firma"><b>Firma del solicitante</b><span>${escapar(solicitante) || 'Nombre y cargo: __________________________'}</span></div><div class="firma"><b>Firma del autorizador</b><span>Nombre y cargo: __________________________</span></div></div><div class="pie"><span>Solicitud de alta · Gestión Patrimonial UNP</span><span>Documento impreso para trámite administrativo</span></div></main><script>window.addEventListener('load',function(){setTimeout(function(){window.print()},300)})</script></body></html>`);
      pagina.document.close();
      pagina.opener = null;
    };

    return (
        <Dialogo className={STYLES.modalOverlay}>
          <div className={STYLES.modalContent + " max-w-md overflow-hidden"}>
            <div className="flex justify-between items-center px-6 py-5 border-b border-line dark:border-zinc-800/80 shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-surface-3 dark:bg-surface-1/10 text-content-1 dark:text-white">
                  <i className="fa-solid fa-user-gear text-base"></i>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-content-1 dark:text-white tracking-tight">
                    {usuarioEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                  </h2>
                  <p className="text-xs text-content-3 dark:text-content-3 mt-0.5">Credenciales y nivel de acceso</p>
                </div>
              </div>
              <button
                onClick={onClose}
                title="Cerrar" aria-label="Cerrar"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-content-3 hover:text-content-1 dark:hover:text-zinc-200 hover:bg-surface-3 dark:hover:bg-surface-1/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">

                <i className="fa-solid fa-xmark text-base"></i>
              </button>
            </div>

            <form ref={formRef} onSubmit={saveUsuario} className="flex flex-col h-full overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Usuario (Login / ID)</label>
                    <div className="relative">
                      <i className="fa-solid fa-at absolute left-4 top-1/2 -translate-y-1/2 text-content-3 text-xs"></i>
                      <input
                        type="text"
                        name="username"
                        required
                        defaultValue={usuarioEditing?.username}
                        disabled={!!usuarioEditing}
                        className={`${STYLES.input} pl-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${usuarioEditing ? 'bg-surface-3 dark:bg-surface-1/80 cursor-not-allowed text-content-3' : ''}`}
                        placeholder="Ej. mocampo"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={LABEL}>Nombre Completo</label>
                    <div className="relative">
                      <i className="fa-solid fa-id-card absolute left-4 top-1/2 -translate-y-1/2 text-content-3 text-xs"></i>
                      <input
                        type="text"
                        name="nombre"
                        required
                        defaultValue={usuarioEditing?.nombre}
                        className={`${STYLES.input} pl-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand`}
                        placeholder="Ej. Matías Ocampo"
                      />
                    </div>
                  </div>
                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className={LABEL}>Rol de Sistema</label>
                    <FiltroCombo
                      name="cargo"
                      required
                      valor={rolSeleccionado}
                      opciones={[
                        { label: 'Funcionario Local (lectura y creación)', value: 'user' },
                        { label: 'Administrador General (control total)', value: 'admin' },
                        ...(esDesarrollador ? [{ label: 'Desarrollador del sistema', value: 'desarrollador' }] : []),
                      ]}
                      onElegir={setRolSeleccionado}
                      etiquetaTodos="Funcionario Local"
                      titulo="Rol de sistema"
                    />
                    <div className="mt-2 rounded-control border border-line bg-surface-2 px-3 py-2.5" aria-live="polite">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-content-3">Permisos que tendrá este usuario</p>
                      <ul className="mt-1.5 space-y-1">{(permisosPorRol[rolSeleccionado] || permisosPorRol.user).map(permiso => <li key={permiso} className="flex items-start gap-1.5 text-[11px] text-content-2"><i className="fa-solid fa-check mt-0.5 text-ok" aria-hidden="true" />{permiso}</li>)}</ul>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className={LABEL}>Dependencia Asignada</label>
                    <FiltroCombo
                      name="dependencia"
                      required
                      valor={dependenciaSeleccionada}
                      opciones={todasDependencias}
                      onElegir={setDependenciaSeleccionada}
                      etiquetaTodos="Elegí dependencia"
                      titulo="Dependencia asignada"
                    />
                  </div>
                </div>
              </div>

              <div className="mx-6 sm:mx-8 mb-5 -mt-1 rounded-card bg-blue-500/[0.07] border border-blue-500/20 px-4 py-3 flex items-start gap-2.5">
                <i className="fa-solid fa-circle-info text-blue-500 text-xs mt-0.5 shrink-0"></i>
                <p className="text-[11px] leading-relaxed text-content-2 dark:text-content-3 font-medium">
                  El acceso real se crea en Supabase → <strong>Authentication</strong> con el email <strong>usuario@unp.edu.py</strong> y su contraseña. Sin esa cuenta, este perfil no puede entrar aunque exista aquí.
                </p>
              </div>

              <div className="flex flex-wrap justify-end gap-2 px-6 py-4 border-t border-line dark:border-zinc-800/80 shrink-0 z-10">
                {!usuarioEditing && <button type="button" onClick={imprimirSolicitudAlta} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-line px-4 text-[13px] font-semibold text-content-2 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><i className="fa-solid fa-print" aria-hidden="true" />Imprimir solicitud</button>}
                <button type="button" onClick={onClose} className="inline-flex items-center justify-center h-10 px-4 rounded-control text-[13px] font-semibold text-content-2 dark:text-content-3 hover:bg-surface-3 dark:hover:bg-surface-1/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">Cancelar</button>
                <button type="submit" className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-control bg-zinc-900 dark:bg-surface-1 text-white dark:text-content-1 font-bold text-[13px] hover:bg-zinc-800 dark:hover:bg-surface-3 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50"><i className="fa-solid fa-check text-xs"></i> Guardar Usuario</button>
              </div>
              {errorImpresion && <p role="alert" className="px-6 pb-3 text-right text-xs text-danger">{errorImpresion}</p>}
            </form>
          </div>
        </Dialogo>
    );
}
