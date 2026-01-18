import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true pour 465, false pour autres ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Vérifier la configuration email au démarrage
transporter.verify((error, success) => {
  if (error) {
    console.log('⚠️ Configuration email non disponible:', error.message);
    console.log('📧 Le service de mailing nécessite EMAIL_USER et EMAIL_PASSWORD dans .env');
  } else {
    console.log('✅ Service de mailing configuré avec succès');
  }
});

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email envoyé:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
    return { success: false, error: error.message };
  }
};

// Envoyer un email de notification de nouveau contact
export const sendContactNotification = async (contactData) => {
  const { name, email, subject, message } = contactData;

  const html = `
    <h2>Nouveau message de contact</h2>
    <p><strong>Nom:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Sujet:</strong> ${subject || 'Aucun sujet'}</p>
    <p><strong>Message:</strong></p>
    <p>${message}</p>
  `;

  const text = `
    Nouveau message de contact
    Nom: ${name}
    Email: ${email}
    Sujet: ${subject || 'Aucun sujet'}
    Message: ${message}
  `;

  return await sendEmail({
    to: process.env.EMAIL_USER, // Email de l'artiste
    subject: `Nouveau contact: ${subject || 'Sans sujet'}`,
    text,
    html,
  });
};

// Envoyer un email de confirmation au visiteur
export const sendContactConfirmation = async (email, name) => {
  const html = `
    <h2>Merci pour votre message</h2>
    <p>Bonjour ${name},</p>
    <p>Votre message a bien été reçu. Alexandre Bindl vous répondra dans les plus brefs délais.</p>
    <p>Cordialement,<br>Équipe Alexandre Bindl</p>
  `;

  const text = `
    Merci pour votre message
    Bonjour ${name},
    Votre message a bien été reçu. Alexandre Bindl vous répondra dans les plus brefs délais.
    Cordialement,
    Équipe Alexandre Bindl
  `;

  return await sendEmail({
    to: email,
    subject: 'Message reçu - Alexandre Bindl',
    text,
    html,
  });
};
