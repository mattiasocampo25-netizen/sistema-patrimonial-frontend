import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

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
      const { data, error: err } = await supabase.rpc('resumen_por_dependencia');
      if (err) throw err;
      setResumen(Array.isArray(data) ? data : []);
      setError(null);
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
