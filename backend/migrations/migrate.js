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

    await pool.query(`
      ALTER TABLE site_settings
      ADD COLUMN IF NOT EXISTS primary_color VARCHAR(20) DEFAULT '#C6AC8F',
      ADD COLUMN IF NOT EXISTS accent_color VARCHAR(20) DEFAULT '#B89A7A',
      ADD COLUMN IF NOT EXISTS navbar_color VARCHAR(20) DEFAULT '#C6AC8F'
    `);
    console.log('✅ Colonnes de thème ajoutées/vérifiées dans site_settings');

    await pool.query(`
      ALTER TABLE site_settings
      ADD COLUMN IF NOT EXISTS atelier_hero_eyebrow VARCHAR(120) DEFAULT 'Espace de création',
      ADD COLUMN IF NOT EXISTS atelier_hero_title_line1 VARCHAR(120) DEFAULT 'Entrer',
      ADD COLUMN IF NOT EXISTS atelier_hero_title_line2_prefix VARCHAR(120) DEFAULT 'dans la ',
      ADD COLUMN IF NOT EXISTS atelier_hero_title_emphasis VARCHAR(80) DEFAULT 'couleur',
      ADD COLUMN IF NOT EXISTS atelier_hero_lead_prefix TEXT DEFAULT 'Peintures et croquis choisis comme on ouvre un ',
      ADD COLUMN IF NOT EXISTS atelier_hero_lead_emphasis VARCHAR(80) DEFAULT 'carnet',
      ADD COLUMN IF NOT EXISTS atelier_hero_lead_suffix TEXT DEFAULT ' — lentement, sans vitrine.'
    `);
    console.log('✅ Colonnes texte hero Atelier ajoutées/vérifiées dans site_settings');

    await pool.query(`
      ALTER TABLE site_settings
      ADD COLUMN IF NOT EXISTS atelier_events_index VARCHAR(80) DEFAULT 'Agenda',
      ADD COLUMN IF NOT EXISTS atelier_events_title VARCHAR(200) DEFAULT 'Rencontres & expositions',
      ADD COLUMN IF NOT EXISTS atelier_events_intro TEXT DEFAULT 'Vernissages, salons et parcours commentés — faites défiler les prochaines dates.',
      ADD COLUMN IF NOT EXISTS atelier_works_index VARCHAR(80) DEFAULT 'Sélection',
      ADD COLUMN IF NOT EXISTS atelier_works_title VARCHAR(200) DEFAULT 'Œuvres choisies',
      ADD COLUMN IF NOT EXISTS atelier_works_intro TEXT DEFAULT 'Un carrousel de toiles et croquis — chaque slide révèle une nouvelle présence au mur.'
    `);
    console.log('✅ Colonnes texte sections Atelier ajoutées/vérifiées dans site_settings');

    await pool.query(`
      ALTER TABLE site_settings
      ADD COLUMN IF NOT EXISTS public_site_url VARCHAR(500)
    `);
    console.log('✅ Colonne public_site_url vérifiée dans site_settings');

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

    // Billetterie événements
    await pool.query(`
      ALTER TABLE works
      ADD COLUMN IF NOT EXISTS ticket_mode VARCHAR(24) DEFAULT 'closed',
      ADD COLUMN IF NOT EXISTS ticket_capacity INTEGER
    `);
    console.log('✅ Colonnes billetterie ajoutées/vérifiées dans works');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS visitors (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        first_name VARCHAR(120) NOT NULL,
        last_name VARCHAR(120) NOT NULL,
        phone VARCHAR(50),
        marketing_opt_in BOOLEAN DEFAULT FALSE NOT NULL,
        marketing_consent_at TIMESTAMP,
        privacy_policy_version VARCHAR(32),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_registrations (
        id SERIAL PRIMARY KEY,
        work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
        visitor_id INTEGER NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
        ticket_code UUID NOT NULL,
        status VARCHAR(20) DEFAULT 'confirmed' NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(work_id, visitor_id),
        UNIQUE(ticket_code)
      )
    `);
    console.log('✅ Tables visitors et event_registrations créées/vérifiées');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_ticket_slots (
        id SERIAL PRIMARY KEY,
        work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
        label VARCHAR(200) NOT NULL,
        slot_date DATE,
        capacity_mode VARCHAR(16) NOT NULL DEFAULT 'limited',
        capacity INTEGER,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      ALTER TABLE event_registrations
      ADD COLUMN IF NOT EXISTS slot_id INTEGER REFERENCES event_ticket_slots(id) ON DELETE SET NULL
    `);

    await pool.query(`
      ALTER TABLE event_registrations
      DROP CONSTRAINT IF EXISTS event_registrations_work_id_visitor_id_key
    `);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS event_registrations_legacy_unique
      ON event_registrations (work_id, visitor_id)
      WHERE slot_id IS NULL
    `);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS event_registrations_slot_unique
      ON event_registrations (work_id, visitor_id, slot_id)
      WHERE slot_id IS NOT NULL
    `);

    await pool.query(`
      ALTER TABLE event_registrations
      ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP
    `);
    console.log('✅ Colonne checked_in_at vérifiée sur event_registrations');

    await pool.query(`
      ALTER TABLE event_registrations
      ADD COLUMN IF NOT EXISTS party_size INTEGER NOT NULL DEFAULT 1
    `);
    console.log('✅ Colonne party_size vérifiée sur event_registrations');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_registration_tickets (
        id SERIAL PRIMARY KEY,
        registration_id INTEGER NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
        ticket_code UUID NOT NULL UNIQUE,
        ticket_index INTEGER NOT NULL,
        checked_in_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(registration_id, ticket_index)
      )
    `);
    console.log('✅ Table event_registration_tickets créée/vérifiée');

    const regsForTickets = await pool.query(
      `SELECT id, ticket_code, party_size, checked_in_at FROM event_registrations`
    );
    for (const reg of regsForTickets.rows) {
      const total = Math.max(1, Number(reg.party_size) || 1);
      for (let idx = 1; idx <= total; idx += 1) {
        const code =
          idx === 1
            ? reg.ticket_code
            : (await import('crypto')).default.randomUUID();
        await pool.query(
          `INSERT INTO event_registration_tickets (registration_id, ticket_code, ticket_index, checked_in_at)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (registration_id, ticket_index) DO NOTHING`,
          [reg.id, code, idx, idx === 1 ? reg.checked_in_at : null]
        );
      }
    }
    if (regsForTickets.rows.length > 0) {
      console.log('✅ Billets individuels (QR) synchronisés pour les inscriptions existantes');
    }

    console.log('✅ Tables créneaux billetterie créées/vérifiées');

    const { migrateLegacyTicketToSlots } = await import('../src/services/ticketSlots.js');
    const legacyEvents = await pool.query(
      `SELECT * FROM works WHERE type = 'evenements' AND ticket_mode NOT IN ('closed', 'open')`
    );
    for (const row of legacyEvents.rows) {
      await migrateLegacyTicketToSlots(row);
    }
    if (legacyEvents.rows.length > 0) {
      console.log(`✅ ${legacyEvents.rows.length} événement(s) migré(s) vers créneaux billetterie`);
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
