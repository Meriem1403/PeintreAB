import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import workRoutes from './routes/workRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import artistRoutes from './routes/artistRoutes.js';
import contactInfoRoutes from './routes/contactInfoRoutes.js';
import siteSettingsRoutes from './routes/siteSettingsRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import pool from './config/database.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:5173'] : 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/images', express.static(path.join(publicDir, 'images')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/works', workRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/artist', artistRoutes);
app.use('/api/contact-info', contactInfoRoutes);
app.use('/api/site-settings', siteSettingsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/events', eventRoutes);

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API fonctionnelle' });
});

// Test de connexion à la base de données
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'OK', database: 'Connecté', time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', database: 'Non connecté', error: error.message });
  }
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erreur serveur' });
});

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur backend démarré sur le port ${PORT}`);
  console.log(`📡 API disponible sur http://localhost:${PORT}/api`);
});
