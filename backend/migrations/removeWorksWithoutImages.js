import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Charger les variables d'environnement
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Créer une connexion à la base de données
const dbConfig = {
  host: process.env.DB_HOST === 'postgres' ? 'localhost' : (process.env.DB_HOST || 'localhost'),
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'peintreab_db',
  user: process.env.DB_USER || 'peintreab_user',
  password: process.env.DB_PASSWORD || 'peintreab_password',
};

const pool = new pg.Pool(dbConfig);

// Fonction pour vérifier si un fichier image existe
const imageExists = (imagePath) => {
  if (!imagePath || imagePath.trim() === '') {
    return false;
  }
  
  // Essayer plusieurs chemins possibles
  const possiblePaths = [
    path.join(__dirname, '../../', imagePath),
    path.join(process.cwd(), '..', imagePath),
    path.join(process.cwd(), imagePath),
  ];
  
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      return true;
    }
  }
  
  return false;
};

const removeWorksWithoutImages = async () => {
  try {
    console.log('🔍 Recherche des œuvres sans image ou avec images manquantes...\n');
    
    // Récupérer toutes les œuvres
    const allWorks = await pool.query(`
      SELECT id, type, titre, image 
      FROM works 
      ORDER BY type, id
    `);
    
    const worksToDelete = [];
    const byType = {
      peintures: [],
      croquis: [],
      evenements: []
    };
    
    // Vérifier chaque œuvre
    for (const work of allWorks.rows) {
      const hasNoImage = !work.image || work.image.trim() === '';
      const imageMissing = !hasNoImage && !imageExists(work.image);
      
      if (hasNoImage || imageMissing) {
        worksToDelete.push(work);
        byType[work.type] = byType[work.type] || [];
        byType[work.type].push(work);
        
        const reason = hasNoImage ? 'sans image' : 'fichier image manquant';
        console.log(`   - [${work.type}] ${work.titre} (ID: ${work.id}) - ${reason}`);
        if (!hasNoImage) {
          console.log(`     Chemin: ${work.image}`);
        }
      }
    }
    
    if (worksToDelete.length === 0) {
      console.log('✅ Aucune œuvre sans image ou avec image manquante trouvée.');
      return;
    }
    
    console.log(`\n📊 Répartition:`);
    console.log(`   - Peintures: ${byType.peintures.length}`);
    console.log(`   - Croquis: ${byType.croquis.length}`);
    console.log(`   - Événements: ${byType.evenements.length}\n`);
    
    // Supprimer les œuvres sans image ou avec images manquantes
    console.log('🗑️  Suppression des œuvres...\n');
    
    const idsToDelete = worksToDelete.map(w => w.id);
    const deleteResult = await pool.query(`
      DELETE FROM works 
      WHERE id = ANY($1::int[])
      RETURNING id, type, titre
    `, [idsToDelete]);
    
    console.log(`✅ ${deleteResult.rows.length} œuvre(s) supprimée(s) avec succès.\n`);
    
    // Afficher un résumé
    const deletedByType = {
      peintures: 0,
      croquis: 0,
      evenements: 0
    };
    
    deleteResult.rows.forEach(work => {
      deletedByType[work.type]++;
    });
    
    console.log('📊 Résumé des suppressions:');
    console.log(`   - Peintures: ${deletedByType.peintures}`);
    console.log(`   - Croquis: ${deletedByType.croquis}`);
    console.log(`   - Événements: ${deletedByType.evenements}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    throw error;
  }
};

// Exécuter le script
removeWorksWithoutImages()
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
