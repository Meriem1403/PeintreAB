import pool from '../config/database.js';

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const normalizeHex = (value, fallback) => {
  const raw = String(value || '').trim();
  if (!HEX.test(raw)) return fallback || null;
  if (raw.length === 4) {
    const [, r, g, b] = raw;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return raw.toUpperCase();
};

const mapPalette = (row) => ({
  id: row.id,
  name: row.name,
  primary_color: row.primary_color,
  accent_color: row.accent_color,
  navbar_color: row.navbar_color,
  created_at: row.created_at,
});

export async function ensureThemePaletteTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS theme_color_presets (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      primary_color VARCHAR(20) NOT NULL,
      accent_color VARCHAR(20) NOT NULL,
      navbar_color VARCHAR(20) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS theme_color_history (
      id SERIAL PRIMARY KEY,
      primary_color VARCHAR(20) NOT NULL,
      accent_color VARCHAR(20) NOT NULL,
      navbar_color VARCHAR(20) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function recordThemeHistory(colors) {
  await ensureThemePaletteTables();
  const primary = normalizeHex(colors.primary_color, '#C6AC8F');
  const accent = normalizeHex(colors.accent_color, '#B89A7A');
  const navbar = normalizeHex(colors.navbar_color, '#C6AC8F');

  const last = await pool.query(
    `SELECT primary_color, accent_color, navbar_color
     FROM theme_color_history
     ORDER BY created_at DESC, id DESC
     LIMIT 1`
  );
  const prev = last.rows[0];
  if (
    prev &&
    String(prev.primary_color).toUpperCase() === primary &&
    String(prev.accent_color).toUpperCase() === accent &&
    String(prev.navbar_color).toUpperCase() === navbar
  ) {
    return null;
  }

  const result = await pool.query(
    `INSERT INTO theme_color_history (primary_color, accent_color, navbar_color)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [primary, accent, navbar]
  );

  /* garder les 40 dernières entrées */
  await pool.query(`
    DELETE FROM theme_color_history
    WHERE id NOT IN (
      SELECT id FROM theme_color_history ORDER BY created_at DESC, id DESC LIMIT 40
    )
  `);

  return mapPalette(result.rows[0]);
}

export const listThemePresets = async (_req, res) => {
  try {
    await ensureThemePaletteTables();
    const result = await pool.query(
      `SELECT * FROM theme_color_presets ORDER BY created_at DESC, id DESC`
    );
    res.json(result.rows.map(mapPalette));
  } catch (error) {
    console.error('listThemePresets:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createThemePreset = async (req, res) => {
  try {
    await ensureThemePaletteTables();
    const name = String(req.body.name || '').trim() || 'Ma palette';
    const primary = normalizeHex(req.body.primary_color);
    const accent = normalizeHex(req.body.accent_color);
    const navbar = normalizeHex(req.body.navbar_color);

    if (!primary || !accent || !navbar) {
      return res.status(400).json({ error: 'Couleurs invalides (format #RRGGBB)' });
    }

    const result = await pool.query(
      `INSERT INTO theme_color_presets (name, primary_color, accent_color, navbar_color)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name.slice(0, 120), primary, accent, navbar]
    );

    res.status(201).json(mapPalette(result.rows[0]));
  } catch (error) {
    console.error('createThemePreset:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deleteThemePreset = async (req, res) => {
  try {
    await ensureThemePaletteTables();
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM theme_color_presets WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Palette introuvable' });
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('deleteThemePreset:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const listThemeHistory = async (_req, res) => {
  try {
    await ensureThemePaletteTables();
    const result = await pool.query(
      `SELECT * FROM theme_color_history ORDER BY created_at DESC, id DESC LIMIT 40`
    );
    res.json(result.rows.map(mapPalette));
  } catch (error) {
    console.error('listThemeHistory:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deleteThemeHistoryEntry = async (req, res) => {
  try {
    await ensureThemePaletteTables();
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM theme_color_history WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entrée d’historique introuvable' });
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('deleteThemeHistoryEntry:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const clearThemeHistory = async (_req, res) => {
  try {
    await ensureThemePaletteTables();
    await pool.query('DELETE FROM theme_color_history');
    res.json({ ok: true });
  } catch (error) {
    console.error('clearThemeHistory:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
