// Utilidades del modo kiosco.
//
// Vive fuera del componente para que KioskBar.jsx solo exporte componentes:
// si un archivo exporta tambien funciones, el fast refresh de Vite deja de
// funcionar en desarrollo.
export const parseIdleSegundos = (search) => {
  try {
    const n = parseInt(new URLSearchParams(search).get('kioskIdle') || '45', 10);
    return Number.isFinite(n) && n > 5 && n <= 3600 ? n : 45;
  } catch { return 45; }
};
