// ============================================================================
// AJUSTES PARA EL PLAN FREE DE SUPABASE
// ============================================================================
// El plan free tiene limites que pesan sobre el uso real del sistema:
//
//   - 500 MB de base de datos
//   - 5 GB de egress sin caché y 5 GB de egress en caché por organización
//   - 1 GB de Storage por organización
//   - 2 millones de mensajes Realtime y 200 conexiones máximas
//   - Hasta 50.000 usuarios activos al mes
//
// Este modulo concentra las decisiones que las respetan. Todo lo que sigue
// asume que el sistema corre sobre el free tier, no sobre un plan pagos.
//
// ============================================================================

/** Egress: bytes que Supabase puede descargar desde la region del proyecto. */
export const LIMITE_EGRESS_MES = 5 * 1024 * 1024 * 1024; // 5 GB sin caché
export const LIMITE_EGRESS_CACHE_MES = 5 * 1024 * 1024 * 1024; // 5 GB en caché
export const LIMITE_MENSAJES_REALTIME_MES = 2_000_000;
export const LIMITE_CONEXIONES_REALTIME = 200;
export const LIMITE_USUARIOS_ACTIVOS_MES = 50_000;
/** Espacio de base de datos. */
export const LIMITE_DB = 500 * 1024 * 1024; // 500 MB
/** Storage de archivos. */
export const LIMITE_STORAGE = 1 * 1024 * 1024 * 1024; // 1 GB

/**
 * Trafico que genera una carga completa del inventario.
 * El sistema usa sync delta (solo filas con updated_at nuevo), pero cada 24 h
 * hace una recarga total. Este numero sirve para decidir cada cuanto.
 *
 * Medido en el sistema real: ~1800 bienes por dependencia, ~2 KB por fila.
 */
export const BYTES_POR_FILA_BIEN = 2 * 1024;
export const BIENES_POR_DEPENDENCIA = 1800;

/** Bytes de una recarga total. */
export const bytesRecargaTotal = (bienes = BIENES_POR_DEPENDENCIA) => bienes * BYTES_POR_FILA_BIEN;

/** Cuantas recargas completas aguantamos en el mes con el egress disponible. */
export const recargasPorMes = () => Math.floor(LIMITE_EGRESS_MES / bytesRecargaTotal());

// ---------------------------------------------------------------------------
// 1. Periodicidad de la recarga total
// ---------------------------------------------------------------------------
// El syncBienes.js ya hace delta cada 24 h. En free, 30 recargas completas por
// mes (~55 MB) es un presupuesto cómodo. Bajar a 7 días lo deja en ~8
// recargas/mes (~28 MB) y libera margen para fotos y consultas.
// ---------------------------------------------------------------------------
export const INTERVALO_RESYNC_MS = 24 * 60 * 60 * 1000; // 24 h (el valor actual)

// ---------------------------------------------------------------------------
// 2. Compresión de imágenes antes de subirlas
// ---------------------------------------------------------------------------
// Storage del plan free es 1 GB y cada foto cuenta. comprimirImagen() en helpers
// ya recorta a 1024 px y ~120 KB. Se limitan las fotos por bien para dejar margen
// al resto de archivos: tres fotos de ese tamaño son ~360 KB por bien.
// Con 1800 bienes, el tope teórico es ~650 MB solo en fotos.
// ---------------------------------------------------------------------------
export const MAX_FOTOS_POR_BIEN = 3;
export const KB_POR_FOTO = 120;

// ---------------------------------------------------------------------------
// 3. Consulta de auditoría acotada
// ---------------------------------------------------------------------------
// La auditoría crece sin límite: cada firma, cambio o borrado escribe una fila.
// Es la tabla que más crece y la que solo el admin lee. En free conviene
// traer solo una ventana reciente, no todo el historial.
// ---------------------------------------------------------------------------
export const AUDITORIA_WINDOW_DIAS = 180;
export const AUDITORIA_MAX_FILAS = 1000;

// ---------------------------------------------------------------------------
// 4. Realtime: qué merece suscripción y qué no
// ---------------------------------------------------------------------------
// El realtime del free cobra por conexiones y mensajes. La estrategia:
//
//   - bens: SI se suscribe. Es la tabla que cambia entre equipos y el Savings
//     es lo que hace útil la app en campo. Como el delta ya cubre el resto,
//     llega muy poco por este canal.
//   - notificaciones: se reemplazan por sondeo para ahorrar conexiones.
//
// Los canales se abren solo con la sesión iniciada y se cierran al salir
// (ver el return del useEffect), así que no quedan conexiones colgando.
// ---------------------------------------------------------------------------
export const REALTIME_BENS_ACTIVO = true;
export const REALTIME_NOTIF_ACTIVO = false; // el sondeo ya cubre el caso

// La cadencia limita llamadas innecesarias y evita sondear en segundo plano.
export const POLL_NOTIFICACIONES_MS = 180000; // 3 minutos
export const POLL_NOTIF_ROWS = 25;

// ---------------------------------------------------------------------------
// 5. Consulta de bienes: solo columnas necesarias
// ---------------------------------------------------------------------------
// Traer '*' en una tabla con JSONB puede duplicar el ancho de banda si se
// seleccionan columnas anidadas. El select explicito de id, data, updated_at
// ya es lo que usa syncBienes para el delta.

/** Uso real del disco de Postgres y Storage, medido en una RPC administrativa. */
export const estimarUsoDB = async (supabase) => {
  const { data, error } = await supabase.rpc('admin_obtener_uso_recursos');
  if (error) throw error;
  if (!data || !Number.isFinite(Number(data.dbBytes))) throw new Error('La RPC no devolvió el tamaño de la base.');
  const bytesEstimados = Number(data.dbBytes);
  const storageBytes = Number(data.storageBytes) || 0;
  return {
    bytesEstimados,
    storageBytes,
    objetosStorage: Number(data.storageObjetos) || 0,
    pctUso: (bytesEstimados / LIMITE_DB) * 100,
    pctStorage: (storageBytes / LIMITE_STORAGE) * 100,
    medidoEn: data.medidoEn || null
  };
};

/** Aviso si el uso se acerca al limite del free. */
export const alertaUso = ({ pctUso, pctStorage = 0 }) => {
  const maximo = Math.max(pctUso || 0, pctStorage || 0);
  if (maximo >= 95) return { nivel: 'critico', texto: 'El almacenamiento está casi lleno. Revisa la base y las fotos antes de continuar.' };
  if (maximo >= 80) return { nivel: 'aviso', texto: 'El almacenamiento está por encima del 80% de la cuota gratuita.' };
  return null;
};
