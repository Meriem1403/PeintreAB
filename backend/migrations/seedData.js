import pool from '../src/config/database.js';

// Données initiales directement dans le fichier pour éviter les problèmes d'import
const initialWorks = {
  peintures: [
    { titre: 'Sainte-Victoire au clair de lune', description: 'Paysage nocturne de la montagne Sainte-Victoire, technique huile sur toile', prix: '850', image: '/images/peintures/2024-sainte-victoire-au-clair-de-lune.jpg' },
    { titre: 'Vieux Port', description: 'Vue du vieux port de Marseille, peinture à l\'huile', prix: '750', image: '/images/peintures/2024-vieux-port.jpg' },
    { titre: 'Sainte-Victoire Dragon', description: 'Représentation symbolique de la Sainte-Victoire', prix: '900', image: '/images/peintures/2025-1-st-victoire-dragon.jpg' },
    { titre: 'Le Cours', description: 'Scène de rue animée, technique huile sur toile', prix: '650', image: '/images/peintures/2025-2-le-cours.jpg' },
    { titre: 'Alexandra', description: 'Portrait à l\'huile', prix: '800', image: '/images/peintures/alexandra.jpg' },
    { titre: 'Amanda Li', description: 'Portrait contemporain', prix: '850', image: '/images/peintures/amanda-li.jpg' },
    { titre: 'Andrea', description: 'Portrait en peinture à l\'huile', prix: '780', image: '/images/peintures/andrea.jpg' },
    { titre: 'Bolt', description: 'Portrait de personnalité', prix: '920', image: '/images/peintures/bolt.jpg' },
    { titre: 'Chemin de nuit', description: 'Paysage nocturne, technique huile', prix: '700', image: '/images/peintures/cheminnuit.jpg' },
    { titre: 'Chien Loup Richelme', description: 'Portrait animalier', prix: '680', image: '/images/peintures/chienlouprichelme.jpg' },
  ],
  croquis: [
    { titre: 'Aznavour', description: 'Croquis au crayon, portrait', prix: '150', image: '/images/croquis/aznavour.jpg' },
    { titre: 'Brel', description: 'Croquis au crayon', prix: '150', image: '/images/croquis/brel.jpg' },
    { titre: 'Clint', description: 'Portrait au crayon', prix: '180', image: '/images/croquis/clint.jpg' },
    { titre: 'Frida', description: 'Hommage, croquis au crayon', prix: '160', image: '/images/croquis/frida.jpg' },
    { titre: 'Johnny', description: 'Croquis portrait', prix: '170', image: '/images/croquis/johnny.jpg' },
    { titre: 'Piaf', description: 'Portrait au crayon', prix: '160', image: '/images/croquis/piaf.jpg' },
    { titre: 'Steve McQueen', description: 'Croquis portrait', prix: '180', image: '/images/croquis/steve-mcqueen.jpg' },
    { titre: 'Tara 2015', description: 'Croquis au crayon', prix: '140', image: '/images/croquis/tara2015.jpg' },
  ],
  evenements: [
    { titre: 'Exposition 2025 - PSP', description: 'Exposition collective à venir', date: '2025-06-15', lieu: 'Marseille', image: '/images/evenements/2025-PSP-affiche.jpeg' },
    { titre: 'Art et Lunettes', description: 'Exposition spéciale', date: '2024-09-20', lieu: 'Aix-en-Provence', image: '/images/evenements/affiche_art_lunettes.jpg' },
    { titre: 'Exposition BINDL', description: 'Collection personnelle de l\'artiste', date: '2024-11-10', lieu: 'Paris', image: '/images/evenements/AFFICHE-BINDL.jpg' },
    { titre: 'Exposition Grandas 2024', description: 'Rétrospective', date: '2024-07-15', lieu: 'Marseille', image: '/images/evenements/affiche2024-grandas.jpg' },
  ]
};

const seedDatabase = async () => {
  try {
    // Vérifier si des données existent déjà
    const existingWorks = await pool.query('SELECT COUNT(*) FROM works');
    const count = parseInt(existingWorks.rows[0].count);

    if (count > 0) {
      console.log(`✅ Des données existent déjà (${count} œuvres). Pas d'import nécessaire.`);
      return;
    }

    console.log('🌱 Importation des données initiales...');

    // Importer les peintures
    for (const peinture of initialWorks.peintures) {
      await pool.query(
        `INSERT INTO works (type, titre, description, prix, image)
         VALUES ($1, $2, $3, $4, $5)`,
        ['peintures', peinture.titre, peinture.description || null, peinture.prix || null, peinture.image || null]
      );
    }

    // Importer les croquis
    for (const croquis of initialWorks.croquis) {
      await pool.query(
        `INSERT INTO works (type, titre, description, prix, image)
         VALUES ($1, $2, $3, $4, $5)`,
        ['croquis', croquis.titre, croquis.description || null, croquis.prix || null, croquis.image || null]
      );
    }

    // Importer les événements
    for (const evenement of initialWorks.evenements) {
      await pool.query(
        `INSERT INTO works (type, titre, description, image, date, lieu)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ['evenements', evenement.titre, evenement.description || null, evenement.image || null, evenement.date || null, evenement.lieu || null]
      );
    }

    console.log(`✅ Données importées avec succès :`);
    console.log(`   - ${initialWorks.peintures.length} peintures`);
    console.log(`   - ${initialWorks.croquis.length} croquis`);
    console.log(`   - ${initialWorks.evenements.length} événements`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'importation des données:', error);
    throw error;
  }
};

// Exécuter l'importation
seedDatabase()
  .then(() => {
    console.log('✅ Importation terminée');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
