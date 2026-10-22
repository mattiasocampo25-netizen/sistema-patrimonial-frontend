import React from 'react';
import { aniosDisponibles } from '../utils/filtros';
import FiltroCombo from './FiltroCombo';

const MESES = [
  { val: '01', name: 'Enero' }, { val: '02', name: 'Febrero' }, { val: '03', name: 'Marzo' },
  { val: '04', name: 'Abril' }, { val: '05', name: 'Mayo' }, { val: '06', name: 'Junio' },
  { val: '07', name: 'Julio' }, { val: '08', name: 'Agosto' }, { val: '09', name: 'Septiembre' },
  { val: '10', name: 'Octubre' }, { val: '11', name: 'Noviembre' }, { val: '12', name: 'Diciembre' }
];

// Años disponibles: 5 años hacia atrás (histórico) y 1 hacia adelante
// (presupuesto del año siguiente). Antes la lista estaba fija en 2024-2030, así
// que en 2027 ya no se podían filtrar periodos viejos ni el siguiente.

/**
 * Selector de periodo (Año y Mes) para las cabeceras de FC-04 / FC-10 / FC-11.
 * Usa FiltroCombo en vez de <select> nativo: el popup del navegador se dibuja
 * con los colores del sistema y quedaba ilegible sobre la app oscura.
 */
export function PeriodSelector({ selectedYear, setSelectedYear, selectedMonth, setSelectedMonth, descripcion = 'Filtrar por mes y año' }) {
  const nombreMes = MESES.find(m => m.val === String(selectedMonth))?.name || 'Seleccionar mes';
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-card border border-line bg-surface-2/70 px-3 py-2.5" role="group" aria-label={descripcion}>
      <div className="min-w-[116px] pb-0.5">
        <span className="block text-[9px] font-bold uppercase tracking-widest text-content-3">Periodo</span>
        <span className="block text-xs font-bold text-content-1">{nombreMes} {selectedYear}</span>
      </div>
      <div className="flex items-end gap-2">
        <div className="w-[122px]">
          <span className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-content-3">Mes</span>
          <FiltroCombo
            compacto
            valor={selectedMonth}
            opciones={MESES.map(m => ({ label: m.name, value: m.val }))}
            onElegir={setSelectedMonth}
            etiquetaTodos="Mes"
            titulo="Elegir mes del periodo"
          />
        </div>
        <div className="w-[96px]">
          <span className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-content-3">Año</span>
          <FiltroCombo
            compacto
            valor={selectedYear}
            opciones={aniosDisponibles()}
            onElegir={setSelectedYear}
            etiquetaTodos="Año"
            titulo="Elegir año del periodo"
          />
        </div>
      </div>
    </div>
  );
}
