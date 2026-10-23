import React, { useState } from 'react';
import FaqItem from '../components/FaqItem';
import WorkflowStep from '../components/WorkflowStep';
import { SHORTCUTS } from '../constants/appConstants';
import { normalizeStr, APP_VERSION } from '../utils/helpers';
import { Card, PageHeader, Toolbar } from '../components/ui';

// Vista de ayuda/Soporte y Normativa.
// Contenido estático + tour guiado + FAQ accordion ampliado.
export default function AyudaView({ setTourPaso, STYLES, version = APP_VERSION }) {
  const [busquedaFaq, setBusquedaFaq] = useState('');
  const [seccionActiva, setSeccionActiva] = useState('faq');

  const FAQS = [
    {
      category: 'General',
      question: "¿Qué es este sistema y para qué sirve?",
      answer: "Es la herramienta de la Universidad Nacional de Pilar para consultar los bienes institucionales y registrar sus altas, responsables, traslados y bajas. También permite generar códigos QR y consultar el historial de cada bien."
    },
    {
      category: 'General',
      question: "¿Quién puede acceder al sistema?",
      answer: "El acceso requiere una cuenta habilitada. Las opciones disponibles dependen del rol asignado: las tareas habituales de inventario, la administración y las herramientas de mantenimiento tienen permisos distintos."
    },
    {
      category: 'Inventario',
      question: "Explicación de la alerta crítica 'Req. Acción'",
      answer: "La alerta indica que el registro necesita atención para completar o revisar datos del bien. Abre su ficha y comprueba la ubicación, el responsable y las actas asociadas antes de continuar."
    },
    {
      category: 'Inventario',
      question: "Protocolo para exclusión de inventario (Baja)",
      answer: "Abre la acción de baja desde el bien y sigue el formulario correspondiente. Si tu rol no permite aprobarla directamente, el sistema enviará una solicitud al centro de aprobaciones."
    },
    {
      category: 'FC-10',
      question: "¿Cómo se controlan las firmas de un acta FC-10?",
      answer: "En Actas · FC-10, filtra por “Falta funcionario” o “Falta jefatura” para encontrar qué firma queda pendiente. Registra una firma cuando recibas el documento correspondiente; usa “Confirmar ambas firmas recibidas” solo si el PDF volvió con las dos firmas."
    },
    {
      category: 'FC-10',
      question: "Autocompletado de la estructura organizacional",
      answer: "Algunos campos de la unidad organizacional sugieren valores utilizados anteriormente. Revisa cada sugerencia antes de guardar: puede variar según la dependencia y el acta."
    },
    {
      category: 'FC-10',
      question: "¿Qué significa que un acta esté 'cerrada'?",
      answer: "El acta se considera cerrada cuando están registradas las firmas del funcionario responsable y de la jefatura inmediata. En la tarjeta del acta puedes revisar quién firmó y cuándo."
    },
    {
      category: 'FC-04',
      question: "Recuperación de registros históricos (Bajas)",
      answer: "Usa el filtro de estado del inventario para encontrar bienes dados de baja. Si necesitas revisar quién registró el cambio, consulta la ficha y su trazabilidad."
    },
    {
      category: 'FC-04',
      question: "Orígenes permitidos en un FC-04",
      answer: "El formulario presenta los tipos de movimiento disponibles. Selecciona el que corresponda al documento y completa los datos solicitados antes de generar el acta."
    },
    {
      category: 'QR',
      question: "¿Cómo generar varios códigos QR?",
      answer: "En Inventario, filtra los bienes que necesitas y selecciónalos. Usa la acción de lote para descargar las etiquetas de esa selección; también puedes generar un QR desde la ficha de un solo bien."
    },
    {
      category: 'QR',
      question: "¿Cómo funciona la consulta pública por QR?",
      answer: "El QR abre una ficha pública de consulta del bien. Comprueba que la etiqueta corresponda al bien antes de usar sus datos para una gestión."
    },
    {
      category: 'Respaldos',
      question: "¿Cómo hacer una copia de seguridad?",
      answer: "Abre Utilidades en el sidebar y selecciona “Copia de seguridad”. Guarda el archivo descargado en una ubicación institucional autorizada."
    },
    {
      category: 'Respaldos',
      question: "¿Cómo restaurar una copia de seguridad?",
      answer: "En Utilidades, selecciona “Restaurar respaldo” y elige un archivo generado por el sistema. Revisa la vista previa y confirma solo si corresponde; esta operación requiere permisos de administración."
    },
    {
      category: 'Seguridad',
      question: "¿Cómo se protegen mis datos?",
      answer: "El sistema limita las opciones según tu cuenta y rol. Evita compartir tus credenciales, cierra sesión al terminar y reporta al soporte cualquier acceso que no reconozcas."
    },
    {
      category: 'Seguridad',
      question: "¿Qué pasa si hay inactividad?",
      answer: "La sesión puede solicitarte nuevamente el acceso después de un periodo de inactividad. Guarda los cambios antes de dejar el sistema sin uso."
    },
    {
      category: 'Atajos',
      question: "Atajos de teclado",
      answer: "Usa Ctrl+K para abrir la búsqueda global, la tecla / para ir al buscador del inventario y ? para consultar la lista completa de atajos."
    },
    {
      category: 'Contacto',
      question: "¿Dónde reportar un fallo o solicitar soporte?",
      answer: "Escribe a patrimonio@unp.edu.py. Describe qué estabas intentando hacer, qué ocurrió y cuándo; si afecta a un bien, incluye su rótulo. No envíes contraseñas ni datos personales innecesarios."
    }
  ];

  const qFaq = normalizeStr(busquedaFaq);
  const faqsFiltradas = FAQS.filter(f =>
    !qFaq || normalizeStr(`${f.category} ${f.question} ${f.answer}`).includes(qFaq)
  );

  const SECCIONES = [
    { id: 'faq', label: 'Preguntas Frecuentes', icon: 'fa-circle-question' },
    { id: 'procedimiento', label: 'Flujo de trabajo', icon: 'fa-network-wired' },
    { id: 'atajos', label: 'Atajos de teclado', icon: 'fa-keyboard' }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Encabezado */}
      <Card className="p-0">
        <div className="p-5 sm:p-6">
          <PageHeader
            titulo="Ayuda y guía de uso"
            descripcion="Respuestas prácticas para gestionar el inventario, las actas y las firmas."
            icono="fa-circle-question"
          />
          <Toolbar className="mt-4">
          <button
            onClick={() => setTourPaso(0)}
            title="Recorrer las funciones principales del sistema"
            className="inline-flex shrink-0 items-center gap-2 px-4 h-10 rounded-control text-[13px] font-semibold text-content-inverse bg-brand hover:bg-brand-hover border border-transparent hover:border-line dark:hover:border-white/10 motion cursor-pointer focus-visible:ring-2 focus-visible:ring-brand outline-none shadow-md shadow-blue-500/25 shrink-0"
          >
            <i className="fa-solid fa-route" aria-hidden="true"></i> Iniciar recorrido
          </button>
          </Toolbar>
        </div>
      </Card>

      {/* Navegación de secciones */}
      <div role="tablist" aria-label="Secciones de ayuda" className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-card border border-line bg-surface-2 p-1 hide-scrollbar">
        {SECCIONES.map(s => (
          <button
            key={s.id}
            type="button"
            role="tab"
            id={`help-tab-${s.id}`}
            aria-controls={`help-panel-${s.id}`}
            onClick={() => setSeccionActiva(s.id)}
            aria-selected={seccionActiva === s.id}
            className={`flex shrink-0 items-center gap-2 rounded-control px-4 py-2.5 text-body font-semibold motion cursor-pointer ${ seccionActiva === s.id ? 'bg-surface-1 text-brand-text shadow-card' : 'bg-transparent text-content-2 hover:bg-surface-1/70 hover:text-content-1' }`}
          >
            <i className={`fa-solid ${s.icon} text-[13px] ${seccionActiva === s.id ? '' : 'opacity-70'}`}></i>
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-6">

        {/* Columna izquierda: sección activa */}
        <div role="tabpanel" id={`help-panel-${seccionActiva}`} aria-labelledby={`help-tab-${seccionActiva}`} className="flex min-w-0 flex-col tab-enter">
          {seccionActiva === 'faq' && (
            <>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-title font-bold leading-6 text-content-1 flex items-center gap-2">
                    <i className="fa-solid fa-circle-question text-brand-text" aria-hidden="true"></i> Preguntas frecuentes
                  </h2>
                  <p className="mt-1 text-body text-content-3">Busca por tarea, formulario o palabra clave.</p>
                </div>
                <span className="text-label font-semibold text-content-3">{faqsFiltradas.length} {faqsFiltradas.length === 1 ? 'respuesta' : 'respuestas'}</span>
              </div>
              <div className="relative mb-4">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-content-3 text-xs pointer-events-none" aria-hidden="true"></i>
                <input
                  type="search"
                  value={busquedaFaq}
                  onChange={(e) => setBusquedaFaq(e.target.value)}
                  placeholder="Ej.: buscar una firma pendiente"
                  aria-label="Buscar en las preguntas frecuentes"
                  className="w-full rounded-control border border-line bg-surface-1 py-3 pl-10 pr-4 text-body font-medium text-content-1 placeholder:text-content-3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 motion"
                />
              </div>
              {faqsFiltradas.length === 0 && (
                <div className="mb-4 rounded-card border border-dashed border-line-strong bg-surface-2/60 px-5 py-8 text-center">
                  <i className="fa-solid fa-magnifying-glass mb-2 text-content-3" aria-hidden="true"></i>
                  <p className="text-body font-bold text-content-1">No encontramos una respuesta</p>
                  <p className="mt-1 text-body text-content-3">Prueba con otra palabra o escribe a patrimonio@unp.edu.py.</p>
                </div>
              )}
              <div className="space-y-2.5">
                {faqsFiltradas.map(f => <FaqItem key={f.question} question={f.question} answer={f.answer} categoria={f.category} />)}
              </div>
            </>
          )}
          {seccionActiva === 'procedimiento' && (
            <>
              <h2 className="text-title font-bold leading-6 text-content-1 flex items-center gap-2 mb-4">
                <i className="fa-solid fa-network-wired text-brand-text" aria-hidden="true"></i> Flujo de trabajo
              </h2>
              <p className="mb-4 text-body text-content-3">Consulta qué registro corresponde a cada movimiento del bien.</p>
              <div className={`${STYLES.card} p-6 sm:p-8 relative overflow-hidden flex-1`}>
                <div className="absolute left-[56px] top-12 bottom-12 w-0.5 bg-surface-3 dark:bg-surface-3 hidden sm:block z-0"></div>
                <div className="space-y-2 relative z-10">
                  <WorkflowStep number="1" title="Registrar un alta · FC-04" description="Incorpora el bien al inventario y completa los datos de identificación, adquisición y ubicación." icon="fa-arrow-trend-up" color="bg-brand" />
                  <WorkflowStep number="2" title="Asignar responsable · FC-10" description="Registra a quién se entrega el bien y da seguimiento a las firmas del acta." icon="fa-file-signature" color="bg-brand" />
                  <WorkflowStep number="3" title="Registrar un traslado · FC-11" description="Documenta el movimiento del bien entre dependencias y revisa los datos de origen y destino." icon="fa-truck-fast" color="bg-info" />
                  <WorkflowStep number="4" title="Solicitar una baja · FC-04" description="Inicia la baja desde el registro y completa los datos y documentos que solicite el flujo." icon="fa-box-archive" color="bg-danger" />
                </div>
              </div>
            </>
          )}
          {seccionActiva === 'atajos' && (
            <>
              <h2 className="text-title font-bold leading-6 text-content-1 flex items-center gap-2 mb-4">
                <i className="fa-solid fa-keyboard text-brand-text" aria-hidden="true"></i> Atajos de teclado
              </h2>
              <p className="mb-4 text-body text-content-3">Acciones rápidas para moverte por el sistema.</p>
              <div className={`${STYLES.card} p-6 sm:p-8 flex-1`}>
                <div className="space-y-3">
                  {SHORTCUTS.map(s => (
                    <div key={s.accion} className="flex items-center justify-between gap-4 py-2 border-b border-line dark:border-line/60 last:border-0">
                      <span className="text-[13px] font-medium text-content-1 dark:text-content-3">{s.accion}</span>
                      <span className="flex gap-1 shrink-0">
                        {s.teclas.map(k => (
                          <kbd key={k} className="inline-flex items-center rounded-lg border border-line dark:border-line bg-surface-2 dark:bg-surface-2 px-2 py-1 text-[11px] font-black text-content-2 dark:text-content-3">{k}</kbd>
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Columna derecha: contacto y recursos rápidos */}
        <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-5">
          <div className={`${STYLES.card} p-5 sm:p-6 w-full`}>
            <h3 className="text-base font-bold text-content-1 dark:text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-envelope text-brand-text"></i> Contacto y Soporte
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-blue-50 dark:bg-blue-900/20 text-brand dark:text-blue-400">
                  <i className="fa-solid fa-envelope text-sm"></i>
                </div>
                <div>
                  <p className="font-bold text-content-1 dark:text-white">Soporte patrimonial</p>
                  <a href="mailto:patrimonio@unp.edu.py" className="text-body text-brand-text hover:underline dark:text-brand">patrimonio@unp.edu.py</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-ok-soft dark:bg-emerald-900/20 text-ok dark:text-emerald-400">
                  <i className="fa-solid fa-building text-sm"></i>
                </div>
                <div>
                  <p className="font-bold text-content-1 dark:text-white">Departamento de Bienes Patrimoniales</p>
                  <p className="text-xs text-content-3 dark:text-content-3">Universidad Nacional de Pilar</p>
                </div>
              </div>
              <div className="pt-4 border-t border-line dark:border-line/60">
                <p className="text-[10px] font-bold uppercase tracking-wider text-content-3 mb-2">Versión del sistema</p>
                <p className="text-body text-content-2">v{version} · Universidad Nacional de Pilar</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
