import pool from '../config/database.js';

export const getSiteSettings = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM site_settings ORDER BY id DESC LIMIT 1');
    if (result.rows.length === 0) {
      return res.json({
        hero_image: '/images/peintures/2025-2-le-cours.jpg',
      });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres du site:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateSiteSettings = async (req, res) => {
  try {
    const { hero_image } = req.body;

    const existing = await pool.query('SELECT * FROM site_settings ORDER BY id DESC LIMIT 1');

    let result;
    if (existing.rows.length === 0) {
      result = await pool.query(
        `INSERT INTO site_settings (hero_image, updated_at)
         VALUES ($1, CURRENT_TIMESTAMP)
         RETURNING *`,
        [hero_image || '/images/peintures/2025-2-le-cours.jpg']
      );
    } else {
      result = await pool.query(
        `UPDATE site_settings
         SET hero_image = COALESCE($1, hero_image),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [hero_image, existing.rows[0].id]
      );
    }

    res.json({
      message: 'Paramètres du site mis à jour avec succès',
      settings: result.rows[0],
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres du site:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
