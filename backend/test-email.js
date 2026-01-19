import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

console.log('🔍 Vérification de la configuration email...\n');

const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;

console.log(`EMAIL_USER: ${emailUser ? emailUser.substring(0, 5) + '***' : 'NON DÉFINI'}`);
console.log(`EMAIL_PASSWORD: ${emailPassword ? (emailPassword.length === 16 ? '✅ App Password détecté (' + emailPassword.length + ' caractères)' : '⚠️ Longueur suspecte (' + emailPassword.length + ' caractères)') : 'NON DÉFINI'}`);
console.log(`EMAIL_FROM: ${process.env.EMAIL_FROM || 'NON DÉFINI'}\n`);

if (!emailUser || !emailPassword) {
  console.error('❌ EMAIL_USER ou EMAIL_PASSWORD manquant dans .env');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: emailUser,
    pass: emailPassword,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

console.log('🧪 Test de connexion à Gmail...\n');

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Erreur de connexion:', error.message);
    if (error.message.includes('Application-specific password')) {
      console.error('\n📌 SOLUTION:');
      console.error('   Gmail nécessite un "App Password" (mot de passe d\'application),');
      console.error('   pas votre mot de passe Gmail normal.');
      console.error('\n   Étapes:');
      console.error('   1. Allez sur https://myaccount.google.com/apppasswords');
      console.error('   2. Sélectionnez "Mail" et "Autre (nom personnalisé)"');
      console.error('   3. Entrez un nom (ex: "PeintreAB")');
      console.error('   4. Copiez le mot de passe généré (16 caractères)');
      console.error('   5. Mettez-le dans backend/.env comme EMAIL_PASSWORD');
    }
    process.exit(1);
  } else {
    console.log('✅ Connexion réussie !\n');
    console.log('📧 Envoi d\'un email de test...\n');
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || emailUser,
      to: emailUser,
      subject: 'Test email - PeintreAB',
      html: `
        <h2>Test d'envoi d'email</h2>
        <p>Si vous recevez cet email, la configuration fonctionne correctement !</p>
        <p>Date: ${new Date().toLocaleString('fr-FR')}</p>
      `,
      text: `Test d'envoi d'email\n\nSi vous recevez cet email, la configuration fonctionne correctement !\n\nDate: ${new Date().toLocaleString('fr-FR')}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('❌ Erreur lors de l\'envoi:', error.message);
        process.exit(1);
      } else {
        console.log('✅ Email de test envoyé avec succès !');
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   Destinataire: ${emailUser}`);
        console.log('\n📬 Vérifiez votre boîte de réception (et les spams)');
        process.exit(0);
      }
    });
  }
});
