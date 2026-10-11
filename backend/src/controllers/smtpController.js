import crypto from 'crypto';
import pool from '../config/database.js';
import { decryptSecret, encryptSecret, maskEmail } from '../utils/secretBox.js';
import { getFrontendUrl, isValidEmail, normalizeEmail } from '../utils/security.js';
import { reloadMailTransport } from '../services/emailService.js';

let tablesReady = false;

export const ensureSmtpTables = async () => {
  if (tablesReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS smtp_settings (
      id SERIAL PRIMARY KEY,
      host VARCHAR(255) NOT NULL DEFAULT 'smtp.gmail.com',
      port INTEGER NOT NULL DEFAULT 587,
      user_email VARCHAR(255) NOT NULL,
      password_cipher TEXT NOT NULL,
      from_email VARCHAR(255),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS smtp_setup_tokens (
      id SERIAL PRIMARY KEY,
      token_hash VARCHAR(128) NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  tablesReady = true;
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const publicStatus = (row) => {
  if (!row) {
    return {
      configured: false,
      host: 'smtp.gmail.com',
      port: 587,
      user_email: null,
      user_email_masked: null,
      from_email: null,
      updated_at: null,
    };
  }
  return {
    configured: true,
    host: row.host,
    port: row.port,
    user_email: row.user_email,
    user_email_masked: maskEmail(row.user_email),
    from_email: row.from_email || row.user_email,
    updated_at: row.updated_at,
  };
};

/** Config SMTP déchiffrée pour l’envoi (interne uniquement). */
export const getDecryptedSmtpConfig = async () => {
  await ensureSmtpTables();
  const result = await pool.query(
    'SELECT * FROM smtp_settings ORDER BY id DESC LIMIT 1'
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  const password = decryptSecret(row.password_cipher);
  if (!password) return null;
  return {
    host: row.host || 'smtp.gmail.com',
    port: Number(row.port) || 587,
    user: row.user_email,
    pass: password.replace(/\s+/g, ''),
    from: row.from_email || row.user_email,
  };
};

const upsertSmtp = async ({ host, port, userEmail, appPassword, fromEmail }) => {
  const cipher = encryptSecret(appPassword.replace(/\s+/g, ''));
  if (!cipher) throw new Error('Mot de passe invalide');

  const existing = await pool.query('SELECT id FROM smtp_settings ORDER BY id DESC LIMIT 1');
  if (existing.rows.length === 0) {
    await pool.query(
      `INSERT INTO smtp_settings (host, port, user_email, password_cipher, from_email)
       VALUES ($1, $2, $3, $4, $5)`,
      [host, port, userEmail, cipher, fromEmail]
    );
  } else {
    await pool.query(
      `UPDATE smtp_settings
       SET host = $1, port = $2, user_email = $3, password_cipher = $4,
           from_email = $5, updated_at = NOW()
       WHERE id = $6`,
      [host, port, userEmail, cipher, fromEmail, existing.rows[0].id]
    );
  }
  await reloadMailTransport();
};

export const getSmtpStatus = async (req, res) => {
  try {
    await ensureSmtpTables();
    const result = await pool.query(
      'SELECT host, port, user_email, from_email, updated_at FROM smtp_settings ORDER BY id DESC LIMIT 1'
    );
    res.json(publicStatus(result.rows[0] || null));
  } catch (error) {
    console.error('getSmtpStatus:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateSmtpSettings = async (req, res) => {
  try {
    await ensureSmtpTables();
    const userEmail = normalizeEmail(req.body?.user_email || req.body?.email);
    const appPassword = String(req.body?.app_password || req.body?.password || '').trim();
    const fromEmail = normalizeEmail(req.body?.from_email || userEmail);
    const host = String(req.body?.host || 'smtp.gmail.com').trim() || 'smtp.gmail.com';
    const port = parseInt(req.body?.port || '587', 10) || 587;

    if (!isValidEmail(userEmail)) {
      return res.status(400).json({ error: 'E-mail Gmail invalide' });
    }
    if (appPassword.length < 8) {
      return res.status(400).json({
        error: 'Mot de passe d’application requis (créé dans le compte Google)',
      });
    }

    await upsertSmtp({ host, port, userEmail, appPassword, fromEmail });
    const status = await pool.query(
      'SELECT host, port, user_email, from_email, updated_at FROM smtp_settings ORDER BY id DESC LIMIT 1'
    );
    res.json({
      message: 'Configuration e-mail enregistrée. Le mot de passe n’est jamais réaffichable.',
      ...publicStatus(status.rows[0]),
    });
  } catch (error) {
    console.error('updateSmtpSettings:', error);
    res.status(500).json({ error: 'Erreur lors de l’enregistrement' });
  }
};

/** Génère un lien à usage unique (le dev le copie et l’envoie à Alexandre). */
export const createSmtpSetupLink = async (req, res) => {
  try {
    await ensureSmtpTables();
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    await pool.query(
      `UPDATE smtp_setup_tokens SET used_at = NOW()
       WHERE used_at IS NULL AND expires_at > NOW()`
    );
    await pool.query(
      `INSERT INTO smtp_setup_tokens (token_hash, expires_at) VALUES ($1, $2)`,
      [tokenHash, expiresAt]
    );

    const setupUrl = `${getFrontendUrl()}/configurer-email?token=${rawToken}`;
    res.json({
      setupUrl,
      expiresAt,
      message:
        'Envoyez ce lien à Alexandre (WhatsApp / Signal). Il expire dans 48 h et ne peut servir qu’une fois. Le mot de passe saisi ne vous sera jamais visible.',
    });
  } catch (error) {
    console.error('createSmtpSetupLink:', error);
    res.status(500).json({ error: 'Impossible de créer le lien' });
  }
};

export const validateSmtpSetupToken = async (req, res) => {
  try {
    await ensureSmtpTables();
    const token = String(req.params.token || '').trim();
    if (token.length < 32) {
      return res.status(400).json({ valid: false, error: 'Lien invalide' });
    }
    const result = await pool.query(
      `SELECT id, expires_at, used_at FROM smtp_setup_tokens WHERE token_hash = $1 LIMIT 1`,
      [hashToken(token)]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ valid: false, error: 'Lien invalide ou expiré' });
    }
    const row = result.rows[0];
    if (row.used_at || new Date(row.expires_at) <= new Date()) {
      return res.status(400).json({ valid: false, error: 'Lien déjà utilisé ou expiré' });
    }
    res.json({
      valid: true,
      expiresAt: row.expires_at,
      suggestedEmail: 'alexandre.bindl@gmail.com',
    });
  } catch (error) {
    console.error('validateSmtpSetupToken:', error);
    res.status(500).json({ valid: false, error: 'Erreur serveur' });
  }
};

export const completeSmtpSetup = async (req, res) => {
  try {
    await ensureSmtpTables();
    const token = String(req.params.token || '').trim();
    const userEmail = normalizeEmail(req.body?.user_email || req.body?.email);
    const appPassword = String(req.body?.app_password || req.body?.password || '').trim();

    if (token.length < 32) {
      return res.status(400).json({ error: 'Lien invalide' });
    }
    if (!isValidEmail(userEmail)) {
      return res.status(400).json({ error: 'E-mail Gmail invalide' });
    }
    if (appPassword.length < 8) {
      return res.status(400).json({
        error: 'Collez le mot de passe d’application Google (16 caractères)',
      });
    }

    const tokenHash = hashToken(token);
    const result = await pool.query(
      `SELECT id, expires_at, used_at FROM smtp_setup_tokens WHERE token_hash = $1 LIMIT 1`,
      [tokenHash]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lien invalide ou expiré' });
    }
    const row = result.rows[0];
    if (row.used_at || new Date(row.expires_at) <= new Date()) {
      return res.status(400).json({ error: 'Lien déjà utilisé ou expiré' });
    }

    await upsertSmtp({
      host: 'smtp.gmail.com',
      port: 587,
      userEmail,
      appPassword,
      fromEmail: userEmail,
    });

    await pool.query('UPDATE smtp_setup_tokens SET used_at = NOW() WHERE id = $1', [
      row.id,
    ]);

    res.json({
      message:
        'Configuration enregistrée. Les e-mails du site utiliseront ce compte. Vous pouvez fermer cette page.',
      configured: true,
      user_email_masked: maskEmail(userEmail),
    });
  } catch (error) {
    console.error('completeSmtpSetup:', error);
    res.status(500).json({ error: 'Erreur lors de l’enregistrement' });
  }
};
