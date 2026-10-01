import pool from '../config/database.js';
import { normalizeImageUrl } from '../utils/imageUrl.js';

const DEFAULT_SETTINGS = {
  hero_image: '/images/peintures/2025-2-le-cours.jpg',
  primary_color: '#C6AC8F',
  accent_color: '#B89A7A',
  navbar_color: '#C6AC8F',
};

export const getSiteSettings = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM site_settings ORDER BY id DESC LIMIT 1');
    if (result.rows.length === 0) {
      return res.json(DEFAULT_SETTINGS);
    }
    const settings = result.rows[0];
    res.json({
      ...DEFAULT_SETTINGS,
      ...settings,
      hero_image: normalizeImageUrl(settings.hero_image),
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres du site:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateSiteSettings = async (req, res) => {
  try {
    const { hero_image, primary_color, accent_color, navbar_color } = req.body;

    const existing = await pool.query('SELECT * FROM site_settings ORDER BY id DESC LIMIT 1');

    let result;
    if (existing.rows.length === 0) {
      result = await pool.query(
        `INSERT INTO site_settings (hero_image, primary_color, accent_color, navbar_color, updated_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          hero_image || DEFAULT_SETTINGS.hero_image,
          primary_color || DEFAULT_SETTINGS.primary_color,
          accent_color || DEFAULT_SETTINGS.accent_color,
          navbar_color || DEFAULT_SETTINGS.navbar_color,
        ]
      );
    } else {
      result = await pool.query(
        `UPDATE site_settings
         SET hero_image = COALESCE($1, hero_image),
             primary_color = COALESCE($2, primary_color),
             accent_color = COALESCE($3, accent_color),
             navbar_color = COALESCE($4, navbar_color),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING *`,
        [
          hero_image ?? null,
          primary_color ?? null,
          accent_color ?? null,
          navbar_color ?? null,
          existing.rows[0].id,
        ]
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
