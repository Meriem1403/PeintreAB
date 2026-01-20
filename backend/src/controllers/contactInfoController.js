import pool from '../config/database.js';

export const getContactInfo = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contact_info ORDER BY id DESC LIMIT 1');
    
    if (result.rows.length === 0) {
      // Retourner des valeurs par défaut si aucune info n'existe
      return res.json({
        email: 'alexandre.bindl@gmail.com',
        phone: '06 32 00 12 28',
        facebook_name: 'Alexandre Bindl - Artiste Peintre',
        facebook_url: 'https://www.facebook.com/AlexandreBindlArtistePeintre',
        instagram_name: 'Alexandre_Bindl',
        instagram_url: 'https://www.instagram.com/Alexandre_Bindl',
        website_name: 'www.alexandre-bindl.fr',
        website_url: 'http://www.alexandre-bindl.fr'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération des informations de contact:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateContactInfo = async (req, res) => {
  try {
    const { email, phone, facebook_name, facebook_url, instagram_name, instagram_url, website_name, website_url } = req.body;

    // Vérifier si une entrée existe déjà
    const existing = await pool.query('SELECT * FROM contact_info ORDER BY id DESC LIMIT 1');

    let result;
    if (existing.rows.length === 0) {
      // Créer une nouvelle entrée
      result = await pool.query(
        `INSERT INTO contact_info (email, phone, facebook_name, facebook_url, instagram_name, instagram_url, website_name, website_url, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          email || 'alexandre.bindl@gmail.com',
          phone || '06 32 00 12 28',
          facebook_name || 'Alexandre Bindl - Artiste Peintre',
          facebook_url || 'https://www.facebook.com/AlexandreBindlArtistePeintre',
          instagram_name || 'Alexandre_Bindl',
          instagram_url || 'https://www.instagram.com/Alexandre_Bindl',
          website_name || 'www.alexandre-bindl.fr',
          website_url || 'http://www.alexandre-bindl.fr'
        ]
      );
    } else {
      // Mettre à jour l'entrée existante
      result = await pool.query(
        `UPDATE contact_info 
         SET email = COALESCE($1, email),
             phone = COALESCE($2, phone),
             facebook_name = COALESCE($3, facebook_name),
             facebook_url = COALESCE($4, facebook_url),
             instagram_name = COALESCE($5, instagram_name),
             instagram_url = COALESCE($6, instagram_url),
             website_name = COALESCE($7, website_name),
             website_url = COALESCE($8, website_url),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $9
         RETURNING *`,
        [email, phone, facebook_name, facebook_url, instagram_name, instagram_url, website_name, website_url, existing.rows[0].id]
      );
    }

    res.json({
      message: 'Informations de contact mises à jour avec succès',
      contactInfo: result.rows[0],
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des informations de contact:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
