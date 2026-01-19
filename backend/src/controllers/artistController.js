import pool from '../config/database.js';

export const getArtistInfo = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM artist_info ORDER BY id DESC LIMIT 1');
    
    if (result.rows.length === 0) {
      // Retourner des valeurs par défaut si aucune info n'existe
      return res.json({
        photo: '/images/accueil.jpg',
        biographie: 'Alexandre Bindl est un artiste peintre passionné par la représentation de la beauté et de l\'émotion à travers ses œuvres.'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération des informations artiste:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateArtistInfo = async (req, res) => {
  try {
    const { photo, biographie } = req.body;

    // Vérifier si une entrée existe déjà
    const existing = await pool.query('SELECT * FROM artist_info ORDER BY id DESC LIMIT 1');

    let result;
    if (existing.rows.length === 0) {
      // Créer une nouvelle entrée
      result = await pool.query(
        `INSERT INTO artist_info (photo, biographie, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         RETURNING *`,
        [photo || '/images/accueil.jpg', biographie || '']
      );
    } else {
      // Mettre à jour l'entrée existante
      result = await pool.query(
        `UPDATE artist_info 
         SET photo = COALESCE($1, photo),
             biographie = COALESCE($2, biographie),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [photo, biographie, existing.rows[0].id]
      );
    }

    res.json({
      message: 'Informations artiste mises à jour avec succès',
      artistInfo: result.rows[0],
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des informations artiste:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
