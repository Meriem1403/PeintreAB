import pool from '../config/database.js';

let tableReady = false;

export const ensureSiteAnalyticsTable = async () => {
  if (tableReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_analytics_hits (
      id BIGSERIAL PRIMARY KEY,
      session_id VARCHAR(64) NOT NULL,
      path VARCHAR(300),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_site_analytics_hits_created
      ON site_analytics_hits (created_at DESC)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_site_analytics_hits_session
      ON site_analytics_hits (session_id)
  `);
  tableReady = true;
};

const normalizeSessionId = (value) => {
  const raw = String(value || '').trim().slice(0, 64);
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(raw)) return null;
  return raw;
};

const normalizePath = (value) => {
  let path = String(value || '/').trim().slice(0, 300);
  if (!path.startsWith('/')) path = `/${path}`;
  if (
    path.startsWith('/admin') ||
    path.startsWith('/login') ||
    path.startsWith('/api') ||
    path.startsWith('/billet')
  ) {
    return null;
  }
  return path;
};

/** Enregistre une visite (public, anti-spam léger par session). */
export const recordSiteVisit = async (req, res) => {
  try {
    await ensureSiteAnalyticsTable();
    const sessionId = normalizeSessionId(req.body?.sessionId);
    const path = normalizePath(req.body?.path);
    if (!sessionId || !path) {
      return res.status(400).json({ error: 'sessionId ou path invalide' });
    }

    // Max 1 hit / session / 20 s (évite le spam de refresh)
    const recent = await pool.query(
      `SELECT id FROM site_analytics_hits
       WHERE session_id = $1 AND created_at > NOW() - INTERVAL '20 seconds'
       LIMIT 1`,
      [sessionId]
    );
    if (recent.rows.length > 0) {
      return res.json({ ok: true, counted: false });
    }

    await pool.query(
      `INSERT INTO site_analytics_hits (session_id, path) VALUES ($1, $2)`,
      [sessionId, path]
    );
    return res.json({ ok: true, counted: true });
  } catch (error) {
    console.error('recordSiteVisit:', error);
    return res.status(500).json({ error: 'Erreur enregistrement visite' });
  }
};

/** Stats pour l’admin. */
export const getSiteVisitStats = async (req, res) => {
  try {
    await ensureSiteAnalyticsTable();

    const [totals, today, week, last7] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)::int AS page_views,
          COUNT(DISTINCT session_id)::int AS visitors
        FROM site_analytics_hits
      `),
      pool.query(`
        SELECT
          COUNT(*)::int AS page_views,
          COUNT(DISTINCT session_id)::int AS visitors
        FROM site_analytics_hits
        WHERE created_at >= date_trunc('day', NOW())
      `),
      pool.query(`
        SELECT
          COUNT(*)::int AS page_views,
          COUNT(DISTINCT session_id)::int AS visitors
        FROM site_analytics_hits
        WHERE created_at >= NOW() - INTERVAL '7 days'
      `),
      pool.query(`
        SELECT
          to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
          COUNT(*)::int AS page_views,
          COUNT(DISTINCT session_id)::int AS visitors
        FROM site_analytics_hits
        WHERE created_at >= date_trunc('day', NOW()) - INTERVAL '6 days'
        GROUP BY 1
        ORDER BY 1 ASC
      `),
    ]);

    res.json({
      totalVisitors: totals.rows[0]?.visitors || 0,
      totalPageViews: totals.rows[0]?.page_views || 0,
      todayVisitors: today.rows[0]?.visitors || 0,
      todayPageViews: today.rows[0]?.page_views || 0,
      weekVisitors: week.rows[0]?.visitors || 0,
      weekPageViews: week.rows[0]?.page_views || 0,
      last7Days: last7.rows,
    });
  } catch (error) {
    console.error('getSiteVisitStats:', error);
    res.status(500).json({ error: 'Erreur lecture statistiques' });
  }
};
