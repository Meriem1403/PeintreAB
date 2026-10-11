import crypto from 'crypto';
import { getJwtSecret } from './security.js';

const ALGO = 'aes-256-gcm';

const deriveKey = () => {
  const material = process.env.SMTP_ENCRYPTION_KEY || getJwtSecret();
  return crypto.createHash('sha256').update(String(material)).digest();
};

/** Chiffre une chaîne (mot de passe d’application). Jamais loggé. */
export const encryptSecret = (plain) => {
  const text = String(plain || '');
  if (!text) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, deriveKey(), iv);
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
};

export const decryptSecret = (payload) => {
  if (!payload || typeof payload !== 'string') return null;
  const [ivHex, tagHex, dataHex] = payload.split(':');
  if (!ivHex || !tagHex || !dataHex) return null;
  const decipher = crypto.createDecipheriv(ALGO, deriveKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]);
  return dec.toString('utf8');
};

export const maskEmail = (email) => {
  const value = String(email || '');
  const at = value.indexOf('@');
  if (at < 2) return '•••';
  return `${value[0]}•••${value.slice(at - 1)}`;
};
