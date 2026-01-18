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
    to: process.env.EMAIL_USER, // Email de l'artiste
    subject: workData 
      ? `Nouvelle demande pour l'œuvre: ${workData.titre}` 
      : `Nouveau contact: ${subject || 'Sans sujet'}`,
    text,
    html,
  });
};

// Envoyer un email de confirmation au visiteur
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
