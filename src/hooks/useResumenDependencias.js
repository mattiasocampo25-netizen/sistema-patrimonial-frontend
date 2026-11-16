import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { normalizeStr } from '../utils/helpers';

/**
 * useResumenDependencias — resumen por dependencia para los tiles del panel.
 *
 * Va al servidor (RPC `resumen_por_dependencia`) y no a una consulta de
 * `bens`: para sacar ocho numeros haria falta traer las 13.673 filas al
 * navegador, que es justo lo que se quiere evitar (egress y row budget del
 * plan gratuito de Supabase).
 *
 * El RPC ya aplica el criterio de visibilidad: un funcionario recibe solo su
 * dependencia y los roles privilegiados, todas.
 */
export function useResumenDependencias() {
  const [resumen, setResumen] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [resumenBase, resumenAsignaciones] = await Promise.all([
        supabase.rpc('resumen_por_dependencia'),
        supabase.rpc('resumen_asignaciones_por_dependencia')
      ]);
      const { data, error: err } = resumenBase;
      if (err) throw err;
      const asignados = new Map((resumenAsignaciones.data || []).map(fila => [normalizeStr(fila.dependencia), Number(fila.asignados) || 0]));
      setResumen((Array.isArray(data) ? data : []).map(fila => ({
        ...fila,
        asignados: resumenAsignaciones.error ? null : (asignados.get(normalizeStr(fila.dependencia)) || 0)
      })));
      setError(resumenAsignaciones.error || null);
    } catch (e) {
      setError(e);
      setResumen([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { resumen, cargando, error, recargar: cargar };
}

export default useResumenDependencias;
