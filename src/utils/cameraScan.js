import { Html5Qrcode } from 'html5-qrcode';

/** @returns {string} */
export function cameraScanErrorMessage(err) {
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    return 'La caméra nécessite une connexion sécurisée (HTTPS). Sur cet hébergement, utilisez https:// ou la saisie manuelle du code.';
  }

  const name = err?.name || '';
  const msg = String(err?.message || '');

  if (
    name === 'NotAllowedError' ||
    /not allowed|permission denied|permission/i.test(msg)
  ) {
    return 'Accès caméra refusé — autorisez la caméra dans les réglages du navigateur, ou saisissez le code manuellement.';
  }
  if (name === 'NotFoundError' || msg === 'NO_CAMERA' || /not found|no camera/i.test(msg)) {
    return 'Aucune caméra détectée. Branchez une webcam ou saisissez le code UUID à la main.';
  }
  if (name === 'NotReadableError' || /not readable|in use/i.test(msg)) {
    return 'La caméra est occupée par une autre application. Fermez-la ou utilisez la saisie manuelle.';
  }

  const short = msg.length > 120 ? `${msg.slice(0, 117)}…` : msg;
  return short
    ? `Impossible d’ouvrir la caméra (${short}). Essayez la saisie manuelle.`
    : 'Impossible d’ouvrir la caméra sur cet appareil. Essayez la saisie manuelle.';
}

/** Configurations à essayer pour html5-qrcode .start() */
export async function buildCameraStartAttempts() {
  const attempts = [];

  try {
    const cameras = await Html5Qrcode.getCameras();
    if (cameras?.length) {
      const back = cameras.find((c) =>
        /back|rear|environment|arrière|wide|world/i.test(c.label || '')
      );
      const pick = back || cameras[cameras.length - 1] || cameras[0];
      if (pick?.id) {
        attempts.push(pick.id);
      }
      cameras.forEach((c) => {
        if (c.id && c.id !== pick?.id) attempts.push(c.id);
      });
    }
  } catch {
    /* getCameras peut échouer — on tente facingMode */
  }

  attempts.push({ facingMode: 'environment' });
  attempts.push({ facingMode: 'user' });

  const seen = new Set();
  return attempts.filter((a) => {
    const key = typeof a === 'string' ? a : JSON.stringify(a);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function qrBoxForViewfinder(viewfinderWidth, viewfinderHeight) {
  const w = Math.max(1, viewfinderWidth);
  const h = Math.max(1, viewfinderHeight);
  const size = Math.floor(Math.min(w, h) * 0.72);
  return { width: Math.max(180, size), height: Math.max(180, size) };
}
