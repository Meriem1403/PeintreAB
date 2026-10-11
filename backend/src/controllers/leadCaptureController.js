import pool from '../config/database.js';

const PRIVACY_VERSION = process.env.PRIVACY_POLICY_VERSION || '2026-03';

export async function ensureVisitorLeadsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS visitor_leads (
      id SERIAL PRIMARY KEY,
      visitor_id INTEGER NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
      work_id INTEGER REFERENCES works(id) ON DELETE SET NULL,
      source VARCHAR(40) NOT NULL DEFAULT 'qr_event',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS visitor_leads_visitor_idx ON visitor_leads (visitor_id)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS visitor_leads_work_idx ON visitor_leads (work_id)
  `);
}

/** Infos publiques pour préremplir le formulaire (titre événement). */
export const getLeadCaptureMeta = async (req, res) => {
  try {
    await ensureVisitorLeadsTable();
    const eventId = req.query.event ? parseInt(req.query.event, 10) : null;
    if (!eventId) {
      return res.json({
        title: 'Restons en contact',
        subtitle: 'Laissez vos coordonnées pour être informé des prochaines expositions.',
        event: null,
      });
    }

    const result = await pool.query(
      `SELECT id, titre, date_debut, date_fin, lieu, type
       FROM works WHERE id = $1 AND type = 'evenements'`,
      [eventId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Événement introuvable' });
    }
    const ev = result.rows[0];
    return res.json({
      title: ev.titre,
      subtitle: 'Laissez vos coordonnées — nous vous recontacterons pour cet événement et les suivants.',
      event: {
        id: ev.id,
        titre: ev.titre,
        date_debut: ev.date_debut,
        date_fin: ev.date_fin,
        lieu: ev.lieu,
      },
    });
  } catch (error) {
    console.error('getLeadCaptureMeta:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/** Capture rapide de contact via QR (salon / vernissage). */
export const captureVisitorLead = async (req, res) => {
  try {
    await ensureVisitorLeadsTable();

    const {
      email,
      first_name,
      last_name,
      phone,
      accept_privacy,
      marketing_opt_in,
      event_id: eventIdRaw,
    } = req.body || {};

    if (!email || !first_name || !last_name) {
      return res.status(400).json({ error: 'Prénom, nom et email sont requis' });
    }
    if (!accept_privacy) {
      return res.status(400).json({ error: 'Merci d’accepter la politique de confidentialité' });
    }

    const emailNorm = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
      return res.status(400).json({ error: 'Email invalide' });
    }

    let workId = eventIdRaw != null && eventIdRaw !== '' ? parseInt(eventIdRaw, 10) : null;
    if (workId) {
      const ev = await pool.query(
        `SELECT id FROM works WHERE id = $1 AND type = 'evenements'`,
        [workId]
      );
      if (ev.rows.length === 0) {
        workId = null;
      }
    }

    const wantNews = marketing_opt_in !== false;

    const visitorUpsert = await pool.query(
      `INSERT INTO visitors (email, first_name, last_name, phone, marketing_opt_in, marketing_consent_at, privacy_policy_version, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       ON CONFLICT (email)
       DO UPDATE SET
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         phone = COALESCE(EXCLUDED.phone, visitors.phone),
         marketing_opt_in = CASE WHEN EXCLUDED.marketing_opt_in THEN TRUE ELSE visitors.marketing_opt_in END,
         marketing_consent_at = CASE
           WHEN EXCLUDED.marketing_opt_in THEN COALESCE(visitors.marketing_consent_at, CURRENT_TIMESTAMP)
           ELSE visitors.marketing_consent_at
         END,
         privacy_policy_version = EXCLUDED.privacy_policy_version,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        emailNorm,
        String(first_name).trim(),
        String(last_name).trim(),
        phone ? String(phone).trim() : null,
        wantNews,
        wantNews ? new Date() : null,
        PRIVACY_VERSION,
      ]
    );

    const visitor = visitorUpsert.rows[0];

    /* Éviter les doublons QR le même jour pour le même événement */
    const recent = await pool.query(
      `SELECT id FROM visitor_leads
       WHERE visitor_id = $1
         AND COALESCE(work_id, 0) = COALESCE($2::int, 0)
         AND source = 'qr_event'
         AND created_at > NOW() - INTERVAL '12 hours'
       LIMIT 1`,
      [visitor.id, workId]
    );

    if (recent.rows.length === 0) {
      await pool.query(
        `INSERT INTO visitor_leads (visitor_id, work_id, source)
         VALUES ($1, $2, 'qr_event')`,
        [visitor.id, workId]
      );
    }

    res.status(201).json({
      ok: true,
      message: wantNews
        ? 'Merci ! Vos coordonnées sont enregistrées — vous serez informé des prochains événements.'
        : 'Merci ! Vos coordonnées sont enregistrées.',
    });
  } catch (error) {
    console.error('captureVisitorLead:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
