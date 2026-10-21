// ============================================================================
// BARRA DE KIOSCO PARA LA VISTA PÚBLICA DE QR
// ============================================================================
// Complemento de la vista pública (?id=...): pantalla completa, temporizador de
// inactividad y botón "Escanear otro QR". Se renderiza solo en el kiosk (URL con
// kiosk=1) para no ensuciar la consulta normal con controles de exhibition.
//
// Decisión: el temporizador NO hace logout ni borra nada; solo redirige a la
// pantalla principal cuando la pantalla quedó sin tocar, que es el comportamiento
// deseado en un punto de atención unattended.
import React, { useCallback, useEffect, useRef, useState } from 'react';

// Segundos de inactividad antes de volver al inicio. Configurable por ?kioskIdle=N

export default function KioskBar({ idleSegundos = 45, onSalir, onEscanearOtro }) {
  const [visible, setVisible] = useState(true);
  //Segundos restantes; se recalcula en cada tick a partir de un deadline para
  // que un tab en segundo plano nouela el temporizador.
  const [restantes, setRestantes] = useState(idleSegundos);
  const deadline = useRef(Date.now() + idleSegundos * 1000);
  const timerRef = useRef(null);

  // Con useCallback: si no, seria una funcion nueva en cada render y los
  // oyentes se volverian a suscribir en cada tick.
  const reiniciar = useCallback(() => {
    deadline.current = Date.now() + idleSegundos * 1000;
    setRestantes(idleSegundos);
    setVisible(true);
  }, [idleSegundos]);

  // Contador regresivo.
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const seg = Math.max(0, Math.round((deadline.current - Date.now()) / 1000));
      setRestantes(seg);
      if (seg === 0) {
        clearInterval(timerRef.current);
        if (onSalir) onSalir();
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [idleSegundos, onSalir]);

  // Reinicia con cualquier interacción humana.
  useEffect(() => {
    const eventos = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
  // `reiniciar` cambia en cada tick (es el que reinicia el temporizador): si
  // fuera dependencia, los oyentes se volverian a suscribir en cada tick.
    eventos.forEach(e => window.addEventListener(e, reiniciar, { passive: true }));
    return () => eventos.forEach(e => window.removeEventListener(e, reiniciar));
  }, [idleSegundos, reiniciar]);

  // Barra oculta durante los últimos 8 s para no distraer al lector.
  useEffect(() => { setVisible(restantes > 8 || restantes === idleSegundos); }, [restantes, idleSegundos]);

  const pct = Math.max(0, Math.min(100, (restantes / idleSegundos) * 100));

  return (
    <>
      {/* Indicador de inactividad */}
      <div className="fixed top-0 inset-x-0 h-1 z-[700] bg-black/15 dark:bg-white/20">
        <div
          className="h-full bg-brand transition-[width] duration-[var(--dur-slow)] ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Barra de controles */}
      <div
        className={`fixed bottom-0 inset-x-0 z-[700] flex items-center justify-between gap-2 px-4 py-3 bg-black/85 backdrop-blur-md text-white transition-transform duration-[var(--dur-base)] ${visible ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <span className="text-[11px] font-bold tabular-nums opacity-80">
          <i className="fa-regular fa-clock mr-1.5"></i>
          Vuelve al inicio en {restantes}s
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onEscanearOtro}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-control bg-brand hover:bg-blue-500 text-content-inverse text-xs font-bold motion active:scale-95 cursor-pointer"
          >
            <i className="fa-solid fa-qrcode text-[11px]"></i> Escanear otro QR
          </button>
          <button
            onClick={onSalir}
            title="Salir del modo kiosco"
            className="flex h-9 w-9 items-center justify-center rounded-control bg-surface-1/10 hover:bg-surface-1/20 text-white motion cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>
      </div>
    </>
  );
}

// Botón para activar pantalla completa desde la vista pública normal.
export function BotonPantallaCompleta({ onCambio }) {
  const [activo, setActivo] = useState(false);
  useEffect(() => {
    const alCambiar = () => { setActivo(Boolean(document.fullscreenElement)); if (onCambio) onCambio(Boolean(document.fullscreenElement)); };
    document.addEventListener('fullscreenchange', alCambiar);
    return () => document.removeEventListener('fullscreenchange', alCambiar);
  }, [onCambio]);

  const toggle = () => {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    } catch { /* el navegador puede rechazarlo (permisos); no es crítico */ }
  };

  return (
    <button
      onClick={toggle}
      title={activo ? 'Salir de pantalla completa' : 'Pantalla completa'}
      className="inline-flex items-center gap-2 h-9 px-3 rounded-control border border-line bg-surface-1 text-content-2 text-[11px] font-bold hover:bg-surface-2 active:scale-95 motion cursor-pointer"
    >
      <i className={`fa-solid ${activo ? 'fa-compress' : 'fa-expand'} text-[10px]`}></i>
      <span className="hidden sm:inline">{activo ? 'Reducir' : 'Pantalla completa'}</span>
    </button>
  );
}