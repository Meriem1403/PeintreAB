import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import {
  buildContactConfirmationEmail,
  buildContactNotificationEmail,
  buildEventInvitationEmail,
  buildEventTicketEmail,
  buildQrBlock,
  buildReplyEmail,
  buildWorkInfoBlock,
} from './emailTemplates.js';

dotenv.config();

const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
const emailPort = parseInt(process.env.EMAIL_PORT || '587', 10);
const isLocalMail =
  emailHost === 'mailpit' ||
  emailHost === 'localhost' ||
  process.env.EMAIL_MODE === 'dev';

const emailPasswordRaw = process.env.EMAIL_PASSWORD || '';
const emailPassword = emailPasswordRaw.replace(/\s+/g, '');

const transporterConfig = {
  host: emailHost,
  port: emailPort,
  secure: emailPort === 465,
  tls: {
    rejectUnauthorized: false,
  },
};

if (process.env.EMAIL_USER && emailPassword) {
  transporterConfig.auth = {
    user: process.env.EMAIL_USER,
    pass: emailPassword,
  };
} else if (process.env.EMAIL_USER && !emailPassword && !isLocalMail) {
  console.warn(
    '⚠️ EMAIL_PASSWORD manquant — envoi SMTP impossible (hors Mailpit sans auth).'
  );
}

const transporter = nodemailer.createTransport(transporterConfig);

transporter.verify((error) => {
  if (error) {
    console.log('⚠️ Configuration email non disponible:', error.message);
    if (isLocalMail) {
      console.log('📧 Vérifiez que le service Mailpit est démarré (docker compose up mailpit)');
    } else {
      console.log('📧 Le service de mailing nécessite EMAIL_USER et EMAIL_PASSWORD dans .env');
    }
  } else {
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@peintreab.local';
    if (isLocalMail) {
      console.log(`✅ SMTP ${emailHost}:${emailPort} (Mailpit) — boîte web http://localhost:8025`);
      console.log(`   Les emails ne partent PAS vers de vraies adresses tant que EMAIL_HOST=mailpit.`);
    } else {
      console.log(`✅ SMTP ${emailHost}:${emailPort} — expéditeur ${from}`);
    }
  }
});

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@peintreab.local',
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email envoyé avec succès:', info.messageId);
    console.log('   Destinataire:', to);
    if (isLocalMail) {
      console.log('   Interface Mailpit: http://localhost:8025');
    }
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error.message);
    if (error.message.includes('Application-specific password')) {
      console.error('⚠️ Gmail nécessite un "App Password". Vérifiez votre configuration.');
    }
    throw error;
  }
};

export const sendContactNotification = async (contactData, workData = null) => {
  const { name, email, subject, message } = contactData;
  const subjectLine =
    subject ||
    (workData ? `Intérêt pour: ${workData.titre}` : 'Aucun sujet');

  const html = buildContactNotificationEmail({
    name,
    email,
    subject: subjectLine,
    message,
    workBlockHtml: buildWorkInfoBlock(workData),
  });

  const text = `
    Nouveau message de contact
    ${workData ? `Œuvre concernée: ${workData.titre}` : ''}
    Nom: ${name}
    Email: ${email}
    Sujet: ${subjectLine}
    Message: ${message}
  `;

  const adminTo =
    process.env.ADMIN_NOTIFY_EMAIL ||
    process.env.EMAIL_USER ||
    process.env.EMAIL_FROM ||
    'dev@peintreab.local';

  return await sendEmail({
    to: adminTo,
    subject: workData
      ? `Nouvelle demande pour l'œuvre: ${workData.titre}`
      : `Nouveau contact: ${subjectLine}`,
    text,
    html,
  });
};

export const sendContactConfirmation = async (email, name, workData = null) => {
  const html = buildContactConfirmationEmail({
    name,
    workTitle: workData?.titre,
  });

  const text = `
    Merci pour votre message
    Bonjour ${name},
    ${workData ? `Votre demande concernant l'œuvre "${workData.titre}" a bien été transmise à Alexandre Bindl.` : ''}
    Votre message a bien été reçu. Alexandre Bindl vous répondra dans les plus brefs délais.
    Cordialement,
    Équipe Alexandre Bindl
  `;

  return await sendEmail({
    to: email,
    subject: workData
      ? `Demande reçue pour ${workData.titre} - Alexandre Bindl`
      : 'Message reçu - Alexandre Bindl',
    text,
    html,
  });
};

export const sendReply = async ({ to, subject, message, originalContact }) => {
  const { name, subject: originalSubject, message: originalMessage } = originalContact;

  const html = buildReplyEmail({
    name,
    message,
    originalSubject,
    originalMessage,
  });

  const text = `
    Réponse à votre message
    Bonjour ${name},
    
    ${message}
    
    ---
    Votre message original:
    ${originalSubject || 'Sans sujet'}
    ${originalMessage}
    
    Cordialement,
    Alexandre Bindl
  `;

  return await sendEmail({
    to,
    subject,
    text,
    html,
  });
};

const formatEventDates = (event) => {
  const opts = { day: 'numeric', month: 'long', year: 'numeric' };
  if (event.date_debut && event.date_fin) {
    const a = new Date(event.date_debut).toLocaleDateString('fr-FR', opts);
    const b = new Date(event.date_fin).toLocaleDateString('fr-FR', opts);
    return `${a} — ${b}`;
  }
  if (event.date_debut) {
    return new Date(event.date_debut).toLocaleDateString('fr-FR', opts);
  }
  return '';
};

export const sendEventTicketEmail = async ({
  visitor,
  event,
  ticketCode,
  ticketCodes = [],
  slot,
  partySize = 1,
}) => {
  const { ticketQrDataUrl } = await import('./ticketQr.js');
  const codes = ticketCodes.length > 0 ? ticketCodes : [ticketCode];
  const base = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  const ticketUrl = `${base}/billet/${ticketCode}`;
  const dates = formatEventDates(event);
  const lieu = [event.lieu, event.adresse].filter(Boolean).join(' — ');
  const slotLine = slot?.label
    ? `${slot.label}${slot.slot_date ? ` — ${new Date(slot.slot_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}`
    : '';

  const qrBlocksHtml = (
    await Promise.all(
      codes.map(async (code, i) => {
        const qr = await ticketQrDataUrl(code);
        const label = codes.length > 1 ? `Billet ${i + 1} / ${codes.length}` : 'Votre billet';
        return buildQrBlock(label, qr);
      })
    )
  ).join('');

  const subject = `Votre invitation — ${event.titre}`;
  const html = buildEventTicketEmail({
    visitor,
    event,
    ticketUrl,
    dates,
    lieu,
    slotLine,
    partySize,
    qrBlocksHtml,
  });

  const text = `Bonjour ${visitor.first_name},\n\nParticipation confirmée : ${event.titre}\n${dates}\n${lieu}\n\nBillets : ${ticketUrl}\n`;

  return sendEmail({
    to: visitor.email,
    subject,
    text,
    html,
  });
};

export const sendEventInvitation = async ({ visitor, event, customMessage }) => {
  const base = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  const eventUrl = `${base}/galerie/evenements/${event.id}`;
  const dates = formatEventDates(event);
  const lieu = [event.lieu, event.adresse].filter(Boolean).join(' — ');

  const subject = `Invitation — ${event.titre}`;
  const html = buildEventInvitationEmail({
    visitor,
    event,
    customMessage,
    eventUrl,
    dates,
    lieu,
  });

  const text = `Bonjour ${visitor.first_name},\n\n${event.titre}\n${dates}\n\n${eventUrl}\n`;

  return sendEmail({
    to: visitor.email,
    subject,
    text,
    html,
  });
};
