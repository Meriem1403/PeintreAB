import dotenv from 'dotenv';

dotenv.config();

const WEAK_JWT_SECRETS = new Set([
  '',
  'your-secret-key',
  'your-secret-key-change-in-production',
  'CHANGEZ_MOI_EN_PRODUCTION_AVEC_UNE_CLE_SECRETE_TRES_LONGUE_ET_ALEATOIRE',
]);

export const isProduction = () => process.env.NODE_ENV === 'production';

export const getJwtSecret = () => {
  const secret = String(process.env.JWT_SECRET || '').trim();
  if (!secret || WEAK_JWT_SECRETS.has(secret) || secret.length < 24) {
    if (isProduction()) {
      throw new Error(
        'JWT_SECRET manquant ou trop faible — définissez une clé aléatoire (≥ 24 caractères) dans backend/.env'
      );
    }
    console.warn('⚠️ JWT_SECRET faible — acceptable uniquement en développement local');
    return secret || 'dev-only-insecure-jwt-secret-do-not-use';
  }
  return secret;
};

export const getJwtExpiresIn = () => process.env.JWT_EXPIRES_IN || '12h';

export const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

export const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));

export const getFrontendUrl = () =>
  String(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
