import pool from '../config/database.js';
import { sendContactNotification, sendContactConfirmation } from '../services/emailService.js';

export const createContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Nom, email et message sont requis' });
    }

    // Enregistrer dans la base de données
    const result = await pool.query(
      `INSERT INTO contacts (name, email, subject, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, email, subject || null, message]
    );

    // Envoyer les emails (notification + confirmation)
    try {
      await sendContactNotification(result.rows[0]);
      await sendContactConfirmation(email, name);
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi des emails (message tout de même enregistré):', emailError);
    }

    res.status(201).json({
      message: 'Message envoyé avec succès',
      contact: result.rows[0],
    });
  } catch (error) {
    console.error('Erreur lors de la création du contact:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getAllContacts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contacts ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des contacts:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const markContactAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE contacts SET read = true WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du contact:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
