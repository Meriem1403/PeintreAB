import pool from '../src/config/database.js';

const createTables = async () => {
  try {
    // Table users (pour l'authentification admin)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table works (œuvres : peintures, croquis, événements)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS works (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL CHECK (type IN ('peintures', 'croquis', 'evenements')),
        titre VARCHAR(255) NOT NULL,
        description TEXT,
        prix VARCHAR(50),
        image VARCHAR(500),
        date DATE,
        lieu VARCHAR(255),
        is_sold BOOLEAN DEFAULT FALSE,
        is_featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ajouter les colonnes si elles n'existent pas (pour les tables déjà créées)
    try {
      await pool.query(`
        ALTER TABLE works 
        ADD COLUMN IF NOT EXISTS is_sold BOOLEAN DEFAULT FALSE
      `);
      await pool.query(`
        ALTER TABLE works 
        ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE
      `);
      await pool.query(`
        ALTER TABLE works 
        ADD COLUMN IF NOT EXISTS date_debut DATE
      `);
      await pool.query(`
        ALTER TABLE works 
        ADD COLUMN IF NOT EXISTS date_fin DATE
      `);
      await pool.query(`
        ALTER TABLE works 
        ADD COLUMN IF NOT EXISTS adresse VARCHAR(500)
      `);
      await pool.query(`
        ALTER TABLE works 
        ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0
      `);
      console.log('✅ Colonnes is_sold, is_featured, date_debut, date_fin, adresse et display_order ajoutées/vérifiées');
    } catch (error) {
      // Les colonnes existent déjà ou erreur, on continue
      console.log('ℹ️ Vérification des colonnes is_sold, is_featured, date_debut et date_fin');
    }

    // Table contacts (pour les messages/contact via le formulaire)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255),
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table artist_info (pour la photo et biographie de l'artiste)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS artist_info (
        id SERIAL PRIMARY KEY,
        photo VARCHAR(500) DEFAULT '/images/accueil.jpg',
        biographie TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insérer une entrée par défaut si elle n'existe pas
    const artistInfoCheck = await pool.query('SELECT * FROM artist_info LIMIT 1');
    if (artistInfoCheck.rows.length === 0) {
      await pool.query(`
        INSERT INTO artist_info (photo, biographie)
        VALUES (
          '/images/accueil.jpg',
          'Alexandre Bindl est un artiste peintre passionné par la représentation de la beauté et de l''émotion à travers ses œuvres. Son travail explore les nuances de la lumière, les textures et les expressions humaines avec une sensibilité particulière.

Formé dans les techniques classiques de la peinture à l''huile, Alexandre développe un style unique qui allie tradition et modernité. Ses portraits et paysages capturent l''essence de ses sujets avec une profondeur émotionnelle remarquable.

À travers ses peintures, croquis et participations à divers événements, Alexandre Bindl partage sa vision artistique et invite le spectateur à découvrir le monde à travers ses yeux.'
        )
      `);
      console.log('✅ Informations artiste par défaut créées');
    }

    // Table contact_info (pour les informations de contact)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_info (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) DEFAULT 'alexandre.bindl@gmail.com',
        phone VARCHAR(50) DEFAULT '06 32 00 12 28',
        facebook_name VARCHAR(255) DEFAULT 'Alexandre Bindl - Artiste Peintre',
        facebook_url VARCHAR(500) DEFAULT 'https://www.facebook.com/AlexandreBindlArtistePeintre',
        instagram_name VARCHAR(255) DEFAULT 'Alexandre_Bindl',
        instagram_url VARCHAR(500) DEFAULT 'https://www.instagram.com/Alexandre_Bindl',
        website_name VARCHAR(255) DEFAULT 'www.alexandre-bindl.fr',
        website_url VARCHAR(500) DEFAULT 'http://www.alexandre-bindl.fr',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insérer une entrée par défaut si elle n'existe pas
    const contactInfoCheck = await pool.query('SELECT * FROM contact_info LIMIT 1');
    if (contactInfoCheck.rows.length === 0) {
      await pool.query(`
        INSERT INTO contact_info (email, phone, facebook_name, facebook_url, instagram_name, instagram_url, website_name, website_url)
        VALUES (
          'alexandre.bindl@gmail.com',
          '06 32 00 12 28',
          'Alexandre Bindl - Artiste Peintre',
          'https://www.facebook.com/AlexandreBindlArtistePeintre',
          'Alexandre_Bindl',
          'https://www.instagram.com/Alexandre_Bindl',
          'www.alexandre-bindl.fr',
          'http://www.alexandre-bindl.fr'
        )
      `);
      console.log('✅ Informations de contact par défaut créées');
    }

    // Table site_settings (pour les paramètres du site comme l'image du hero)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id SERIAL PRIMARY KEY,
        hero_image VARCHAR(500) DEFAULT '/images/peintures/2025-2-le-cours.jpg',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insérer une entrée par défaut si elle n'existe pas
    const siteSettingsCheck = await pool.query('SELECT * FROM site_settings LIMIT 1');
    if (siteSettingsCheck.rows.length === 0) {
      await pool.query(`
        INSERT INTO site_settings (hero_image)
        VALUES ('/images/peintures/2025-2-le-cours.jpg')
      `);
      console.log('✅ Paramètres du site par défaut créés');
    }

    console.log('✅ Tables créées avec succès');

    // Ajouter work_id à la table contacts si elle n'existe pas
    try {
      await pool.query(`
        ALTER TABLE contacts 
        ADD COLUMN IF NOT EXISTS work_id INTEGER REFERENCES works(id) ON DELETE SET NULL
      `);
      console.log('✅ Colonne work_id ajoutée/vérifiée dans la table contacts');
    } catch (error) {
      console.log('ℹ️ Vérification de la colonne work_id dans contacts');
    }

    // Créer un utilisateur admin par défaut si aucun n'existe
    const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
    
    if (userCheck.rows.length === 0) {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash('admin123', 10);
      await pool.query(
        'INSERT INTO users (username, password_hash, email) VALUES ($1, $2, $3)',
        ['admin', hashedPassword, 'admin@alexandrebindl.com']
      );
      console.log('✅ Utilisateur admin créé (username: admin, password: admin123)');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la création des tables:', error);
    throw error;
  }
};

createTables()
  .then(() => {
    console.log('✅ Migration terminée');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur de migration:', error);
    process.exit(1);
  });
