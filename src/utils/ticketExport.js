import {
  formatExhibitionOnTicket,
  formatSlotOnTicket,
} from './eventDates.js';

function pad(n) {
  return String(n).padStart(2, '0');
}

function formatIcsDate(d) {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function escapeIcs(text) {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function buildTicketCalendarIcs(ticket) {
  const startRaw = ticket.slot?.slot_date || ticket.event.date_debut;
  const endRaw = ticket.slot?.slot_date || ticket.event.date_fin || ticket.event.date_debut;
  const start = startRaw ? new Date(startRaw) : new Date();
  const end = endRaw ? new Date(endRaw) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
  if (end <= start) {
    end.setTime(start.getTime() + 2 * 60 * 60 * 1000);
  }

  const location = ticket.event.adresse || ticket.event.lieu || '';
  const title = ticket.event.titre || 'Événement';
  const guest = `${ticket.guest.first_name} ${ticket.guest.last_name}`.trim();
  const party = ticket.party_size > 1 ? ` (${ticket.party_size} personnes)` : '';
  const desc = [
    `Billet ${ticket.ticket_code}`,
    guest ? `Nom : ${guest}${party}` : '',
    ticket.slot?.label ? `Créneau : ${ticket.slot.label}` : '',
    'Présentez le QR code à l’entrée.',
  ]
    .filter(Boolean)
    .join('\\n');

  const uid = `${ticket.ticket_code}@peintreab`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PeintreAB//Billet//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${escapeIcs(title)}`,
    location ? `LOCATION:${escapeIcs(location)}` : '',
    `DESCRIPTION:${escapeIcs(desc)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return lines.join('\r\n');
}

export function downloadTextFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadTicketIcs(ticket) {
  const ics = buildTicketCalendarIcs(ticket);
  const slug = (ticket.event.titre || 'evenement').replace(/[^\w\-]+/gi, '-').slice(0, 40);
  downloadTextFile(`billet-${slug}.ics`, ics, 'text/calendar;charset=utf-8');
}

export function openMapsForTicket(ticket) {
  const query = ticket.event.adresse || ticket.event.lieu;
  if (!query) return false;
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

export function ticketQrDataUrlFromTicket(ticket) {
  return ticket?.qr_data_url || ticket?.tickets?.[0]?.qr_data_url || null;
}

function isAppleMobile() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/i.test(ua)) return true;
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

/** data: URL → Blob sans fetch (requis pour iOS : garder le geste utilisateur). */
export function dataUrlToBlob(dataUrl) {
  const [header, data] = String(dataUrl).split(',');
  if (!data) throw new Error('QR invalide');
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

async function qrDataUrlToBlob(qrDataUrl) {
  if (qrDataUrl.startsWith('data:')) {
    return dataUrlToBlob(qrDataUrl);
  }
  const res = await fetch(qrDataUrl);
  return res.blob();
}

function copyTextFallback(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(ta);
  return ok;
}

/**
 * Enregistrer le QR (PNG). iOS : menu Partager → Enregistrer dans Photos, ou ouverture pour appui long.
 */
export async function saveTicketQrImage(qrDataUrl, filename = 'billet-qr.png') {
  if (!qrDataUrl) return { ok: false, reason: 'missing' };

  const safeName = filename.endsWith('.png') ? filename : `${filename}.png`;
  let blob;
  try {
    blob = await qrDataUrlToBlob(qrDataUrl);
  } catch {
    return { ok: false, reason: 'decode' };
  }

  const file = new File([blob], safeName.replace(/[^\w.-]+/gi, '_'), {
    type: blob.type || 'image/png',
  });

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      const canFiles = !navigator.canShare || navigator.canShare({ files: [file] });
      if (canFiles) {
        await navigator.share(
          isAppleMobile()
            ? { files: [file], title: 'QR code — billet' }
            : {
                title: 'QR code — billet',
                text: 'Enregistrez le QR code dans vos photos.',
                files: [file],
              }
        );
        return {
          ok: true,
          method: 'share',
          hint: 'Choisissez « Enregistrer l’image » ou « Photos » dans le menu.',
        };
      }
    } catch (err) {
      if (err?.name === 'AbortError') return { ok: false, cancelled: true };
    }
  }

  const objectUrl = URL.createObjectURL(blob);

  if (isAppleMobile()) {
    const opened = window.open(objectUrl, '_blank', 'noopener,noreferrer');
    if (opened) {
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 120_000);
      return {
        ok: true,
        method: 'open',
        hint: 'Maintenez appuyé sur le QR code → « Enregistrer l’image ».',
      };
    }
  }

  try {
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = safeName;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
    return { ok: true, method: 'download' };
  } catch {
    URL.revokeObjectURL(objectUrl);
    return { ok: false, reason: 'download' };
  }
}

async function loadJsPDF() {
  const { default: jsPDF } = await import('jspdf');
  return jsPDF;
}

function pdfLines(pdf, text, maxWidth) {
  return pdf.splitTextToSize(text, maxWidth);
}

function drawInvitationPage(pdf, { event, slot, guest, pass, ticketIndex, ticketsTotal }) {
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;

  pdf.setFillColor(247, 242, 234);
  pdf.rect(0, 0, pageW, pageH, 'F');

  pdf.setFillColor(31, 27, 23);
  pdf.rect(0, 0, pageW, 52, 'F');

  pdf.setTextColor(198, 172, 143);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('ALEXANDRE BINDL', pageW / 2, 16, { align: 'center' });

  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  const inviteLabel =
    ticketsTotal > 1 ? `Invitation — billet ${ticketIndex} / ${ticketsTotal}` : 'Invitation';
  pdf.text(inviteLabel, pageW / 2, 28, { align: 'center' });

  pdf.setFont('times', 'italic');
  pdf.setFontSize(22);
  const titleLines = pdfLines(pdf, event.titre || 'Événement', contentW - 10);
  pdf.text(titleLines, pageW / 2, 42, { align: 'center' });

  let y = 68;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 55, 50);
  pdf.setFontSize(11);
  pdf.text('Madame, Monsieur,', margin, y);
  y += 10;

  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${guest.first_name} ${guest.last_name}`, margin, y);
  y += 12;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(80, 75, 70);
  pdf.text('Nous avons le plaisir de vous confirmer votre participation.', margin, y);
  y += 14;

  const exhibition = formatExhibitionOnTicket(event.date_debut, event.date_fin);
  const visitSlot = formatSlotOnTicket(slot);

  pdf.setDrawColor(198, 172, 143);
  pdf.setLineWidth(0.3);
  pdf.line(margin, y, pageW - margin, y);
  y += 10;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(138, 112, 72);
  if (visitSlot?.dayLine) {
    pdf.text('VOTRE VISITE', margin, y);
    y += 7;
    pdf.setFont('times', 'normal');
    pdf.setFontSize(14);
    pdf.setTextColor(26, 21, 18);
    pdf.text(visitSlot.dayLine, margin, y);
    y += 8;
    if (visitSlot.title) {
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(11);
      pdf.setTextColor(92, 86, 80);
      pdf.text(visitSlot.title, margin, y);
      y += 10;
    }
  }

  if (exhibition) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(138, 112, 72);
    pdf.text('EXPOSITION', margin, y);
    y += 7;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(26, 21, 18);
    pdf.text(exhibition.range, margin, y);
    y += 7;
    pdf.setFontSize(10);
    pdf.setTextColor(107, 86, 56);
    pdf.text(exhibition.duration, margin, y);
    y += 12;
  }

  const lieu = event.lieu || event.adresse;
  if (lieu) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(138, 112, 72);
    pdf.text('LIEU', margin, y);
    y += 7;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(26, 21, 18);
    const lieuLines = pdfLines(pdf, lieu, contentW);
    pdf.text(lieuLines, margin, y);
    y += lieuLines.length * 5 + 8;
  }

  const qrSize = Math.min(78, contentW * 0.45);
  const qrX = (pageW - qrSize) / 2;
  const qrY = Math.max(y + 4, pageH - qrSize - 42);

  if (pass.qr_data_url) {
    pdf.addImage(pass.qr_data_url, 'PNG', qrX, qrY, qrSize, qrSize);
  }

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(111, 106, 100);
  const code = pass.ticket_code?.slice(0, 8).toUpperCase();
  pdf.text(`Réf. ${code}`, pageW / 2, qrY + qrSize + 8, { align: 'center' });
  pdf.setFontSize(8);
  pdf.text('Présentez ce QR code à l’entrée.', pageW / 2, qrY + qrSize + 14, { align: 'center' });
}

/** PDF invitation pleine page A4 (une page par QR si plusieurs billets). */
export async function downloadInvitationPdf({ ticket, passes, filename }) {
  const jsPDF = await loadJsPDF();
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const list = passes?.length ? passes : [
    {
      ticket_code: ticket.ticket_code,
      qr_data_url: ticket.qr_data_url,
    },
  ];
  const total = list.length;

  list.forEach((pass, i) => {
    if (i > 0) pdf.addPage();
    drawInvitationPage(pdf, {
      event: ticket.event,
      slot: ticket.slot,
      guest: ticket.guest,
      pass,
      ticketIndex: ticket.tickets?.[i]?.ticket_index ?? i + 1,
      ticketsTotal: total,
    });
  });

  pdf.save(filename);
}

export async function shareTicket(ticket, ticketUrl) {
  const title = ticket.event?.titre || 'Mon billet';
  const guest = ticket.guest || {};
  const text =
    `Billet pour ${title} — ${guest.first_name || ''} ${guest.last_name || ''}`.trim();
  const qrDataUrl = ticketQrDataUrlFromTicket(ticket);

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      if (qrDataUrl?.startsWith('data:')) {
        const blob = dataUrlToBlob(qrDataUrl);
        const file = new File([blob], 'billet-qr.png', { type: 'image/png' });
        const canFiles = !navigator.canShare || navigator.canShare({ files: [file] });
        if (canFiles) {
          try {
            await navigator.share(
              isAppleMobile() ? { files: [file], title, text } : { title, text, url: ticketUrl, files: [file] }
            );
            return 'shared';
          } catch (fileErr) {
            if (fileErr?.name === 'AbortError') return 'cancelled';
          }
        }
      }
      await navigator.share({ title, text, url: ticketUrl });
      return 'shared';
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled';
    }
  }

  const payload = `${text}\n${ticketUrl}`;
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(payload);
      return 'clipboard';
    } catch {
      /* iOS sans permission clipboard */
    }
  }
  if (copyTextFallback(payload)) return 'clipboard';
  return false;
}
