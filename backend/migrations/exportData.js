import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbConfig = {
  host: process.env.DB_HOST === 'postgres' ? 'localhost' : (process.env.DB_HOST || 'localhost'),
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'peintreab_db',
  user: process.env.DB_USER || 'peintreab_user',
  password: process.env.DB_PASSWORD || 'peintreab_password',
};

const pool = new pg.Pool(dbConfig);

const exportData = async () => {
  try {
    console.log('📦 Export des données de la base de données...\n');

    // Exporter toutes les tables
    const tables = ['works', 'users', 'contacts', 'artist_info', 'contact_info', 'site_settings'];
    const exportData = {};

    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT * FROM ${table}`);
        exportData[table] = result.rows;
        console.log(`✅ ${table}: ${result.rows.length} enregistrement(s)`);
      } catch (error) {
        console.log(`⚠️  Table ${table} non trouvée ou erreur: ${error.message}`);
        exportData[table] = [];
      }
    }

    // Sauvegarder dans un fichier JSON
    const exportPath = path.join(__dirname, '../../data-export.json');
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2), 'utf8');

    console.log(`\n✅ Données exportées avec succès dans: ${exportPath}`);
    console.log(`\n📊 Résumé:`);
    Object.keys(exportData).forEach(table => {
      console.log(`   - ${table}: ${exportData[table].length} enregistrement(s)`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'export:', error);
    throw error;
  }
};

exportData()
  .then(() => {
    console.log('\n✅ Export terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });
