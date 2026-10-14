import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const keyGenerator = (req) => ipKeyGenerator(req.ip || req.socket?.remoteAddress || 'unknown');

export const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: { error: 'Trop de tentatives de connexion. Réessayez plus tard.' },
});

export const authResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: { error: 'Trop de demandes. Réessayez plus tard.' },
});

/** Validation d’un lien (GET) — plus souple : React StrictMode double les appels. */
export const tokenValidateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: { error: 'Trop de vérifications. Réessayez dans quelques minutes.' },
});

/** Finalisation d’un lien (POST SMTP setup). */
export const tokenCompleteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: { error: 'Trop de tentatives. Réessayez plus tard.' },
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
