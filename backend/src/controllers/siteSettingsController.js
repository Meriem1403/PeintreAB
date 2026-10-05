import pool from '../config/database.js';
import { normalizeImageUrl } from '../utils/imageUrl.js';
import { urlQrDataUrl } from '../services/ticketQr.js';
import {
  DEFAULT_ATELIER_HERO_COPY,
  DEFAULT_ATELIER_SECTION_COPY,
} from '../constants/atelierHeroCopy.js';

const DEFAULT_PUBLIC_SITE_URL =
  process.env.FRONTEND_URL?.replace(/\/$/, '') || 'https://www.alexandrebindl.fr';

const DEFAULT_SETTINGS = {
  hero_image: '/images/peintures/2025-2-le-cours.jpg',
  primary_color: '#C6AC8F',
  accent_color: '#B89A7A',
  navbar_color: '#C6AC8F',
  public_site_url: DEFAULT_PUBLIC_SITE_URL,
  ...DEFAULT_ATELIER_HERO_COPY,
  ...DEFAULT_ATELIER_SECTION_COPY,
};

function normalizePublicSiteUrl(raw) {
  if (raw == null || raw === '') return null;
  let url = String(raw).trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.href.replace(/\/$/, '');
  } catch {
    return null;
  }
}

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
    const {
      hero_image,
      primary_color,
      accent_color,
      navbar_color,
      atelier_hero_eyebrow,
      atelier_hero_title_line1,
      atelier_hero_title_line2_prefix,
      atelier_hero_title_emphasis,
      atelier_hero_lead_prefix,
      atelier_hero_lead_emphasis,
      atelier_hero_lead_suffix,
      atelier_events_index,
      atelier_events_title,
      atelier_events_intro,
      atelier_works_index,
      atelier_works_title,
      atelier_works_intro,
      public_site_url,
    } = req.body;

    const normalizedSiteUrl =
      public_site_url !== undefined ? normalizePublicSiteUrl(public_site_url) : undefined;
    if (public_site_url !== undefined && public_site_url !== '' && normalizedSiteUrl === null) {
      return res.status(400).json({ error: 'URL du site invalide (utilisez https://…)' });
    }

    const existing = await pool.query('SELECT * FROM site_settings ORDER BY id DESC LIMIT 1');

    let result;
    if (existing.rows.length === 0) {
      result = await pool.query(
        `INSERT INTO site_settings (
           hero_image, primary_color, accent_color, navbar_color,
           atelier_hero_eyebrow, atelier_hero_title_line1, atelier_hero_title_line2_prefix,
           atelier_hero_title_emphasis, atelier_hero_lead_prefix, atelier_hero_lead_emphasis,
           atelier_hero_lead_suffix,
           atelier_events_index, atelier_events_title, atelier_events_intro,
           atelier_works_index, atelier_works_title, atelier_works_intro,
           public_site_url,
           updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          hero_image || DEFAULT_SETTINGS.hero_image,
          primary_color || DEFAULT_SETTINGS.primary_color,
          accent_color || DEFAULT_SETTINGS.accent_color,
          navbar_color || DEFAULT_SETTINGS.navbar_color,
          atelier_hero_eyebrow ?? DEFAULT_SETTINGS.atelier_hero_eyebrow,
          atelier_hero_title_line1 ?? DEFAULT_SETTINGS.atelier_hero_title_line1,
          atelier_hero_title_line2_prefix ?? DEFAULT_SETTINGS.atelier_hero_title_line2_prefix,
          atelier_hero_title_emphasis ?? DEFAULT_SETTINGS.atelier_hero_title_emphasis,
          atelier_hero_lead_prefix ?? DEFAULT_SETTINGS.atelier_hero_lead_prefix,
          atelier_hero_lead_emphasis ?? DEFAULT_SETTINGS.atelier_hero_lead_emphasis,
          atelier_hero_lead_suffix ?? DEFAULT_SETTINGS.atelier_hero_lead_suffix,
          atelier_events_index ?? DEFAULT_SETTINGS.atelier_events_index,
          atelier_events_title ?? DEFAULT_SETTINGS.atelier_events_title,
          atelier_events_intro ?? DEFAULT_SETTINGS.atelier_events_intro,
          atelier_works_index ?? DEFAULT_SETTINGS.atelier_works_index,
          atelier_works_title ?? DEFAULT_SETTINGS.atelier_works_title,
          atelier_works_intro ?? DEFAULT_SETTINGS.atelier_works_intro,
          normalizedSiteUrl ?? DEFAULT_SETTINGS.public_site_url,
        ]
      );
    } else {
      result = await pool.query(
        `UPDATE site_settings
         SET hero_image = COALESCE($1, hero_image),
             primary_color = COALESCE($2, primary_color),
             accent_color = COALESCE($3, accent_color),
             navbar_color = COALESCE($4, navbar_color),
             atelier_hero_eyebrow = COALESCE($5, atelier_hero_eyebrow),
             atelier_hero_title_line1 = COALESCE($6, atelier_hero_title_line1),
             atelier_hero_title_line2_prefix = COALESCE($7, atelier_hero_title_line2_prefix),
             atelier_hero_title_emphasis = COALESCE($8, atelier_hero_title_emphasis),
             atelier_hero_lead_prefix = COALESCE($9, atelier_hero_lead_prefix),
             atelier_hero_lead_emphasis = COALESCE($10, atelier_hero_lead_emphasis),
             atelier_hero_lead_suffix = COALESCE($11, atelier_hero_lead_suffix),
             atelier_events_index = COALESCE($12, atelier_events_index),
             atelier_events_title = COALESCE($13, atelier_events_title),
             atelier_events_intro = COALESCE($14, atelier_events_intro),
             atelier_works_index = COALESCE($15, atelier_works_index),
             atelier_works_title = COALESCE($16, atelier_works_title),
             atelier_works_intro = COALESCE($17, atelier_works_intro),
             public_site_url = COALESCE($18, public_site_url),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $19
         RETURNING *`,
        [
          hero_image ?? null,
          primary_color ?? null,
          accent_color ?? null,
          navbar_color ?? null,
          atelier_hero_eyebrow ?? null,
          atelier_hero_title_line1 ?? null,
          atelier_hero_title_line2_prefix ?? null,
          atelier_hero_title_emphasis ?? null,
          atelier_hero_lead_prefix ?? null,
          atelier_hero_lead_emphasis ?? null,
          atelier_hero_lead_suffix ?? null,
          atelier_events_index ?? null,
          atelier_events_title ?? null,
          atelier_events_intro ?? null,
          atelier_works_index ?? null,
          atelier_works_title ?? null,
          atelier_works_intro ?? null,
          normalizedSiteUrl ?? null,
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

export const getWebsiteQr = async (req, res) => {
  try {
    let url = normalizePublicSiteUrl(req.query.url);
    if (!url) {
      const result = await pool.query(
        'SELECT public_site_url FROM site_settings ORDER BY id DESC LIMIT 1'
      );
      url = normalizePublicSiteUrl(result.rows[0]?.public_site_url) || DEFAULT_SETTINGS.public_site_url;
    }
    if (!url) {
      return res.status(400).json({ error: 'Configurez l’URL du site pour générer le QR code' });
    }
    const qr_data_url = await urlQrDataUrl(url);
    res.json({ url, qr_data_url });
  } catch (error) {
    console.error('getWebsiteQr:', error);
    res.status(500).json({ error: 'Impossible de générer le QR code' });
  }
};
