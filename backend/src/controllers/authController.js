import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { sendPasswordResetEmail } from '../services/emailService.js';
import {
  getFrontendUrl,
  getJwtExpiresIn,
  getJwtSecret,
  isValidEmail,
  normalizeEmail,
} from '../utils/security.js';

const MIN_PASSWORD_LENGTH = 8;

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const login = async (req, res) => {
  try {
    const rawEmail = req.body?.email ?? req.body?.username;
    const password = req.body?.password;

    if (!rawEmail || !password) {
      return res.status(400).json({ error: 'E-mail et mot de passe requis' });
    }

    const email = normalizeEmail(rawEmail);
    if (!isValidEmail(email)) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      getJwtSecret(),
      { expiresIn: getJwtExpiresIn() }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la connexion' });
  }
};

export const forgotPassword = async (req, res) => {
  const generic = {
    message:
      'Si un compte existe pour cet e-mail, un lien de réinitialisation a été envoyé.',
  };

  try {
    const email = normalizeEmail(req.body?.email);
    if (!isValidEmail(email)) {
      return res.json(generic);
    }

    const result = await pool.query(
      'SELECT id, email FROM users WHERE LOWER(email) = $1 LIMIT 1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.json(generic);
    }

    const user = result.rows[0];
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await pool.query(
      `UPDATE password_reset_tokens SET used_at = NOW()
       WHERE user_id = $1 AND used_at IS NULL AND expires_at > NOW()`,
      [user.id]
    );

    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt]
    );

    const resetUrl = `${getFrontendUrl()}/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail({ to: user.email, resetUrl });

    return res.json(generic);
  } catch (error) {
    console.error('forgotPassword:', error);
    return res.json(generic);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const token = String(req.body?.token || '').trim();
    const password = String(req.body?.password || '');

    if (!token || token.length < 32) {
      return res.status(400).json({ error: 'Lien de réinitialisation invalide' });
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        error: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères`,
      });
    }

    const tokenHash = hashToken(token);
    const result = await pool.query(
      `SELECT t.id AS token_id, t.user_id, t.expires_at, t.used_at
       FROM password_reset_tokens t
       WHERE t.token_hash = $1
       LIMIT 1`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Lien de réinitialisation invalide ou expiré' });
    }

    const row = result.rows[0];
    if (row.used_at || new Date(row.expires_at) <= new Date()) {
      return res.status(400).json({ error: 'Lien de réinitialisation invalide ou expiré' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // IMPORTANT : un client dédié — pool.query(BEGIN/COMMIT) sur des connexions
    // différentes ne committait jamais le nouveau hash → admin123 restait valide.
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const updated = await client.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, email',
        [passwordHash, row.user_id]
      );
      if (updated.rowCount !== 1) {
        throw new Error('Utilisateur introuvable pour la réinitialisation');
      }
      await client.query(
        'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1',
        [row.token_id]
      );
      await client.query(
        `UPDATE password_reset_tokens SET used_at = NOW()
         WHERE user_id = $1 AND used_at IS NULL AND id <> $2`,
        [row.user_id, row.token_id]
      );
      await client.query('COMMIT');
      console.log(`🔐 Mot de passe réinitialisé pour ${updated.rows[0].email}`);
    } catch (err) {
      try {
        await client.query('ROLLBACK');
      } catch {
        /* ignore */
      }
      throw err;
    } finally {
      client.release();
    }

    res.json({ message: 'Mot de passe mis à jour. Vous pouvez vous connecter.' });
  } catch (error) {
    console.error('resetPassword:', error);
    res.status(500).json({ error: 'Erreur lors de la réinitialisation' });
  }
};

/** Change le mot de passe du compte connecté (sans e-mail). */
export const changePassword = async (req, res) => {
  try {
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mot de passe actuel et nouveau requis' });
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        error: `Le nouveau mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères`,
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const result = await pool.query(
      'SELECT id, email, password_hash FROM users WHERE id = $1 LIMIT 1',
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Utilisateur introuvable' });
    }

    const user = result.rows[0];
    const ok = await bcrypt.compare(currentPassword, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
      passwordHash,
      user.id,
    ]);

    console.log(`🔐 Mot de passe changé (connecté) pour ${user.email}`);
    res.json({ message: 'Mot de passe mis à jour.' });
  } catch (error) {
    console.error('changePassword:', error);
    res.status(500).json({ error: 'Erreur lors du changement de mot de passe' });
  }
};
