import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const isProduction = process.env.NODE_ENV === 'production';
const dbPassword = process.env.DB_PASSWORD;

if (isProduction && (!dbPassword || dbPassword === 'peintreab_password')) {
  // Ne plus exit(1) : ça coupait tout le site NAS. Avertir seulement.
  console.warn(
    '⚠️ DB_PASSWORD faible ou par défaut — changez-le dans backend/.env quand possible'
  );
}

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'peintreab_db',
  user: process.env.DB_USER || 'peintreab_user',
  password: dbPassword || 'peintreab_password',
});

pool.on('connect', () => {
  console.log('✅ Connecté à la base de données PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erreur de connexion à la base de données:', err);
});

export default pool;
