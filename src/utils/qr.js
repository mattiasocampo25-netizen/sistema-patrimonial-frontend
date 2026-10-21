// Extracción del código de bien desde un QR escaneado (extraído de App.jsx).
// Acepta URL con ?id= / ?bienId=, formato "CTA:...DIGO:..." o código directo.

export const extraerCodigoQR = (decodedText) => {
  let targetId = String(decodedText || '').trim();
  if (targetId.startsWith('http://') || targetId.startsWith('https://')) {
    try {
      const parsedUrl = new URL(targetId);
      targetId = parsedUrl.searchParams.get('id') || parsedUrl.searchParams.get('bienId') || targetId;
    } catch {}
  } else if (/CTA:|DIGO:/i.test(targetId)) {
    // Etiquetas físicas del tipo "CTA:UNP SIGEP DIGO:1045": el código del bien
    // va DESPUÉS del último "DIGO:".
    //
    // Antes se tomaba la parte IZQUIERDA del primer "CTA:" (split('CTA:')[0]),
    // que para ese formato siempre es cadena vacía, y luego se aplicaba el
    // replace sobre ella: el resultado era "" y el código escaneado se perdía.
    const conDigo = targetId.match(/DIGO:\s*([^:;,\s]+)/i);
    if (conDigo) {
      targetId = conDigo[1];
    } else {
      // Solo hay "CTA:" (o "DIGO:" sin valor detrás): se toma lo que sigue al
      // último "CTA:", descartando un "DIGO:" final y la puntuación sobrante.
      targetId = targetId
        .split('CTA:')
        .pop()
        .replace(/\bDIGO\b.*$/i, '')
        .replace(/[:;,\s]+$/, '')
        .trim();
    }
  }
  return targetId;
};
