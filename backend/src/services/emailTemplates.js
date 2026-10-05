/** Templates HTML email — charte Alexandre Bindl (inline styles, clients mail). */

const BRAND = {
  primary: '#c6ac8f',
  primaryDark: '#8a7048',
  ink: '#1a1512',
  muted: '#6f6a64',
  cream: '#f7f2ea',
  paper: '#fffcf7',
  dark: '#1f1b17',
  border: 'rgba(138, 112, 72, 0.28)',
};

export const escapeHtml = (value) => {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

export const nl2br = (text) => escapeHtml(text).replace(/\n/g, '<br />');

const siteUrl = () => (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

/**
 * Enveloppe commune : bandeau sombre, corps crème, pied de page discret.
 */
export const wrapEmailLayout = ({
  preheader = '',
  eyebrow = 'Alexandre Bindl',
  headline,
  bodyHtml,
  footerNote = '',
  cta,
}) => {
  const pre = escapeHtml(preheader);
  const head = headline ? `<h1 style="margin:0 0 0.5rem;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;font-style:italic;line-height:1.25;color:${BRAND.ink};">${headline}</h1>` : '';

  const ctaBlock = cta?.href
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px auto 8px;">
        <tr>
          <td align="center" style="border-radius:8px;background:${BRAND.primary};">
            <a href="${escapeHtml(cta.href)}" target="_blank" rel="noopener"
               style="display:inline-block;padding:14px 28px;font-family:Georgia,serif;font-size:15px;font-weight:500;letter-spacing:0.04em;color:#ffffff;text-decoration:none;">
              ${escapeHtml(cta.label || 'Ouvrir')}
            </a>
          </td>
        </tr>
      </table>`
    : '';

  const foot = footerNote
    ? `<p style="margin:24px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:${BRAND.muted};text-align:center;">${footerNote}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${escapeHtml(headline || eyebrow)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.cream};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${pre}&nbsp;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.cream};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;background:${BRAND.paper};border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(26,22,19,0.08);">
          <tr>
            <td style="padding:28px 32px 24px;background:linear-gradient(145deg,#3d342c 0%,${BRAND.dark} 100%);text-align:center;">
              <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;color:${BRAND.primary};">${escapeHtml(eyebrow)}</p>
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:13px;font-style:italic;color:rgba(255,255,255,0.55);">Artiste peintre · Galerie</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px 28px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.6;color:${BRAND.ink};">
              ${head}
              ${bodyHtml}
              ${ctaBlock}
              ${foot}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 22px;border-top:1px dashed ${BRAND.border};text-align:center;">
              <a href="${escapeHtml(siteUrl())}" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${BRAND.primaryDark};text-decoration:none;letter-spacing:0.06em;">alexandre-bindl.fr</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const infoRow = (label, value) => {
  if (!value) return '';
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid rgba(138,112,72,0.12);font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.primaryDark};width:38%;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:10px 0;border-bottom:1px solid rgba(138,112,72,0.12);font-family:Georgia,serif;font-size:15px;color:${BRAND.ink};vertical-align:top;">${value}</td>
  </tr>`;
};

export const buildEventTicketEmail = ({
  visitor,
  event,
  ticketUrl,
  dates,
  lieu,
  slotLine,
  partySize,
  qrBlocksHtml,
}) => {
  const firstName = escapeHtml(visitor.first_name);
  const titre = escapeHtml(event.titre);
  const plural = partySize > 1 ? ` — <strong style="font-weight:600;">${partySize} billets</strong> (un QR par personne)` : '';

  const bodyHtml = `
    <p style="margin:0 0 16px;">Bonjour ${firstName},</p>
    <p style="margin:0 0 24px;">Votre participation à l&apos;exposition <strong style="font-weight:600;">${titre}</strong> est confirmée${plural}.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;background:linear-gradient(180deg,#faf6ef 0%,#f3ece2 100%);border:1px solid ${BRAND.border};border-radius:12px;">
      <tr><td style="padding:18px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${infoRow('Exposition', `<strong style="font-weight:600;">${titre}</strong>`)}
          ${dates ? infoRow('Dates', escapeHtml(dates)) : ''}
          ${slotLine ? infoRow('Créneau', escapeHtml(slotLine)) : ''}
          ${lieu ? infoRow('Lieu', escapeHtml(lieu)) : ''}
        </table>
      </td></tr>
    </table>
    <p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${BRAND.primaryDark};text-align:center;">Présentez ce QR à l&apos;entrée</p>
    ${qrBlocksHtml}
    <p style="margin:20px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:${BRAND.muted};text-align:center;">
      Retrouvez vos billets à tout moment en ligne.<br />
      <a href="${escapeHtml(ticketUrl)}" style="color:${BRAND.primaryDark};word-break:break-all;">${escapeHtml(ticketUrl)}</a>
    </p>`;

  return wrapEmailLayout({
    preheader: `Votre billet pour ${event.titre}`,
    headline: 'Votre invitation',
    bodyHtml,
    cta: { href: ticketUrl, label: 'Voir mes billets' },
    footerNote: 'Conservez cet email ou enregistrez le QR sur votre téléphone.',
  });
};

export const buildQrBlock = (label, qrDataUrl) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 16px;max-width:260px;">
    <tr>
      <td align="center" style="padding:16px;background:#ffffff;border:1px solid ${BRAND.border};border-radius:14px;">
        <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.06em;color:${BRAND.muted};">${escapeHtml(label)}</p>
        <img src="${qrDataUrl}" width="200" height="200" alt="${escapeHtml(label)}" style="display:block;width:200px;height:200px;margin:0 auto;border-radius:8px;" />
      </td>
    </tr>
  </table>`;

export const buildEventInvitationEmail = ({ visitor, event, customMessage, eventUrl, dates, lieu }) => {
  const firstName = escapeHtml(visitor.first_name);
  const titre = escapeHtml(event.titre);
  const msg = customMessage
    ? nl2br(customMessage)
    : 'Une nouvelle date vous attend dans l&apos;atelier — nous serions ravis de vous y accueillir.';

  const bodyHtml = `
    <p style="margin:0 0 16px;">Bonjour ${firstName},</p>
    <p style="margin:0 0 24px;">${msg}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;background:${BRAND.paper};border:1px solid ${BRAND.border};border-radius:12px;">
      <tr><td style="padding:22px 20px;text-align:center;">
        <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:22px;font-style:italic;line-height:1.3;color:${BRAND.ink};">${titre}</p>
        ${dates ? `<p style="margin:0 0 6px;font-size:15px;color:${BRAND.ink};">${escapeHtml(dates)}</p>` : ''}
        ${lieu ? `<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${BRAND.muted};">${escapeHtml(lieu)}</p>` : ''}
      </td></tr>
    </table>`;

  return wrapEmailLayout({
    preheader: `Invitation — ${event.titre}`,
    headline: 'Invitation',
    bodyHtml,
    cta: { href: eventUrl, label: 'Réserver ma place' },
    footerNote:
      'Vous recevez cet email car vous avez accepté les invitations aux prochains événements.',
  });
};

export const buildContactConfirmationEmail = ({ name, workTitle }) => {
  const bodyHtml = `
    <p style="margin:0 0 16px;">Bonjour ${escapeHtml(name)},</p>
    ${
      workTitle
        ? `<p style="margin:0 0 16px;">Votre demande concernant l&apos;œuvre <strong style="font-weight:600;">${escapeHtml(workTitle)}</strong> a bien été transmise à Alexandre Bindl.</p>`
        : ''
    }
    <p style="margin:0 0 8px;">Votre message a bien été reçu. Alexandre vous répondra dans les plus brefs délais.</p>
    <p style="margin:24px 0 0;font-style:italic;color:${BRAND.muted};">Avec nos salutations,<br />L&apos;atelier Alexandre Bindl</p>`;

  return wrapEmailLayout({
    preheader: 'Nous avons bien reçu votre message',
    headline: 'Merci pour votre message',
    bodyHtml,
  });
};

export const buildContactNotificationEmail = ({ name, email, subject, message, workBlockHtml }) => {
  const bodyHtml = `
    <p style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${BRAND.muted};">Nouveau message depuis le site.</p>
    ${workBlockHtml || ''}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf9f7;border:1px solid ${BRAND.border};border-radius:10px;">
      <tr><td style="padding:16px 18px;">
        ${infoRow('Nom', escapeHtml(name))}
        ${infoRow('Email', `<a href="mailto:${escapeHtml(email)}" style="color:${BRAND.primaryDark};">${escapeHtml(email)}</a>`)}
        ${infoRow('Sujet', escapeHtml(subject))}
      </td></tr>
    </table>
    <p style="margin:20px 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.primaryDark};">Message</p>
    <div style="padding:16px 18px;background:#ffffff;border:1px solid rgba(0,0,0,0.06);border-radius:10px;font-size:15px;line-height:1.55;">${nl2br(message)}</div>`;

  return wrapEmailLayout({
    preheader: `Contact : ${subject || name}`,
    eyebrow: 'Site · Contact',
    headline: 'Nouveau message',
    bodyHtml,
  });
};

export const buildReplyEmail = ({ name, message, originalSubject, originalMessage }) => {
  const bodyHtml = `
    <p style="margin:0 0 16px;">Bonjour ${escapeHtml(name)},</p>
    <div style="margin:0 0 24px;font-size:16px;line-height:1.65;">${nl2br(message)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf9f7;border-left:3px solid ${BRAND.primary};border-radius:0 8px 8px 0;">
      <tr><td style="padding:14px 18px;">
        <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.muted};">Votre message</p>
        <p style="margin:0 0 8px;font-size:14px;font-style:italic;color:${BRAND.ink};">${escapeHtml(originalSubject || 'Sans sujet')}</p>
        <p style="margin:0;font-size:14px;line-height:1.5;color:${BRAND.muted};">${nl2br(originalMessage)}</p>
      </td></tr>
    </table>
    <p style="margin:24px 0 0;font-style:italic;">Cordialement,<br /><strong>Alexandre Bindl</strong></p>`;

  return wrapEmailLayout({
    preheader: 'Réponse à votre message',
    headline: 'Réponse à votre message',
    bodyHtml,
  });
};

export const buildWorkInfoBlock = (workData) => {
  if (!workData) return '';
  const typeLabel =
    workData.type === 'peintures'
      ? 'Peinture'
      : workData.type === 'croquis'
        ? 'Croquis'
        : 'Événement';
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;background:linear-gradient(180deg,#faf6ef 0%,#f3ece2 100%);border:1px solid ${BRAND.border};border-radius:10px;">
    <tr><td style="padding:14px 18px;">
      <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.primaryDark};">Œuvre concernée</p>
      <p style="margin:0;font-family:Georgia,serif;font-size:17px;color:${BRAND.ink};">${escapeHtml(workData.titre)}</p>
      <p style="margin:6px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${BRAND.muted};">${escapeHtml(typeLabel)}${workData.prix ? ` · ${escapeHtml(workData.prix)} €` : ''}</p>
    </td></tr>
  </table>`;
};
