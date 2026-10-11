import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const keyGenerator = (req) => ipKeyGenerator(req.ip || req.socket?.remoteAddress || 'unknown');

export const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: { error: 'Trop de tentatives de connexion. Réessayez plus tard.' },
});

export const authResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: { error: 'Trop de demandes. Réessayez plus tard.' },
});

export const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: { error: 'Trop de messages envoyés. Réessayez plus tard.' },
});

export const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: { error: 'Trop de requêtes.' },
});
