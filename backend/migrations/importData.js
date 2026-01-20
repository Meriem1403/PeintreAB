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

const importData = async () => {
  try {
    const importPath = process.argv[2] || path.join(__dirname, '../../data-export.json');
    
    if (!fs.existsSync(importPath)) {
      console.error(`❌ Fichier non trouvé: ${importPath}`);
      process.exit(1);
    }

    console.log(`📦 Import des données depuis: ${importPath}\n`);

    const importData = JSON.parse(fs.readFileSync(importPath, 'utf8'));

    // Vider les tables existantes (optionnel, commenté pour sécurité)
    const clearTables = process.argv.includes('--clear');
    
    if (clearTables) {
      console.log('🗑️  Suppression des données existantes...\n');
      await pool.query('TRUNCATE TABLE works, contacts, artist_info, contact_info, site_settings RESTART IDENTITY CASCADE');
      console.log('✅ Tables vidées\n');
    }

    // Importer les données
    let totalImported = 0;

    // Importer works
    if (importData.works && importData.works.length > 0) {
      console.log(`📝 Import de ${importData.works.length} œuvre(s)...`);
      for (const work of importData.works) {
        await pool.query(
          `INSERT INTO works (type, titre, description, prix, image, date, date_debut, date_fin, lieu, adresse, is_sold, is_featured, display_order, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           ON CONFLICT (id) DO UPDATE SET
             type = EXCLUDED.type,
             titre = EXCLUDED.titre,
             description = EXCLUDED.description,
             prix = EXCLUDED.prix,
             image = EXCLUDED.image,
             date = EXCLUDED.date,
             date_debut = EXCLUDED.date_debut,
             date_fin = EXCLUDED.date_fin,
             lieu = EXCLUDED.lieu,
             adresse = EXCLUDED.adresse,
             is_sold = EXCLUDED.is_sold,
             is_featured = EXCLUDED.is_featured,
             display_order = EXCLUDED.display_order,
             updated_at = EXCLUDED.updated_at`,
          [
            work.type, work.titre, work.description, work.prix, work.image,
            work.date, work.date_debut, work.date_fin, work.lieu, work.adresse,
            work.is_sold || false, work.is_featured || false,
            work.display_order !== undefined && work.display_order !== null ? work.display_order : null,
            work.created_at || new Date().toISOString(),
            work.updated_at || new Date().toISOString()
          ]
        );
      }
      totalImported += importData.works.length;
      console.log(`✅ ${importData.works.length} œuvre(s) importée(s)\n`);
    }

    // Importer artist_info
    if (importData.artist_info && importData.artist_info.length > 0) {
      console.log(`📝 Import des informations artiste...`);
      const artistInfo = importData.artist_info[0];
      await pool.query(
        `INSERT INTO artist_info (photo, biographie, updated_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET
           photo = EXCLUDED.photo,
           biographie = EXCLUDED.biographie,
           updated_at = EXCLUDED.updated_at`,
        [artistInfo.photo, artistInfo.biographie, artistInfo.updated_at || new Date().toISOString()]
      );
      totalImported++;
      console.log(`✅ Informations artiste importées\n`);
    }

    // Importer contact_info
    if (importData.contact_info && importData.contact_info.length > 0) {
      console.log(`📝 Import des informations de contact...`);
      const contactInfo = importData.contact_info[0];
      await pool.query(
        `INSERT INTO contact_info (email, phone, facebook_name, facebook_url, instagram_name, instagram_url, website_name, website_url, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           email = EXCLUDED.email,
           phone = EXCLUDED.phone,
           facebook_name = EXCLUDED.facebook_name,
           facebook_url = EXCLUDED.facebook_url,
           instagram_name = EXCLUDED.instagram_name,
           instagram_url = EXCLUDED.instagram_url,
           website_name = EXCLUDED.website_name,
           website_url = EXCLUDED.website_url,
           updated_at = EXCLUDED.updated_at`,
        [
          contactInfo.email, contactInfo.phone,
          contactInfo.facebook_name, contactInfo.facebook_url,
          contactInfo.instagram_name, contactInfo.instagram_url,
          contactInfo.website_name, contactInfo.website_url,
          contactInfo.updated_at || new Date().toISOString()
        ]
      );
      totalImported++;
      console.log(`✅ Informations de contact importées\n`);
    }

    // Importer site_settings
    if (importData.site_settings && importData.site_settings.length > 0) {
      console.log(`📝 Import des paramètres du site...`);
      const siteSettings = importData.site_settings[0];
      await pool.query(
        `INSERT INTO site_settings (hero_image, updated_at)
         VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET
           hero_image = EXCLUDED.hero_image,
           updated_at = EXCLUDED.updated_at`,
        [siteSettings.hero_image, siteSettings.updated_at || new Date().toISOString()]
      );
      totalImported++;
      console.log(`✅ Paramètres du site importés\n`);
    }

    console.log(`✅ Import terminé: ${totalImported} enregistrement(s) importé(s)`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error);
    throw error;
  }
};

importData()
  .then(() => {
    console.log('\n✅ Import terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });
