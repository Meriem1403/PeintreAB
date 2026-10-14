import pool from '../config/database.js';
import {
  DEFAULT_GALLERY_CATEGORIES,
  RESERVED_ADMIN_SLUGS,
  slugifyCategory,
} from '../utils/galleryCategories.js';

const clampItemsPerPage = (value, fallback = 12) => {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(1, n));
};

const mapRow = (row) => ({
  id: row.id,
  slug: row.slug,
  label: row.label,
  lead: row.lead || '',
  display_order: row.display_order ?? 0,
  kind: row.kind === 'events' ? 'events' : 'works',
  is_locked: Boolean(row.is_locked),
  pagination_enabled:
    row.pagination_enabled === undefined || row.pagination_enabled === null
      ? true
      : Boolean(row.pagination_enabled),
  items_per_page: clampItemsPerPage(row.items_per_page, 12),
});

export async function ensureGalleryCategoriesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS gallery_categories (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(64) UNIQUE NOT NULL,
      label VARCHAR(120) NOT NULL,
      lead TEXT,
      display_order INTEGER DEFAULT 0,
      kind VARCHAR(16) NOT NULL DEFAULT 'works',
      is_locked BOOLEAN DEFAULT FALSE,
      pagination_enabled BOOLEAN DEFAULT TRUE,
      items_per_page INTEGER DEFAULT 12,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    ALTER TABLE gallery_categories
    ADD COLUMN IF NOT EXISTS pagination_enabled BOOLEAN DEFAULT TRUE
  `);
  await pool.query(`
    ALTER TABLE gallery_categories
    ADD COLUMN IF NOT EXISTS items_per_page INTEGER DEFAULT 12
  `);
}

export async function ensureGalleryCategoriesSeeded() {
  await ensureGalleryCategoriesTable();

  const count = await pool.query('SELECT COUNT(*)::int AS n FROM gallery_categories');
  if ((count.rows[0]?.n || 0) > 0) return;

  for (const cat of DEFAULT_GALLERY_CATEGORIES) {
    await pool.query(
      `INSERT INTO gallery_categories (slug, label, lead, display_order, kind, is_locked)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (slug) DO NOTHING`,
      [cat.slug, cat.label, cat.lead, cat.display_order, cat.kind, cat.is_locked]
    );
  }
}

export const listGalleryCategories = async (_req, res) => {
  try {
    await ensureGalleryCategoriesSeeded();
    const result = await pool.query(
      `SELECT * FROM gallery_categories ORDER BY display_order ASC, id ASC`
    );
    res.json(result.rows.map(mapRow));
  } catch (error) {
    console.error('Erreur listGalleryCategories:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createGalleryCategory = async (req, res) => {
  try {
    await ensureGalleryCategoriesSeeded();
    const label = String(req.body.label || '').trim();
    if (!label) {
      return res.status(400).json({ error: 'Le libellé est requis' });
    }

    let slug = slugifyCategory(req.body.slug || label);
    if (!slug) {
      return res.status(400).json({ error: 'Impossible de générer un identifiant valide' });
    }
    if (RESERVED_ADMIN_SLUGS.has(slug)) {
      return res.status(400).json({ error: 'Cet identifiant est réservé par l’administration' });
    }

    const existing = await pool.query('SELECT id FROM gallery_categories WHERE slug = $1', [slug]);
    if (existing.rows.length > 0) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }

    const lead = String(req.body.lead || '').trim() || null;
    const maxOrder = await pool.query(
      'SELECT COALESCE(MAX(display_order), -1) + 1 AS next FROM gallery_categories'
    );
    const displayOrder =
      req.body.display_order !== undefined && req.body.display_order !== null
        ? parseInt(req.body.display_order, 10)
        : maxOrder.rows[0].next;
    const paginationEnabled =
      req.body.pagination_enabled === undefined
        ? true
        : Boolean(req.body.pagination_enabled);
    const itemsPerPage = clampItemsPerPage(req.body.items_per_page, 12);

    const result = await pool.query(
      `INSERT INTO gallery_categories
         (slug, label, lead, display_order, kind, is_locked, pagination_enabled, items_per_page)
       VALUES ($1, $2, $3, $4, 'works', FALSE, $5, $6)
       RETURNING *`,
      [slug, label, lead, displayOrder, paginationEnabled, itemsPerPage]
    );

    res.status(201).json(mapRow(result.rows[0]));
  } catch (error) {
    console.error('Erreur createGalleryCategory:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateGalleryCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT * FROM gallery_categories WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Onglet introuvable' });
    }

    const row = existing.rows[0];
    const label =
      req.body.label !== undefined ? String(req.body.label || '').trim() : row.label;
    if (!label) {
      return res.status(400).json({ error: 'Le libellé est requis' });
    }

    const lead =
      req.body.lead !== undefined ? String(req.body.lead || '').trim() || null : row.lead;

    let displayOrder = row.display_order;
    if (req.body.display_order !== undefined && req.body.display_order !== null) {
      displayOrder = parseInt(req.body.display_order, 10);
    }

    const paginationEnabled =
      req.body.pagination_enabled !== undefined
        ? Boolean(req.body.pagination_enabled)
        : row.pagination_enabled === undefined || row.pagination_enabled === null
          ? true
          : Boolean(row.pagination_enabled);
    const itemsPerPage =
      req.body.items_per_page !== undefined
        ? clampItemsPerPage(req.body.items_per_page, 12)
        : clampItemsPerPage(row.items_per_page, 12);

    const result = await pool.query(
      `UPDATE gallery_categories
       SET label = $1, lead = $2, display_order = $3,
           pagination_enabled = $4, items_per_page = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [label, lead, displayOrder, paginationEnabled, itemsPerPage, id]
    );

    res.json(mapRow(result.rows[0]));
  } catch (error) {
    console.error('Erreur updateGalleryCategory:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const reorderGalleryCategories = async (req, res) => {
  try {
    const order = Array.isArray(req.body.order) ? req.body.order : [];
    if (order.length === 0) {
      return res.status(400).json({ error: 'Liste d’ordre requise' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (let i = 0; i < order.length; i += 1) {
        const id = parseInt(order[i], 10);
        if (!Number.isFinite(id)) continue;
        await client.query(
          `UPDATE gallery_categories SET display_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [i, id]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    const result = await pool.query(
      `SELECT * FROM gallery_categories ORDER BY display_order ASC, id ASC`
    );
    res.json(result.rows.map(mapRow));
  } catch (error) {
    console.error('Erreur reorderGalleryCategories:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deleteGalleryCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT * FROM gallery_categories WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Onglet introuvable' });
    }

    const row = existing.rows[0];
    if (row.is_locked || row.kind === 'events' || row.slug === 'evenements') {
      return res.status(400).json({
        error: 'L’onglet Événements ne peut pas être supprimé (billets, visiteurs, scan).',
      });
    }

    const worksCount = await pool.query(
      'SELECT COUNT(*)::int AS n FROM works WHERE type = $1',
      [row.slug]
    );
    if ((worksCount.rows[0]?.n || 0) > 0) {
      return res.status(400).json({
        error: `Impossible de supprimer « ${row.label} » : ${worksCount.rows[0].n} œuvre(s) y sont encore classées. Déplacez-les ou supprimez-les d’abord.`,
      });
    }

    await pool.query('DELETE FROM gallery_categories WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (error) {
    console.error('Erreur deleteGalleryCategory:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export async function categoryExists(slug) {
  await ensureGalleryCategoriesSeeded();
  const result = await pool.query('SELECT slug, kind FROM gallery_categories WHERE slug = $1', [
    slug,
  ]);
  return result.rows[0] || null;
}
