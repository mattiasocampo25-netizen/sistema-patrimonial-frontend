import React from 'react';

/**
 * ProgressRing — anillo de progreso circular.
 *
 * Es el elemento que mas pesa visualmente en la referencia: un circulo con
 * el porcentaje al centro y el trazo coloreado en proportion al valor.
 *
 * Se hace con SVG y `stroke-dasharray`, sin libreria: el radio y el grosor
 * son las unicas variables y no hace falta animar nada mas alla del
 * `transition` del trazo.
 */
export default function ProgressRing({
  valor = 0,
  tamano = 46,
  grosor = 4,
  color = 'var(--brand)',
  pista = 'var(--surface-3)',
  className = '',
  etiqueta
}) {
  const pct = Math.max(0, Math.min(100, Number(valor) || 0));
  const radio = (tamano - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const trazado = (pct / 100) * circunferencia;

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: tamano, height: tamano }}
      role="img"
      aria-label={etiqueta || `${Math.round(pct)}%`}
    >
      <svg width={tamano} height={tamano} viewBox={`0 0 ${tamano} ${tamano}`} className="-rotate-90">
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={radio}
          fill="none"
          stroke={pista}
          strokeWidth={grosor}
        />
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={radio}
          fill="none"
          stroke={color}
          strokeWidth={grosor}
          strokeLinecap="round"
          strokeDasharray={`${trazado} ${circunferencia}`}
          className="transition-[stroke-dasharray] duration-[var(--dur-slow)] ease-[var(--ease-out)]"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums text-content-1"
        aria-hidden="true"
      >
        {Math.round(pct)}%
      </span>
    </div>
  );
}
