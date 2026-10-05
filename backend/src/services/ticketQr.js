import QRCode from 'qrcode';

const defaultQrOptions = {
  errorCorrectionLevel: 'M',
  margin: 1,
  width: 280,
};

/** QR en data URL (email HTML uniquement — jamais écrit sur disque). */
export async function ticketQrDataUrl(ticketCode, frontendBase) {
  const base = (frontendBase || process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  const url = `${base}/billet/${ticketCode}`;
  return QRCode.toDataURL(url, defaultQrOptions);
}

/** QR code pour une URL absolue (site vitrine, etc.). */
export async function urlQrDataUrl(targetUrl, width = 320) {
  const url = String(targetUrl || '').trim();
  if (!url) throw new Error('URL requise');
  return QRCode.toDataURL(url, { ...defaultQrOptions, width });
}
