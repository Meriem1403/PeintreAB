import pg from 'pg';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Créer une connexion à la base de données
const dbConfig = {
  host: process.env.DB_HOST === 'postgres' ? 'localhost' : (process.env.DB_HOST || 'localhost'),
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'peintreab_db',
  user: process.env.DB_USER || 'peintreab_user',
  password: process.env.DB_PASSWORD || 'peintreab_password',
};

const pool = new pg.Pool(dbConfig);

const removeDuplicates191108 = async () => {
  try {
    console.log('🔍 Recherche des croquis avec titre "191108"...\n');
    
    // Trouver tous les croquis avec ce titre
    const result = await pool.query(`
      SELECT id, titre, image 
      FROM works 
      WHERE type = 'croquis' AND titre LIKE '%191108%'
      ORDER BY id
    `);
    
    if (result.rows.length === 0) {
      console.log('✅ Aucun croquis avec titre "191108" trouvé.');
      return;
    }
    
    console.log(`📋 ${result.rows.length} croquis trouvé(s):\n`);
    
    result.rows.forEach((work, index) => {
      console.log(`   ${index + 1}. ID: ${work.id}, Titre: "${work.titre}", Image: ${work.image}`);
    });
    
    console.log(`\n🗑️  Suppression de tous ces croquis...\n`);
    
    // Supprimer tous les croquis avec ce titre
    const deleteResult = await pool.query(`
      DELETE FROM works 
      WHERE type = 'croquis' AND titre LIKE '%191108%'
      RETURNING id, titre, image
    `);
    
    console.log(`✅ ${deleteResult.rows.length} croquis supprimé(s) avec succès.\n`);
    
    deleteResult.rows.forEach((work, index) => {
      console.log(`   ${index + 1}. ID: ${work.id}, Titre: "${work.titre}"`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    throw error;
  }
};

// Exécuter le script
removeDuplicates191108()
  .then(() => {
    console.log('\n✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });
