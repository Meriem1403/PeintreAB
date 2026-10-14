import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import workRoutes from './routes/workRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import artistRoutes from './routes/artistRoutes.js';
import contactInfoRoutes from './routes/contactInfoRoutes.js';
import siteSettingsRoutes from './routes/siteSettingsRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import galleryCategoryRoutes from './routes/galleryCategoryRoutes.js';
import themePaletteRoutes from './routes/themePaletteRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import smtpRoutes from './routes/smtpRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { getJwtSecret, isProduction } from './utils/security.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');

dotenv.config();

try {
  getJwtSecret();
} catch (error) {
  console.error(`❌ ${error.message}`);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

if (isProduction()) {
  app.set('trust proxy', 1);
}

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
);

const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
const extraCorsOrigins = String(process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

const corsOrigins = [
  ...new Set(
    [
      frontendUrl,
      ...extraCorsOrigins,
      'https://www.alexandre-bindl.fr',
      'https://alexandre-bindl.fr',
      'http://www.alexandre-bindl.fr',
      'http://alexandre-bindl.fr',
      'http://82.66.116.200:5173',
      'http://www.alexandre-bindl.fr:5173',
      ...(isProduction()
        ? []
        : ['http://localhost:5173', 'http://127.0.0.1:5173']),
    ].filter(Boolean)
  ),
];

const allowedCorsHosts = new Set(
  corsOrigins
    .map((o) => {
      try {
        return new URL(o).hostname;
      } catch {
        return null;
      }
    })
    .filter(Boolean)
);

const isAllowedCorsOrigin = (origin) => {
  if (!origin) return true;
  const normalized = origin.replace(/\/$/, '');
  if (corsOrigins.includes(normalized)) return true;
  try {
    const host = new URL(origin).hostname.toLowerCase();
    if (allowedCorsHosts.has(host)) return true;
    if (host === 'alexandre-bindl.fr' || host.endsWith('.alexandre-bindl.fr')) {
      return true;
    }
    if (host === '82.66.116.200' || host === 'localhost' || host === '127.0.0.1') {
      return true;
    }
  } catch {
    return false;
  }
  return false;
};

console.log('🔒 CORS origins:', corsOrigins.join(', ') || '(aucune)');

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedCorsOrigin(origin)) {
        return callback(null, true);
      }
      // Site mono-artiste : ne pas bloquer l’admin si l’origine est inattendue
      console.warn('⚠️ CORS : origine non listée, autorisée quand même :', origin);
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use('/images', express.static(path.join(publicDir, 'images')));

app.use('/api/auth', authRoutes);
app.use('/api/works', workRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/artist', artistRoutes);
app.use('/api/contact-info', contactInfoRoutes);
app.use('/api/site-settings', siteSettingsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/gallery-categories', galleryCategoryRoutes);
app.use('/api/theme-palettes', themePaletteRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/smtp', smtpRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API fonctionnelle',
    cors: 'open-v3',
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack || err.message || err);
  if (err.message === 'Origine CORS non autorisée') {
    return res.status(403).json({ error: 'Origine non autorisée' });
  }
  res.status(500).json({ error: 'Erreur serveur' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur backend démarré sur le port ${PORT}`);
  console.log(`📡 API disponible sur http://localhost:${PORT}/api`);
});
