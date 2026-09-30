import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
const emailPort = parseInt(process.env.EMAIL_PORT || '587', 10);
const isLocalMail = emailHost === 'mailpit' || process.env.EMAIL_MODE === 'dev';

const transporterConfig = {
  host: emailHost,
  port: emailPort,
  secure: emailPort === 465,
  tls: {
    rejectUnauthorized: false,
  },
};

if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  transporterConfig.auth = {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  };
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
    if (isLocalMail) {
      console.log('✅ Service de mailing configuré (Mailpit - http://localhost:8025)');
    } else {
      console.log('✅ Service de mailing configuré avec succès');
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

  const workInfo = workData ? `
    <h3>Œuvre concernée:</h3>
    <p><strong>Titre:</strong> ${workData.titre}</p>
    <p><strong>Type:</strong> ${workData.type === 'peintures' ? 'Peinture' : workData.type === 'croquis' ? 'Croquis' : 'Événement'}</p>
    ${workData.prix ? `<p><strong>Prix:</strong> ${workData.prix}€</p>` : ''}
  ` : '';

  const html = `
    <h2>Nouveau message de contact</h2>
    ${workInfo}
    <p><strong>Nom:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Sujet:</strong> ${subject || (workData ? `Intérêt pour: ${workData.titre}` : 'Aucun sujet')}</p>
    <p><strong>Message:</strong></p>
    <p>${message}</p>
  `;

  const text = `
    Nouveau message de contact
    ${workData ? `Œuvre concernée: ${workData.titre}` : ''}
    Nom: ${name}
    Email: ${email}
    Sujet: ${subject || (workData ? `Intérêt pour: ${workData.titre}` : 'Aucun sujet')}
    Message: ${message}
  `;

  return await sendEmail({
    to: process.env.EMAIL_USER || process.env.EMAIL_FROM,
    subject: workData
      ? `Nouvelle demande pour l'œuvre: ${workData.titre}`
      : `Nouveau contact: ${subject || 'Sans sujet'}`,
    text,
    html,
  });
};

export const sendContactConfirmation = async (email, name, workData = null) => {
  const workInfo = workData ? `
    <p>Votre demande concernant l'œuvre "<strong>${workData.titre}</strong>" a bien été transmise à Alexandre Bindl.</p>
  ` : '';

  const html = `
    <h2>Merci pour votre message</h2>
    <p>Bonjour ${name},</p>
    ${workInfo}
    <p>Votre message a bien été reçu. Alexandre Bindl vous répondra dans les plus brefs délais.</p>
    <p>Cordialement,<br>Équipe Alexandre Bindl</p>
  `;

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

  const html = `
    <h2>Réponse à votre message</h2>
    <p>Bonjour ${name},</p>
    <p>${message.replace(/\n/g, '<br>')}</p>
    <hr style="margin: 2rem 0; border: none; border-top: 1px solid #e5e5e5;">
    <p style="color: #666; font-size: 0.9rem;">
      <strong>Votre message original:</strong><br>
      <em>${originalSubject || 'Sans sujet'}</em><br><br>
      ${originalMessage.replace(/\n/g, '<br>')}
    </p>
    <p style="margin-top: 2rem;">
      Cordialement,<br>
      <strong>Alexandre Bindl</strong>
    </p>
  `;

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
