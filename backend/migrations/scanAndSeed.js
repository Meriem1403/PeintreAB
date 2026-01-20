import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Charger les variables d'environnement
dotenv.config();

// Créer une connexion à la base de données
// Utiliser localhost si on est en dehors de Docker, sinon utiliser DB_HOST
const dbConfig = {
  host: process.env.DB_HOST === 'postgres' ? 'localhost' : (process.env.DB_HOST || 'localhost'),
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'peintreab_db',
  user: process.env.DB_USER || 'peintreab_user',
  password: process.env.DB_PASSWORD || 'peintreab_password',
};

const pool = new pg.Pool(dbConfig);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fonction pour convertir un nom de fichier en titre
const filenameToTitle = (filename) => {
  // Enlever l'extension
  let title = filename.replace(/\.(jpg|jpeg|JPG|png)$/i, '');
  
  // Décoder les caractères encodés (%20 pour espace, etc.)
  title = decodeURIComponent(title);
  
  // Extraire le numéro entre parenthèses avant de le supprimer (pour les fichiers séquentiels)
  const numberMatch = title.match(/\((\d+)\)/);
  const sequenceNumber = numberMatch ? numberMatch[1] : null;
  
  // Remplacer les underscores et tirets par des espaces
  title = title.replace(/[_-]/g, ' ');
  
  // Enlever les numéros de séquence comme "(1)", "(2)", etc.
  title = title.replace(/\s*\(\d+\)\s*/g, ' ');
  
  // Enlever les préfixes de date comme "20170121_191108"
  title = title.replace(/^\d{8}_\d{6}\s*/g, '');
  
  // Capitaliser la première lettre de chaque mot
  title = title.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
  
  // Si le titre commence par une date (format YYYY-MM ou YYYY), l'enlever
  title = title.replace(/^\d{4}[-\s]?\d*[mM]?[-\s]?/g, '');
  
  // Si le titre est vide ou trop court, utiliser le nom de fichier original
  if (title.length < 3) {
    title = filename.replace(/\.(jpg|jpeg|JPG|png)$/i, '');
  }
  
  // Si c'est un fichier séquentiel (avec numéro entre parenthèses), ajouter le numéro au titre
  // pour éviter les doublons
  if (sequenceNumber && title.length < 10) {
    title = `${title} ${sequenceNumber}`;
  }
  
  return title;
};

// Fonction pour extraire une date du nom de fichier
const extractDateFromFilename = (filename) => {
  // Chercher des patterns de date comme YYYY-MM-DD, YYYY-MM, YYYY
  const datePatterns = [
    /(\d{4})-(\d{2})-(\d{2})/,  // 2024-01-15
    /(\d{4})-(\d{2})/,          // 2024-01
    /(\d{4})/,                  // 2024
  ];
  
  for (const pattern of datePatterns) {
    const match = filename.match(pattern);
    if (match) {
      const year = parseInt(match[1]);
      const month = match[2] ? parseInt(match[2]) : 1;
      const day = match[3] ? parseInt(match[3]) : 1;
      return new Date(year, month - 1, day);
    }
  }
  
  // Si pas de date trouvée, utiliser la date de modification du fichier
  return null;
};

// Fonction pour scanner un dossier et récupérer les fichiers images
const scanDirectory = (dirPath, type) => {
  // Essayer plusieurs chemins possibles
  const possiblePaths = [
    path.join('/app', dirPath),              // Chemin Docker absolu (depuis backend)
    path.join(__dirname, '../../', dirPath),  // Depuis le backend (local)
    path.join(process.cwd(), '..', dirPath),  // Depuis le backend dans Docker
    path.join(process.cwd(), dirPath),        // Chemin relatif depuis cwd
  ];
  
  let fullPath = null;
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      fullPath = testPath;
      break;
    }
  }
  
  if (!fullPath) {
    console.log(`⚠️  Dossier non trouvé: ${dirPath}`);
    console.log(`   Chemins testés: ${possiblePaths.join(', ')}`);
    return [];
  }
  
  console.log(`📂 ${type}: ${fullPath}`);
  
  const files = fs.readdirSync(fullPath)
    .filter(file => /\.(jpg|jpeg|JPG|png)$/i.test(file))
    .map(file => {
      const filePath = path.join(fullPath, file);
      const stats = fs.statSync(filePath);
      const imagePath = `${dirPath}/${file}`;
      
      // Extraire la date du nom de fichier ou utiliser la date de modification
      let fileDate = extractDateFromFilename(file);
      if (!fileDate) {
        fileDate = stats.mtime;
      }
      
      return {
        filename: file,
        imagePath: imagePath,
        title: filenameToTitle(file),
        date: fileDate,
        mtime: stats.mtime
      };
    });
  
  // Supprimer les doublons basés sur le chemin d'image (normalisé en minuscules)
  const uniqueFiles = [];
  const seenPaths = new Set();
  
  for (const file of files) {
    const normalizedPath = file.imagePath.toLowerCase();
    if (!seenPaths.has(normalizedPath)) {
      seenPaths.add(normalizedPath);
      uniqueFiles.push(file);
    } else {
      console.log(`   ⚠️  Doublon ignoré: ${file.imagePath}`);
    }
  }
  
  // Trier par date (plus ancien en premier pour display_order)
  uniqueFiles.sort((a, b) => {
    const dateA = a.date || a.mtime;
    const dateB = b.date || b.mtime;
    return dateA - dateB;
  });
  
  return uniqueFiles;
};

const seedFromImages = async () => {
  try {
    console.log('🔍 Scan des dossiers d\'images...\n');
    
    // Scanner les trois dossiers
    const peintures = scanDirectory('public/images/peintures', 'peintures');
    const croquis = scanDirectory('public/images/croquis', 'croquis');
    const evenements = scanDirectory('public/images/evenements', 'evenements');
    
    console.log(`📁 Images trouvées:`);
    console.log(`   - ${peintures.length} peintures`);
    console.log(`   - ${croquis.length} croquis`);
    console.log(`   - ${evenements.length} événements\n`);
    
    // Supprimer toutes les œuvres existantes
    console.log('🗑️  Suppression de toutes les œuvres existantes...');
    await pool.query('DELETE FROM works');
    console.log('✅ Toutes les œuvres supprimées\n');
    
    let addedCount = 0;
    
    // Ajouter les peintures
    console.log('🎨 Ajout des peintures...');
    for (let i = 0; i < peintures.length; i++) {
      const peinture = peintures[i];
      const dateStr = peinture.date ? peinture.date.toISOString().split('T')[0] : null;
      
      await pool.query(
        `INSERT INTO works (type, titre, description, prix, image, date, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['peintures', peinture.title, null, null, peinture.imagePath, dateStr, i]
      );
      
      addedCount++;
    }
    console.log(`   ✅ ${peintures.length} peintures ajoutées`);
    
    // Ajouter les croquis
    console.log('\n✏️  Ajout des croquis...');
    for (let i = 0; i < croquis.length; i++) {
      const croquisItem = croquis[i];
      const dateStr = croquisItem.date ? croquisItem.date.toISOString().split('T')[0] : null;
      
      await pool.query(
        `INSERT INTO works (type, titre, description, prix, image, date, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['croquis', croquisItem.title, null, null, croquisItem.imagePath, dateStr, i]
      );
      
      addedCount++;
    }
    console.log(`   ✅ ${croquis.length} croquis ajoutés`);
    
    // Ajouter les événements
    console.log('\n📅 Ajout des événements...');
    for (let i = 0; i < evenements.length; i++) {
      const evenement = evenements[i];
      const dateStr = evenement.date ? evenement.date.toISOString().split('T')[0] : null;
      
      await pool.query(
        `INSERT INTO works (type, titre, description, image, date_debut, lieu, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['evenements', evenement.title, null, evenement.imagePath, dateStr, null, i]
      );
      
      addedCount++;
    }
    console.log(`   ✅ ${evenements.length} événements ajoutés`);
    
    console.log(`\n✅ Importation terminée:`);
    console.log(`   - ${addedCount} œuvres ajoutées au total`);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'importation:', error);
    throw error;
  }
};

// Exécuter le script
seedFromImages()
  .then(() => {
    console.log('\n✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
